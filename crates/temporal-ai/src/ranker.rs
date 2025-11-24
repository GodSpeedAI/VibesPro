//! This module provides the `RecommendationRanker`, a multi-factor scoring engine
//! that processes raw similarity search results and re-ranks them to produce the
//! final, context-aware recommendations.

use crate::pattern_extractor::Pattern;
use crate::similarity::SimilarityResult;
use crate::vector_store::VectorStore;
use crate::Result;
use chrono::Utc;

/// Represents a final, scored, and explained recommendation.
///
/// This struct is the output of the `RecommendationRanker`. It contains the original
/// `Pattern`, the individual scores that contributed to its ranking, and a
/// human-readable explanation of why it was recommended.
#[derive(Debug, Clone)]
pub struct Recommendation {
    /// The underlying development pattern being recommended.
    pub pattern: Pattern,
    /// The raw cosine similarity score (between 0.0 and 1.0).
    pub similarity_score: f32,
    /// A score based on the age of the pattern, calculated with exponential decay.
    /// Newer patterns receive a higher score.
    pub recency_score: f32,
    /// A score based on how frequently this pattern has been used, normalized to a
    /// value between 0.0 and 1.0.
    pub usage_score: f32,
    /// The final, weighted score that determines the rank of the recommendation.
    pub final_score: f32,
    /// A human-readable string that summarizes the pattern and its scores.
    pub explanation: String,
}

/// A multi-factor scoring engine for ranking similarity search results.
///
/// The `RecommendationRanker` takes the initial list of semantically similar
/// patterns and applies a weighted scoring model to re-rank them. This model
/// considers not only the similarity of the pattern to the query but also its
/// recency, historical usage count, and success rate. This ensures that the
/// recommendations are not just relevant but also timely and proven.
pub struct RecommendationRanker<'a> {
    store: &'a VectorStore,
    recency_weight: f32,
    usage_weight: f32,
    similarity_weight: f32,
    success_rate_weight: f32,
}

impl<'a> RecommendationRanker<'a> {
    /// Creates a new `RecommendationRanker` with default weights.
    ///
    /// The default weights are chosen to provide a balanced ranking.
    ///
    /// # Arguments
    ///
    /// * `store` - A reference to the `VectorStore`, which is needed to retrieve
    ///   performance metrics for the patterns.
    pub fn new(store: &'a VectorStore) -> Self {
        Self {
            store,
            recency_weight: 0.2,
            usage_weight: 0.3,
            similarity_weight: 0.35,
            success_rate_weight: 0.15,
        }
    }

    /// Creates a new `RecommendationRanker` with custom, user-defined weights.
    ///
    /// The provided weights will be normalized to ensure they sum to 1.0.
    ///
    /// # Arguments
    ///
    /// * `store` - A reference to the `VectorStore`.
    /// * `recency` - The weight for the recency score.
    /// * `usage` - The weight for the usage score.
    /// * `similarity` - The weight for the similarity score.
    /// * `success_rate` - The weight for the success rate score.
    pub fn with_weights(
        store: &'a VectorStore,
        recency: f32,
        usage: f32,
        similarity: f32,
        success_rate: f32,
    ) -> Self {
        let total = recency + usage + similarity + success_rate;
        let (recency_weight, usage_weight, similarity_weight, success_rate_weight) =
            if total.abs() <= f32::EPSILON {
                (0.25, 0.25, 0.25, 0.25) // Avoid division by zero
            } else {
                (
                    recency / total,
                    usage / total,
                    similarity / total,
                    success_rate / total,
                )
            };
        Self {
            store,
            recency_weight,
            usage_weight,
            similarity_weight,
            success_rate_weight,
        }
    }

