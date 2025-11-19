//! Vector storage using redb embedded database

use crate::pattern_extractor::Pattern;
use crate::schema::{
    EmbeddingRecord, PerformanceMetrics, EMBEDDINGS, FILE_PATH_INDEX, METADATA, METRICS, TAG_INDEX,
};
use crate::{Result, TemporalAIError};
use redb::{Database, ReadableTable, Table, TableDefinition};
use std::collections::HashSet;
use std::path::Path;

/// Vector store for embeddings and metadata
pub struct VectorStore {
    db: Database,
}

impl VectorStore {
    /// Open or create database
    pub fn open(db_path: impl AsRef<Path>) -> Result<Self> {
        // Ensure parent directory exists
        if let Some(parent) = db_path.as_ref().parent() {
            std::fs::create_dir_all(parent)?;
        }

        let db = Database::create(db_path)?;

        // Initialize tables
        let write_txn = db.begin_write()?;
        {
            let _ = write_txn.open_table(EMBEDDINGS)?;
            let _ = write_txn.open_table(METADATA)?;
            let _ = write_txn.open_table(METRICS)?;
            let _ = write_txn.open_table(FILE_PATH_INDEX)?;
            let _ = write_txn.open_table(TAG_INDEX)?;
        }
        write_txn.commit()?;

        Ok(Self { db })
    }

    /// Insert pattern with embedding
    pub fn insert(&self, pattern: &Pattern, embedding: Vec<f32>) -> Result<()> {
        let embedding_record = EmbeddingRecord::new(embedding);

        let write_txn = self.db.begin_write()?;

        {
            // Store embedding
            let mut embeddings_table = write_txn.open_table(EMBEDDINGS)?;
            let embedding_bytes = rmp_serde::to_vec(&embedding_record)?;
            embeddings_table.insert(pattern.id.as_str(), embedding_bytes.as_slice())?;

            // Store metadata
            let mut metadata_table = write_txn.open_table(METADATA)?;
            let metadata_json = serde_json::to_string(pattern)?;
            metadata_table.insert(pattern.id.as_str(), metadata_json.as_str())?;

            // Initialize metrics
            let mut metrics_table = write_txn.open_table(METRICS)?;
            let metrics = PerformanceMetrics::new();
            let metrics_json = serde_json::to_string(&metrics)?;
            metrics_table.insert(pattern.id.as_str(), metrics_json.as_str())?;

            // Update file path index
            let mut file_path_index = write_txn.open_table(FILE_PATH_INDEX)?;
            for file_path in &pattern.file_paths {
                Self::update_index_entry(
                    &mut file_path_index,
                    file_path.as_str(),
                    pattern.id.as_str(),
                )?;
            }

            // Update tag index
            let mut tag_index = write_txn.open_table(TAG_INDEX)?;
            for tag in &pattern.tags {
                Self::update_index_entry(&mut tag_index, tag.as_str(), pattern.id.as_str())?;
            }
        }

        write_txn.commit()?;

        Ok(())
    }

    /// Retrieve embedding by pattern ID
    pub fn get_embedding(&self, pattern_id: &str) -> Result<Option<Vec<f32>>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(EMBEDDINGS)?;

