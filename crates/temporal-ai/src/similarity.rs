//! This module provides the core similarity search functionality, using cosine
//! similarity to find the most relevant patterns for a given query.
//!
//! The main component is the [`SimilaritySearch`] struct, which orchestrates the
//! search process. It retrieves embeddings from a [`VectorStore`], calculates their
//! similarity to a query embedding, and returns a ranked list of results. The
//! implementation includes optimizations such as SIMD-accelerated dot product
//! calculations for improved performance.

use crate::pattern_extractor::Pattern;
use crate::vector_store::VectorStore;
use crate::{Result, TemporalAIError};
use std::cmp::Ordering;
use std::collections::BinaryHeap;

/// Represents a single result from a similarity search.
///
/// This struct contains the ID of the matching pattern, its similarity score,
/// and the full `Pattern` object for further processing. It implements `Ord`
/// to be used in a min-heap for efficient top-k selection.
#[derive(Debug, Clone)]
pub struct SimilarityResult {
    /// The unique identifier of the matched pattern.
    pub pattern_id: String,
    /// The cosine similarity score, ranging from -1.0 to 1.0 (though typically
    /// 0.0 to 1.0 for normalized embeddings). A higher score indicates greater
    /// similarity.
    pub score: f32,
    /// The full `Pattern` data associated with the result.
    pub pattern: Pattern,
}

impl PartialEq for SimilarityResult {
    fn eq(&self, other: &Self) -> bool {
        self.score == other.score
    }
}
impl Eq for SimilarityResult {}

impl PartialOrd for SimilarityResult {
    /// The comparison is reversed to make `BinaryHeap` a min-heap of scores.
    /// This means that items with lower scores are considered "greater", so they
    /// are evicted first when the heap is full.
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        other.score.partial_cmp(&self.score)
    }
}

impl Ord for SimilarityResult {
    fn cmp(&self, other: &Self) -> Ordering {
        self.partial_cmp(other).unwrap_or(Ordering::Equal)
    }
}

/// A set of filters to constrain a similarity search.
///
/// This struct allows for more sophisticated queries by enabling callers to
/// filter the search space based on criteria like score thresholds, file paths,
/// tags, and timestamps.
#[derive(Default, Debug, Clone)]
pub struct SearchFilters {
    /// If set, only results with a score greater than or equal to this value
    /// will be returned.
    pub min_score: Option<f32>,
    /// A glob pattern to filter patterns by their affected file paths.
    pub file_path_glob: Option<String>,
    /// A list of tags that all returned patterns must have.
    pub tags: Vec<String>,
    /// If set, only patterns with a timestamp greater than or equal to this
    /// value will be returned.
    pub since_timestamp: Option<i64>,
}

/// The main engine for performing similarity searches.
///
/// An instance of `SimilaritySearch` is tied to a specific `VectorStore` and
/// provides the methods to execute searches against it.
pub struct SimilaritySearch<'a> {
    store: &'a VectorStore,
}

impl<'a> SimilaritySearch<'a> {
    /// Creates a new `SimilaritySearch` instance.
    ///
    /// # Arguments
    ///
    /// * `store` - A reference to the `VectorStore` to be searched.
    pub fn new(store: &'a VectorStore) -> Self {
        Self { store }
    }

    /// Finds the top `k` most similar patterns to a query embedding, without filters.
    ///
    /// # Arguments
    ///
    /// * `query_embedding` - The embedding vector of the search query.
    /// * `k` - The number of top results to return.
    ///
    /// # Returns
    ///
    /// A `Result` containing a `Vec<SimilarityResult>` sorted by score in descending order.
    pub fn search(&self, query_embedding: &[f32], k: usize) -> Result<Vec<SimilarityResult>> {
        self.search_filtered(query_embedding, k, &SearchFilters::default())
    }

