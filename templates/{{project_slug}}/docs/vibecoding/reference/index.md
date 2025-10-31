# Reference Index: Prompts and Chat Modes

This index lists prompts and chat modes with their taxonomy fields (domain, task, phase). Files carry YAML frontmatter with these values.

## Prompts

-   spec.implement (file: `.github/prompts/spec.implement.prompt.md`) — domain: spec, task: implement
-   spec.change (file: `.github/prompts/spec.change.prompt.md`) — domain: spec, task: change
-   spec.traceability.update (file: `.github/prompts/spec.traceability.update.prompt.md`) — domain: spec, task: traceability
-   spec.items.load (file: `.github/prompts/spec.items.load.prompt.md`) — domain: spec, task: items
-   spec.transcript.to-spec (file: `.github/prompts/spec.transcript.to-spec.prompt.md`) — domain: spec, task: transcript
-   spec.transcript.to-devspec (file: `.github/prompts/spec.transcript.to-devspec.prompt.md`) — domain: spec, task: transcript
-   tdd.workflow (file: `.github/prompts/tdd.workflow.prompt.md`) — domain: tdd, task: workflow
-   debug.workflow (file: `.github/prompts/debug.workflow.prompt.md`) — domain: debug, task: workflow
-   docs.generate (file: `.github/prompts/docs.generate.prompt.md`) — domain: docs, task: generate
-   ui.react.create-component (file: `.github/prompts/ui.react.create-component.prompt.md`) — domain: ui, task: create-component
-   perf.analyze (file: `.github/prompts/perf.analyze.prompt.md`) — domain: perf, task: analyze
-   sec.review (file: `.github/prompts/sec.review.prompt.md`) — domain: sec, task: review
-   spec.housekeeping (file: `.github/prompts/spec.housekeeping.prompt.md`) — domain: spec, task: housekeeping
-   tool.techstack.sync (file: `.github/prompts/tool.techstack.sync.prompt.md`) — domain: tool, task: sync
-   platform.bootstrap (file: `.github/prompts/platform.bootstrap.prompt.md`) — domain: platform, task: bootstrap
-   testing.hardening (file: `.github/prompts/test-hardening.prompt.md`) — domain: testing, task: hardening

## Chat Modes

-   spec.lean (file: `.github/chatmodes/spec.lean.chatmode.md`) — domain: spec, task: mode, phase: lean
-   spec.wide (file: `.github/chatmodes/spec.wide.chatmode.md`) — domain: spec, task: mode, phase: wide
-   tdd.red (file: `.github/chatmodes/tdd.red.chatmode.md`) — domain: tdd, task: workflow, phase: red
-   tdd.green (file: `.github/chatmodes/tdd.green.chatmode.md`) — domain: tdd, task: workflow, phase: green
-   tdd.refactor (file: `.github/chatmodes/tdd.refactor.chatmode.md`) — domain: tdd, task: workflow, phase: refactor
-   debug.start (file: `.github/chatmodes/debug.start.chatmode.md`) — domain: debug, task: workflow, phase: start
-   debug.repro (file: `.github/chatmodes/debug.repro.chatmode.md`) — domain: debug, task: workflow, phase: repro
-   debug.isolate (file: `.github/chatmodes/debug.isolate.chatmode.md`) — domain: debug, task: workflow, phase: isolate
-   debug.fix (file: `.github/chatmodes/debug.fix.chatmode.md`) — domain: debug, task: workflow, phase: fix
-   debug.refactor (file: `.github/chatmodes/debug.refactor.chatmode.md`) — domain: debug, task: workflow, phase: refactor
-   debug.regress (file: `.github/chatmodes/debug.regress.chatmode.md`) — domain: debug, task: workflow, phase: regress
-   product.features-list (file: `.github/chatmodes/product.features-list.chatmode.md`) — domain: product, task: features-list
-   planning.plan (file: `.github/chatmodes/planning.plan.chatmode.md`) — domain: planning, task: plan
-   product.problem-statement (file: `.github/chatmodes/product.problem-statement.chatmode.md`) — domain: product, task: problem-statement
-   product.target-audience (file: `.github/chatmodes/product.target-audience.chatmode.md`) — domain: product, task: target-audience
-   product.elevator-pitch (file: `.github/chatmodes/product.elevator-pitch.chatmode.md`) — domain: product, task: elevator-pitch
-   product.usp (file: `.github/chatmodes/product.usp.chatmode.md`) — domain: product, task: usp
-   product.manager (file: `.github/chatmodes/product.manager.chatmode.md`) — domain: product, task: manager
-   persona.system-architect (file: `.github/chatmodes/persona.system-architect.chatmode.md`) — domain: persona, task: architect
-   persona.senior-frontend (file: `.github/chatmodes/persona.senior-frontend.chatmode.md`) — domain: persona, task: frontend
-   persona.senior-backend (file: `.github/chatmodes/persona.senior-backend.chatmode.md`) — domain: persona, task: backend
-   persona.ux-ui (file: `.github/chatmodes/persona.ux-ui.chatmode.md`) — domain: persona, task: ux-ui
-   persona.ux-ui-designer (file: `.github/chatmodes/persona.ux-ui-designer.chatmode.md`) — domain: persona, task: ux-ui-designer
-   persona.qa (file: `.github/chatmodes/persona.qa.chatmode.md`) — domain: persona, task: qa
-   security.analyst (file: `.github/chatmodes/sec.analyst.chatmode.md`) — domain: sec, task: analyst
-   devops.audit (file: `.github/chatmodes/devops.audit.chatmode.md`) — domain: devops, task: audit
-   devops.deployment (file: `.github/chatmodes/devops.deployment.chatmode.md`) — domain: devops, task: deployment
-   platform.target-platforms (file: `.github/chatmodes/platform.target-platforms.chatmode.md`) — domain: platform, task: target-platforms
-   onboarding (file: `.github/chatmodes/onboarding.overview.chatmode.md`) — domain: onboarding, task: overview
-   non-functional (file: `.github/chatmodes/spec.nfr.chatmode.md`) — domain: spec, task: nfr

Model defaults: see `.github/models.yaml`.
