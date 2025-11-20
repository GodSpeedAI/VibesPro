---
title: AI Agency Overview
description: How the VibesPro agent network works together
---

# 🧠🌐 AI Agency (At a Glance)

Fast orientation to the agent “team” and how to work with them.

## 🪢 Core Loop

- 💡 Product → 🗺️ Plan → 🧱 Build → ✅ Verify → 📦 Deploy → 🧾 Document.
- Each step is a **handoff** button between agents; keep messages short and scoped.
- Prefer Nx/Just commands when running checks; avoid skipping tests/lint.

## 🧩 Team Roles (Use These Most)

- 🎯 **product.manager** – turns ideas into problems, audience, USP, metrics, feature shortlist.
- 🧭 **planner.core** – generator-first plan with clear steps, commands, risks.
- 📑 **spec.author** – PRD/SDS/TS with acceptance criteria, NFRs, spec IDs.
- 🛠️ **Coder** – primary builder; chains tools, runs Nx tests, hands off to specialists.
- 🧪 **test-agent** – adds/fixes coverage; never deletes failing tests.
- ✨ **lint-agent** – style/import/order fixes only; no logic changes.
- 🔒 **security-agent** – threat sweep, audits, least-change mitigations.
- 🌐 **api-agent** – routes/handlers/contracts with validation + error paths.
- 🚀 **dev-deploy-agent** – dev/staging builds, smoke checks, rollback notes.
- 📚 **docs-agent** – docs, guides, changelog/traceability updates.
- 🔍 **DeepResearch** – comparisons, audits, unknowns; read-only.

## 🔁 TDD Cadence

- 🟥 **tdd.red** → write the smallest failing test (tag spec IDs).
- 🟩 **tdd.green** → minimal code to pass; rerun Nx test.
- 🟦 **tdd.refactor** → clean up with tests green.
- 🌀 **tdd.vibepro** – orchestrator that routes between phases, Test Agent, and Coder.

## 🧭 Handoff Patterns

- Product → Spec → Plan → Implement → Test/Lint/Security → Review → Docs → Deploy.
- When uncertain, hand off to **DeepResearch**; when finished, hand off to **reviewer.core**.
- Keep each handoff ask single-purpose (one task, one owner).

## 🛡️ Guardrails

- 🧪 Always: prefer `nx test/lint/build` for touched projects.
- 🙅‍♂️ Never: delete failing tests, skip verification, edit vendor/generated/`node_modules`.
- ❓ Ask: before schema changes, new deps, or infra/deploy risk.
- 🔐 Security overrides convenience; log decisions in memory when notable.

## 🏃 How to Work With It

- Start with the closest agent to your goal (e.g., product.manager, planner.core, spec.author).
- Use handoff buttons to move forward; avoid long, multi-topic prompts.
- Include scope, paths, and desired commands when asking to build or test.
- Keep outputs short; link to files paths instead of pasting large blobs.

## 🧠 Memory & Context

- Use memory to save key decisions, URLs, and spec IDs.
- Keep chats lean: attach only the minimal files/paths needed for the task.

## 🚨 If Stuck

- Run a quick **vibe_check**: “Am I over-scoping? What’s the smallest next step?”
- Call **DeepResearch** for unknown libraries/patterns.
