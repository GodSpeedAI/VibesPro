---
kind: prompt
domain: spec
task: tasks-template
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search"]
description: "Template for generating numbered task lists from implementation plans and specifications."
---

# Tasks Template

## Inputs

- Implementation plan ID: {{ '{{PLAN_ID}}' }}
- Specification type: {{ '{{SPEC_TYPE}}' }} (PRD/ADR/SDS/TS)
- Priority level: {{ '{{PRIORITY}}' }}
- Team assignment: {{ '{{TEAM}}' }}
- Timeline constraints: {{ '{{TIMELINE}}' }}

## Template Structure

### 1. Tasks Header

**Project/Feature:** [Project or Feature Name]
**Specification ID:** {{ '{{SPEC_ID}}' }}
**Priority:** [High | Medium | Low]
**Team:** {{ '{{TEAM}}' }}
**Timeline:** {{ '{{TIMELINE}}' }}
**Status:** [Planning | In Progress | Review | Completed]
**Last Updated:** {{ '{{DATE}}' }}

### 2. Task Categories

#### Research & Analysis Tasks

1. **TASK-001:** Research [specific topic or technology]
    - **Description:** [Detailed description of research needed]
    - **Estimate:** [Time estimate]
    - **Dependencies:** [Related tasks]
    - **Owner:** [Assigned team member]
    - **Status:** [Not Started | In Progress | Completed | Blocked]
    - **Acceptance Criteria:**
        - [ ] [Specific deliverable or outcome]
        - [ ] [Verification method]

2. **TASK-002:** Analyze [specific requirement or constraint]
    - **Description:** [Detailed analysis description]
    - **Estimate:** [Time estimate]
    - **Dependencies:** [Related tasks]
    - **Owner:** [Assigned team member]
    - **Status:** [Not Started | In Progress | Completed | Blocked]
    - **Acceptance Criteria:**
        - [ ] [Specific deliverable or outcome]
        - [ ] [Verification method]

#### Design & Architecture Tasks

3. **TASK-003:** Design [component or system architecture]
    - **Description:** [Design approach and scope]
    - **Estimate:** [Time estimate]
    - **Dependencies:** [Related tasks]
    - **Owner:** [Assigned team member]
    - **Status:** [Not Started | In Progress | Completed | Blocked]
    - **Acceptance Criteria:**
        - [ ] [Design documentation created]
        - [ ] [Architecture review completed]
        - [ ] [Stakeholder approval obtained]

4. **TASK-004:** Create [specific design artifact]
    - **Description:** [Design artifact details]
    - **Estimate:** [Time estimate]
    - **Dependencies:** [Related tasks]
    - **Owner:** [Assigned team member]
    - **Status:** [Not Started | In Progress | Completed | Blocked]
    - **Acceptance Criteria:**
        - [ ] [Design artifact completed]
        - [ ] [Review feedback incorporated]

#### Development Tasks

5. **TASK-005:** Implement [specific feature or component]
    - **Description:** [Implementation details and scope]
    - **Estimate:** [Time estimate]
    - **Dependencies:** [Related tasks]
    - **Owner:** [Assigned team member]
    - **Status:** [Not Started | In Progress | Completed | Blocked]
    - **Acceptance Criteria:**
        - [ ] [Code implemented]
        - [ ] [Unit tests written and passing]
        - [ ] [Code review completed]
        - [ ] [Integration with existing system]

6. **TASK-006:** Develop [specific API or endpoint]
    - **Description:** [API development details]
    - **Estimate:** [Time estimate]
    - **Dependencies:** [Related tasks]
    - **Owner:** [Assigned team member]
    - **Status:** [Not Started | In Progress | Completed | Blocked]
    - **Acceptance Criteria:**
        - [ ] [API endpoint implemented]
        - [ ] [API documentation created]
        - [ ] [Integration tests passing]
        - [ ] [Performance benchmarks met]

#### Testing & Quality Tasks

7. **TASK-007:** Write [specific test type] tests
    - **Description:** [Testing scope and approach]
    - **Estimate:** [Time estimate]
    - **Dependencies:** [Related tasks]
    - **Owner:** [Assigned team member]
    - **Status:** [Not Started | In Progress | Completed | Blocked]
    - **Acceptance Criteria:**
        - [ ] [Test coverage achieved]
        - [ ] [All tests passing]
        - [ ] [Test documentation created]

8. **TASK-008:** Perform [specific testing activity]
    - **Description:** [Testing activity details]
    - **Estimate:** [Time estimate]
    - **Dependencies:** [Related tasks]
    - **Owner:** [Assigned team member]
    - **Status:** [Not Started | In Progress | Completed | Blocked]
    - **Acceptance Criteria:**
        - [ ] [Testing completed]
        - [ ] [Defects documented and tracked]
        - [ ] [Quality metrics met]

#### Documentation Tasks

9. **TASK-009:** Create [specific documentation]
    - **Description:** [Documentation scope and content]
    - **Estimate:** [Time estimate]
    - **Dependencies:** [Related tasks]
    - **Owner:** [Assigned team member]
    - **Status:** [Not Started | In Progress | Completed | Blocked]
    - **Acceptance Criteria:**
        - [ ] [Documentation created]
        - [ ] [Documentation reviewed]
        - [ ] [Documentation published]

