//! This module defines the database schema for the `temporal-ai` vector store,
//! which is implemented using the `redb` key-value store.
//!
//! It includes the definitions for the `redb` tables, as well as the data
//! structures (`EmbeddingRecord`, `PerformanceMetrics`) that are serialized and
//! stored in these tables. This module is the single source of truth for the
//! on-disk data layout.

use chrono::Utc;
use redb::TableDefinition;
use serde::{Deserialize, Serialize};

// --- Table Definitions ---

/// Defines the main table for storing embedding vectors.
///
/// - **Key**: The pattern ID (a SHA-256 hex string).
/// - **Value**: A MessagePack-encoded `EmbeddingRecord`, which contains the
///   high-dimensional vector and its precomputed L2 norm.
pub const EMBEDDINGS: TableDefinition<&str, &[u8]> = TableDefinition::new("embeddings_v1");

/// Defines the table for storing the detailed metadata of each pattern.
///
/// - **Key**: The pattern ID.
/// - **Value**: A JSON-encoded `Pattern` struct from the `pattern_extractor` module.
pub const METADATA: TableDefinition<&str, &str> = TableDefinition::new("metadata_v1");

/// Defines the table for storing performance and usage metrics for each pattern.
///
/// - **Key**: The pattern ID.
/// - **Value**: A JSON-encoded `PerformanceMetrics` struct.
pub const METRICS: TableDefinition<&str, &str> = TableDefinition::new("metrics_v1");

/// An index to allow for efficient lookups of patterns by the files they affect.
///
/// - **Key**: A file path (e.g., "src/main.rs").
/// - **Value**: A JSON-encoded array of pattern IDs.
pub const FILE_PATH_INDEX: TableDefinition<&str, &str> = TableDefinition::new("file_path_idx_v1");

/// An index to allow for efficient lookups of patterns by their tags.
///
/// - **Key**: A tag (e.g., "rust", "feat").
/// - **Value**: A JSON-encoded array of pattern IDs.
pub const TAG_INDEX: TableDefinition<&str, &str> = TableDefinition::new("tag_idx_v1");


// --- Data Structures ---

/// Represents the data structure that is stored in the `EMBEDDINGS` table.
///
/// This struct holds the core vector data for a pattern, along with metadata
/// that is useful for performance and versioning.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddingRecord {
    /// The high-dimensional embedding vector, which must have a length of
    /// [`crate::EMBEDDING_DIM`].
    pub vector: Vec<f32>,

    /// The precomputed L2 norm (magnitude) of the vector. Storing this value
    /// avoids recalculating it during similarity searches, which is a significant
    /// performance optimization.
    pub norm: f32,

    /// The Unix timestamp of when this record was created.
    pub created_at: i64,

    /// The version of the schema that this record conforms to. This is useful for
    /// future data migrations. See [`crate::SCHEMA_VERSION`].
    pub version: u8,
}

impl EmbeddingRecord {
    /// Creates a new `EmbeddingRecord` from a vector.
    ///
    /// This constructor calculates the L2 norm of the vector and sets the creation
    /// timestamp and schema version.
    ///
    /// # Arguments
    ///
    /// * `vector` - The embedding vector.
    ///
    /// # Panics
    ///
    /// This method will panic if the length of the provided `vector` is not equal to
    /// [`crate::EMBEDDING_DIM`].
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

    /// Computes the L2 norm of a vector slice.
    fn compute_norm(vec: &[f32]) -> f32 {
        vec.iter().map(|x| x * x).sum::<f32>().sqrt()
    }

    /// Returns a normalized (unit) version of the embedding vector.
    pub fn normalized(&self) -> Vec<f32> {
        if self.norm.abs() <= f32::EPSILON {
            return self.vector.clone();
        }
        self.vector.iter().map(|x| x / self.norm).collect()
    }
}

/// A struct for tracking the performance and usage metrics of a pattern.
///
/// Instances of this struct are stored in the `METRICS` table. This data is used
/// by the `RecommendationRanker` to refine its scoring.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PerformanceMetrics {
    /// The total number of times this pattern has been recommended.
    pub usage_count: u64,

    /// The rolling average of the similarity scores from recommendations.
    pub avg_relevance_score: f32,

    /// The Unix timestamp of the last time this pattern was recommended.
    pub last_recommended: i64,

    /// A collection of user-provided feedback scores (e.g., -1 for "not helpful",
    /// 1 for "helpful").
    #[serde(default)]
    pub feedback_scores: Vec<i8>,

    /// The success rate of the pattern (between 0.0 and 1.0), as determined by
    /// data from an external observability source.
    #[serde(default)]
    pub success_rate: Option<f32>,

    /// The average latency (in ms) associated with recommendations of this pattern.
    #[serde(default)]
    pub avg_latency_ms: Option<f32>,

    /// The error rate (between 0.0 and 1.0) associated with this pattern.
    #[serde(default)]
    pub error_rate: Option<f32>,
}

impl PerformanceMetrics {
    /// Creates a new, empty `PerformanceMetrics` instance.
    pub fn new() -> Self {
        Self::default()
    }

    /// Updates the metrics after a pattern has been recommended.
    ///
    /// This method increments the usage count, updates the last recommended time,
    /// recalculates the average relevance score, and records any user feedback.
    ///
    /// # Arguments
    ///
    /// * `score` - The similarity score of the recommendation.
    /// * `feedback` - An optional user feedback score.
    pub fn record_recommendation(&mut self, score: f32, feedback: Option<i8>) {
        self.usage_count += 1;
        self.last_recommended = Utc::now().timestamp();

        let total_score = self.avg_relevance_score * (self.usage_count - 1) as f32 + score;
        self.avg_relevance_score = total_score / self.usage_count as f32;

        if let Some(fb) = feedback {
            self.feedback_scores.push(fb);
        }
    }

    /// Calculates the average user feedback score.
    ///
    /// The score will be between -1.0 and 1.0.
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

    fn create_test_vector() -> Vec<f32> {
        let mut vec = vec![0.0; crate::EMBEDDING_DIM];
        vec[0] = 3.0;
        vec[1] = 4.0;
        vec
    }

    #[test]
    fn test_embedding_record_norm() {
        let vector = create_test_vector();
        let record = EmbeddingRecord::new(vector);
        assert!((record.norm - 5.0).abs() < 0.001);
    }

    #[test]
    fn test_embedding_record_normalized() {
        let vector = create_test_vector();
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
        assert!((metrics.avg_relevance_score - 0.8).abs() < 0.001);

        metrics.record_recommendation(0.6, Some(-1));
        assert_eq!(metrics.usage_count, 2);
        assert!((metrics.avg_relevance_score - 0.7).abs() < 0.001); // (0.8 + 0.6) / 2

        assert!((metrics.avg_feedback() - 0.0).abs() < 0.001); // (1 + -1) / 2
    }
}
