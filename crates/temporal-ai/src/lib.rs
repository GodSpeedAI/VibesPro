//! Temporal AI Guidance Fabric
//!
//! Embedding-based pattern recommendation engine that analyzes Git commit history
//! to provide context-aware development guidance using semantic similarity search.
//!
//! ## Architecture
//!
//! - **Embedding Generator** (`embedder`): Load and execute embedding-gemma-300M for text → vector
//! - **Pattern Extractor** (`pattern_extractor`): Parse Git history into semantic descriptions
//! - **Vector Store** (`vector_store`): Persistent redb storage for embeddings and metadata
//! - **Similarity Search** (`similarity`): Cosine similarity over vector space
//! - **Recommendation Ranker** (`ranker`): Multi-factor scoring with recency and usage metrics
//! - **Observability Aggregator** (`observability_aggregator`): Correlation with performance data
//!
//! ## Usage
//!
//! ```rust,no_run
//! use temporal_ai::{Embedder, VectorStore, SimilaritySearch, RecommendationRanker};
//! use std::path::Path;
//!
//! # async fn example() -> anyhow::Result<()> {
//! // Initialize components
//! let embedder = Embedder::from_gguf("models/embedding-gemma-300M-Q4_K_M.gguf")?;
//! let store = VectorStore::open("data/temporal-ai.redb")?;
//! let search = SimilaritySearch::new(&store);
//! let ranker = RecommendationRanker::new(&store);
//!
//! // Generate embedding for query
//! let query = "Implement authentication middleware for FastAPI";
//! let query_embedding = embedder.embed(query)?;
//!
//! // Search for similar patterns
//! let results = search.search(&query_embedding, 20)?;
//!
//! // Rank recommendations
//! let recommendations = ranker.rank(results)?;
//!
//! for rec in recommendations.iter().take(5) {
//!     println!("[{:.2}] {}", rec.final_score, rec.explanation);
//! }
//! # Ok(())
//! # }
//! ```

pub mod embedder;
pub mod pattern_extractor;
pub mod schema;
pub mod similarity;
pub mod vector_store;
pub mod ranker;

// Re-exports
pub use embedder::Embedder;
pub use pattern_extractor::{Pattern, PatternExtractor};
pub use schema::{EmbeddingRecord, PerformanceMetrics};
pub use similarity::{SimilaritySearch, SimilarityResult, SearchFilters};
pub use vector_store::VectorStore;
pub use ranker::{RecommendationRanker, Recommendation};

/// Error types for the temporal-ai crate
#[derive(Debug, thiserror::Error)]
pub enum TemporalAIError {
    #[error("Model loading failed: {0}")]
    ModelLoadError(String),

    #[error("Inference failed: {0}")]
    InferenceError(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] redb::Error),

    #[error("Git repository error: {0}")]
    GitError(#[from] git2::Error),

    #[error("Pattern not found: {0}")]
    PatternNotFound(String),

    #[error("Invalid embedding dimension: expected {expected}, got {actual}")]
    DimensionMismatch { expected: usize, actual: usize },

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),
}

impl From<redb::CommitError> for TemporalAIError {
    fn from(err: redb::CommitError) -> Self {
        TemporalAIError::DatabaseError(redb::Error::from(err))
    }
}

impl From<redb::DatabaseError> for TemporalAIError {
    fn from(err: redb::DatabaseError) -> Self {
        TemporalAIError::DatabaseError(redb::Error::from(err))
    }
}

impl From<redb::StorageError> for TemporalAIError {
    fn from(err: redb::StorageError) -> Self {
        TemporalAIError::DatabaseError(redb::Error::from(err))
    }
}

impl From<redb::TableError> for TemporalAIError {
    fn from(err: redb::TableError) -> Self {
        TemporalAIError::DatabaseError(redb::Error::from(err))
    }
}

impl From<redb::TransactionError> for TemporalAIError {
    fn from(err: redb::TransactionError) -> Self {
        TemporalAIError::DatabaseError(redb::Error::from(err))
    }
}

impl From<serde_json::Error> for TemporalAIError {
    fn from(err: serde_json::Error) -> Self {
        TemporalAIError::SerializationError(err.to_string())
    }
}

impl From<rmp_serde::encode::Error> for TemporalAIError {
    fn from(err: rmp_serde::encode::Error) -> Self {
        TemporalAIError::SerializationError(err.to_string())
    }
}

impl From<rmp_serde::decode::Error> for TemporalAIError {
    fn from(err: rmp_serde::decode::Error) -> Self {
        TemporalAIError::SerializationError(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, TemporalAIError>;

/// Embedding dimension for embedding-gemma-300M
pub const EMBEDDING_DIM: usize = 768;

/// Current schema version for embeddings
pub const SCHEMA_VERSION: u8 = 1;

#[cfg(test)]
mod tests {
    #[test]
    fn test_constants() {
        assert_eq!(super::EMBEDDING_DIM, 768);
        assert_eq!(super::SCHEMA_VERSION, 1);
    }
}