        if let Some(bytes) = table.get(pattern_id)? {
            let record: EmbeddingRecord = rmp_serde::from_slice(bytes.value())?;
            Ok(Some(record.vector))
        } else {
            Ok(None)
        }
    }

    /// Get pattern metadata by ID
    pub fn get_pattern(&self, pattern_id: &str) -> Result<Option<Pattern>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(METADATA)?;

        if let Some(json) = table.get(pattern_id)? {
            let pattern: Pattern = serde_json::from_str(json.value())?;
            Ok(Some(pattern))
        } else {
            Ok(None)
        }
    }

    /// Get performance metrics by ID
    pub fn get_metrics(&self, pattern_id: &str) -> Result<Option<PerformanceMetrics>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(METRICS)?;

        if let Some(json) = table.get(pattern_id)? {
            let metrics: PerformanceMetrics = serde_json::from_str(json.value())?;
            Ok(Some(metrics))
        } else {
            Ok(None)
        }
    }
    /// Fetch embedding and metadata together
    pub fn get_embedding_and_pattern(
        &self,
        pattern_id: &str,
    ) -> Result<Option<(Vec<f32>, Pattern)>> {
        let read_txn = self.db.begin_read()?;
        let embeddings = read_txn.open_table(EMBEDDINGS)?;
        let metadata = read_txn.open_table(METADATA)?;

        let embedding_bytes = match embeddings.get(pattern_id)? {
            Some(bytes) => bytes,
            None => return Ok(None),
        };

        let pattern_json = match metadata.get(pattern_id)? {
            Some(json) => json,
            None => return Ok(None),
        };

        let record: EmbeddingRecord = rmp_serde::from_slice(embedding_bytes.value())?;
        let pattern: Pattern = serde_json::from_str(pattern_json.value())?;

        Ok(Some((record.vector, pattern)))
    }

    /// Get all pattern IDs (for full scan)
    pub fn list_patterns(&self) -> Result<Vec<String>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(METADATA)?;

        let mut pattern_ids = Vec::new();
        let iter = table.iter()?;

        for item in iter {
            let (key, _) = item?;
            pattern_ids.push(key.value().to_string());
        }

        Ok(pattern_ids)
    }

    /// Find patterns by file path
    pub fn find_by_file_path(&self, file_path: &str) -> Result<Vec<String>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(FILE_PATH_INDEX)?;

        if let Some(json) = table.get(file_path)? {
            let pattern_ids: Vec<String> = serde_json::from_str(json.value())?;
            Ok(pattern_ids)
        } else {
            Ok(Vec::new())
        }
    }

    /// Find patterns by tag
    pub fn find_by_tag(&self, tag: &str) -> Result<Vec<String>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(TAG_INDEX)?;

        if let Some(json) = table.get(tag)? {
            let pattern_ids: Vec<String> = serde_json::from_str(json.value())?;
            Ok(pattern_ids)
        } else {
            Ok(Vec::new())
        }
    }

    /// Update performance metrics
    pub fn update_metrics(&self, pattern_id: &str, metrics: PerformanceMetrics) -> Result<()> {
        let write_txn = self.db.begin_write()?;

        {
            let mut table = write_txn.open_table(METRICS)?;
            let json = serde_json::to_string(&metrics)?;
            table.insert(pattern_id, json.as_str())?;
        }

        write_txn.commit()?;

        Ok(())
    }

    fn update_index_entry(
        table: &mut Table<&str, &str>,
        key: &str,
        pattern_id: &str,
    ) -> Result<()> {
        let (mut ids, is_new) = {
            let existing = table.get(key)?;
            if let Some(value) = existing {
                (serde_json::from_str::<HashSet<String>>(value.value())?, false)
            } else {
                (HashSet::new(), true)
            }
        };

        let inserted = ids.insert(pattern_id.to_string());
        if inserted || is_new {
            let mut sorted: Vec<_> = ids.into_iter().collect();
            sorted.sort();
            let updated = serde_json::to_string(&sorted)?;
            table.insert(key, updated.as_str())?;
        }

        Ok(())
    }

    /// Batch insert for efficiency
    pub fn insert_batch(&self, records: &[(Pattern, Vec<f32>)]) -> Result<()> {
        let write_txn = self.db.begin_write()?;

        {
            let mut embeddings_table = write_txn.open_table(EMBEDDINGS)?;
            let mut metadata_table = write_txn.open_table(METADATA)?;
            let mut metrics_table = write_txn.open_table(METRICS)?;
            let mut file_path_index = write_txn.open_table(FILE_PATH_INDEX)?;
            let mut tag_index = write_txn.open_table(TAG_INDEX)?;

            for (pattern, embedding) in records {
                let embedding_record = EmbeddingRecord::new(embedding.clone());
                let embedding_bytes = rmp_serde::to_vec(&embedding_record)?;
                embeddings_table.insert(pattern.id.as_str(), embedding_bytes.as_slice())?;

                let metadata_json = serde_json::to_string(pattern)?;
                metadata_table.insert(pattern.id.as_str(), metadata_json.as_str())?;

                let metrics = PerformanceMetrics::new();
                let metrics_json = serde_json::to_string(&metrics)?;
                metrics_table.insert(pattern.id.as_str(), metrics_json.as_str())?;

                // Update indexes
                for file_path in &pattern.file_paths {
                    Self::update_index_entry(
                        &mut file_path_index,
                        file_path.as_str(),
                        pattern.id.as_str(),
                    )?;
                }

                for tag in &pattern.tags {
                    Self::update_index_entry(&mut tag_index, tag.as_str(), pattern.id.as_str())?;
                }
            }
        }

        write_txn.commit()?;

        Ok(())
    }

    /// Get database size estimate
    pub fn size(&self) -> Result<u64> {
        // Estimate based on pattern count
        let patterns = self.list_patterns()?;
        // Rough estimate: 3KB per embedding + 500B metadata
        Ok(patterns.len() as u64 * 3500)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn create_test_pattern() -> Pattern {
        Pattern {
            id: "test123".to_string(),
            description: "Test pattern".to_string(),
            file_paths: vec!["src/main.rs".to_string()],
            commit_sha: "abc123".to_string(),
            timestamp: 1234567890,
            tags: vec!["rust".to_string(), "test".to_string()],
        }
    }

    #[test]
    fn test_vector_store_create() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let _store = VectorStore::open(&db_path)?;

        assert!(db_path.exists());
        Ok(())
    }

    #[test]
    fn test_insert_and_retrieve() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path)?;

        let pattern = create_test_pattern();
        let embedding = vec![0.1; 768];

        store.insert(&pattern, embedding.clone())?;

        let retrieved_embedding = store.get_embedding(&pattern.id)?;
        assert!(retrieved_embedding.is_some());
        assert_eq!(retrieved_embedding.unwrap().len(), 768);

        let retrieved_pattern = store.get_pattern(&pattern.id)?;
        assert!(retrieved_pattern.is_some());
        assert_eq!(retrieved_pattern.unwrap().id, pattern.id);

        Ok(())
    }

    #[test]
    fn test_list_patterns() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path)?;

        let pattern1 = create_test_pattern();
        let pattern2 = Pattern {
            id: "test456".to_string(),
            ..create_test_pattern()
        };

        store.insert(&pattern1, vec![0.1; 768])?;
        store.insert(&pattern2, vec![0.2; 768])?;

        let patterns = store.list_patterns()?;
        assert_eq!(patterns.len(), 2);
        assert!(patterns.contains(&pattern1.id));
        assert!(patterns.contains(&pattern2.id));

        Ok(())
    }

    #[test]
    fn test_find_by_tag() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path)?;

        let pattern = create_test_pattern();
        store.insert(&pattern, vec![0.1; 768])?;

        let rust_patterns = store.find_by_tag("rust")?;
        assert_eq!(rust_patterns.len(), 1);
        assert_eq!(rust_patterns[0], pattern.id);

        Ok(())
    }

    #[test]
    fn test_find_by_file_path_index() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path)?;

        let mut pattern = create_test_pattern();
        pattern.id = "file-path-pattern".to_string();
        pattern.file_paths = vec!["src/lib.rs".to_string()];
        store.insert(&pattern, vec![0.1; 768])?;

        let matches = store.find_by_file_path("src/lib.rs")?;
        assert_eq!(matches, vec![pattern.id]);

        Ok(())
    }

    #[test]
    fn test_insert_batch_persists_records() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path)?;

        let mut pattern1 = create_test_pattern();
        pattern1.id = "batch-1".to_string();
        pattern1.file_paths = vec!["src/one.rs".to_string()];

        let mut pattern2 = create_test_pattern();
        pattern2.id = "batch-2".to_string();
        pattern2.file_paths = vec!["src/two.rs".to_string()];
        pattern2.commit_sha = "def456".to_string();

        let records = vec![
            (pattern1.clone(), vec![0.1; 768]),
            (pattern2.clone(), vec![0.2; 768]),
        ];

        store.insert_batch(&records)?;

        let patterns = store.list_patterns()?;
        assert_eq!(patterns.len(), 2);
        assert!(patterns.contains(&pattern1.id));
        assert!(patterns.contains(&pattern2.id));

        let file_matches = store.find_by_file_path("src/two.rs")?;
        assert_eq!(file_matches, vec![pattern2.id]);

        Ok(())
    }

    #[test]
    fn test_metrics_update() -> Result<()> {
        let dir = tempdir()?;
        let db_path = dir.path().join("test.redb");
        let store = VectorStore::open(&db_path)?;

        let pattern = create_test_pattern();
        store.insert(&pattern, vec![0.1; 768])?;

        let mut metrics = store.get_metrics(&pattern.id)?.unwrap();
        metrics.record_recommendation(0.9, Some(1));

        store.update_metrics(&pattern.id, metrics.clone())?;

        let retrieved = store.get_metrics(&pattern.id)?.unwrap();
        assert_eq!(retrieved.usage_count, 1);
        assert_eq!(retrieved.avg_relevance_score, 0.9);

        Ok(())
    }
}
