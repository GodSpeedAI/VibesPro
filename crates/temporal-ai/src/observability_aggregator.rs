//! This module provides a client for querying observability data from an OpenObserve backend.
//!
//! The `ObservabilityClient` is designed to fetch aggregated metrics about the
//! performance and usage of different development patterns. This data can be used
//! to enrich the recommendations provided by the `ranker` module, allowing it to
//! favor patterns that are not only semantically similar but also have a proven
//! track record of being performant and reliable.

use crate::{Result, TemporalAIError};
use chrono::{Utc, Duration as ChronoDuration};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::env;
use std::time::Duration;

/// Defines the strategy for connecting to the OpenObserve backend.
///
/// This enum allows consumers of the `ObservabilityClient` to specify their
/// preferred connection strategy, which is particularly useful for environments
/// where both a local and a remote OpenObserve instance might be available.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ObservabilityMode {
    /// Forces the client to connect to a local OpenObserve instance at `http://localhost:5080`.
    Local,
    /// Forces the client to connect to the online OpenObserve API, using the URL
    /// specified in the `OPENOBSERVE_URL` environment variable.
    Online,
    /// The default strategy. The client will first attempt to connect to the local
    /// instance. If the local instance is unavailable, it will fall back to the
    /// online API.
    Auto,
}

/// A client for fetching pattern performance metrics from an OpenObserve backend.
///
/// This client encapsulates the logic for authenticating with and querying the
/// OpenObserve search API. It is configured via environment variables and can
/// operate in different modes as defined by `ObservabilityMode`.
///
/// # Environment Variables
///
/// - `OPENOBSERVE_ORG`: The organization name in OpenObserve. Defaults to "default".
/// - `OPENOBSERVE_USER`: The username for authentication. Defaults to "root@example.com".
/// - `OPENOBSERVE_TOKEN`: The authentication token. **This is required.**
/// - `OPENOBSERVE_URL`: The base URL for the online OpenObserve API. Required for
///   `Online` and `Auto` (fallback) modes.
pub struct ObservabilityClient {
    base_url: String,
    org: String,
    user: String,
    auth_token: String,
    http_client: Client,
    mode: ObservabilityMode,
}

/// Holds aggregated performance and usage metrics for a specific development pattern.
///
/// This struct represents the data retrieved from OpenObserve for a single pattern.
/// It provides a snapshot of how a pattern has performed over a given time period.
#[derive(Debug, Clone)]
pub struct PatternMetrics {
    /// The unique identifier of the pattern.
    pub pattern_id: String,
    /// The average latency (in milliseconds) for recommendations involving this pattern.
    pub avg_latency_ms: f32,
    /// The rate of errors associated with this pattern (a value between 0.0 and 1.0).
    pub error_rate: f32,
    /// The calculated success rate (1.0 - `error_rate`).
    pub success_rate: f32,
    /// The total number of times this pattern has been recommended.
    pub recommendation_count: u64,
}

#[derive(Serialize)]
struct SearchRequest {
    query: SqlQuery,
}

#[derive(Serialize)]
struct SqlQuery {
    sql: String,
    start_time: i64,
    end_time: i64,
    from: u32,
    size: u32,
}

#[derive(Deserialize)]
struct SearchResponse {
    hits: Vec<Value>,
}

impl ObservabilityClient {
    /// Creates a new `ObservabilityClient` from environment variables using the
    /// default `Auto` mode.
    ///
    /// This is the most common constructor. It will create a client that tries to
    /// connect to a local OpenObserve instance first and falls back to the online
    /// API if the local one is not available.
    ///
    /// # Errors
    ///
    /// Returns an error if the `OPENOBSERVE_TOKEN` environment variable is not set.
    pub fn from_env() -> Result<Self> {
        Self::from_env_with_mode(ObservabilityMode::Auto)
    }

    /// Creates a new `ObservabilityClient` from environment variables with an explicit
    /// connection mode.
    ///
    /// # Arguments
    ///
    /// * `mode` - The `ObservabilityMode` to use for this client.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The `OPENOBSERVE_TOKEN` environment variable is not set.
    /// - The mode is `Online` and the `OPENOBSERVE_URL` environment variable is not set.
    pub fn from_env_with_mode(mode: ObservabilityMode) -> Result<Self> {
        let org = env::var("OPENOBSERVE_ORG").unwrap_or_else(|_| "default".to_string());
        let user = env::var("OPENOBSERVE_USER").unwrap_or_else(|_| "root@example.com".to_string());
        let auth_token = env::var("OPENOBSERVE_TOKEN").map_err(|_| {
            TemporalAIError::ObservabilityError("OPENOBSERVE_TOKEN not set".to_string())
        })?;

        let base_url = match mode {
            ObservabilityMode::Local => "http://localhost:5080".to_string(),
            ObservabilityMode::Online => env::var("OPENOBSERVE_URL").map_err(|_| {
                TemporalAIError::ObservabilityError("OPENOBSERVE_URL not set for Online mode".to_string())
            })?,
            ObservabilityMode::Auto => {
                env::var("OPENOBSERVE_URL").unwrap_or_else(|_| "http://localhost:5080".to_string())
            }
        };

        Ok(Self {
            base_url,
            org,
            user,
            auth_token,
            http_client: Client::builder()
                .timeout(Duration::from_secs(10))
                .build()
                .map_err(|e| TemporalAIError::ObservabilityError(e.to_string()))?,
            mode,
        })
    }

