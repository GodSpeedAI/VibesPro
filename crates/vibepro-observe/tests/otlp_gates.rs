#[cfg(feature = "otlp")]
mod otlp_enabled {
    use vibepro_observe::{init_tracing, record_metric};
    use std::env;

    #[tokio::test(flavor = "multi_thread")]
    async fn otlp_exporter_initializes_with_flag() {
        // Point to a non-listening endpoint; exporter should initialize without crashing.
        env::set_var("VIBEPRO_OBSERVE", "1");
        env::set_var("OTLP_ENDPOINT", "http://127.0.0.1:4317");

        let result = init_tracing("otlp-test");
        assert!(result.is_ok(), "init_tracing should succeed");

        record_metric("otlp.counter", 3.0);
        // Add verification that metric was recorded if possible

        // Cleanup
        env::remove_var("VIBEPRO_OBSERVE");
        env::remove_var("OTLP_ENDPOINT");
    }
}
