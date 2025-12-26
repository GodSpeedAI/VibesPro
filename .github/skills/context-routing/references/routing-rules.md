# Routing Rules for Context Routing Skill

This file mirrors the routing rules defined in `.github/ce/routing-rules.md`. It exists in the skill
directory so that the skill can load the rules without including the entire `.github/ce` folder by
default. See the main routing rules document for detailed signal definitions and example routes.

The rules describe how to map intent, scope, risk and actionability signals to specific prompts,
skills, toolsets and validation tasks. They ensure that only the minimum set of artifacts is
loaded into context, reducing hallucinations and improving answer accuracy.

If you update the routing rules, reflect those changes here or reference the updated document.
