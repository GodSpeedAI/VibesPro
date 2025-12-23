# docs/ Agent Instructions

## 📍 Context

> **Purpose**: Documentation Hub - Specifications (ADR, PRD, SDS, TS), traceability matrix, and developer documentation.
> **When to use**: When implementing from specs, updating documentation, checking traceability, or writing technical specifications.

## 🔗 Parent Context

See the repository guidance in `.github/copilot-instructions.md` (repo root) for comprehensive project guidance and refer to `AGENT-MAP.md` at the repository root for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**

- Architectural Decision Records (ADR)
- Product Requirements Documents (PRD)
- Software Design Specifications (SDS)
- Technical Specifications (TS)
- Traceability matrix linking specs to implementation
- Developer-focused documentation (DEV-\* specs)
- Knowledge base and how-to guides

**Architecture Layer**: N/A (Documentation/Specification)

## 📁 Key Files & Patterns

### Directory Structure

```
docs/
├── dev_adr.md                          # Architecture Decision Records
├── dev_prd.md                          # Product Requirements Document
├── dev_sds.md                          # Software Design Specification
├── dev_technical-specifications.md    # Technical Specifications
├── spec_index.md                       # Specification catalog (product)
├── dev_spec_index.md                  # Specification catalog (dev)
├── traceability_matrix.md             # Requirements traceability
├── ARCHITECTURE.md                     # Hexagonal architecture guide
├── QUICKSTART.md                       # Quick start guide
├── README.md                           # Documentation index
├── specs/                              # Detailed specifications
│   ├── features/                       # Feature specifications
│   ├── requirements/                   # Requirements documents
│   └── technical/                      # Technical deep dives
├── ai_context_bundle/                  # Generated AI context (read-only)
│   ├── CALM/                           # CALM architecture docs
│   ├── techstack.yaml                  # Technology stack
│   └── specs/                          # Spec snapshots
├── reference/                          # API reference (auto-generated)
├── how-to/                             # Task-oriented tutorials
├── knowledgebase/                      # Knowledge articles
└── work-summaries/                     # Development session summaries
```

### Key Specification Documents

| Document         | Purpose                  | Spec ID Prefix | Location                             |
| ---------------- | ------------------------ | -------------- | ------------------------------------ |
| **ADR**          | Architectural decisions  | `DEV-ADR-###`  | `dev_adr.md`                         |
| **PRD**          | Product requirements     | `DEV-PRD-###`  | `dev_prd.md`                         |
| **SDS**          | Software design spec     | `DEV-SDS-###`  | `dev_sds.md`                         |
| **TS**           | Technical specifications | `DEV-TS-###`   | `dev_technical-specifications.md`    |
| **Spec Index**   | Specification catalog    | N/A            | `spec_index.md`, `dev_spec_index.md` |
| **Traceability** | Requirement mapping      | N/A            | `traceability_matrix.md`             |

### File Naming Conventions

| File Type          | Pattern           | Location               | Example                    |
| ------------------ | ----------------- | ---------------------- | -------------------------- |
| **Dev Specs**      | `dev_*.md`        | `docs/`                | `dev_adr.md`, `dev_prd.md` |
| **Feature Specs**  | `*.spec.md`       | `docs/specs/features/` | `authentication.spec.md`   |
| **How-to Guides**  | `*.md`            | `docs/how-to/`         | `setup-development.md`     |
| **Work Summaries** | `YYYY-MM-DD-*.md` | `docs/work-summaries/` | `2025-10-13-feature-x.md`  |

### Spec ID Format

```
DEV-<DOCTYPE>-###
```

**Examples:**

- `DEV-ADR-001` - First architectural decision
- `DEV-PRD-042` - Product requirement #42
- `DEV-SDS-015` - Software design spec #15
- `DEV-TS-007` - Technical specification #7

## 🧭 Routing Rules

### Use This Context When:

- [ ] Implementing a feature from specifications
- [ ] Writing or updating technical documentation
- [ ] Checking spec IDs for traceability
- [ ] Creating Architectural Decision Records (ADRs)
- [ ] Defining product requirements or design specs
- [ ] Updating the traceability matrix
- [ ] Resolving spec conflicts or gaps
- [ ] Generating work summaries

