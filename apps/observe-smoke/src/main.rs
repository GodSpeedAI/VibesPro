use anyhow::Result;
use tokio::time::{sleep, Duration};
use tracing::{info, warn, span, Level};

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<()> {
    // Initialize tracing for this demo binary.
    // Behavior:
    // - Default: JSON logs to stdout.
    // - If compiled with `--features otlp` AND env VIBEPRO_OBSERVE=1, exports OTLP to $OTLP_ENDPOINT.
    vibepro_observe::init_tracing("observe-smoke")?;

    // App log with category (DEV-PRD-018, DEV-SDS-018)
    info!(category = "app", "observe-smoke starting up");

    // Emit a span with some attributes
    let demo_span = span!(Level::INFO, "demo_operation", kind = "smoke", iteration = 1);
    let _enter = demo_span.enter();

    // App log with user context (hashed per PII policy)
    info!(category = "app", user_id_hash = "test_user_abc123", "request accepted");

    // Emit a metric-like event
    vibepro_observe::record_metric("smoke.counter", 1.0);

    // Simulate some async work
    sleep(Duration::from_millis(123)).await;

    // Security warning example (for test purposes)
    warn!(category = "security", action = "rate_limit", client_ip_hash = "192.168.1.1", "client throttled");

    info!(category = "app", "observe-smoke completed iteration");

    Ok(())
}
