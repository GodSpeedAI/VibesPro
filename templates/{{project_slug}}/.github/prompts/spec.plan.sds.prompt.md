---
kind: prompt
domain: spec
task: plan-sds
thread: spec-plan-sds
matrix_ids: []
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search"]
description: "Template for generating System Design Specification (SDS) plans from PRD and ADR specifications."
---

# System Design Specification (SDS) Plan Template

## Inputs

- Product Requirements ID: {{ '{{PRD_ID}}' }}
- Architecture Decision ID: {{ '{{ADR_ID}}' }}
- Technical constraints: {{ '{{TECH_CONSTRAINTS}}' }}
- Performance requirements: {{ '{{PERFORMANCE_REQS}}' }}
- Security requirements: {{ '{{SECURITY_REQS}}' }}

## Template Structure

### 1. SDS Header

**Document ID:** SDS-XXX
**Title:** [System Design Feature Name]
**Version:** 1.0
**Status:** [Draft | Review | Approved | Implemented]
**Author:** {{ '{{AUTHOR}}' }}
**Date:** {{ '{{DATE}}' }}
**Related PRD:** {{ '{{PRD_ID}}' }}
**Related ADR:** {{ '{{ADR_ID}}' }}

### 2. System Overview

#### Architecture Context

- High-level system architecture
- Component relationships and boundaries
- Integration points with existing systems

#### Design Principles

- Architectural patterns being used
- Key design decisions and rationale
- Non-functional requirements prioritization

### 3. Component Design

#### Component 1: [Component Name]

- **Purpose:** [What this component does]
- **Responsibilities:** [Key functions]
- **Interfaces:** [APIs, contracts]
- **Dependencies:** [What it depends on]
- **Configuration:** [Key settings]

#### Component 2: [Component Name]

- **Purpose:** [What this component does]
- **Responsibilities:** [Key functions]
- **Interfaces:** [APIs, contracts]
- **Dependencies:** [What it depends on]
- **Configuration:** [Key settings]

### 4. Data Architecture

#### Data Model

- Entity relationships
- Data flow diagrams
- Database schema overview
- Data persistence strategy

#### Data Storage

- Storage technologies used
- Data partitioning strategy
- Backup and recovery approach
- Data retention policies

### 5. API Design

#### REST API Endpoints

- Endpoint: [METHOD] /[path]
  - Description: [Purpose]
  - Request/Response format
  - Authentication requirements
  - Rate limiting

#### GraphQL Schema (if applicable)

- Schema definition
- Query/Mutation types
- Subscription types
- Resolver mappings

### 6. Security Design

#### Authentication & Authorization

- Authentication mechanism
- Authorization strategy
- Session management
- Token handling

#### Data Protection

- Encryption strategy
- Data masking
- Secure coding practices
- Vulnerability protection

### 7. Performance Design

#### Scalability Strategy

- Horizontal vs vertical scaling
- Load balancing approach
- Caching strategy
- Database optimization

#### Performance Targets

- Response time targets
- Throughput requirements
- Resource utilization targets
- Monitoring and alerting

### 8. Error Handling & Resilience

#### Error Management

- Error categorization
- Error handling patterns
- Logging strategy
- Error reporting

#### Resilience Patterns

- Circuit breakers
- Retry mechanisms
- Fallback strategies
- Graceful degradation

### 9. Integration Design

#### External Integrations

- Third-party APIs
- Webhook endpoints
- Message queues
- Event streaming

#### Internal Integrations

- Microservice communication
- Service discovery
- Configuration management
- Health checks

### 10. Deployment Architecture

#### Infrastructure Design

- Cloud provider strategy
- Containerization approach
- Orchestration platform
- Network topology

#### CI/CD Pipeline

- Build process
- Testing strategy
- Deployment pipeline
- Rollback strategy

### 11. Monitoring & Observability

#### Monitoring Strategy

- Key metrics to track
- Alerting thresholds
- Dashboard requirements
- Reporting needs

#### Logging Strategy

- Log levels and formats
- Log aggregation
- Log retention
- Log analysis tools

### 12. Testing Strategy

#### Test Types

- Unit testing approach
- Integration testing
- End-to-end testing
- Performance testing

#### Test Data

- Test data management
- Mock strategies
- Test environment setup
- Test automation

### 13. Implementation Roadmap

#### Phase 1: [Timeline]

- [Deliverable 1]
- [Deliverable 2]
- [Dependencies]

#### Phase 2: [Timeline]

- [Deliverable 1]
- [Deliverable 2]
- [Dependencies]

### 14. Risk Assessment

#### Technical Risks

- [Risk 1]: [Impact] - [Mitigation]
- [Risk 2]: [Impact] - [Mitigation]

#### Operational Risks

- [Risk 1]: [Impact] - [Mitigation]
- [Risk 2]: [Impact] - [Mitigation]

### 15. Appendices

#### Glossary

- [Term 1]: [Definition]
- [Term 2]: [Definition]

#### References

- Architecture diagrams
- API specifications
- Database schemas
- External documentation

## Output

- Complete System Design Specification
- SDS-XXX ID assigned
- Technical architecture documented
- Implementation roadmap defined
- Ready for detailed technical specification
