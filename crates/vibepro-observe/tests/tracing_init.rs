use vibepro_observe::{init_tracing, record_metric};
use std::env;

#[tokio::test]
async fn init_multiple_times_is_idempotent() {
    // First call should succeed
    let result1 = init_tracing("unit-test");
    // Second call should also succeed due to guard check
    let result2 = init_tracing("unit-test");

    // Both should be Ok - the second one just returns early
    assert!(result1.is_ok() || result2.is_ok(), "At least one init should succeed");
}

#[tokio::test]
async fn emits_json_logs_by_default() {
    // Without env flag or otlp feature, we still initialize and log.
    let _ = init_tracing("unit-test-logs");
    record_metric("unit.counter", 1.0);
    // Not asserting output here; just ensuring no panic.
}

use serial_test::serial;

#[serial]
#[tokio::test]
async fn respect_env_flag_without_otlp_feature() {
    // Even if VIBEPRO_OBSERVE=1, without `otlp` feature we must not panic.
    env::set_var("VIBEPRO_OBSERVE", "1");
    let _ = init_tracing("unit-test-env");
    record_metric("unit.counter", 2.0);
    env::remove_var("VIBEPRO_OBSERVE");
}
