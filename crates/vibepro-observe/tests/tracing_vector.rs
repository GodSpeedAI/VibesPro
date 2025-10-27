#![cfg(feature = "otlp")]

use opentelemetry::{
    trace::{Span, Tracer as _},
    KeyValue,
};
use std::env;
use std::time::Duration;
use tokio::time::sleep;
use vibepro_observe::{init_tracing, shutdown_tracing};

// Small RAII helper that captures previous values of environment variables
// and restores them when dropped. This ensures tests don't leak env changes
// even if they panic.
struct EnvVarGuard {
    vibep: Option<String>,
    otlp: Option<String>,
}

impl EnvVarGuard {
    fn capture() -> Self {
        let vibep = env::var("VIBEPRO_OBSERVE").ok();
        let otlp = env::var("OTLP_ENDPOINT").ok();
        EnvVarGuard { vibep, otlp }
    }

    fn set_for_test(&self) {
        // Set the vars for the test run. Use the existing OTLP_ENDPOINT if present,
        // otherwise default to localhost vector.
        env::set_var("VIBEPRO_OBSERVE", "1");
        if let Some(ref ep) = self.otlp {
            // respect existing value
            env::set_var("OTLP_ENDPOINT", ep);
        } else {
            env::set_var("OTLP_ENDPOINT", "http://127.0.0.1:4317");
        }
    }
}

impl Drop for EnvVarGuard {
    fn drop(&mut self) {
        // Explicitly flush the exporter with error handling
        // Ignore errors during shutdown as we're in a Drop context
        let _ = shutdown_tracing();

        // Restore original environment variables
        if let Some(val) = &self.vibep {
            env::set_var("VIBEPRO_OBSERVE", val);
        } else {
            env::remove_var("VIBEPRO_OBSERVE");
        }

        if let Some(val) = &self.otlp {
            env::set_var("OTLP_ENDPOINT", val);
        } else {
            env::remove_var("OTLP_ENDPOINT");
        }
    }
}

#[tokio::test(flavor = "multi_thread")]
async fn emits_span_with_redactable_fields() {
    // Capture prior env var state and set test-specific values. The guard will
    // restore originals in Drop even if the test panics.
    let guard = EnvVarGuard::capture();
    guard.set_for_test();

    init_tracing("vector-integration").expect("tracing initialization should succeed");

    let span = tracing::info_span!(
        "vector_phase3_test",
        user_email = "alice@example.com",
        auth_token = "secret-123",
        request_id = %uuid::Uuid::new_v4()
    );

    {
        let _guard = span.enter();
        tracing::info!(
            event = "phase3_integration",
            detail = "ensuring OTLP pipeline works"
        );
    }

    let tracer = opentelemetry::global::tracer("vector-integration");
    let mut direct_span = tracer.start("direct_otlp_span");
    direct_span.set_attribute(KeyValue::new("user.email", "alice@example.com"));
    direct_span.set_attribute(KeyValue::new("auth.token", "secret-123"));
    direct_span.set_attribute(KeyValue::new("phase", "phase3"));
    direct_span.end();

    // Give exporter time to flush async batches.
    sleep(Duration::from_secs(2)).await;

    // guard is dropped here (end of scope) and will restore env vars
}
