#![cfg(feature = "otlp")]

use opentelemetry::{
    trace::{Span, Tracer as _},
    KeyValue,
};
use std::env;
use std::time::Duration;
use tokio::time::sleep;
use vibepro_observe::init_tracing;

#[tokio::test(flavor = "multi_thread")]
async fn emits_span_with_redactable_fields() {
    // Configure exporter to use injected OTLP endpoint (default to localhost vector)
    env::set_var("VIBEPRO_OBSERVE", "1");
    env::set_var("OTLP_ENDPOINT", env::var("OTLP_ENDPOINT").unwrap_or_else(|_| "http://127.0.0.1:4317".to_string()));

    init_tracing("vector-integration").expect("tracing initialization should succeed");

    let span = tracing::info_span!(
        "vector_phase3_test",
        user_email = "alice@example.com",
        auth_token = "secret-123",
        request_id = %uuid::Uuid::new_v4()
    );

    {
        let _guard = span.enter();
        tracing::info!(event = "phase3_integration", detail = "ensuring OTLP pipeline works");
    }

    drop(span);

    let tracer = opentelemetry::global::tracer("vector-integration");
    let mut direct_span = tracer.start("direct_otlp_span");
    direct_span.set_attribute(KeyValue::new("user.email", "alice@example.com"));
    direct_span.set_attribute(KeyValue::new("auth.token", "secret-123"));
    direct_span.set_attribute(KeyValue::new("phase", "phase3"));
    direct_span.end();

    // Give exporter time to flush async batches.
    sleep(Duration::from_secs(2)).await;

    env::remove_var("VIBEPRO_OBSERVE");
    env::remove_var("OTLP_ENDPOINT");
}
