---
description: 'AI workflows constitution and governance'
applyTo: '**'
kind: instructions
domain: ai-workflows
precedence: 10
---

# AI Workflows Constitution & Governance

This constitution establishes the foundational principles and governance framework for AI-assisted development within this project. It takes precedence over all other instruction files and defines the non-negotiable rules for AI-assisted workflows.

## Core Principles

### 1. Spec-Driven Development

- All changes MUST originate from a formal specification
- Follow the strict PRD → SDS → TS → Task workflow
- Every commit MUST reference spec IDs in the commit message body
- Use conventional commit format: `type(scope): message`

### 2. TDD is Mandatory

- Follow strict Red-Green-Refactor cycles for all functional changes
- Write failing tests BEFORE implementing functionality
- Never bypass the TDD cycle or take shortcuts
- Refactor continuously to leave code cleaner than found

### 3. Traceability & Documentation

- Every file, test, and change must be traceable to specs
- Use `matrix_ids` frontmatter in all spec-related documents
- Maintain the `/docs/specs/` directory structure
- Update traceability matrix after each change

### 4. Quality Gates

- All code must pass existing tests before committing
- Run `just prompt-lint` and `just spec-matrix` before PRs
- No manual bypassing of validation checks
- Address all findings before merging

### 5. Minimal Dependencies

- Never add dependencies without discussion and ADR
- Keep generated projects lean and focused
- Prefer built-in tools over external libraries
- Document all dependency decisions

### 6. Security & Compliance

- Never commit secrets or sensitive information
- Use environment variables for configuration
- Follow security guidelines in security.instructions.md
- Regular security audits required

## Governance Framework

### Decision Making

- Technical decisions require ADR (Architecture Decision Record)
- Breaking changes require spec updates and impact analysis
- Cross-cutting concerns require stakeholder alignment

### Quality Assurance

- Automated testing is mandatory for all changes
- Manual validation for UI/UX changes
- Performance testing for critical paths
- Security scanning for all dependencies

### Workflow Enforcement

- CI/CD pipeline enforces constitution rules
- Pre-commit hooks validate code quality
- PR reviews check adherence to principles
- Regular constitution audits

## Implementation Rules

### File Organization

- Prompts: `.github/prompts/`
- Chat modes: `.github/chatmodes/`
- Instructions: `.github/instructions/`
- Specs: `docs/specs/`
- Architecture: `architecture/`

### Naming Conventions

- Use domain.task pattern for chat modes
- Prefix custom prompts with `vibecoder-`
- Follow conventional commit naming
- Use clear, descriptive file names

### Validation Rules

- Linter validates all prompt files
- Frontmatter validation is mandatory
- Model validation against `.github/models.yaml`
- Instruction reference validation

## Enforcement Mechanisms

### Automated Checks

- Pre-commit hooks for linting
- CI pipeline for spec validation
- Automated testing for all changes
- Dependency scanning

### Manual Reviews

- Architecture reviews for significant changes
- Security reviews for sensitive areas
- Performance reviews for critical paths
- Constitution compliance reviews

### Continuous Improvement

- Regular constitution reviews
- Feedback collection from team
- Process optimization based on metrics
- Training and knowledge sharing

## Violation Handling

### Minor Violations

- Documentation required
- Peer review required
- Additional testing required
- Temporary approval with justification

### Major Violations

- Change request required
- Architecture review required
- Stakeholder approval required
- Implementation plan required

### Critical Violations

- Constitution amendment required
- Full team approval required
- Implementation moratorium
- Process redesign required

---

_This constitution is the supreme authority for AI-assisted workflows. All other instruction files must comply with these principles. Any exceptions require formal approval and documentation._
