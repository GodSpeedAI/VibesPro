---
kind: prompt
domain: spec
task: feature-template
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search"]
description: "Template for generating feature specifications with proper structure and traceability."
---

# Feature Specification Template

## Inputs

- Feature name: {{ '{{FEATURE_NAME}}' }}
- Feature description: {{ '{{DESCRIPTION}}' }}
- Business value/outcome: {{ '{{BUSINESS_VALUE}}' }}
- Related features/dependencies: {{ '{{RELATED_FEATURES}}' }}
- Target release/iteration: {{ '{{TARGET_RELEASE}}' }}

## Template Structure

### 1. Feature Overview

**Feature ID:** PRD-XXX

#### What

- Clear, concise description of the feature
- User-facing benefit statement
- Scope boundaries (what's included/excluded)

#### Why

- Business problem being solved
- User pain point addressed
- Strategic alignment
- Success metrics

### 2. Requirements

#### Functional Requirements

- [ ] Requirement 1 with acceptance criteria
- [ ] Requirement 2 with acceptance criteria

#### Non-Functional Requirements

- Performance: {{ '{{PERFORMANCE_TARGETS}}' }}
- Security: {{ '{{SECURITY_REQUIREMENTS}}' }}
- Scalability: {{ '{{SCALABILITY_REQUIREMENTS}}' }}
- Accessibility: {{ '{{ACCESSIBILITY_REQUIREMENTS}}' }}

### 3. User Stories

- As a [user role], I want [goal] so that [benefit]
- As a [user role], I want [goal] so that [benefit]

### 4. Acceptance Criteria

- Given [context], when [event], then [outcome]
- Given [context], when [event], then [outcome]

### 5. Implementation Considerations

- Technical constraints
- Integration points
- Data requirements
- API considerations

### 6. Risks & Assumptions

- **Risks:**
  - Risk 1 with mitigation
  - Risk 2 with mitigation
- **Assumptions:**
  - Assumption 1
  - Assumption 2

### 7. Success Metrics

- Quantitative metrics: {{ '{{QUANT_METRICS}}' }}
- Qualitative metrics: {{ '{{QUAL_METRICS}}' }}

## Output

- Complete feature specification ready for review
- PRD-XXX ID assigned
- Traceability matrix entry created
- Ready for ADR/SDS/TS planning
