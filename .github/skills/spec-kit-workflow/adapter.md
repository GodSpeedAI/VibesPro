# Spec-Kit → VibesPro Adapter

Maps spec-kit conventions to VibesPro patterns for seamless integration.

## Path Mapping

| Spec-Kit Convention               | VibesPro Pattern                                        |
| --------------------------------- | ------------------------------------------------------- |
| `.specify/specs/NNN-feature/`     | `docs/specs/<bounded-context>/<feature>/`               |
| `.specify/memory/constitution.md` | `.github/instructions/sdd_constitution.instructions.md` |
| `spec.md`                         | `spec.md` (unchanged)                                   |
| `plan.md`                         | `plan.md` (unchanged)                                   |
| `tasks.md`                        | `tasks.md` (unchanged)                                  |

## Bounded Context Detection

When a bounded context is not explicitly provided, detect from:

1. **Keywords in description**:
   - "auth", "login", "user", "permission" → `auth`
   - "order", "cart", "checkout", "payment" → `orders`
   - "trace", "log", "metric", "observe" → `observability`
   - "generate", "template", "scaffold" → `generators`

2. **Existing spec directories**:
   - Check `docs/specs/*/` for related features
   - Prefer existing context if description aligns

3. **Fallback**:
   - Use `features` as default bounded context
   - Prompt user for clarification if highly ambiguous

## ID Assignment

### PRD IDs (Product Requirements)

1. Scan `docs/specs/shared/reference/009-traceability-matrix.md` for highest PRD-NNN
2. Assign next sequential: `PRD-{max + 1}`
3. Update traceability matrix with new entry

### SDS IDs (System Design Specs)

1. Scan traceability matrix for highest SDS-NNN
2. Assign next sequential: `SDS-{max + 1}`
3. Link SDS to parent PRD

## Template Adaptation

### Spec Template Modifications

The adapter modifies spec-kit's template output:

```diff
- # Feature: {feature_name}
+ # PRD-{id}: {feature_name}
+
+ **Bounded Context**: {bounded-context}
+ **Traceability**: [View Matrix](../shared/reference/009-traceability-matrix.md)
```

### Plan Template Modifications

```diff
- # Implementation Plan: {feature}
+ # SDS-{id}: {feature} Implementation Plan
+
+ **Parent PRD**: PRD-{parent_id}
+ **Bounded Context**: {bounded-context}
```

## Script Wrappers

The adapter wraps spec-kit scripts to handle path translation:

### specify-wrapper.sh

```bash
#!/bin/bash
# Wraps spec-kit's create-new-feature.sh with VibesPro paths

SPEC_KIT_DIR="libs/tools/spec-kit"
VIBEPRO_SPECS_DIR="docs/specs"

# 1. Detect bounded context from description
CONTEXT=$(detect_bounded_context "$@")

# 2. Generate feature directory
FEATURE_DIR="$VIBEPRO_SPECS_DIR/$CONTEXT/$FEATURE_SLUG"
mkdir -p "$FEATURE_DIR"

# 3. Execute spec-kit with modified paths
SPECS_DIR="$FEATURE_DIR" "$SPEC_KIT_DIR/scripts/bash/create-new-feature.sh" "$@"

# 4. Assign PRD ID
assign_prd_id "$FEATURE_DIR/spec.md"
```

## Handoff Mapping

| Spec-Kit Agent      | VibesPro Agent              |
| ------------------- | --------------------------- |
| `speckit.plan`      | `planner.core.agent.md`     |
| `speckit.clarify`   | `spec.author.agent.md`      |
| `speckit.implement` | `implementer.core.agent.md` |

## Validation

After each operation, the adapter validates:

1. ✅ Output files exist at expected VibesPro paths
2. ✅ IDs are assigned and unique
3. ✅ Traceability matrix is updated
4. ✅ Git branch follows convention: `{context}/{feature-slug}`