    /// Finds the top `k` most similar patterns, applying a set of filters.
    ///
    /// This method first narrows down the search space based on the provided filters
    /// and then performs the similarity calculation on the candidate patterns.
    ///
    /// # Arguments
    ///
    /// * `query_embedding` - The embedding vector of the search query.
    /// * `k` - The number of top results to return.
    /// * `filters` - The `SearchFilters` to apply.
    ///
    /// # Returns
    ///
    /// A `Result` containing a `Vec<SimilarityResult>` sorted by score.
    pub fn search_filtered(
        &self,
        query_embedding: &[f32],
        k: usize,
        filters: &SearchFilters,
    ) -> Result<Vec<SimilarityResult>> {
        let pattern_ids = self.get_candidate_pattern_ids(filters)?;

        // A min-heap is used to efficiently keep track of the top k results.
        let mut heap = BinaryHeap::with_capacity(k + 1);

        for pattern_id in pattern_ids {
            let (embedding, pattern) = match self.store.get_embedding_and_pattern(&pattern_id)? {
                Some(data) => data,
                None => continue,
            };

            if let Some(since) = filters.since_timestamp {
                if pattern.timestamp < since {
                    continue;
                }
            }

            let score = cosine_similarity(query_embedding, &embedding);

            if let Some(min_score) = filters.min_score {
                if score < min_score {
                    continue;
                }
            }

            heap.push(SimilarityResult {
                pattern_id: pattern_id.clone(),
                score,
                pattern,
            });

            if heap.len() > k {
                heap.pop();
            }
        }

        let mut results: Vec<_> = heap.into_vec();
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(Ordering::Equal));
        Ok(results)
    }

    /// Retrieves a list of candidate pattern IDs based on the applied filters.
    fn get_candidate_pattern_ids(&self, filters: &SearchFilters) -> Result<Vec<String>> {
        if !filters.tags.is_empty() {
            let mut candidates = vec![];
            for tag in &filters.tags {
                candidates.extend(self.store.find_by_tag(tag)?);
            }
            candidates.sort_unstable();
            candidates.dedup();
            return Ok(candidates);
        }

        if let Some(glob_str) = &filters.file_path_glob {
            let glob_pattern = glob::Pattern::new(glob_str).map_err(|e| {
                TemporalAIError::IoError(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    e.to_string(),
                ))
            })?;
            let mut candidates = vec![];
            for pattern_id in self.store.list_patterns()? {
                if let Some(pattern) = self.store.get_pattern(&pattern_id)? {
                    if pattern.file_paths.iter().any(|p| glob_pattern.matches(p)) {
                        candidates.push(pattern_id);
                    }
                }
            }
            return Ok(candidates);
        }

        self.store.list_patterns()
    }
}

/// Calculates the cosine similarity between two vector slices.
///
/// Cosine similarity measures the cosine of the angle between two vectors,
/// producing a value between -1 and 1. For non-negative vectors, the range is
/// 0 to 1. A value of 1 means the vectors are identical in orientation.
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }

    let dot_product = dot_product_simd(a, b);
    let norm_a = l2_norm(a);
    let norm_b = l2_norm(b);

    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    dot_product / (norm_a * norm_b)
}

/// A platform-specific dispatcher for dot product calculation, using SIMD where available.
#[cfg(target_arch = "x86_64")]
fn dot_product_simd(a: &[f32], b: &[f32]) -> f32 {
    if is_x86_feature_detected!("avx") {
        unsafe { dot_product_avx(a, b) }
    } else {
        dot_product_fallback(a, b)
    }
}

#[cfg(not(target_arch = "x86_64"))]
fn dot_product_simd(a: &[f32], b: &[f32]) -> f32 {
    dot_product_fallback(a, b)
}

