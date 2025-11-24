use serde_json::json;
use std::env;
use temporal_ai::observability_aggregator::{ObservabilityClient, ObservabilityMode};
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

#[tokio::test]
async fn test_observability_client_creation() {
    env::set_var("OPENOBSERVE_TOKEN", "test-token");
    env::set_var("OPENOBSERVE_URL", "http://localhost:5080");

    let _client = ObservabilityClient::from_env().unwrap();
    // We can't easily inspect private fields, but if it didn't panic, it's good.
}

#[tokio::test]
async fn test_end_to_end_with_mock() {
    // Start mock server
    let mock_server = MockServer::start().await;

    // Mock OpenObserve search response
    Mock::given(method("POST"))
        .and(path("/api/default/search"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "hits": [{
                "pattern_id": "test-pattern-1",
                "avg_latency_ms": 50.0,
                "error_count": 5,
                "recommendation_count": 100
            }]
        })))
        .mount(&mock_server)
        .await;

    // Configure client to use mock server
    env::set_var("OPENOBSERVE_URL", mock_server.uri());
    env::set_var("OPENOBSERVE_TOKEN", "test-token");
    env::set_var("OPENOBSERVE_ORG", "default");
    env::set_var("OPENOBSERVE_USER", "root");

    // Force Online mode to use the mock server URL (since Auto might try localhost:5080)
    // Actually, we can use Auto if we set OPENOBSERVE_URL to mock server and ensure localhost:5080 is not reachable?
    // But localhost:5080 might be reachable if the user has it running!
    // So we should use Online mode for reliable testing.
    let client = ObservabilityClient::from_env_with_mode(ObservabilityMode::Online).unwrap();

    let metrics = client.query_pattern_metrics(7).await.unwrap();

    assert_eq!(metrics.len(), 1);
    assert_eq!(metrics[0].pattern_id, "test-pattern-1");
    assert_eq!(metrics[0].avg_latency_ms, 50.0);
    assert_eq!(metrics[0].recommendation_count, 100);
    assert_eq!(metrics[0].error_rate, 0.05); // 5/100
    assert_eq!(metrics[0].success_rate, 0.95); // 1.0 - 0.05
}

#[tokio::test]
async fn test_empty_response() {
    let mock_server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/api/default/search"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "hits": []
        })))
        .mount(&mock_server)
        .await;

    env::set_var("OPENOBSERVE_URL", mock_server.uri());
    env::set_var("OPENOBSERVE_TOKEN", "test-token");

    let client = ObservabilityClient::from_env_with_mode(ObservabilityMode::Online).unwrap();
    let metrics = client.query_pattern_metrics(7).await.unwrap();

    assert!(metrics.is_empty());
}

#[tokio::test]
async fn test_api_error() {
    let mock_server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/api/default/search"))
        .respond_with(ResponseTemplate::new(500))
        .mount(&mock_server)
        .await;

    env::set_var("OPENOBSERVE_URL", mock_server.uri());
    env::set_var("OPENOBSERVE_TOKEN", "test-token");

    let client = ObservabilityClient::from_env_with_mode(ObservabilityMode::Online).unwrap();
    let result = client.query_pattern_metrics(7).await;

    assert!(result.is_err());
}
