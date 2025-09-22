// temporal_db/schema.rs
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SpecificationRecord {
    pub id: Uuid,
    pub spec_type: SpecificationType,
    pub identifier: String, // e.g., 'ADR-MERGE-001'
    pub title: String,
    pub content: String,
    pub template_variables: serde_json::Value,
    pub timestamp: DateTime<Utc>,
    pub version: u32,
    pub author: Option<String>,
    pub matrix_ids: Vec<String>,
    pub metadata: serde_json::Value,
    pub hash: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum SpecificationType {
    ADR,
    PRD,
    SDS,
    TS,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DecisionPoint {
    pub id: Uuid,
    pub specification_id: Uuid,
    pub decision_point: String,
    pub context: String,
    pub timestamp: DateTime<Utc>,
    pub metadata: serde_json::Value,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DecisionOption {
    pub id: Uuid,
    pub decision_point_id: Uuid,
    pub option_name: String,
    pub description: Option<String>,
    pub pros: Vec<String>,
    pub cons: Vec<String>,
    pub selected: bool,
    pub selection_rationale: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ArchitecturalPattern {
    pub id: Uuid,
    pub pattern_name: String,
    pub pattern_type: PatternType,
    pub context_similarity: f64, // 0.0 to 1.0
    pub usage_frequency: u32,
    pub success_rate: Option<f64>,
    pub last_used: Option<DateTime<Utc>>,
    pub pattern_definition: serde_json::Value,
    pub examples: Vec<String>,
    pub metadata: serde_json::Value,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum PatternType {
    Domain,
    Application,
    Infrastructure,
    Interface,
}

// Time-series optimized change tracking
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SpecificationChange {
    pub spec_id: String,
    pub change_type: ChangeType,
    pub field: String,
    pub old_value: Option<String>,
    pub new_value: String,
    pub author: String,
    pub context: String,
    pub confidence: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum ChangeType {
    Create,
    Update,
    Delete,
    Decision,
    Pattern,
}

impl SpecificationRecord {
    pub fn new(
        spec_type: SpecificationType,
        identifier: String,
        title: String,
        content: String,
        author: Option<String>,
    ) -> Self {
        let id = Uuid::new_v4();
        let timestamp = Utc::now();
        let hash = format!("{:x}", md5::compute(&content));

        Self {
            id,
            spec_type,
            identifier,
            title,
            content,
            template_variables: serde_json::Value::Object(serde_json::Map::new()),
            timestamp,
            version: 1,
            author,
            matrix_ids: Vec::new(),
            metadata: serde_json::Value::Object(serde_json::Map::new()),
            hash,
        }
    }

    pub fn update_content(&mut self, new_content: String, author: Option<String>) {
        self.content = new_content;
        self.hash = format!("{:x}", md5::compute(&self.content));
        self.version += 1;
        self.timestamp = Utc::now();
        if let Some(author) = author {
            self.author = Some(author);
        }
    }
}

impl ArchitecturalPattern {
    pub fn new(
        pattern_name: String,
        pattern_type: PatternType,
        pattern_definition: serde_json::Value,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            pattern_name,
            pattern_type,
            context_similarity: 0.0,
            usage_frequency: 0,
            success_rate: None,
            last_used: None,
            pattern_definition,
            examples: Vec::new(),
            metadata: serde_json::Value::Object(serde_json::Map::new()),
        }
    }

    pub fn use_pattern(&mut self) {
        self.usage_frequency += 1;
        self.last_used = Some(Utc::now());
    }
}
