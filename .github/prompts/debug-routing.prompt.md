---
agent: 'agent'
description: 'Explain why the context engineering routing loaded certain files or made particular decisions.'
tools: ['toolset:read']
metadata:
  id: ce.prompt.debug-routing
  tags: [routing, context-debug]
  inputs:
    files: [ce.manifest.jsonc, .github/ce/routing-rules.md]
    concepts: [explainability]
    tools: [toolset:read]
  outputs:
    artifacts: [ce.skill.context-routing]
    files: []
    actions: [explain-route, suggest-fix]
  dependsOn:
    artifacts: [ce.skill.context-routing]
    files: [.github/ce/routing-rules.md]
  related:
    artifacts: [ce.prompt.add-artifact]
    files: []
---

# Debug Routing Prompt

Use this prompt to understand the reasoning behind the selection of
context files, prompts or skills. It is particularly useful when the AI
appears to have loaded too many or too few files, or when you need to
adjust the manifest metadata.

1. Ask the user to provide the chat request or a description of the
   context‑engineering action they observed. Capture any specific files that
   were unexpectedly included or omitted.

2. Inspect `ce.manifest.jsonc` to see which artifacts match the request’s
   signals, tags and dependency closures. Refer to `routing-rules.md` for
   the formal selection rules.

3. Explain, step by step, why each file or tool was loaded. Reference the
   artifact’s metadata (inputs, outputs, dependsOn, tags) to justify its
   inclusion.

4. If an expected file was not loaded, identify which metadata field may be
   missing or misconfigured. Suggest updates to the manifest entry or the
   artifact’s frontmatter.

5. If an unnecessary file was loaded, determine whether its tags or
   dependencies are too broad. Recommend refining the metadata or adding
   more specific routing signals.

6. Summarise the analysis and, if appropriate, instruct the user to use
   `/add-artifact` to correct missing entries or to adjust metadata.

This prompt promotes transparency and helps maintain a lean context footprint
by iteratively refining the routing metadata.
