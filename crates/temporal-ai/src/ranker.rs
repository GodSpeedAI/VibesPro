//! Recommendation ranking with multi-factor scoring

use crate::pattern_extractor::Pattern;
use crate::similarity::SimilarityResult;
use crate::vector_store::VectorStore;
use crate::{Result, TemporalAIError};
use chrono::Utc;

/// Final recommendation with explanation
#[derive(Debug, Clone)]
pub struct Recommendation {
    pub pattern: Pattern,
    pub similarity_score: f32,
    pub recency_score: f32,
    pub usage_score: f32,
    pub final_score: f32,
    pub explanation: String,
}

/// Recommendation ranker
pub struct RecommendationRanker<'a> {
    store: &'a VectorStore,
    recency_weight: f32,
    usage_weight: f32,
    similarity_weight: f32,
}

impl<'a> RecommendationRanker<'a> {
    /// Create new ranker with default weights
    pub fn new(store: &'a VectorStore) -> Self {
        Self {
            store,
            recency_weight: 0.2,
            usage_weight: 0.3,
            similarity_weight: 0.5,
        }
    }

    /// Create ranker with custom weights
    pub fn with_weights(store: &'a VectorStore, recency: f32, usage: f32, similarity: f32) -> Self {
        // Normalize weights to sum to 1.0
        let total = recency + usage + similarity;
        let (recency_weight, usage_weight, similarity_weight) = if total.abs() <= f32::EPSILON {
            (1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0)
        } else {
            (recency / total, usage / total, similarity / total)
        };
        Self {
            store,
            recency_weight,
            usage_weight,
            similarity_weight,
        }
    }

    /// Rank similarity results
    pub fn rank(&self, results: Vec<SimilarityResult>) -> Result<Vec<Recommendation>> {
        let now = Utc::now().timestamp();

        let mut recommendations: Vec<Recommendation> = results
            .into_iter()
            .map(|result| {
                // Calculate recency score (exponential decay)
                let raw_days = (now - result.pattern.timestamp) as f32 / 86400.0;
                let days_since = raw_days.max(0.0);
                let recency_score = (-0.01 * days_since).exp();

                // Get usage metrics
                let metrics = self.store.get_metrics(&result.pattern_id).ok().flatten();
                let (usage_score, usage_count) = if let Some(m) = metrics {
                    // Normalize usage count (cap at 100)
                    ((m.usage_count as f32 / 100.0).min(1.0), m.usage_count)
                } else {
                    (0.0, 0)
                };

                // Calculate final score
                let final_score = self.similarity_weight * result.score
                    + self.recency_weight * recency_score
                    + self.usage_weight * usage_score;

                // Generate explanation
                let explanation = self.generate_explanation(
                    &result.pattern,
                    result.score,
                    days_since.round() as i64,
                    usage_count,
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

        // Sort by final score descending
        recommendations.sort_by(|a, b| {
            b.final_score
                .partial_cmp(&a.final_score)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        Ok(recommendations)
    }

    /// Generate human-readable explanation
    fn generate_explanation(
        &self,
        pattern: &Pattern,
        similarity: f32,
        days_ago: i64,
        usage_count: u64,
    ) -> String {
        let commit_short: String = pattern.commit_sha.chars().take(7).collect();
        let commit_display = if commit_short.is_empty() {
            pattern.commit_sha.clone()
        } else {
            commit_short
        };
        let tags = pattern.tags.join(", ");
        let day_label = if days_ago == 1 { "day" } else { "days" };

        format!(
            "Pattern from {} ({}): {} - Similarity: {:.1}%, Recency: {} {} ago, Usage: {} times",
            commit_display,
            tags,
            pattern.description,
            similarity * 100.0,
            days_ago,
            day_label,
            usage_count
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
        let ranker = RecommendationRanker::with_weights(&store, 0.1, 0.1, 0.8);

        assert!((ranker.similarity_weight - 0.8).abs() < 0.001);
        assert!((ranker.recency_weight - 0.1).abs() < 0.001);
        assert!((ranker.usage_weight - 0.1).abs() < 0.001);

        Ok(())
    }

    #[test]
    fn test_explanation_generation() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path).unwrap();
        let ranker = RecommendationRanker::new(&store);

        let pattern = create_test_pattern("1", Utc::now().timestamp() - 86400);
        let explanation = ranker.generate_explanation(&pattern, 0.85, 1, 42);

        assert!(explanation.contains("abcdef1"));
        assert!(explanation.contains("rust"));
        assert!(explanation.contains("Test pattern 1"));
        assert!(explanation.contains("85")); // Similarity percentage
        assert!(explanation.contains("1 day ago"));
        assert!(explanation.contains("42 times"));
    }

    #[test]
    fn test_weight_normalization() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path).unwrap();

        // Unnormalized weights
        let ranker = RecommendationRanker::with_weights(&store, 2.0, 3.0, 5.0);

        // Should sum to 1.0
        let total = ranker.recency_weight + ranker.usage_weight + ranker.similarity_weight;
        assert!((total - 1.0).abs() < 0.001);
    }
}
