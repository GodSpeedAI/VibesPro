# How-to: Bundle AI Context 📦

## Summary

Bundle CALM, tech stack, and key docs into `docs/ai_context_bundle/` for Copilot.

## Steps

1. Run `just ai-context-bundle`
2. Inspect output under `docs/ai_context_bundle/`

## Troubleshooting

- If `just` is missing, run: `bash scripts/dev/bundle-context.sh docs/ai_context_bundle`
- Ensure `architecture/calm/` and `techstack.yaml` exist; otherwise the bundle will be partial.