### Refer to Other Contexts When:

| Context            | When to Use                                 |
| ------------------ | ------------------------------------------- |
| `.github/AGENT.md` | AI development system (prompts, chat modes) |

> Note: This repository is a template repository. Several directory-scoped `AGENT.md` files are generated in projects created from these templates (for example `libs/AGENT.md` or `apps/AGENT.md`). Those files may not exist in this template repository. When you see a reference to a sibling `AGENT.md` file that doesn't exist here, check the generated project or the equivalent documentation in `docs/` or `AGENT-MAP.md`.

## 🔧 Local Conventions

### Specification Hierarchy (CRITICAL)

**Always prefer architectural and interface constraints first:**

```
ADR → SDS/Technical Specs → PRD → DEV-* specs
```

**Ordering principle:**

1. **Architecture** (ADR) defines the structure
2. **Design/Technical** (SDS/TS) defines the solution
3. **Product** (PRD) defines the requirements
4. **Developer** (DEV-\*) documents the implementation

### Traceability Requirements

**Every implementation must:**

- Reference at least one spec ID in code comments
- Link to spec IDs in commit messages
- Update traceability matrix after changes
- Document spec gaps when conflicts arise

**Example traceability comment:**

```typescript
// DEV-PRD-042, DEV-SDS-015: OAuth2 authentication flow
export class AuthService {
  // Implementation...
}
```

### Handling Spec Conflicts

When specifications conflict:

1. **Identify the conflict** - Document which specs disagree
2. **Check hierarchy** - ADR > SDS/TS > PRD precedence
3. **Document in "Spec Gaps"** - Add to relevant spec document
4. **Propose 2-3 options** - Include trade-offs
5. **Request decision** - Get developer/stakeholder approval
6. **Update traceability** - Record resolution in matrix

### Markdown Standards

- **Linting**: Use markdownlint with `.markdownlint.json` config
- **Link checking**: Automated via `node tools/docs/link_check.js`
- **Formatting**: Consistent headings, lists, code blocks
- **Cross-references**: Use relative links, maintain link integrity
- **Frontmatter**: Include `matrix_ids` for traceability

**Example frontmatter:**

```yaml
---
title: 'Feature Name'
matrix_ids:
  - DEV-PRD-042
  - DEV-SDS-015
date: 2025-10-13
status: draft|approved|implemented
---
```

## 📚 Related Instructions

**Modular instructions that apply here:**

