//! Similarity search using cosine distance

use crate::pattern_extractor::Pattern;
use crate::vector_store::VectorStore;
use crate::{Result, TemporalAIError};
use std::collections::BinaryHeap;
use std::cmp::Ordering;

/// Similarity search result
#[derive(Debug, Clone)]
pub struct SimilarityResult {
    pub pattern_id: String,
    pub score: f32,
    pub pattern: Pattern,
}

impl PartialEq for SimilarityResult {
    fn eq(&self, other: &Self) -> bool {
        self.score == other.score
    }
}

impl Eq for SimilarityResult {}

impl PartialOrd for SimilarityResult {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        // Reverse ordering for min-heap (smaller scores at top)
        other.score.partial_cmp(&self.score)
    }
}

impl Ord for SimilarityResult {
    fn cmp(&self, other: &Self) -> Ordering {
        self.partial_cmp(other).unwrap_or(Ordering::Equal)
    }
}

/// Search filters
#[derive(Default, Debug, Clone)]
pub struct SearchFilters {
    pub min_score: Option<f32>,
    pub file_path_glob: Option<String>,
    pub tags: Vec<String>,
    pub since_timestamp: Option<i64>,
}

/// Similarity search engine
pub struct SimilaritySearch<'a> {
    store: &'a VectorStore,
}

impl<'a> SimilaritySearch<'a> {
    /// Create new search instance
    pub fn new(store: &'a VectorStore) -> Self {
        Self { store }
    }

    /// Find top-k most similar patterns
    pub fn search(&self, query_embedding: &[f32], k: usize) -> Result<Vec<SimilarityResult>> {
        self.search_filtered(query_embedding, k, &SearchFilters::default())
    }

    /// Search with filters
    pub fn search_filtered(
        &self,
        query_embedding: &[f32],
        k: usize,
        filters: &SearchFilters,
    ) -> Result<Vec<SimilarityResult>> {
        let pattern_ids = self.get_candidate_pattern_ids(filters)?;

        // Min-heap to keep top-k results
        let mut heap = BinaryHeap::with_capacity(k + 1);

        for pattern_id in pattern_ids {
            // Get embedding
            let embedding = match self.store.get_embedding(&pattern_id)? {
                Some(emb) => emb,
                None => continue,
            };

            // Get pattern metadata
            let pattern = match self.store.get_pattern(&pattern_id)? {
                Some(p) => p,
                None => continue,
            };

            // Apply timestamp filter
            if let Some(since) = filters.since_timestamp {
                if pattern.timestamp < since {
                    continue;
                }
            }

            // Calculate similarity
            let score = cosine_similarity(query_embedding, &embedding);

            // Apply minimum score filter
            if let Some(min_score) = filters.min_score {
                if score < min_score {
                    continue;
                }
            }

            // Add to heap
            let result = SimilarityResult {
                pattern_id: pattern_id.clone(),
                score,
                pattern,
            };

            heap.push(result);

            // Keep only top-k
            if heap.len() > k {
                heap.pop();
            }
        }

        // Convert heap to sorted vector (highest score first)
        let mut results: Vec<_> = heap.into_vec();
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(Ordering::Equal));

        Ok(results)
    }

    /// Get candidate pattern IDs based on filters
    fn get_candidate_pattern_ids(&self, filters: &SearchFilters) -> Result<Vec<String>> {
        // If tags specified, use tag index
        if !filters.tags.is_empty() {
            let mut candidates = Vec::new();
            for tag in &filters.tags {
                let tag_patterns = self.store.find_by_tag(tag)?;
                candidates.extend(tag_patterns);
            }
            // Remove duplicates
            candidates.sort();
            candidates.dedup();
            return Ok(candidates);
        }

        // If file path glob specified, use file path index
        if let Some(glob_str) = &filters.file_path_glob {
            let glob_pattern = glob::Pattern::new(glob_str)
                .map_err(|e| TemporalAIError::IoError(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    e.to_string()
                )))?;

            // This is inefficient - in production we'd need better indexing
            let all_patterns = self.store.list_patterns()?;
            let mut candidates = Vec::new();

            for pattern_id in all_patterns {
                if let Some(pattern) = self.store.get_pattern(&pattern_id)? {
                    if pattern.file_paths.iter().any(|p| glob_pattern.matches(p)) {
                        candidates.push(pattern_id);
                    }
                }
            }

            return Ok(candidates);
        }

        // Otherwise return all patterns
        self.store.list_patterns()
    }
}

/// Calculate cosine similarity between two vectors
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }

    // Optimized dot product
    let dot_product = dot_product_simd(a, b);

    // Calculate norms
    let norm_a = l2_norm(a);
    let norm_b = l2_norm(b);

    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }

    dot_product / (norm_a * norm_b)
}

/// SIMD-optimized dot product (x86_64)
#[cfg(target_arch = "x86_64")]
fn dot_product_simd(a: &[f32], b: &[f32]) -> f32 {
    #[cfg(target_feature = "avx")]
    {
        unsafe { dot_product_avx(a, b) }
    }

    #[cfg(not(target_feature = "avx"))]
    {
        dot_product_fallback(a, b)
    }
}

/// Fallback dot product for non-x86_64 architectures
#[cfg(not(target_arch = "x86_64"))]
fn dot_product_simd(a: &[f32], b: &[f32]) -> f32 {
    dot_product_fallback(a, b)
}

/// AVX-accelerated dot product
#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx")]
unsafe fn dot_product_avx(a: &[f32], b: &[f32]) -> f32 {
    use std::arch::x86_64::*;

    let len = a.len();
    let mut sum = _mm256_setzero_ps();

    let chunks = len / 8;
    let remainder = len % 8;

    for i in 0..chunks {
        let idx = i * 8;
        let va = _mm256_loadu_ps(a.as_ptr().add(idx));
        let vb = _mm256_loadu_ps(b.as_ptr().add(idx));
        let mul = _mm256_mul_ps(va, vb);
        sum = _mm256_add_ps(sum, mul);
    }

    // Horizontal add
    let mut result = [0.0f32; 8];
    _mm256_storeu_ps(result.as_mut_ptr(), sum);
    let mut total = result.iter().sum::<f32>();

    // Handle remainder
    for i in (len - remainder)..len {
        total += a[i] * b[i];
    }

    total
}

/// Fallback dot product (portable)
fn dot_product_fallback(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}

/// Calculate L2 norm
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
        let filters = SearchFilters {
            min_score: Some(0.95),
            ..Default::default()
        };

        let search = SimilaritySearch::new(&store);
        let results = search.search_filtered(&query_emb, 10, &filters)?;

        // Only high-scoring pattern should be returned
        assert!(results.len() <= 1);
        if !results.is_empty() {
            assert!(results[0].score >= 0.95);
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
