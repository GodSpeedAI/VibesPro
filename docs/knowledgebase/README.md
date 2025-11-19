# VibePDK Knowledge Base

Welcome to the VibePDK Knowledge Base. This is your single source of truth for understanding the architecture, workflows, and tools of the VibePDK platform.

This knowledge base is organized into four main sections, based on the Diátaxis framework, to help you find the information you need quickly and efficiently.

- **[Explanation](#explanation):** High-level concepts, architectural principles, and design rationale.
- **[How-To Guides](#how-to-guides):** Practical, task-oriented instructions to solve specific problems.
- **[Tutorials](#tutorials):** Step-by-step guides to help you get started with common tasks.
- **[Reference](#reference):** Detailed information on APIs, commands, and configurations.

---

## Explanation

_Understand the "why" behind the VibePDK platform._

### Core Architecture

- **[System Architecture](./explanation/system-architecture.md):** An overview of the Hexagonal Architecture and Domain-Driven Design principles.
- **[Architecture-Aware Context](./explanation/architecture-aware-context.md):** How the AI understands and leverages the system's architecture.

### AI-Driven Workflow

- **[AI Agent Playbook](./explanation/ai-agent-playbook.md):** The definitive guide to the AI agent stack, its layers, and core tenets.
- **[AI Workflows Rationale](./explanation/ai-workflows-rationale.md):** The reasoning behind the AI-assisted development process.
- **[AI Specifications](./explanation/ai-specifications/):** The canonical collection of ADRs, PRDs, and technical specifications for the AI system.
    - [AI Architecture Decision Records (ADR)](./explanation/ai-specifications/AI_ADR.md)
    - [AI Product Requirements (PRD)](./explanation/ai-specifications/AI_PRD.md)
    - [AI Software Design Specification (SDS)](./explanation/ai-specifications/AI_SDS.md)
    - [AI Technical Specification (TS)](./explanation/ai-specifications/AI_TS.md)
    - [AI Security Hardening Specification](./explanation/ai-specifications/AI_SECURITY_HARDENING.md)
    - [VibePDK AI Integration Plan](./explanation/ai-specifications/vibepdk-ai-integration-plan.md)

### MergeKit Engine

- **[Integration Blueprint](./explanation/mergekit/integration-blueprint.md):** The strategy for merging HexDDD and VibePDK into a unified generator.
- **[MergeKit Specifications](./explanation/mergekit/):** The collection of planning and design documents for the MergeKit engine.
    - [MergeKit ADR](./explanation/mergekit/ADR.md)
    - [MergeKit PRD](./explanation/mergekit/PRD.md)
    - [MergeKit SDS](./explanation/mergekit/SDS.md)
    - [MergeKit TS](./explanation/mergekit/TS.md)
    - [MergeKit Implementation Plan](./explanation/mergekit/IMPLEMENTATION-PLAN.md)

---

## How-To Guides

_Practical, step-by-step instructions for common tasks._

### AI Workflow

- **[Maintain the AI Workflow](./how-to/maintain-ai-workflow.md):** A guide for developers evolving the AI-assisted workflow.
- **[Use Chat Modes](./how-to/use-chat-modes.md):** How to effectively use the different AI chat modes.
- **[Bundle AI Context](./how-to/bundle-context.md):** How to generate and use the AI context bundle.
- **[Write Commit Messages](./how-to/write-commit-messages.md):** Guidelines for writing clear and traceable commit messages.

### Development & Scaffolding

- **[Initialize Dev Environment (MergeKit)](./how-to/mergekit/initialize-dev-environment.md):** A checklist for setting up the MergeKit development environment.
- **[Scaffold with Nx](./how-to/scaffold-with-nx.md):** How to use Nx to scaffold new components.
- **[Configure MCP Tools](./how-to/configure-mcp.md):** How to configure the Model Context Protocol (MCP) tools.
- **[Validate the Repo](./how-to/validate-repo.md):** How to run validation checks on the repository.

### Security

- **[Integrate Security Hardening](./how-to/security/integrate-security-hardening.md):** A step-by-step guide for integrating security features.
- **[Run Security Tests](./how-to/security/run-security-tests.md):** Procedures for validating the security of the application.

---

## Tutorials

_Learn by doing with these guided walkthroughs._

- **[Getting Started with TDD](./tutorials/getting-started-tdd.md):** A step-by-step tutorial for test-driven development with the AI assistant.

---

## Reference

_Detailed information, lists, and specifications._

- **[Chat Modes](./reference/chat-modes.md):** A complete list of available AI chat modes.
- **[Prompts](./reference/prompts.md):** A reference for the available AI prompts.
- **[Just Recipes](./reference/just-recipes.md):** A complete list of `just` commands.
- **[VS Code Customization](./reference/vscode-customization.md):** Details on customizing VS Code for the VibePDK workflow.
- **[FAQ](./reference/faq.md):** Frequently asked questions.

---

## Archive

_Historical documents, preserved for context._

- **[Archived Specifications](./archive/specs/):** Historical and raw specification documents.
- **[Archived Wiki](./archive/wiki/):** Previous versions of the project wiki.
