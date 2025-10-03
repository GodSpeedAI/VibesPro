---
kind: prompt
domain: spec
task: plan-adr
thread: spec-plan-adr
matrix_ids: []
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search"]
description: "Template for generating Architecture Decision Record (ADR) plans from feature specifications."
---

# Architecture Decision Record (ADR) Plan Template

## Inputs

- Feature specification ID: {{ '{{PRD_ID}}' }}
- Decision context: {{ '{{DECISION_CONTEXT}}' }}
- Technical constraints: {{ '{{TECH_CONSTRAINTS}}' }}
- Stakeholder requirements: {{ '{{STAKEHOLDER_REQS}}' }}
- Timeline/urgency: {{ '{{TIMELINE}}' }}

## Template Structure

### 1. ADR Header

**Decision ID:** ADR-XXX
**Title:** [Clear, concise decision title]
**Status:** [Proposed | Accepted | Rejected | Superseded]
**Date:** {{ '{{DATE}}' }}
**Author:** {{ '{{AUTHOR}}' }}
**Related PRD:** {{ '{{PRD_ID}}' }}

### 2. Context and Problem Statement

#### What is the decision about?

- Clear description of the architectural decision needed
- Technical challenge or opportunity
- Business context driving the decision

#### Why is this decision necessary?

- Problem statement
- Pain points or limitations in current approach
- Future requirements or scaling needs
- Stakeholder expectations

### 3. Considered Options

#### Option 1: [Option Name]

- Description of the approach
- Pros:
  - [Benefit 1]
  - [Benefit 2]
- Cons:
  - [Drawback 1]
  - [Drawback 2]
- Implementation complexity: [Low/Medium/High]
- Maintenance overhead: [Low/Medium/High]
- Scalability: [Low/Medium/High]

#### Option 2: [Option Name]

- Description of the approach
- Pros:
  - [Benefit 1]
  - [Benefit 2]
- Cons:
  - [Drawback 1]
  - [Drawback 2]
- Implementation complexity: [Low/Medium/High]
- Maintenance overhead: [Low/Medium/High]
- Scalability: [Low/Medium/High]

### 4. Decision Outcome

#### Chosen option: [Option Name]

- Rationale for selection
- How it addresses the problem statement
- Alignment with business goals
- Risk assessment and mitigation

### 5. Implementation Details

#### Technical Specifications

- Architecture diagram or component description
- Key interfaces and contracts
- Technology stack decisions
- Data flow and storage approach

#### Success Criteria

- Technical metrics for success
- Performance benchmarks
- Quality attributes addressed
- Integration points

### 6. Consequences

#### Positive Consequences

- [Benefit 1]
- [Benefit 2]

#### Negative Consequences

- [Drawback 1]
- [Drawback 2]

#### Follow-up Decisions

- [Related decision 1]
- [Related decision 2]

### 7. References

- Related PRD: {{ '{{PRD_ID}}' }}
- Related technical specifications
- Industry best practices
- Previous ADRs that inform this decision

## Output

- Complete Architecture Decision Record
- ADR-XXX ID assigned
- Technical specifications documented
- Implementation guidance provided
- Ready for team review and approval