- [.github/instructions/docs.instructions.md](/.github/instructions/docs.instructions.md) - Documentation guardrails
- [.github/instructions/dev-docs.instructions.md](/.github/instructions/dev-docs.instructions.md) - Developer docs guardrails
- [.github/instructions/commit-msg.instructions.md](/.github/instructions/commit-msg.instructions.md) - Commit messages with spec IDs
- [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - Security in specs

**Relevant prompts:**

- [.github/prompts/spec.plan.adr.prompt.md](/.github/prompts/spec.plan.adr.prompt.md) - Generate ADR
- [.github/prompts/spec.plan.prd.prompt.md](/.github/prompts/spec.plan.prd.prompt.md) - Generate PRD
- [.github/prompts/spec.plan.sds.prompt.md](/.github/prompts/spec.plan.sds.prompt.md) - Generate SDS
- [.github/prompts/spec.plan.ts.prompt.md](/.github/prompts/spec.plan.ts.prompt.md) - Generate TS
- [.github/prompts/spec.implement.prompt.md](/.github/prompts/spec.implement.prompt.md) - Implement from spec
- [.github/prompts/spec.traceability.update.prompt.md](/.github/prompts/spec.traceability.update.prompt.md) - Update traceability

**Related chat modes:**

- `spec.lean` - Minimal specification generation
- `spec.wide` - Comprehensive specification generation
- `spec.nfr` - Non-functional requirements

## 💡 Examples

### Example 1: Creating an ADR

```markdown
---
matrix_ids:
  - DEV-ADR-001
date: 2025-10-13
status: approved
---

# ADR-001: Choose Hexagonal Architecture

## Context

We need a maintainable, testable architecture that supports...

## Decision

We will use Hexagonal Architecture (Ports & Adapters) because...

## Consequences

**Positive:**

- Clear separation of concerns
- Easy to test in isolation

**Negative:**

- More initial boilerplate
- Team learning curve

## Alternatives Considered

1. Layered Architecture - Rejected because...
2. Clean Architecture - Too complex for our needs...
```

### Example 2: Implementing from Spec

**Workflow:**

1. Read relevant spec: `dev_prd.md` or `specs/features/auth.spec.md`
2. Check spec ID: e.g., `DEV-PRD-042`
3. Implement with traceability comment:
   ```typescript
   // DEV-PRD-042: User authentication via OAuth2
   ```
4. Update traceability matrix:
   ```markdown
   | DEV-PRD-042 | User OAuth2 Auth | `libs/auth/domain/auth-service.ts` | Implemented |
   ```
5. Commit with spec ID:
   ```
   feat(auth): add OAuth2 authentication [DEV-PRD-042]
   ```

### Example 3: Resolving Spec Conflict

**Scenario**: PRD says "use JWT" but ADR says "avoid stateless auth"

**Resolution:**

```markdown
## Spec Gap: Authentication Token Format

**Conflict:**

- DEV-PRD-042 requires JWT tokens
- DEV-ADR-005 prefers stateful session auth

**Options:**

1. Use JWT with short expiry (5 min) + refresh tokens
   - Pro: Satisfies both specs partially
   - Con: Added complexity
2. Update PRD to use stateful sessions
   - Pro: Aligns with ADR
   - Con: Requires client changes
3. Update ADR to allow JWT for specific use cases
   - Pro: Flexible approach
   - Con: Weakens architectural principle

**Decision Needed**: Option [TBD]
```

### Example 4: Work Summary Generation

After a development session, save summary in `docs/work-summaries/`:

```markdown
---
date: 2025-10-13
session: 'Feature X Implementation'
specs:
  - DEV-PRD-042
  - DEV-SDS-015
---

# Work Summary: Feature X Implementation

## What Was Done

- Implemented OAuth2 authentication flow
- Added unit tests for AuthService
- Updated traceability matrix

## Decisions Made

- Used Passport.js for OAuth2 (DEV-TS-007)
- Stored tokens in Redis (DEV-ADR-003)

## Next Steps

- Add integration tests
- Update API documentation
- Deploy to staging

## References

- DEV-PRD-042 (example spec ID; see [spec catalog](./specs/README.md))
- [Implementation PR #123](https://github.com/...)
```

## ✅ Checklist

### Before Implementing from Spec:

- [ ] Read relevant spec documents (ADR, SDS, TS, PRD)
- [ ] Identify spec IDs that apply
- [ ] Check traceability matrix for related implementations
- [ ] Review architectural constraints from ADRs
- [ ] Check for spec conflicts or gaps
- [ ] Confirm understanding with developer if uncertain

### While Implementing:

- [ ] Add traceability comments with spec IDs
- [ ] Follow patterns defined in SDS/TS
- [ ] Respect architectural decisions from ADRs
- [ ] Document any deviations or discoveries

### After Implementing:

- [ ] Update traceability matrix with new implementations
- [ ] Reference spec IDs in commit message
- [ ] Update specifications if implementation reveals gaps
- [ ] Generate work summary in `docs/work-summaries/`
- [ ] Verify documentation is current

### When Writing Specs:

- [ ] Assign unique spec ID (DEV-XXX-###)
- [ ] Add frontmatter with `matrix_ids`
- [ ] Follow spec hierarchy (ADR > SDS/TS > PRD)
- [ ] Cross-reference related specs
- [ ] Include examples and diagrams where helpful
- [ ] Run markdown linting: `pnpm run lint:markdown`
- [ ] Check links: `node tools/docs/link_check.js`

## 🔍 Quick Reference

### Common Commands

```bash
# Validate specs and traceability
just spec-guard

# Generate AI context bundle (includes specs)
just ai-context-bundle

# Lint markdown files
pnpm run lint:markdown

# Check documentation links
node tools/docs/link_check.js

# Validate templates
python tools/validate-templates.py

# Generate documentation
pnpm run docs:generate
```

### Key Concepts

- **Spec Hierarchy**: ADR → SDS/TS → PRD (architecture first)
- **Spec ID**: Unique identifier for traceability (DEV-XXX-###)
- **Traceability**: Link between specs and implementation
- **Spec Gaps**: Documented conflicts requiring resolution
- **Matrix IDs**: Frontmatter field for spec tracking

### Documentation Hierarchy

```
1. Architecture docs (CALM, ADR) - Highest authority
2. Specifications (SDS, Technical Specs, PRD)
3. Developer specs (DEV-*)
4. API Reference - Auto-generated from code
5. How-to guides - Task-oriented tutorials
```

### Spec ID Prefixes

| Prefix     | Document Type                 | Example        |
| ---------- | ----------------------------- | -------------- |
| `DEV-ADR`  | Architectural Decision Record | `DEV-ADR-001`  |
| `DEV-PRD`  | Product Requirement           | `DEV-PRD-042`  |
| `DEV-SDS`  | Software Design Spec          | `DEV-SDS-015`  |
| `DEV-TS`   | Technical Specification       | `DEV-TS-007`   |
| `DEV-SPEC` | General Development Spec      | `DEV-SPEC-003` |

## 🛡️ Security Considerations

When documenting:

- ⚠️ **NEVER** include secrets, API keys, or passwords in documentation
- ⚠️ **NEVER** commit sensitive data to version control
- ⚠️ Use placeholders like `<YOUR_API_KEY>` in examples
- ⚠️ Document security requirements in specs (STRIDE model)
- ⚠️ Map security features to PRD/SDS security requirements
- ⚠️ Add threat notes in PRs for new attack surfaces

**Reference**: [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md)

## 🎯 Workflow Integration

### Spec-Driven Development Workflow

**Standard flow:**

1. **Plan**: Create or update specs (ADR → SDS/TS → PRD)
2. **Review**: Get stakeholder approval on specs
3. **Implement**: Build with spec traceability
4. **Validate**: Check implementation against specs
5. **Document**: Update traceability matrix

**AI-assisted flow:**

1. Use `spec.plan.*` chat modes to generate specs
2. Use `spec.implement` prompt to build from specs
3. Use `spec.traceability.update` prompt to update matrix

### TDD Integration

When doing TDD with specs:

1. Read spec for requirements
2. Write failing test referencing spec ID
3. Implement to pass test
4. Refactor with spec constraints in mind
5. Update traceability matrix

## 📊 Metrics & Monitoring

### Traceability Metrics

Track in traceability matrix:

- Spec coverage: % of specs with implementations
- Implementation coverage: % of code with spec IDs
- Spec drift: Implementations without spec references

### Documentation Health

```bash
# Check for broken links
node tools/docs/link_check.js

# Validate markdown
pnpm run lint:markdown

# Check spec matrix consistency
just spec-guard
```

## 🔄 Maintenance

### Regular Tasks

- **Daily**: Update traceability matrix with new implementations
- **Weekly**: Review spec gaps and propose resolutions
- **Monthly**: Audit spec ID usage in codebase
- **Quarterly**: Review and update ADRs for relevance

### When to Update This AGENT.md

- New spec document types added
- Spec hierarchy or precedence changes
- Traceability process evolves
- Documentation structure reorganized
- New spec-related tools or prompts added

### Generated vs Manual Content

**Generated (Read-Only):**

- `ai_context_bundle/` - Generated by `just ai-context-bundle`
- `reference/` - Auto-generated API docs

**Manual (Versioned):**

- Spec documents (`dev_*.md`, `specs/`)
- Traceability matrix
- How-to guides
- Work summaries

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: see `.github/copilot-instructions.md` (repository root) for master instructions. For a navigation map, see `AGENT-MAP.md` (repository root)._
