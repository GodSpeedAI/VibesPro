{% include 'docs/partials/_metadata_header.j2' %}

# Product Specification Index

> **🎯 Purpose**: Maintain a concise index of all product specifications (PRD, ADR, SDS, TS) with ≤140 character summaries.
>
> **📝 How to use this file**:
>
> 1. Generate specifications using chat modes: `@workspace #spec.lean` or `#spec.wide`
> 2. Or use prompts: `.github/prompts/spec.plan.*.prompt.md`
> 3. After creating specs, update this index with concise summaries
> 4. Run `just spec-matrix` to validate traceability

---

## Template Structure

Each entry should follow this format:

```markdown
## [SPEC-ID] — [Brief Title]

Source: [path/to/spec.md#spec-id]
Summary: [≤140 character description of what this spec defines]
```

---

## Example Entries

### PRD Specifications

## PRD-001 — User Authentication

Source: docs/dev_prd.md#prd-001
Summary: OAuth2 authentication with Google and GitHub providers for secure user access without password management.

## PRD-002 — Dashboard Analytics

Source: docs/dev_prd.md#prd-002
Summary: Real-time analytics dashboard showing key metrics, user activity, and system health with customizable widgets.

### ADR Specifications

## ADR-001 — Use TypeScript Strict Mode

Source: docs/dev_adr.md#adr-001
Summary: Enable TypeScript strict mode for type safety, better tooling support, and reduced runtime errors.

## ADR-001 — Native config-only prompt system

Source: docs/specs/ (see traceability_matrix.md)
Summary: Adopt a native, configuration-only approach for prompt definitions to simplify management and version control.

## ADR-002 — Modular instruction stacking

Source: docs/specs/ (see traceability_matrix.md)
Summary: Implement a modular instruction stacking mechanism for prompts, allowing reusable and composable directives.

### SDS Specifications

## SDS-001 — Prompt system architecture

Source: docs/specs/ (see traceability_matrix.md)
Summary: Design the architecture for the prompt system, including prompt parsing, execution, and output handling.

## SDS-002 — Instruction stacking design

Source: docs/specs/ (see traceability_matrix.md)
Summary: Detail the design of the instruction stacking mechanism, covering instruction types, order, and conflict resolution.

### TS Specifications

## TS-001 — Prompt file format

Source: docs/specs/ (see traceability_matrix.md)
Summary: Specify the file format for prompt definitions, including metadata, input parameters, and instruction blocks.

## TS-002 — Instruction file format

Source: docs/specs/ (see traceability_matrix.md)
Summary: Define the file format for individual instructions, detailing their structure, parameters, and execution logic.

---

## Your Specification Entries

<!-- Add your specification entries below this line -->
<!-- Keep summaries to ≤140 characters -->
<!-- Update this file whenever you add/modify specs -->
<!-- Run `just spec-matrix` to validate traceability -->

---

## Maintenance

-   **When to update**: After creating or modifying any specification
-   **Validation**: Run `just spec-matrix` to check traceability
-   **Summary length**: Keep ≤140 characters for scanability
-   **Source paths**: Use relative paths from repository root
-   **Spec IDs**: Must match IDs in source documents
