{% include 'docs/partials/_metadata_header.j2' %}

<!--
thread: {{ project_slug }}
matrix_ids: []
project: {{ project_name }}
date: {{ year }}
-->

# Software Design Specification (SDS)

> **🎯 Purpose**: Document system architecture, component design, and technical implementation details.
>
> **📝 How to use this file**:
>
> 1. Use chat mode `@workspace #spec.lean` or `#spec.wide` to generate SDS entries
> 2. Or run the prompt: `.github/prompts/spec.plan.sds.prompt.md`
> 3. Each SDS should follow the template structure below

---

## Template Structure

### SDS-XXX — [Component/System Name]

#### System Overview

- **Purpose**: [What this component/system does]
- **Scope**: [Boundaries and responsibilities]
- **Architecture Pattern**: [Hexagonal, Layered, Microservices, etc.]
- **Status**: [Draft | Review | Approved | Implemented]

#### Component Architecture

##### Component: [Component Name]

- **Responsibilities**: [Key functions this component handles]
- **Interfaces**: [APIs, contracts, ports]
- **Dependencies**: [What it depends on]
- **Data Flow**: [How data moves through this component]

#### Data Architecture

- **Data Model**: [Key entities and relationships]
- **Storage**: [Database, file system, cache, etc.]
- **Persistence Strategy**: [How data is stored and retrieved]

#### API Specifications

- **Endpoint**: `[HTTP_METHOD] /api/path`
  - **Purpose**: [What this endpoint does]
  - **Request**: [Request format]
  - **Response**: [Response format]
  - **Error Codes**: [Possible errors]

#### Non-Functional Requirements

- **Performance**: [Latency, throughput targets]
- **Scalability**: [Growth expectations]
- **Security**: [Security measures]
- **Reliability**: [Uptime, fault tolerance]

#### Technology Stack

- **Languages**: [Programming languages used]
- **Frameworks**: [Key frameworks]
- **Libraries**: [Important libraries]

#### Related Specs

- PRD: [PRD-XXX]
- ADR: [ADR-XXX]
- TS: [TS-XXX]

---

## Example SDS Entry

### SDS-001 — Authentication Service

#### System Overview

- **Purpose**: Handle user authentication and authorization using OAuth2
- **Scope**: User sign-up, login, logout, session management, token refresh
- **Architecture Pattern**: Hexagonal architecture with ports and adapters
- **Status**: Approved

#### Component Architecture

##### Component: AuthenticationService (Domain)

- **Responsibilities**: Core authentication logic, token validation, user session management
- **Interfaces**: `IAuthenticationPort` (inbound), `IUserRepositoryPort` (outbound)
- **Dependencies**: None (pure domain logic)
- **Data Flow**: Receives auth requests → validates credentials → issues tokens

##### Component: OAuth2Adapter (Infrastructure)

- **Responsibilities**: Integration with Google and GitHub OAuth providers
- **Interfaces**: Implements `IAuthenticationPort`
- **Dependencies**: External OAuth providers, HTTP client
- **Data Flow**: Redirects to provider → receives callback → exchanges code for tokens

#### Data Architecture

- **Data Model**: User (id, email, provider, created_at, last_login)
- **Storage**: PostgreSQL database
- **Persistence Strategy**: Repository pattern with ORM

#### API Specifications

- **Endpoint**: `POST /auth/login`
  - **Purpose**: Initiate OAuth login flow
  - **Request**: `{ "provider": "google" | "github" }`
  - **Response**: `{ "redirect_url": "https://..." }`
  - **Error Codes**: 400 (invalid provider), 500 (server error)

#### Non-Functional Requirements

- **Performance**: <200ms for token validation, <500ms for OAuth flow
- **Scalability**: Support 10,000+ concurrent sessions
- **Security**: PKCE flow, secure token storage, HTTPS only
- **Reliability**: 99.9% uptime

#### Technology Stack

- **Languages**: TypeScript
- **Frameworks**: Express.js, Passport.js
- **Libraries**: jsonwebtoken, bcrypt

#### Related Specs

- PRD: PRD-001
- ADR: ADR-002
- TS: TS-003

---

## Your SDS Entries

<!-- Add your SDS entries below this line -->
<!-- Use the chat modes or prompts mentioned above to generate well-structured SDS specifications -->
