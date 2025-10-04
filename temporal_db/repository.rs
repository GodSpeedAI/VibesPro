// temporal_db/repository.rs
use crate::schema::{
    SpecificationRecord, SpecificationChange, ChangeType, ArchitecturalPattern,
};
use redb::{Database, TableDefinition};
use chrono::Utc;
use std::collections::HashMap;
use anyhow::{Result, Context};

// Define table schemas for redb
const SPECIFICATIONS_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("specifications");
const PATTERNS_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("patterns");
const CHANGES_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("changes");

pub struct TemporalRepository {
    pub db_path: String,
    pub db: Option<Database>,
}

impl TemporalRepository {
    pub fn new(db_path: String) -> Self {
        Self {
            db_path,
            db: None,
        }
    }

    pub async fn initialize(&mut self) -> Result<()> {
        // Initialize redb database
        let db = Database::create(&self.db_path)
            .context("Failed to open redb database")?;

        // Create tables if they don't exist
        {
            let write_txn = db.begin_write()?;
            {
                let _ = write_txn.open_table(SPECIFICATIONS_TABLE)?;
                let _ = write_txn.open_table(PATTERNS_TABLE)?;
                let _ = write_txn.open_table(CHANGES_TABLE)?;
            }
            write_txn.commit()?;
        }

        self.db = Some(db);
        Ok(())
    }

    pub async fn store_specification(
        &self,
        spec: &SpecificationRecord,
    ) -> Result<()> {
        let db = self.db.as_ref()
            .context("Database not initialized")?;

        // Create change record for time-series
        let change = SpecificationChange {
            spec_id: spec.identifier.clone(),
            change_type: ChangeType::Create,
            field: "content".to_string(),
            old_value: None,
            new_value: spec.content.clone(),
            author: spec.author.clone().unwrap_or_else(|| "unknown".to_string()),
            context: spec.title.clone(),
            confidence: None,
        };

        // Begin write transaction
        let write_txn = db.begin_write()?;
        {
            // Store in specifications table
            let spec_key = format!("spec:{}:{}", spec.identifier, spec.timestamp.timestamp_nanos_opt().unwrap_or(0));
            let spec_value = serde_json::to_vec(spec)?;
            let mut spec_table = write_txn.open_table(SPECIFICATIONS_TABLE)?;
            spec_table.insert(spec_key.as_str(), spec_value.as_slice())?;

            // Store change in changes table
            let change_key = format!("change:{}:{}", spec.identifier, spec.timestamp.timestamp_nanos_opt().unwrap_or(0));
            let change_value = serde_json::to_vec(&change)?;
            let mut change_table = write_txn.open_table(CHANGES_TABLE)?;
            change_table.insert(change_key.as_str(), change_value.as_slice())?;
        }
        write_txn.commit()?;

        Ok(())
    }

    pub async fn get_latest_specification(
        &self,
        _spec_type: &str,
        identifier: &str,
    ) -> Result<Option<SpecificationRecord>> {
        let db = self.db.as_ref()
            .context("Database not initialized")?;

        let read_txn = db.begin_read()?;
        let spec_table = read_txn.open_table(SPECIFICATIONS_TABLE)?;

        // Scan for specifications with the given identifier
        let spec_prefix = format!("spec:{}", identifier);
        let mut latest_spec: Option<SpecificationRecord> = None;
        let mut latest_timestamp = 0i64;

        let range = spec_table.range::<&str>(..)?;
        for result in range {
            let (key, value) = result?;
            let key_str = key.value();

            // Check if key matches our prefix
            if key_str.starts_with(&spec_prefix) {
                // Extract timestamp from key
                if let Some(timestamp_str) = key_str.split(':').last() {
                    if let Ok(timestamp) = timestamp_str.parse::<i64>() {
                        if timestamp > latest_timestamp {
                            let spec: SpecificationRecord = serde_json::from_slice(value.value())?;
                            latest_spec = Some(spec);
                            latest_timestamp = timestamp;
                        }
                    }
                }
            }
        }

        Ok(latest_spec)
    }

    pub async fn store_architectural_pattern(
        &self,
        pattern: &ArchitecturalPattern,
    ) -> Result<()> {
        let db = self.db.as_ref()
            .context("Database not initialized")?;

        let write_txn = db.begin_write()?;
        {
            let pattern_key = format!("pattern:{}:{}", pattern.id, Utc::now().timestamp_nanos_opt().unwrap_or(0));
            let pattern_value = serde_json::to_vec(pattern)?;
            let mut pattern_table = write_txn.open_table(PATTERNS_TABLE)?;
            pattern_table.insert(pattern_key.as_str(), pattern_value.as_slice())?;
        }
        write_txn.commit()?;

        Ok(())
    }