    /// Ranks a vector of `SimilarityResult`s to produce a sorted list of `Recommendation`s.
    ///
    /// This is the core method of the `RecommendationRanker`. It iterates through the
    /// input results, calculates the recency, usage, and success rate scores for each,
    /// computes the final weighted score, and generates an explanation. The final list
    /// is sorted in descending order of `final_score`.
    ///
    /// # Arguments
    ///
    /// * `results` - A `Vec<SimilarityResult>` from the `SimilaritySearch` module.
    ///
    /// # Returns
    ///
    /// A `Result` containing a `Vec<Recommendation>` sorted by `final_score`.
    pub fn rank(&self, results: Vec<SimilarityResult>) -> Result<Vec<Recommendation>> {
        let now = Utc::now().timestamp();

        let mut recommendations: Vec<Recommendation> = results
            .into_iter()
            .map(|result| {
                // Calculate recency score using an exponential decay function.
                let days_since = ((now - result.pattern.timestamp) as f32 / 86400.0).max(0.0);
                let recency_score = (-0.01 * days_since).exp();

                let (usage_score, usage_count, success_rate_score) = self
                    .store
                    .get_metrics(&result.pattern.id)
                    .ok()
                    .flatten()
                    .map_or((0.0, 0, 0.5), |m| {
                        (
                            (m.usage_count as f32 / 100.0).min(1.0), // Normalize usage
                            m.usage_count,
                            m.success_rate.unwrap_or(0.5), // Default to neutral
                        )
                    });

                let final_score = self.similarity_weight * result.score
                    + self.recency_weight * recency_score
                    + self.usage_weight * usage_score
                    + self.success_rate_weight * success_rate_score;

                let explanation = self.generate_explanation(
                    &result.pattern,
                    result.score,
                    days_since.round() as i64,
                    usage_count,
                    success_rate_score,
                );

                Recommendation {
                    pattern: result.pattern,
                    similarity_score: result.score,
                    recency_score,
                    usage_score,
                    final_score,
                    explanation,
                }
            })
            .collect();

        recommendations.sort_by(|a, b| {
            b.final_score
                .partial_cmp(&a.final_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        Ok(recommendations)
    }

    /// Generates a human-readable explanation for a recommendation.
    fn generate_explanation(
        &self,
        pattern: &Pattern,
        similarity: f32,
        days_ago: i64,
        usage_count: u64,
        success_rate: f32,
    ) -> String {
        let commit_short: String = pattern.commit_sha.chars().take(7).collect();
        let day_label = if days_ago == 1 { "day" } else { "days" };

        format!(
            "Pattern from {} ({}): {} - Similarity: {:.1}%, Recency: {} {} ago, Usage: {} times, Success: {:.1}%",
            commit_short,
            pattern.tags.join(", "),
            pattern.description,
            similarity * 100.0,
            days_ago,
            day_label,
            usage_count,
            success_rate * 100.0
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pattern_extractor::Pattern;
    use crate::schema::PerformanceMetrics;
    use tempfile::tempdir;

    fn create_test_pattern(id: &str, timestamp: i64) -> Pattern {
        Pattern {
            id: id.to_string(),
            description: format!("Test pattern {}", id),
            file_paths: vec![format!("src/{}.rs", id)],
            commit_sha: format!("abcdef{}", id),
            timestamp,
            tags: vec!["rust".to_string()],
        }
    }

    fn create_similarity_result(pattern: Pattern, score: f32) -> SimilarityResult {
        SimilarityResult {
            pattern_id: pattern.id.clone(),
            score,
            pattern,
        }
    }

    #[test]
    fn test_ranker_scoring() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path)?;

        let now = Utc::now().timestamp();

        // Pattern 1: High similarity, recent, low usage
        let pattern1 = create_test_pattern("1", now - 86400); // 1 day ago
        store.insert(&pattern1, vec![0.9; 768])?;

        // Pattern 2: Medium similarity, old, high usage
        let pattern2 = create_test_pattern("2", now - 86400 * 30); // 30 days ago
        store.insert(&pattern2, vec![0.7; 768])?;
        let mut metrics2 = PerformanceMetrics::new();
        for _ in 0..50 {
            metrics2.record_recommendation(0.8, None);
        }
        store.update_metrics(&pattern2.id, metrics2)?;

        let results = vec![
            create_similarity_result(pattern1.clone(), 0.9),
            create_similarity_result(pattern2.clone(), 0.7),
        ];

        let ranker = RecommendationRanker::new(&store);
        let recommendations = ranker.rank(results)?;

        assert_eq!(recommendations.len(), 2);

        // Verify all scores are in [0, 1]
        for rec in &recommendations {
            assert!(rec.similarity_score >= 0.0 && rec.similarity_score <= 1.0);
            assert!(rec.recency_score >= 0.0 && rec.recency_score <= 1.0);
            assert!(rec.usage_score >= 0.0 && rec.usage_score <= 1.0);
            assert!(rec.final_score >= 0.0 && rec.final_score <= 1.0);
        }

        Ok(())
    }

    #[test]
    fn test_custom_weights() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path)?;

        // Heavily weight similarity
        let ranker = RecommendationRanker::with_weights(&store, 0.1, 0.1, 0.7, 0.1);

        assert!((ranker.similarity_weight - 0.7).abs() < 0.001);
        assert!((ranker.recency_weight - 0.1).abs() < 0.001);
        assert!((ranker.usage_weight - 0.1).abs() < 0.001);
        assert!((ranker.success_rate_weight - 0.1).abs() < 0.001);

        Ok(())
    }

    #[test]
    fn test_explanation_generation() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path).unwrap();
        let ranker = RecommendationRanker::new(&store);

        let pattern = create_test_pattern("1", Utc::now().timestamp() - 86400);
        let explanation = ranker.generate_explanation(&pattern, 0.85, 1, 42, 0.95);

        assert!(explanation.contains("abcdef1"));
        assert!(explanation.contains("rust"));
        assert!(explanation.contains("Test pattern 1"));
        assert!(explanation.contains("85")); // Similarity percentage
        assert!(explanation.contains("1 day ago"));
        assert!(explanation.contains("42 times"));
        assert!(explanation.contains("95.0%")); // Success rate
    }

    #[test]
    fn test_weight_normalization() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path).unwrap();

        // Unnormalized weights
        let ranker = RecommendationRanker::with_weights(&store, 2.0, 3.0, 4.0, 1.0);

        // Should sum to 1.0
        let total = ranker.recency_weight
            + ranker.usage_weight
            + ranker.similarity_weight
            + ranker.success_rate_weight;
        assert!((total - 1.0).abs() < 0.001);
    }
}
