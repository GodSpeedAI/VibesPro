---
kind: prompt
domain: spec
task: plan-task
thread: spec-plan-task
matrix_ids: []
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search"]
description: "Template for generating Task plans from technical specifications and implementation requirements."
---

# Task Plan Template

## Inputs

- Technical Specification ID: {{ '{{TS_ID}}' }}
- Implementation scope: {{ '{{SCOPE}}' }}
- Priority: {{ '{{PRIORITY}}' }}
- Assignee: {{ '{{ASSIGNEE}}' }}
- Due date: {{ '{{DUE_DATE}}' }}

## Template Structure

### 1. Task Header

**Task ID:** TASK-XXX
**Title:** [Task Description]
**Status:** [Not Started | In Progress | Review | Completed | Blocked]
**Priority:** [Low | Medium | High | Critical]
**Assignee:** {{ '{{ASSIGNEE}}' }}
**Created Date:** {{ '{{CREATED_DATE}}' }}
**Due Date:** {{ '{{DUE_DATE}}' }}
**Related TS:** {{ '{{TS_ID}}' }}

### 2. Task Overview

#### Objective

- Clear, concise description of what needs to be accomplished
- Business value or technical benefit
- Success criteria definition

#### Context

- Background information
- Related tasks or dependencies
- Previous work or decisions

### 3. Task Breakdown

#### Main Activities

1. **Activity 1:** [Description]

   - Sub-tasks:
     - [ ] [Sub-task 1]
     - [ ] [Sub-task 2]
   - Estimated effort: [Time estimate]
   - Dependencies: [Related tasks]

2. **Activity 2:** [Description]

   - Sub-tasks:
     - [ ] [Sub-task 1]
     - [ ] [Sub-task 2]
   - Estimated effort: [Time estimate]
   - Dependencies: [Related tasks]

3. **Activity 3:** [Description]
   - Sub-tasks:
     - [ ] [Sub-task 1]
     - [ ] [Sub-task 2]
   - Estimated effort: [Time estimate]
   - Dependencies: [Related tasks]

### 4. Technical Requirements

#### Implementation Details

- Specific technologies or frameworks to use
- Coding standards and patterns
- Integration requirements
- Performance requirements

#### Quality Standards

- Code coverage requirements
- Testing standards
- Documentation requirements
- Review criteria

### 5. Acceptance Criteria

#### Functional Criteria

- [ ] [Criterion 1: Description]
- [ ] [Criterion 2: Description]
- [ ] [Criterion 3: Description]

#### Non-Functional Criteria

- [ ] [Performance: Target metric]
- [ ] [Security: Requirement]
- [ ] [Reliability: Requirement]
- [ ] [Usability: Requirement]

### 6. Resources & Dependencies

#### Required Resources

- Development environment setup
- Tools and technologies
- Documentation and references
- Team expertise needed

#### Dependencies

- [Dependency 1]: [Description and blocking nature]
- [Dependency 2]: [Description and blocking nature]
- [Dependency 3]: [Description and blocking nature]

### 7. Timeline & Milestones

#### Schedule

- **Start Date:** [Date]
- **Estimated Duration:** [Time period]
- **Milestone 1:** [Date] - [Deliverable]
- **Milestone 2:** [Date] - [Deliverable]
- **Completion Date:** [Date]

#### Time Tracking

- Planned effort: [Hours]
- Actual effort: [Hours]
- Remaining effort: [Hours]
- Progress percentage: [Percentage]

### 8. Risk Assessment

#### Potential Risks

- **Risk 1:** [Description] - [Impact] - [Mitigation strategy]
- **Risk 2:** [Description] - [Impact] - [Mitigation strategy]
- **Risk 3:** [Description] - [Impact] - [Mitigation strategy]

#### Risk Mitigation

- Prevention strategies
- Contingency plans
- Escalation procedures
- Monitoring indicators

### 9. Communication Plan

#### Stakeholders

- **Primary Stakeholder:** [Role] - [Communication frequency]
- **Secondary Stakeholder:** [Role] - [Communication frequency]
- **Technical Stakeholder:** [Role] - [Communication frequency]

#### Reporting

- Status update frequency
- Meeting schedule
- Reporting format
- Escalation path

### 10. Testing Strategy

#### Test Types

- **Unit Testing:** [Scope and requirements]
- **Integration Testing:** [Scope and requirements]
- **End-to-End Testing:** [Scope and requirements]
- **Performance Testing:** [Scope and requirements]

#### Test Data

- Test data requirements
- Mock data strategy
- Test environment setup
- Test automation approach

### 11. Deployment & Release

#### Deployment Plan

- Deployment environment
- Deployment steps
- Rollback procedures
- Release checklist

#### Post-Deployment

- Monitoring requirements
- Support handover
- Documentation updates
- Lessons learned capture

### 12. Review & Approval

#### Review Process

- Code review requirements
- Testing review criteria
- Documentation review
- Stakeholder approval process

#### Approval Criteria

- Technical completeness
- Quality standards met
- Requirements satisfied
- Business objectives achieved

### 13. Task Completion

#### Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests passed and documented
- [ ] Documentation updated
- [ ] Deployment completed
- [ ] Stakeholders notified

#### Handover

- Knowledge transfer completed
- Support documentation provided
- Training materials prepared
- Post-implementation support plan

### 14. Lessons Learned

#### What Went Well

- [Positive outcome 1]
- [Positive outcome 2]
- [Positive outcome 3]

#### Areas for Improvement

- [Improvement area 1]
- [Improvement area 2]
- [Improvement area 3]

### 15. Appendices

#### References

- Related technical specifications
- Documentation links
- Research materials
- Previous work

#### Templates

- Code templates
- Test templates
- Documentation templates
- Communication templates

## Output

- Complete Task Plan
- TASK-XXX ID assigned
- Detailed breakdown and timeline established
- Risk assessment and mitigation strategies defined
- Ready for implementation execution
