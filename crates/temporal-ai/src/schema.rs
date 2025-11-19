//! Database schema definitions for the temporal AI vector store

use chrono::Utc;
use redb::TableDefinition;
use serde::{Deserialize, Serialize};

/// Primary embedding storage
/// Key: pattern_id (SHA-256 hex string)
/// Value: MessagePack-encoded EmbeddingRecord
pub const EMBEDDINGS: TableDefinition<&str, &[u8]> = TableDefinition::new("embeddings_v1");

/// Pattern metadata
/// Key: pattern_id
/// Value: JSON-encoded Pattern
pub const METADATA: TableDefinition<&str, &str> = TableDefinition::new("metadata_v1");

/// Performance tracking
/// Key: pattern_id
/// Value: JSON-encoded PerformanceMetrics
pub const METRICS: TableDefinition<&str, &str> = TableDefinition::new("metrics_v1");

/// Index: file_path → [pattern_id]
pub const FILE_PATH_INDEX: TableDefinition<&str, &str> = TableDefinition::new("file_path_idx_v1");

/// Index: tag → [pattern_id]
pub const TAG_INDEX: TableDefinition<&str, &str> = TableDefinition::new("tag_idx_v1");

/// Embedding record stored in the vector database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddingRecord {
    /// Embedding vector with length [`crate::EMBEDDING_DIM`]
    pub vector: Vec<f32>,

    /// Precomputed L2 norm for optimization
    pub norm: f32,

    /// Creation timestamp
    pub created_at: i64,

    /// Schema version
    pub version: u8,
}

impl EmbeddingRecord {
    /// Create a new embedding record with L2 normalization
    pub fn new(vector: Vec<f32>) -> Self {
        assert_eq!(
            vector.len(),
            crate::EMBEDDING_DIM,
            "Expected embedding vectors of length {}",
            crate::EMBEDDING_DIM
        );
        let norm = Self::compute_norm(&vector);
        Self {
            vector,
            norm,
            created_at: Utc::now().timestamp(),
            version: crate::SCHEMA_VERSION,
        }
    }

    /// Compute L2 norm of a vector
    fn compute_norm(vec: &[f32]) -> f32 {
        vec.iter().map(|x| x * x).sum::<f32>().sqrt()
    }

    /// Get the normalized vector
    pub fn normalized(&self) -> Vec<f32> {
        if self.norm.abs() <= f32::EPSILON {
            return self.vector.clone();
        }
        self.vector.iter().map(|x| x / self.norm).collect()
    }
}

/// Performance metrics for a pattern
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PerformanceMetrics {
    /// Number of times this pattern was recommended
    pub usage_count: u64,

    /// Average relevance score from recommendations
    pub avg_relevance_score: f32,

    /// Last time this pattern was recommended (Unix timestamp)
    pub last_recommended: i64,

    /// User feedback scores (-1, 0, 1)
    #[serde(default)]
    pub feedback_scores: Vec<i8>,

    /// Success rate from OpenObserve (0.0-1.0)
    #[serde(default)]
    pub success_rate: Option<f32>,

    /// Average recommendation latency in ms
    #[serde(default)]
    pub avg_latency_ms: Option<f32>,

    /// Error rate (0.0-1.0)
    #[serde(default)]
    pub error_rate: Option<f32>,
}

impl PerformanceMetrics {
    /// Create new metrics
    pub fn new() -> Self {
        Self::default()
    }

    /// Update metrics after a recommendation
    pub fn record_recommendation(&mut self, score: f32, feedback: Option<i8>) {
        self.usage_count += 1;
        self.last_recommended = Utc::now().timestamp();

        // Update rolling average
        let total = self.avg_relevance_score * (self.usage_count - 1) as f32 + score;
        self.avg_relevance_score = total / self.usage_count as f32;

        if let Some(fb) = feedback {
            self.feedback_scores.push(fb);
        }
    }

    /// Calculate average feedback score
    pub fn avg_feedback(&self) -> f32 {
        if self.feedback_scores.is_empty() {
            return 0.0;
        }
        let sum: i32 = self.feedback_scores.iter().map(|&x| x as i32).sum();
        sum as f32 / self.feedback_scores.len() as f32
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_embedding_record_norm() {
        let vector = vec![3.0, 4.0];
        let record = EmbeddingRecord::new(vector);
        assert_eq!(record.norm, 5.0); // sqrt(3^2 + 4^2) = 5
    }

    #[test]
    fn test_embedding_record_normalized() {
        let vector = vec![3.0, 4.0];
        let record = EmbeddingRecord::new(vector);
        let normalized = record.normalized();
        assert!((normalized[0] - 0.6).abs() < 0.001);
        assert!((normalized[1] - 0.8).abs() < 0.001);
    }

    #[test]
    fn test_performance_metrics_update() {
        let mut metrics = PerformanceMetrics::new();

        metrics.record_recommendation(0.8, Some(1));
        assert_eq!(metrics.usage_count, 1);
        assert_eq!(metrics.avg_relevance_score, 0.8);

        metrics.record_recommendation(0.6, Some(-1));
        assert_eq!(metrics.usage_count, 2);
        assert_eq!(metrics.avg_relevance_score, 0.7); // (0.8 + 0.6) / 2

        assert_eq!(metrics.avg_feedback(), 0.0); // (1 + -1) / 2
    }
}
