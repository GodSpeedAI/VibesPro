---
kind: prompt
domain: spec
task: plan-prd
thread: spec-plan-prd
matrix_ids: []
budget: M
mode: 'agent'
model: GPT-5 mini
tools: ['codebase', 'search']
description: 'Template for generating Product Requirements Document (PRD) plans from feature specifications.'
---

# Product Requirements Document (PRD) Plan Template

## Inputs

- Feature specification ID: {{ '{{FEATURE_ID}}' }}
- Target audience: {{ '{{TARGET_AUDIENCE}}' }}
- Business objectives: {{ '{{BUSINESS_OBJECTIVES}}' }}
- Market context: {{ '{{MARKET_CONTEXT}}' }}
- Competitive landscape: {{ '{{COMPETITIVE_LANDSCAPE}}' }}

## Template Structure

### 1. PRD Header

**Document ID:** PRD-XXX
**Title:** [Product Feature Name]
**Version:** 1.0
**Status:** [Draft | Review | Approved | Implemented]
**Author:** {{ '{{AUTHOR}}' }}
**Date:** {{ '{{DATE}}' }}
**Related ADR:** {{ '{{ADR_ID}}' }}

### 2. Executive Summary

#### Overview

- High-level description of the feature/product
- Business value and strategic importance
- Target user segments and their needs

#### Success Metrics

- Key performance indicators (KPIs)
- Business outcomes expected
- User adoption targets

### 3. Problem Statement

#### Current State

- Description of existing problem or opportunity
- User pain points and frustrations
- Business limitations or gaps

#### Desired State

- Vision for improved experience
- Business benefits expected
- User satisfaction goals

### 4. User Personas

#### Primary Persona: [Persona Name]

- Role: [Job title/responsibilities]
- Goals: [What they want to achieve]
- Pain Points: [Current frustrations]
- Usage Context: [When and how they use the product]

#### Secondary Persona: [Persona Name]

- Role: [Job title/responsibilities]
- Goals: [What they want to achieve]
- Pain Points: [Current frustrations]
- Usage Context: [When and how they use the product]

### 5. Requirements

#### Functional Requirements

- [ ] FR-1: [Requirement description]
  - Acceptance Criteria:
    - [ ] Given [context], when [action], then [result]
    - [ ] Given [context], when [action], then [result]
- [ ] FR-2: [Requirement description]
  - Acceptance Criteria:
    - [ ] Given [context], when [action], then [result]
    - [ ] Given [context], when [action], then [result]

#### Non-Functional Requirements

- [ ] NFR-1: Performance - [Specific targets]
- [ ] NFR-2: Security - [Requirements]
- [ ] NFR-3: Reliability - [Requirements]
- [ ] NFR-4: Usability - [Requirements]
- [ ] NFR-5: Scalability - [Requirements]

### 6. User Stories

#### Epic: [Epic Name]

- As a [user persona], I want [goal] so that [benefit]
- Acceptance Criteria:
  - [ ] [Criterion 1]
  - [ ] [Criterion 2]

#### Epic: [Epic Name]

- As a [user persona], I want [goal] so that [benefit]
- Acceptance Criteria:
  - [ ] [Criterion 1]
  - [ ] [Criterion 2]

### 7. User Flow & Scenarios

#### Primary User Flow

1. [Step 1] - [Description]
2. [Step 2] - [Description]
3. [Step 3] - [Description]
4. [Step 4] - [Description]

#### Edge Cases & Error Scenarios

- [Scenario 1] - [Expected behavior]
- [Scenario 2] - [Expected behavior]
- [Scenario 3] - [Expected behavior]

### 8. Design & UX Considerations

#### UI/UX Requirements

- Design principles to follow
- Accessibility requirements
- Responsive design considerations
- Brand guidelines compliance

#### Wireframes/Prototypes

- Reference to design artifacts
- Key screens and interactions
- Visual style guidelines

### 9. Technical Considerations

#### Integration Points

- External systems and APIs
- Data sources and dependencies
- Authentication and authorization

#### Technical Constraints

- Platform limitations
- Technology stack requirements
- Performance constraints
- Security requirements

### 10. Success Criteria & Metrics

#### Quantitative Metrics

- [Metric 1]: [Target value] by [Timeline]
- [Metric 2]: [Target value] by [Timeline]
- [Metric 3]: [Target value] by [Timeline]

#### Qualitative Metrics

- [Qualitative measure 1]
- [Qualitative measure 2]
- [Qualitative measure 3]

### 11. Timeline & Milestones

#### Release Plan

- [Phase 1]: [Timeline] - [Deliverables]
- [Phase 2]: [Timeline] - [Deliverables]
- [Phase 3]: [Timeline] - [Deliverables]

#### Dependencies

- [Dependency 1] - [Description]
- [Dependency 2] - [Description]

### 12. Risks & Assumptions

#### Risks

- [Risk 1]: [Impact] - [Mitigation strategy]
- [Risk 2]: [Impact] - [Mitigation strategy]

#### Assumptions

- [Assumption 1]
- [Assumption 2]
- [Assumption 3]

### 13. Stakeholders & Reviewers

#### Business Stakeholders

- [Name] - [Role] - [Contact]
- [Name] - [Role] - [Contact]

#### Technical Stakeholders

- [Name] - [Role] - [Contact]
- [Name] - [Role] - [Contact]

### 14. Appendices

#### Glossary

- [Term 1]: [Definition]
- [Term 2]: [Definition]

#### References

- Related documents
- Research sources
- Competitive analysis

## Output

- Complete Product Requirements Document
- PRD-XXX ID assigned
- User stories and acceptance criteria defined
- Success metrics and timeline established
- Ready for technical specification development
