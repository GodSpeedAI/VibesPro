use anyhow::Result;
use tokio::time::{sleep, Duration};
use tracing::{info, span, Level};

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<()> {
    // Initialize tracing for this demo binary.
    // Behavior:
    // - Default: JSON logs to stdout.
    // - If compiled with `--features otlp` AND env VIBEPRO_OBSERVE=1, exports OTLP to $OTLP_ENDPOINT.
    vibepro_observe::init_tracing("observe-smoke")?;

    info!("observe-smoke starting up");

    // Emit a span with some attributes
    let demo_span = span!(Level::INFO, "demo_operation", kind = "smoke", iteration = 1);
    let _enter = demo_span.enter();

    // Emit a metric-like event
    vibepro_observe::record_metric("smoke.counter", 1.0);

    // Simulate some async work
    sleep(Duration::from_millis(123)).await;
    info!("observe-smoke completed iteration");

    Ok(())
}
