# Reference: AI Prompts & Chat Modes

This document provides a reference for the available AI assets that provide context and automation for AI assistants like GitHub Copilot.

---

## AI Prompts

Prompts are pre-written queries designed to handle common, complex, or repetitive development tasks. They ensure consistency and leverage the full context of the repository. They are located in `.github/prompts/`.

-   **`bootstrap-dev-platform.prompt.md`**: Guides the setup of the development platform and environment.
-   **`change-feature.prompt.md`**: Assists in modifying an existing feature based on new requirements.
-   **`create-react-component.prompt.md`**: Generates boilerplate for a new React component following project conventions.
-   **`generate-ai-docs.prompt.md`**: Creates documentation for AI-related components and workflows.
-   **`implement-feature.prompt.md`**: Guides the implementation of a new feature based on a specification document.
-   **`load-spec-items.prompt.md`**: Helps load and process items from a specification document.
-   **`performance-analysis.prompt.md`**: Initiates a performance analysis of the application code.
-   **`security-review.prompt.md`**: Starts a security review of the codebase.
-   **`spec-housekeeping.prompt.md`**: Assists with cleaning up, organizing, and maintaining specification documents.
-   **`sync-techstack.prompt.md`**: Helps synchronize the project configuration based on `techstack.yaml`.
-   **`test-hardening.prompt.md`**: Guides the process of improving the robustness and coverage of tests.
-   **`traceability-matrix.prompt.md`**: Creates or updates a traceability matrix linking specs to code and tests.
-   **`transcript-to-devspec.prompt.md`**: Converts a meeting or discussion transcript into a formal development specification.
-   **`transcript-to-spec.prompt.md`**: Converts a transcript into a general specification document.

---

## AI Chat Modes

Chat modes are personas that the AI assistant can adopt to provide specialized advice and analysis from a specific point of view. They help focus the conversation and leverage expert knowledge. They are located in `.github/chatmodes/`.

-   **`devops-audit.chatmode.md`**: Provides analysis from a DevOps perspective, focusing on CI/CD, infrastructure, and operations.
-   **`devops-deployment-engineer.chatmode.md`**: Focuses specifically on deployment and release engineering challenges.
-   **`elevator-pitch.chatmode.md`**: Helps generate a concise and compelling elevator pitch for the project.
-   **`features-list.chatmode.md`**: Assists in brainstorming and creating a list of project features.
-   **`non-functional.chatmode.md`**: Focuses the conversation on non-functional requirements like performance, security, and scalability.
-   **`onboarding.chatmode.md`**: Acts as a guide for new developers joining the project.
-   **`planning.chatmode.md`**: Assists with high-level project planning and task breakdown.
-   **`problem-statement.chatmode.md`**: Helps draft and refine the project's core problem statement.
-   **`product-manager.chatmode.md`**: Provides feedback and analysis from a product manager's perspective.
-   **`qa-test-automation-engineer.chatmode.md`**: Focuses on quality assurance and test automation strategies.
-   **`security-analyst.chatmode.md`**: Provides analysis from a security expert's point of view.
-   **`senior-backend-engineer.chatmode.md`**: Simulates a senior backend engineer for architectural and implementation discussions.
-   **`senior-frontend-engineer.chatmode.md`**: Simulates a senior frontend engineer for UI/UX and implementation discussions.
-   **`spec-driven-lean.chatmode.md`**: Focuses on a lean, efficient approach to specification-driven development.
-   **`spec-driven.chatmode.md`**: Focuses on the principles and practices of specification-driven development.
-   **`system-architect.chatmode.md`**: Provides a high-level, systemic view of the project's architecture.
-   **`target-audience.chatmode.md`**: Helps define and analyze the project's target audience.
-   **`target-platforms.chatmode.md`**: Assists in defining and planning for target platforms (e.g., web, mobile).
-   **`usp.chatmode.md`**: Helps define the project's Unique Selling Proposition.
-   **`ux-ui-designer.chatmode.md`**: Provides feedback and guidance from a UX/UI designer's perspective.
-   **`ux-ui.chatmode.md`**: Focuses generally on topics related to user experience and user interface design.
