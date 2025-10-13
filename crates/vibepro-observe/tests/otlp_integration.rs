#![cfg(feature = "otlp")]

//! Integration tests for OTLP exporter using fake OpenTelemetry collector

use fake_opentelemetry_collector::{FakeCollectorServer, setup_tracer_provider};
use opentelemetry::trace::Span;
use std::time::Duration;

#[tokio::test(flavor = "multi_thread")]
async fn test_otlp_span_export_basic() {
    let mut fake_collector = FakeCollectorServer::start().await.unwrap();
    let tracer_provider = setup_tracer_provider(&fake_collector).await;

    // Use the concrete tracer type from the provider
    let tracer = opentelemetry::trace::TracerProvider::tracer(&tracer_provider, "vibepro-observe-test");

    let mut span = opentelemetry::trace::Tracer::start(&tracer, "test_operation");
    span.set_attribute(opentelemetry::KeyValue::new("test.phase", "3"));
    span.set_attribute(opentelemetry::KeyValue::new("test.type", "integration"));
    span.end();

    let _ = tracer_provider.force_flush();
    tracer_provider.shutdown().unwrap();
    drop(tracer_provider);

    let spans = fake_collector
        .exported_spans(1, Duration::from_secs(10))
        .await;

    assert_eq!(spans.len(), 1, "Expected exactly one span");
    let span_data = &spans[0];

    assert_eq!(span_data.name, "test_operation");
    println!("✓ Phase 3: OTLP span exported successfully via fake collector");
}