10. **TASK-010:** Update [existing documentation]

- **Description:** [Documentation update scope]
- **Estimate:** [Time estimate]
- **Dependencies:** [Related tasks]
- **Owner:** [Assigned team member]
- **Status:** [Not Started | In Progress | Completed | Blocked]
- **Acceptance Criteria:**
    - [ ] [Documentation updated]
    - [ ] [Changes reviewed]
    - [ ] [Documentation synchronized]

#### Deployment & Release Tasks

11. **TASK-011:** Prepare [environment] for deployment

- **Description:** [Environment preparation details]
- **Estimate:** [Time estimate]
- **Dependencies:** [Related tasks]
- **Owner:** [Assigned team member]
- **Status:** [Not Started | In Progress | Completed | Blocked]
- **Acceptance Criteria:**
    - [ ] [Environment configured]
    - [ ] [Infrastructure validated]
    - [ ] [Deployment scripts ready]

12. **TASK-012:** Deploy [specific component or feature]

- **Description:** [Deployment scope and process]
- **Estimate:** [Time estimate]
- **Dependencies:** [Related tasks]
- **Owner:** [Assigned team member]
- **Status:** [Not Started | In Progress | Completed | Blocked]
- **Acceptance Criteria:**
    - [ ] [Deployment completed]
    - [ ] [Health checks passing]
    - [ ] [Monitoring active]
    - [ ] [Rollback plan tested]

#### Review & Approval Tasks

13. **TASK-013:** Conduct [specific review type]

- **Description:** [Review scope and criteria]
- **Estimate:** [Time estimate]
- **Dependencies:** [Related tasks]
- **Owner:** [Assigned team member]
- **Status:** [Not Started | In Progress | Completed | Blocked]
- **Acceptance Criteria:**
    - [ ] [Review completed]
    - [ ] [Feedback documented]
    - [ ] [Action items tracked]

14. **TASK-014:** Obtain [specific approval]

- **Description:** [Approval requirements and process]
- **Estimate:** [Time estimate]
- **Dependencies:** [Related tasks]
- **Owner:** [Assigned team member]
- **Status:** [Not Started | In Progress | Completed | Blocked]
- **Acceptance Criteria:**
    - [ ] [Approval obtained]
    - [ ] [Approval documented]
    - [ ] [Stakeholders notified]

### 3. Task Dependencies

#### Dependency Graph

- **TASK-001** → **TASK-003** → **TASK-005**
- **TASK-002** → **TASK-004** → **TASK-006**
- **TASK-005** → **TASK-007** → **TASK-009**
- **TASK-006** → **TASK-008** → **TASK-010**
- **TASK-007** → **TASK-011** → **TASK-012**
- **TASK-009** → **TASK-013** → **TASK-014**

#### Critical Path

- **Critical Path Tasks:** [List of critical path tasks]
- **Total Estimated Duration:** [Time estimate]
- **Key Milestones:** [Milestone descriptions]

### 4. Task Tracking

#### Progress Metrics

- **Total Tasks:** [Number]
- **Completed Tasks:** [Number]
- **In Progress Tasks:** [Number]
- **Blocked Tasks:** [Number]
- **Completion Percentage:** [Percentage]

#### Burndown Chart

- **Planned Effort:** [Hours]
- **Actual Effort:** [Hours]
- **Remaining Effort:** [Hours]
- **Velocity:** [Hours per iteration]

### 5. Risk Management

#### Task Risks

- **Risk 1:** [Risk description] - [Impact] - [Mitigation]
- **Risk 2:** [Risk description] - [Impact] - [Mitigation]
- **Risk 3:** [Risk description] - [Impact] - [Mitigation]

#### Risk Mitigation

- **Prevention:** [Prevention strategies]
- **Contingency:** [Contingency plans]
- **Monitoring:** [Risk indicators]

### 6. Communication Plan

#### Status Updates

- **Frequency:** [Update frequency]
- **Format:** [Update format]
- **Recipients:** [Stakeholders]
- **Escalation:** [Escalation path]

#### Meetings

- **Daily Standup:** [Time and participants]
- **Sprint Review:** [Time and participants]
- **Retrospective:** [Time and participants]

### 7. Success Criteria

#### Project Success

- [ ] All tasks completed on time
- [ ] Quality standards met
- [ ] Stakeholder satisfaction achieved
- [ ] Business objectives delivered

#### Process Success

- [ ] Team collaboration effective
- [ ] Communication channels open
- [ ] Risks managed appropriately
- [ ] Lessons learned documented

### 8. Appendices

#### Task Templates

- [ ] Task template for future use
- [ ] Checklists for quality assurance
- [ ] Communication templates

#### References

- [ ] Related specifications
- [ ] Previous project documentation
- [ ] Best practices and guidelines

## Output

- Complete numbered task list
- TASK-XXX IDs assigned
- Dependencies and critical path identified
- Progress tracking metrics established
- Ready for project execution