/// An AVX-accelerated dot product implementation (unsafe).
#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx")]
unsafe fn dot_product_avx(a: &[f32], b: &[f32]) -> f32 {
    use std::arch::x86_64::*;
    let mut sum = _mm256_setzero_ps();
    for (a_chunk, b_chunk) in a.chunks_exact(8).zip(b.chunks_exact(8)) {
        let va = _mm256_loadu_ps(a_chunk.as_ptr());
        let vb = _mm256_loadu_ps(b_chunk.as_ptr());
        sum = _mm256_add_ps(sum, _mm256_mul_ps(va, vb));
    }
    let mut result = [0.0f32; 8];
    _mm256_storeu_ps(result.as_mut_ptr(), sum);
    result.iter().sum::<f32>() + a.chunks_exact(8).remainder().iter().zip(b.chunks_exact(8).remainder()).map(|(x, y)| x * y).sum::<f32>()
}

/// A portable, non-SIMD fallback for dot product calculation.
fn dot_product_fallback(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}

/// Calculates the L2 norm (Euclidean length) of a vector.
fn l2_norm(vec: &[f32]) -> f32 {
    vec.iter().map(|x| x * x).sum::<f32>().sqrt()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pattern_extractor::Pattern;
    use tempfile::tempdir;

    fn create_test_pattern(id: &str) -> Pattern {
        Pattern {
            id: id.to_string(),
            description: format!("Test pattern {}", id),
            file_paths: vec![format!("src/{}.rs", id)],
            commit_sha: format!("commit{}", id),
            timestamp: 1234567890,
            tags: vec!["rust".to_string()],
        }
    }

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        let score = cosine_similarity(&a, &b);
        assert!((score - 1.0).abs() < 0.001);

        let a = vec![1.0, 0.0];
        let b = vec![0.0, 1.0];
        let score = cosine_similarity(&a, &b);
        assert!((score - 0.0).abs() < 0.001);

        let a = vec![1.0, 1.0];
        let b = vec![1.0, 1.0];
        let score = cosine_similarity(&a, &b);
        assert!((score - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_similarity_search() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path)?;

        // Insert test patterns
        let pattern1 = create_test_pattern("1");
        let pattern2 = create_test_pattern("2");
        let pattern3 = create_test_pattern("3");

        // Embeddings: pattern1 similar to query, pattern2 and 3 less similar
        let query_emb = vec![1.0; 768];
        let emb1 = vec![0.9; 768];
        let emb2 = vec![0.5; 768];
        let emb3 = vec![0.3; 768];

        store.insert(&pattern1, emb1)?;
        store.insert(&pattern2, emb2)?;
        store.insert(&pattern3, emb3)?;

        let search = SimilaritySearch::new(&store);
        let results = search.search(&query_emb, 2)?;

        assert_eq!(results.len(), 2);
        assert_eq!(results[0].pattern_id, "1"); // Most similar
        assert!(results[0].score > results[1].score);

        Ok(())
    }

    #[test]
    fn test_search_with_min_score() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path)?;

        let pattern1 = create_test_pattern("1");
        let pattern2 = create_test_pattern("2");

        store.insert(&pattern1, vec![0.9; 768])?;
        store.insert(&pattern2, vec![0.3; 768])?;

        let query_emb = vec![1.0; 768];
        let min_score = 0.95;
        let filters = SearchFilters {
            min_score: Some(min_score),
            ..Default::default()
        };

        let search = SimilaritySearch::new(&store);
        let results = search.search_filtered(&query_emb, 10, &filters)?;

        for result in &results {
            assert!(result.score >= min_score);
        }

        Ok(())
    }

    #[test]
    fn test_dot_product_fallback() {
        let a = vec![1.0, 2.0, 3.0];
        let b = vec![4.0, 5.0, 6.0];
        let result = dot_product_fallback(&a, &b);
        assert_eq!(result, 32.0); // 1*4 + 2*5 + 3*6 = 32
    }

    #[test]
    fn test_l2_norm() {
        let v = vec![3.0, 4.0];
        let norm = l2_norm(&v);
        assert_eq!(norm, 5.0); // sqrt(9 + 16) = 5
    }
}