    pub async fn get_similar_patterns(
        &self,
        _context: &str,
        _similarity_threshold: f64,
        _lookback_days: i64,
    ) -> Result<Vec<ArchitecturalPattern>> {
        let db = self.db.as_ref()
            .context("Database not initialized")?;

        let read_txn = db.begin_read()?;
        let pattern_table = read_txn.open_table(PATTERNS_TABLE)?;

        let mut patterns = Vec::new();

        // Scan all patterns (simplified implementation)
        let range = pattern_table.range::<&str>(..)?;
        for result in range {
            let (_key, value) = result?;
            let pattern: ArchitecturalPattern = serde_json::from_slice(value.value())?;
            patterns.push(pattern);
        }

        Ok(patterns)
    }

    pub async fn analyze_decision_patterns(
        &self,
        _lookback_days: i64,
    ) -> Result<Vec<HashMap<String, serde_json::Value>>> {
        let db = self.db.as_ref()
            .context("Database not initialized")?;

        let read_txn = db.begin_read()?;
        let change_table = read_txn.open_table(CHANGES_TABLE)?;

        // Aggregate decision patterns from changes
        let mut patterns: HashMap<(String, String), HashMap<String, serde_json::Value>> = HashMap::new();

        let range = change_table.range::<&str>(..)?;
        for result in range {
            let (key, value) = result?;
            let key_str = key.value();

            // Only process change: entries
            if !key_str.starts_with("change:") {
                continue;
            }

            let change: SpecificationChange = serde_json::from_slice(value.value())?;

            if matches!(change.change_type, ChangeType::Decision) {
                let key = (change.spec_id.clone(), change.field.clone());

                let pattern = patterns.entry(key).or_insert_with(|| {
                    let mut map = HashMap::new();
                    map.insert("decision_point".to_string(), serde_json::Value::String(change.field.clone()));
                    map.insert("spec_type".to_string(), serde_json::Value::String(
                        change.spec_id.split('-').next().unwrap_or("unknown").to_string()
                    ));
                    map.insert("total_decisions".to_string(), serde_json::Value::Number(0.into()));
                    map.insert("selected_count".to_string(), serde_json::Value::Number(0.into()));
                    map.insert("contexts".to_string(), serde_json::Value::Array(Vec::new()));
                    map
                });

                // Increment total decisions
                if let Some(serde_json::Value::Number(count)) = pattern.get_mut("total_decisions") {
                    *count = (count.as_u64().unwrap_or(0) + 1).into();
                }

                // Add context
                if let Some(serde_json::Value::Array(contexts)) = pattern.get_mut("contexts") {
                    contexts.push(serde_json::Value::String(change.context));
                }

                // Track selections (simplified logic)
                if let Some(confidence) = change.confidence {
                    if confidence > 0.7 {
                        if let Some(serde_json::Value::Number(count)) = pattern.get_mut("selected_count") {
                            *count = (count.as_u64().unwrap_or(0) + 1).into();
                        }
                    }
                }
            }
        }

        Ok(patterns.into_values().collect())
    }

    pub async fn record_decision(
        &self,
        spec_id: &str,
        decision_point: &str,
        selected_option: &str,
        context: &str,
        author: &str,
        confidence: Option<f64>,
    ) -> Result<()> {
        let db = self.db.as_ref()
            .context("Database not initialized")?;

        let change = SpecificationChange {
            spec_id: spec_id.to_string(),
            change_type: ChangeType::Decision,
            field: decision_point.to_string(),
            old_value: None,
            new_value: selected_option.to_string(),
            author: author.to_string(),
            context: context.to_string(),
            confidence,
        };

        let write_txn = db.begin_write()?;
        {
            let change_key = format!("change:{}:{}", spec_id, Utc::now().timestamp_nanos_opt().unwrap_or(0));
            let change_value = serde_json::to_vec(&change)?;
            let mut change_table = write_txn.open_table(CHANGES_TABLE)?;
            change_table.insert(change_key.as_str(), change_value.as_slice())?;
        }
        write_txn.commit()?;

        Ok(())
    }

    pub async fn close(&mut self) -> Result<()> {
        // redb automatically flushes on drop, no explicit close needed
        self.db.take();
        Ok(())
    }
}

