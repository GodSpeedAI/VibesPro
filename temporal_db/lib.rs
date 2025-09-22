// temporal_db/lib.rs
pub mod schema;
pub mod repository;

pub use schema::*;
pub use repository::*;

use anyhow::Result;

// High-level API for easy integration
pub async fn initialize_temporal_database(db_path: &str) -> Result<TemporalRepository> {
    let mut repo = TemporalRepository::new(db_path.to_string());
    repo.initialize().await?;
    Ok(repo)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use tokio;

    #[tokio::test]
    async fn test_database_initialization() {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db_path_str = db_path.to_str().unwrap();

        let repo = initialize_temporal_database(db_path_str).await;
        assert!(repo.is_ok());

        let mut repo = repo.unwrap();
        assert!(repo.close().await.is_ok());
    }

    #[tokio::test]
    async fn test_specification_storage_and_retrieval() {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db_path_str = db_path.to_str().unwrap();

        let mut repo = initialize_temporal_database(db_path_str).await.unwrap();

        let spec = SpecificationRecord::new(
            SpecificationType::ADR,
            "ADR-001".to_string(),
            "Test Decision".to_string(),
            "This is a test decision content".to_string(),
            Some("test_author".to_string()),
        );

        // Store specification
        repo.store_specification(&spec).await.unwrap();

        // Retrieve specification
        let retrieved = repo.get_latest_specification("ADR", "ADR-001").await.unwrap();
        assert!(retrieved.is_some());

        let retrieved_spec = retrieved.unwrap();
        assert_eq!(retrieved_spec.identifier, "ADR-001");
        assert_eq!(retrieved_spec.title, "Test Decision");

        repo.close().await.unwrap();
    }

    #[tokio::test]
    async fn test_architectural_pattern_storage() {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db_path_str = db_path.to_str().unwrap();

        let mut repo = initialize_temporal_database(db_path_str).await.unwrap();

        let pattern = ArchitecturalPattern::new(
            "Repository Pattern".to_string(),
            PatternType::Domain,
            serde_json::json!({
                "description": "Data access abstraction pattern",
                "implementation": "interface + concrete class"
            }),
        );

        repo.store_architectural_pattern(&pattern).await.unwrap();

        // Test pattern retrieval
        let patterns = repo.get_similar_patterns("repository", 0.5, 30).await.unwrap();
        assert!(!patterns.is_empty());

        repo.close().await.unwrap();
    }

    #[tokio::test]
    async fn test_decision_recording() {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db_path_str = db_path.to_str().unwrap();

        let mut repo = initialize_temporal_database(db_path_str).await.unwrap();

        // Record a decision
        repo.record_decision(
            "ADR-002",
            "database_choice",
            "PostgreSQL",
            "Need reliable ACID transactions",
            "architect",
            Some(0.85),
        ).await.unwrap();

        // Analyze decision patterns
        let patterns = repo.analyze_decision_patterns(30).await.unwrap();
        assert!(!patterns.is_empty());

        repo.close().await.unwrap();
    }
}
