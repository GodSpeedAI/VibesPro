// temporal_db/repository.rs
use crate::schema::{
    SpecificationRecord, SpecificationChange, ChangeType, ArchitecturalPattern,
    DecisionPoint, DecisionOption, SpecificationType, PatternType
};
use sled::{Db, IVec};
use uuid::Uuid;
use chrono::{DateTime, Utc, Duration};
use std::collections::HashMap;
use anyhow::{Result, Context};

pub struct TemporalRepository {
    pub db_path: String,
    pub db: Option<Db>,
}

impl TemporalRepository {
    pub fn new(db_path: String) -> Self {
        Self {
            db_path,
            db: None,
        }
    }

    pub async fn initialize(&mut self) -> Result<()> {
        // Initialize sled database
        self.db = Some(sled::open(&self.db_path)
            .context("Failed to open sled database")?);

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

        // Store in specifications tree
        let spec_key = format!("spec:{}:{}", spec.identifier, spec.timestamp.timestamp_nanos());
        let spec_value = serde_json::to_vec(spec)?;
        db.insert(&spec_key, spec_value)?;

        // Store change in changes tree
        let change_key = format!("change:{}:{}", spec.identifier, spec.timestamp.timestamp_nanos());
        let change_value = serde_json::to_vec(&change)?;
        db.insert(&change_key, change_value)?;

        db.flush()?;
        Ok(())
    }

    pub async fn get_latest_specification(
        &self,
        _spec_type: &str,
        identifier: &str,
    ) -> Result<Option<SpecificationRecord>> {
        let db = self.db.as_ref()
            .context("Database not initialized")?;

        // Scan for specifications with the given identifier
        let spec_prefix = format!("spec:{}", identifier);
        let mut latest_spec: Option<SpecificationRecord> = None;
        let mut latest_timestamp = 0i64;

        for result in db.scan_prefix(&spec_prefix) {
            let (key, value) = result?;
            let key_str = String::from_utf8_lossy(&key);

            // Extract timestamp from key
            if let Some(timestamp_str) = key_str.split(':').last() {
                if let Ok(timestamp) = timestamp_str.parse::<i64>() {
                    if timestamp > latest_timestamp {
                        let spec: SpecificationRecord = serde_json::from_slice(&value)?;
                        latest_spec = Some(spec);
                        latest_timestamp = timestamp;
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

        let pattern_key = format!("pattern:{}:{}", pattern.id, Utc::now().timestamp_nanos());
        let pattern_value = serde_json::to_vec(pattern)?;
        db.insert(&pattern_key, pattern_value)?;

        db.flush()?;
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

        let mut patterns = Vec::new();

        // Scan all patterns (simplified implementation)
        for result in db.scan_prefix("pattern:") {
            let (_key, value) = result?;
            let pattern: ArchitecturalPattern = serde_json::from_slice(&value)?;
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

        // Aggregate decision patterns from changes
        let mut patterns: HashMap<(String, String), HashMap<String, serde_json::Value>> = HashMap::new();

        for result in db.scan_prefix("change:") {
            let (_key, value) = result?;
            let change: SpecificationChange = serde_json::from_slice(&value)?;

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
                if let Some(serde_json::Value::Number(ref mut count)) = pattern.get_mut("total_decisions") {
                    *count = (count.as_u64().unwrap_or(0) + 1).into();
                }

                // Add context
                if let Some(serde_json::Value::Array(ref mut contexts)) = pattern.get_mut("contexts") {
                    contexts.push(serde_json::Value::String(change.context));
                }

                // Track selections (simplified logic)
                if let Some(confidence) = change.confidence {
                    if confidence > 0.7 {
                        if let Some(serde_json::Value::Number(ref mut count)) = pattern.get_mut("selected_count") {
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

        let change_key = format!("change:{}:{}", spec_id, Utc::now().timestamp_nanos());
        let change_value = serde_json::to_vec(&change)?;
        db.insert(&change_key, change_value)?;

        db.flush()?;
        Ok(())
    }

    pub async fn close(&mut self) -> Result<()> {
        if let Some(db) = self.db.take() {
            db.flush()?;
        }
        Ok(())
    }
}
