//! VibePro: Rust-native observability helpers.
//!
//! Default: JSON logs to stdout via `tracing_subscriber`.
//! If `VIBEPRO_OBSERVE=1` and feature `otlp` is enabled, export OTLP to `OTLP_ENDPOINT` (default: grpc://127.0.0.1:4317).

use anyhow::Result;
use once_cell::sync::OnceCell;
#[cfg(feature = "otlp")]
use opentelemetry_sdk::trace::SdkTracerProvider;
use std::env;
#[cfg(feature = "otlp")]
use tracing::debug;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

static INIT_GUARD: OnceCell<()> = OnceCell::new();
#[cfg(feature = "otlp")]
static OTLP_TRACER_PROVIDER: OnceCell<SdkTracerProvider> = OnceCell::new();

/// Initialize tracing for a given service name.
/// Behavior:
/// - Always installs JSON fmt layer + EnvFilter (RUST_LOG or default "info").
/// - If `VIBEPRO_OBSERVE=1` and feature `otlp` is enabled,
///   installs an OTLP exporter targeting `OTLP_ENDPOINT` (default http://127.0.0.1:4317).
pub fn init_tracing(service_name: &str) -> Result<()> {
    if INIT_GUARD.get().is_some() {
        return Ok(());
    }

    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let observe_flag = env::var("VIBEPRO_OBSERVE").unwrap_or_default() == "1";

    #[cfg(feature = "otlp")]
    {
        let build_base_subscriber = || {
            tracing_subscriber::registry()
                .with(env_filter.clone())
                .with(
                    tracing_subscriber::fmt::layer()
                        .json()
                        .with_target(true)
                        .with_thread_ids(false)
                        .with_thread_names(false)
                        .with_current_span(true),
                )
        };

        if observe_flag {
            let endpoint =
                env::var("OTLP_ENDPOINT").unwrap_or_else(|_| "http://127.0.0.1:4317".to_string());
            let protocol = env::var("OTLP_PROTOCOL").unwrap_or_else(|_| "grpc".to_string());

            if tokio::runtime::Handle::try_current().is_err() {
                if let Err(err) = build_base_subscriber().try_init() {
                    debug!(target = "vibepro_observe::init", error = %err, "global subscriber already initialized");
                }

                info!(
                    service = service_name,
                    endpoint = %endpoint,
                    "OTLP exporter skipped (no Tokio runtime available)"
                );
            } else {
                let tracer = setup_otlp_exporter(&endpoint, &protocol, service_name)?;
                if let Err(err) = build_base_subscriber()
                    .with(tracing_opentelemetry::layer().with_tracer(tracer))
                    .try_init()
                {
                    debug!(target = "vibepro_observe::init", error = %err, "global subscriber already initialized");
                }

                info!(service = service_name, endpoint = %endpoint, "OTLP exporter enabled");
            }
        } else {
            if let Err(err) = build_base_subscriber().try_init() {
                debug!(target = "vibepro_observe::init", error = %err, "global subscriber already initialized");
            }

            info!(
                service = service_name,
                "OTLP exporter disabled (VIBEPRO_OBSERVE!=1)"
            );
        }
    }

    #[cfg(not(feature = "otlp"))]
    {
        if let Err(err) = tracing_subscriber::registry()
            .with(env_filter.clone())
            .with(
                tracing_subscriber::fmt::layer()
                    .json()
                    .with_target(true)
                    .with_thread_ids(false)
                    .with_thread_names(false)
                    .with_current_span(true),
            )
            .try_init()
        {
            info!(service = service_name, error = %err, "tracing subscriber already initialized; skipping re-init");
        }

        if observe_flag {
            info!(service = service_name, "VIBEPRO_OBSERVE=1 set, but crate built without `otlp` feature; exporting is disabled");
        }
    }

    let _ = INIT_GUARD.set(());
    Ok(())
}

/// Record a simple numeric metric as a structured event.
/// For richer metrics, integrate OpenTelemetry metrics when stabilized for your use-case.
pub fn record_metric(key: &str, value: f64) {
    tracing::info!(metric.key = key, metric.value = value, "metric");
}

#[cfg(feature = "otlp")]
fn setup_otlp_exporter(
    endpoint: &str,
    protocol: &str,
    service_name: &str,
) -> Result<opentelemetry_sdk::trace::Tracer> {
    debug!(
        target = "vibepro_observe::otlp",
        %endpoint,
        %protocol,
        service = service_name,
        "initializing OTLP exporter"
    );
    use opentelemetry::{trace::TracerProvider as _, KeyValue};
    use opentelemetry_otlp::{SpanExporter, WithExportConfig};
    use opentelemetry_sdk::{trace as sdktrace, Resource};

    // Build the OTLP exporter based on protocol
    let build_exporter = || -> Result<SpanExporter> {
        if matches!(
            protocol.to_lowercase().as_str(),
            "http" | "http/proto" | "http/protobuf"
        ) {
            Ok(SpanExporter::builder()
                .with_http()
                .with_endpoint(endpoint)
                .build()?)
        } else {
            Ok(SpanExporter::builder()
                .with_tonic()
                .with_endpoint(endpoint)
                .build()?)
        }
    };

    // Build the tracer provider with resource attributes
    let resource = Resource::builder_empty()
        .with_attributes(vec![
            KeyValue::new("service.name", service_name.to_string()),
            KeyValue::new("library.name", "vibepro-observe"),
        ])
        .build();

    // Prefer batch processing when a Tokio runtime is available; otherwise fall back to simple.
    let mut provider_builder = sdktrace::SdkTracerProvider::builder().with_resource(resource);
    if tokio::runtime::Handle::try_current().is_ok() {
        let exporter = build_exporter()?;
        provider_builder = provider_builder
            .with_span_processor(sdktrace::BatchSpanProcessor::builder(exporter).build());
    } else {
        let exporter = build_exporter()?;
        provider_builder =
            provider_builder.with_span_processor(sdktrace::SimpleSpanProcessor::new(exporter));
    }

    let tracer_provider = provider_builder.build();

    // Get tracer before setting global provider
    let tracer = tracer_provider.tracer("vibepro-observe");

    // Store provider for optional shutdown and set global provider for convenience
    let provider_handle = tracer_provider.clone();
    let _ = OTLP_TRACER_PROVIDER.set(provider_handle.clone());
    opentelemetry::global::set_tracer_provider(provider_handle);

    Ok(tracer)
}

/// Gracefully shut down the OTLP tracer provider if one was initialized.
/// Safe to call multiple times.
#[cfg(feature = "otlp")]
pub fn shutdown_tracing() -> Result<()> {
    use opentelemetry_sdk::error::OTelSdkError;

    if let Some(provider) = OTLP_TRACER_PROVIDER.get() {
        match provider.shutdown() {
            Ok(()) => Ok(()),
            Err(OTelSdkError::AlreadyShutdown) => Ok(()),
            Err(err) => Err(err.into()),
        }
    } else {
        Ok(())
    }
}

/// No-op when OTLP support is disabled.
#[cfg(not(feature = "otlp"))]
pub fn shutdown_tracing() -> Result<()> {
    Ok(())
}
