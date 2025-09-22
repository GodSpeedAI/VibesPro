# Reference: `techstack.yaml` Format

The `techstack.yaml` file is the central manifest for defining the project's technology stack. It serves as a single source of truth that can be read by automation scripts (like `sync-techstack`) to configure the project, update documentation, or generate other artifacts.

The file is organized into several high-level categories that group dependencies and tools by their purpose.

## Top-Level Categories

- **`core_application_dependencies`**: Essential libraries for the main application's functionality.
  - `web_frameworks`: e.g., FastAPI, Express.
  - `database_drivers`: e.g., `supabase-py`, `redis-py`.
  - `authentication_authorization`: e.g., Ory Kratos/Hydra clients.
  - `business_logic_libraries`: e.g., `dspy`, `litellm` for AI logic.
  - `api_client_libraries`: e.g., `httpx`.

- **`infrastructure_runtime_dependencies`**: Components related to the runtime environment and infrastructure.
  - `web_server_asgi`: e.g., Uvicorn.
  - `process_management`: e.g., Dramatiq for task queues.
  - `container_runtime`: e.g., Docker, Docker Compose.
  - `orchestration`: e.g., Argo Workflows, Nx.
  - `cloud_provider_sdks`: e.g., Supabase SDK.

- **`data_layer_dependencies`**: Tools and libraries for data storage, access, and migration.
  - `orm_odm`: e.g., SQLModel.
  - `migration_tools`: e.g., Alembic.
  - `caching_libraries`: e.g., `redis-py`.
  - `message_queue_clients`: e.g., `aio-pika`.
  - `search_analytics`: e.g., `pgvector`.

- **`development_only_dependencies`**: Tools used only during development and testing.
  - `testing_frameworks`: e.g., `pytest`, `jest`.
  - `code_quality`: e.g., `husky`, `lint-staged`.
  - `documentation`: e.g., `mkdocs-material`.

- **`build_deployment_dependencies`**: Tools for building, packaging, and deploying the application.
  - `package_managers`: e.g., `uv`, `pnpm`.
  - `build_tools`: e.g., `nx`.
  - `ci_cd_libraries`: e.g., GitHub Actions.

- **`monitoring_observability_dependencies`**: Tools for logging, metrics, and tracing.
  - `logging`: e.g., `structlog`.
  - `apm_tracing`: e.g., OpenTelemetry.

- **`security_dependencies`**: Libraries and tools for securing the application.
  - `vulnerability_scanning`: e.g., Trivy.
  - `secrets_management`: e.g., Doppler.

- **`frontend_client_dependencies`**: Libraries for the front-end application.
  - `ui_frameworks`: e.g., React, Remix.
  - `state_management`: e.g., `react-query`.

- **`communication_integration_dependencies`**: Services for external communication.
  - `email_services`, `file_storage`, etc.

- **`utility_helper_dependencies`**: General-purpose utility libraries.
  - `date_time`, `validation`, `serialization`.

- **`implementation_priority`**: A meta-category to group other categories into phases like MVP, Production Ready, etc. This can be used to plan the implementation sequence.
