# Mapping Specification: CALM ↔ domain.yaml ↔ Nx Generator Inputs

This document describes how the architecture-as-code definition provided by FINOS CALM maps to the domain model consumed by Nx generators and @nxlv/python. The goal is to maintain a single source of truth for both architecture and domain logic while allowing teams to author in either format.

## CALM First

When teams begin with a CALM specification (e.g. `architecture/calm/system.calm.json`), the translator CLI converts the architecture into a `domain/domain.yaml` file by applying the following rules:

- **Nodes → services**: Each `node` in CALM becomes a `service` in the domain YAML, with the `id` mapped to the service name and `description` preserved.
- **Relationships → relationships**: CALM `relationships` become `relationships` in the domain YAML; `source` and `target` are mapped to `from` and `to` fields. The `type` property is propagated.
- **Controls & Patterns**: CALM `controls` and `patterns` are not directly expressed in domain YAML. Instead, they influence the generation phase. For example, an `api-versioning` control could cause the generators to include versioning middleware in the generated FastAPI project.

The resulting domain YAML can then be consumed by the Nx service generator to scaffold apps, libraries, DI wiring and test skeletons. The translator ensures deterministic ordering of services and relationships to guarantee reproducible output.

## Domain First

Teams may prefer to model entities, fields and relationships in a human-friendly YAML format first. In this case, the translator CLI reads `domain/domain.yaml` and produces a skeleton CALM JSON:

- **services → nodes**: Each service becomes a node. The translator sets the node `id` to the service name and copies the description if provided.
- **relationships → relationships**: Domain relationships map back to CALM relationships; the translator preserves the type.
- **Entities and Fields**: Domain entities and fields are not explicitly represented in CALM. They inform the generator layer but not the architecture layer. The translator drops these details when converting to CALM JSON.

Once a CALM file exists, teams can enrich it with controls, patterns and deployment metadata without modifying domain definitions.

## Generator Inputs

The domain YAML serves as the primary input for Nx generators, including @nxlv/python. The generator reads:

- **services** to create apps and libraries within the Nx workspace. For a Python service, the generator invokes `@nxlv/python` to scaffold a FastAPI-based application, hexagonal ports and adapters, and unit tests.
- **entities** to define domain models, Pydantic schemas and persistence layers.
- **relationships** to wire dependencies between services (e.g. injecting an Auth client into the Chat service).

Additional configuration (e.g. container images, environment variables) can be provided via generator options or environment-specific overlays.

## Authoritative Boundaries

- **CALM** is authoritative for topology (nodes, relationships), deployment and rollback metadata, policies (controls), patterns and data-classification requirements. Changes here should be version-controlled and validated via `just validate-calm`.
- **domain.yaml** is authoritative for rich domain details: entities, fields, validation rules and use-case specific logic. This file should capture the business context and remain free of infrastructure concerns.

## Determinism and Idempotence

- The translator emits outputs with stable ordering and without timestamps. Snapshot tests can assert that repeated runs yield identical outputs.
- Nx generators should be idempotent: running them multiple times should not reformat or modify existing code beyond what is defined in templates.

## Example Mapping

CALM JSON:

```json
{
  "nodes": [
    { "id": "auth", "description": "User auth service" },
    { "id": "chat", "description": "Real-time chat" }
  ],
  "relationships": [{ "source": "auth", "target": "chat", "type": "authenticated_by" }]
}
```

Maps to domain YAML:

```yaml
services:
  - name: auth
    description: User auth service
    entities: []
  - name: chat
    description: Real-time chat
    entities: []
relationships:
  - from: auth
    to: chat
    type: authenticated_by
```

This YAML then drives Nx generators to scaffold two services with a dependency from `chat` to `auth`.

## Future Extensions

The mapping may be extended to support advanced CALM features (e.g. `controls` for circuit breakers or SLOs) and domain-specific constructs (aggregates, commands, queries). The translator CLI can be adapted to handle these without breaking backward compatibility.
