# Generator-First Workflow Diagram

## AI Workflow Integration

```mermaid
graph TD
    A[User Request: Create Component/Lib/App] --> B{AI Reads Instructions}
    B --> C[generators-first.instructions.md<br/>Precedence: 15]
    C --> D{Check for Nx Generator}
    D -->|List generators| E[pnpm exec nx list]
    E --> F{Generator Exists?}
    F -->|Yes| G[just ai-scaffold name=generator]
    F -->|No| H[Write Custom Code]
    G --> I[Generator Creates Scaffold]
    I --> J[AI Customizes with Business Logic]
    J --> K[Add Tests via TDD]
    K --> L[Update Traceability]
    H --> J

    style C fill:#90EE90
    style G fill:#87CEEB
    style I fill:#FFD700
```

## TDD Workflow with Generators

```mermaid
graph LR
    subgraph "Red Phase"
        R1[Need New Module?] -->|Yes| R2[Use Generator]
        R1 -->|No| R3[Write Failing Test]
        R2 --> R4[Customize Test Scaffold]
        R4 --> R5[Run Test - Should FAIL]
    end

    subgraph "Green Phase"
        R5 --> G1[Implement in Generated Structure]
        G1 --> G2[Run Test - Should PASS]
    end

    subgraph "Refactor Phase"
        G2 --> RF1[Improve Within Boundaries]
        RF1 --> RF2[Keep Nx Project Graph Intact]
        RF2 --> RF3[Re-run Tests]
    end

    style R2 fill:#FFD700
    style G1 fill:#90EE90
    style RF1 fill:#87CEEB
```

## Spec Implementation Flow

```mermaid
graph TD
    S1[Read Spec: PRD/SDS/TS] --> S2[Identify Scope]
    S2 --> S3{What Type?}
    S3 -->|Library| L1[@nx/js:library]
    S3 -->|Component| L2[@nx/react:component]
    S3 -->|App| L3[@nx/node:application]
    S3 -->|Hook| L4[@nx/react:hook]

    L1 --> S4[just ai-scaffold]
    L2 --> S4
    L3 --> S4
    L4 --> S4

    S4 --> S5[Generator Creates Structure]
    S5 --> S6[Implement Business Logic]
    S6 --> S7[Add Tests]
    S7 --> S8[Update Traceability Matrix]

    style S4 fill:#FFD700
    style S5 fill:#90EE90
```

## Instruction Precedence Hierarchy

```mermaid
graph TD
    A[Precedence 10: Security & Constitution] --> B[Precedence 15: generators-first.instructions.md]
    B --> C[Precedence 20: ai-workflows.instructions.md]
    C --> D[Precedence 25: context.instructions.md]
    D --> E[Precedence 32: src.instructions.md]
    E --> F[Precedence 50: general.instructions.md]

    B -.references.-> G[nx.instructions.md<br/>Nx MCP Server]
    B -.uses.-> H[justfile<br/>ai-scaffold recipe]

    style B fill:#FFD700
    style G fill:#87CEEB
    style H fill:#90EE90
```

## File Cross-Reference Map

```mermaid
graph LR
    GF[generators-first.instructions.md] --> |referenced by| CI[copilot-instructions.md]
    GF --> |referenced by| AI[ai-workflows.instructions.md]
    GF --> |referenced by| SI[src.instructions.md]
    GF --> |referenced by| SP[spec.implement.prompt.md]
    GF --> |referenced by| TP[tdd.workflow.prompt.md]
    GF --> |referenced by| TC[tdd.red.chatmode.md]

    GF --> |references| NX[nx.instructions.md]
    GF --> |references| JF[justfile ai-scaffold]

    NG[nx-generators-guide.md] --> |references| GF
    NG --> |references| NX
    NG --> |references| JF

    style GF fill:#FFD700
    style NG fill:#90EE90
```

## Generator Selection Decision Tree

```mermaid
graph TD
    A[Need to Create Something] --> B{What are you creating?}

    B -->|Shared utilities, domain logic| C[@nx/js:library]
    B -->|React component| D[@nx/react:component]
    B -->|React library| E[@nx/react:library]
    B -->|Custom hook| F[@nx/react:hook]
    B -->|REST API| G[@nx/node:application]
    B -->|Next.js app| H[@nx/next:application<br/>Install: pnpm add -D @nx/next]
    B -->|Mobile app| I[@nx/expo:application<br/>Install: pnpm add -D @nx/expo]
    B -->|Python API| J[@nxlv/python:application<br/>Install: pnpm add -D @nxlv/python]

    C --> K[just ai-scaffold name=@nx/js:library]
    D --> L[pnpm exec nx g @nx/react:component MyComponent]
    E --> K
    F --> M[pnpm exec nx g @nx/react:hook useMyHook]
    G --> N[pnpm exec nx g @nx/node:application api]
    H --> O[pnpm exec nx g @nx/next:application web]
    I --> P[pnpm exec nx g @nx/expo:application mobile]
    J --> Q[pnpm exec nx g @nxlv/python:application api --type=fastapi]

    K --> R[Customize with Business Logic]
    L --> R
    M --> R
    N --> R
    O --> R
    P --> R
    Q --> R

    style K fill:#90EE90
    style R fill:#FFD700
```

## Before vs After Integration

### Before (AI writes custom code directly)

```mermaid
graph LR
    A[User: Create Button component] --> B[AI writes custom files]
    B --> C[src/components/Button.tsx]
    B --> D[src/components/Button.test.tsx]
    B --> E[Manual config]
    E --> F[Inconsistent structure]

    style F fill:#FF6B6B
```

### After (Generator-first approach)

```mermaid
graph LR
    A[User: Create Button component] --> B[AI checks generators]
    B --> C[pnpm exec nx list]
    C --> D[Uses @nx/react:component]
    D --> E[Generator creates scaffold]
    E --> F[Nx project.json + tsconfig.json]
    E --> G[Component + test files]
    E --> H[Proper Nx project graph]
    F --> I[Consistent structure]
    G --> I
    H --> I

    style I fill:#90EE90
```

---

## Quick Commands Reference

```bash
# List all available generators
pnpm exec nx list

# List generators for specific plugin
pnpm exec nx list @nx/react

# Use generator via just recipe (recommended)
just ai-scaffold name=@nx/js:library

# Use generator directly
pnpm exec nx g @nx/react:component MyComponent

# Preview without creating (dry run)
pnpm exec nx g @nx/react:component MyComponent --dry-run

# Interactive mode (prompts for options)
pnpm exec nx g @nx/react:component
```

---

## Legend

-   🟡 **Yellow/Gold**: Generator-related (generators-first, ai-scaffold)
-   🟢 **Green**: Generated artifacts, successful outcomes
-   🔵 **Blue**: Nx infrastructure (MCP server, nx.instructions.md)
-   🔴 **Red**: Anti-patterns, problems to avoid