    /// Checks if a local OpenObserve instance is available and healthy.
    async fn is_local_available(&self) -> bool {
        let url = "http://localhost:5080/healthz";
        match self.http_client.get(url).send().await {
            Ok(resp) => resp.status().is_success(),
            Err(_) => false,
        }
    }

    /// Queries the OpenObserve backend to retrieve performance metrics for all patterns.
    ///
    /// This method constructs and executes a SQL query against the OpenObserve search
    /// API to aggregate metrics such as average latency, error rate, and recommendation
    /// count for each pattern within a specified time window.
    ///
    /// # Arguments
    ///
    /// * `since_days` - The number of past days to include in the query.
    ///
    /// # Returns
    ///
    /// A `Result` containing a `Vec<PatternMetrics>` where each element corresponds
    /// to a pattern. The vector is sorted by recommendation count in descending order.
    pub async fn query_pattern_metrics(&self, since_days: u32) -> Result<Vec<PatternMetrics>> {
        let mut active_url = self.base_url.clone();

        // Handle the fallback logic for `Auto` mode.
        if self.mode == ObservabilityMode::Auto {
            if self.is_local_available().await {
                active_url = "http://localhost:5080".to_string();
            } else if active_url.contains("localhost") {
                if let Ok(online_url) = env::var("OPENOBSERVE_URL") {
                    if !online_url.contains("localhost") {
                        active_url = online_url;
                    }
                }
            }
        }

        let end_time = Utc::now().timestamp_micros();
        let start_time = (Utc::now() - ChronoDuration::days(since_days as i64)).timestamp_micros();

        let sql = r#"
            SELECT
              pattern_id,
              AVG(latency_ms) as avg_latency_ms,
              COUNT(*) as recommendation_count,
              SUM(CASE WHEN error = true THEN 1 ELSE 0 END) as error_count
            FROM temporal_ai_recommendations
            GROUP BY pattern_id
            ORDER BY recommendation_count DESC
        "#.to_string();

        let request = SearchRequest {
            query: SqlQuery {
                sql,
                start_time,
                end_time,
                from: 0,
                size: 1000, // Limit to the top 1000 patterns.
            },
        };

        let url = format!("{}/api/{}/search", active_url, self.org);

        let response = self.http_client
            .post(&url)
            .basic_auth(&self.user, Some(&self.auth_token))
            .json(&request)
            .send()
            .await
            .map_err(|e| TemporalAIError::ObservabilityError(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(TemporalAIError::ObservabilityError(format!(
                "OpenObserve API error: {}", response.status()
            )));
        }

        let search_response: SearchResponse = response.json().await
            .map_err(|e| TemporalAIError::ObservabilityError(format!("Failed to parse response: {}", e)))?;

        let mut metrics = Vec::new();

        for hit in search_response.hits {
            if let (Some(pattern_id), Some(avg_latency), Some(count), Some(error_count)) = (
                hit.get("pattern_id").and_then(|v| v.as_str()),
                hit.get("avg_latency_ms").and_then(|v| v.as_f64()),
                hit.get("recommendation_count").and_then(|v| v.as_u64()),
                hit.get("error_count").and_then(|v| v.as_f64()),
            ) {
                let error_rate = if count > 0 {
                    (error_count as f32) / (count as f32)
                } else {
                    0.0
                };

                metrics.push(PatternMetrics {
                    pattern_id: pattern_id.to_string(),
                    avg_latency_ms: avg_latency as f32,
                    error_rate,
                    success_rate: 1.0 - error_rate,
                    recommendation_count: count,
                });
            }
        }

        Ok(metrics)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockito::Server;

    #[tokio::test]
    async fn test_query_pattern_metrics_mock() {
        let mut server = Server::new_async().await;
        let mock = server
            .mock("POST", "/api/default/search")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(r#"{
                "hits": [{
                    "pattern_id": "abc123",
                    "avg_latency_ms": 45.2,
                    "error_count": 2,
                    "recommendation_count": 100
                }]
            }"#)
            .create_async()
            .await;

        env::set_var("OPENOBSERVE_TOKEN", "test-token");
        let server_url = server.url();
        env::set_var("OPENOBSERVE_URL", &server_url);

        let client = ObservabilityClient {
            base_url: server_url.clone(),
            org: "default".to_string(),
            user: "root".to_string(),
            auth_token: "test-token".to_string(),
            http_client: Client::new(),
            mode: ObservabilityMode::Online,
        };

        let metrics = client.query_pattern_metrics(7).await.unwrap();
        mock.assert_async().await;
        assert_eq!(metrics.len(), 1);
        assert_eq!(metrics[0].pattern_id, "abc123");
        assert_eq!(metrics[0].recommendation_count, 100);
        assert_eq!(metrics[0].error_rate, 0.02);
        assert_eq!(metrics[0].success_rate, 0.98);
    }
}
