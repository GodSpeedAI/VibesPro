//! # VibePro Rust-Native Observability Helpers
//!
//! This crate provides a standardized and easy-to-use interface for setting up
//! structured logging and distributed tracing for Rust services within the VibePro ecosystem.
//! It is designed to be a "one-liner" integration for most services.
//!
//! ## Core Features
//!
//! - **Structured Logging**: By default, it configures `tracing_subscriber` to emit
//!   JSON-formatted logs to standard output. This is suitable for production environments
//!   where logs are collected and processed by an external agent.
//! - **Distributed Tracing**: When the `otlp` feature is enabled and the `VIBEPRO_OBSERVE`
//!   environment variable is set to `1`, the crate automatically configures and installs
//!   an OpenTelemetry (OTLP) exporter. This sends trace data to a configured OTLP
//!   endpoint, enabling distributed tracing across services.
//! - **Dynamic Configuration**: The behavior of the crate is controlled by environment
//!   variables, allowing for flexible configuration without code changes.
//! - **Idempotent Initialization**: The `init_tracing` function is safe to call
//!   multiple times; it will only initialize the global tracer once.
//!
//! ## Usage
//!
//! Add `vibepro-observe` to your `Cargo.toml`, enabling the `otlp` feature if you need
//! distributed tracing:
//!
//! ```toml
//! [dependencies]
//! vibepro-observe = { version = "0.1.0", features = ["otlp"] }
//! ```
//!
//! Then, at the beginning of your application's `main` function, call `init_tracing`:
//!
//! ```rust
//! use vibepro_observe::init_tracing;
//! use anyhow::Result;
//!
//! #[tokio::main]
//! async fn main() -> Result<()> {
//!     // Initialize tracing for your service.
//!     init_tracing("my-rust-service")?;
//!
//!     // Your application logic here...
//!
//!     // Gracefully shut down the tracer before exiting.
//!     vibepro_observe::shutdown_tracing()?;
//!     Ok(())
//! }
//! ```
//!
//! ## Environment Variables
//!
//! - `RUST_LOG`: Controls the log level (e.g., `info`, `debug`, `my_crate=trace`).
//!   Defaults to `info`.
//! - `VIBEPRO_OBSERVE`: Set to `1` to enable the OTLP exporter (requires the `otlp` feature).
//! - `OTLP_ENDPOINT`: The OTLP endpoint to send traces to. Defaults to `http://127.0.0.1:4317`.
//! - `OTLP_PROTOCOL`: The OTLP protocol (`grpc` or `http`). Defaults to `grpc`.

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

/// Initializes the global tracing subscriber for a given service.
///
/// This function is the main entry point for the crate. It sets up a global
/// `tracing` subscriber that handles both logging and, optionally, distributed tracing.
/// The function is idempotent and can be safely called multiple times.
///
/// # Behavior
///
/// - It always installs a JSON formatting layer that writes structured logs to stdout.
/// - It respects the `RUST_LOG` environment variable for log filtering, defaulting to `info`.
/// - If the `otlp` feature is enabled and the `VIBEPRO_OBSERVE` environment variable
///   is set to `1`, it also installs an OTLP trace exporter. The exporter's endpoint
///   and protocol are configured via the `OTLP_ENDPOINT` and `OTLP_PROTOCOL`
///   environment variables.
///
/// # Arguments
///
/// * `service_name` - A string slice that holds the name of the service. This name
///   will be included in all traces as the `service.name` resource attribute.
///
/// # Errors
///
/// This function will return an error if there is a problem initializing the OTLP
/// exporter. However, it will not error if a global subscriber has already been set.
///
/// # Examples
///
/// ```
/// # use anyhow::Result;
/// # fn main() -> Result<()> {
/// vibepro_observe::init_tracing("my-awesome-service")?;
/// # Ok(())
/// # }
/// ```
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

/// Records a simple numeric metric as a structured event.
///
/// This function provides a basic way to emit metrics through the logging system.
/// It creates a structured log event with `metric.key` and `metric.value` fields.
/// This is intended for simple use cases. For more advanced metrics with aggregation
/// and different instrument types, consider using a dedicated OpenTelemetry metrics SDK.
///
/// # Arguments
///
/// * `key` - The name of the metric (e.g., "http_requests_total").
/// * `value` - The numeric value of the metric.
///
/// # Examples
///
/// ```
/// vibepro_observe::record_metric("files_processed", 42.0);
/// ```
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

    let resource = Resource::builder_empty()
        .with_attributes(vec![
            KeyValue::new("service.name", service_name.to_string()),
            KeyValue::new("library.name", "vibepro-observe"),
        ])
        .build();

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
    let tracer = tracer_provider.tracer("vibepro-observe");
    let provider_handle = tracer_provider.clone();
    let _ = OTLP_TRACER_PROVIDER.set(provider_handle.clone());
    opentelemetry::global::set_tracer_provider(provider_handle);

    Ok(tracer)
}

/// Gracefully shuts down the OTLP tracer provider, flushing any buffered spans.
///
/// It is recommended to call this function at the end of the application's lifecycle
/// to ensure that all telemetry data is sent before the process exits. The function
/// is safe to call multiple times and will do nothing if no tracer was initialized.
///
/// # Errors
///
/// Returns an error if the shutdown process fails for a reason other than the
/// tracer already being shut down.
///
/// # Examples
///
/// ```
/// # use anyhow::Result;
/// # fn main() -> Result<()> {
/// // ... application logic ...
/// vibepro_observe::shutdown_tracing()?;
/// # Ok(())
/// # }
/// ```
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

/// A no-op version of `shutdown_tracing` for when the `otlp` feature is not enabled.
///
/// This allows for unconditional calls to `shutdown_tracing` in application code
/// without needing to use `#[cfg]` attributes.
#[cfg(not(feature = "otlp"))]
pub fn shutdown_tracing() -> Result<()> {
    Ok(())
}
