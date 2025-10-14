#!/usr/bin/env python3
"""
Simple link checker for AGENT.md files.
Checks that local markdown links point to existing files in the repo.
"""
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

link_re = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

agent_files = list(REPO_ROOT.rglob('**/AGENT.md'))

errors = []

for f in agent_files:
    rel = f.relative_to(REPO_ROOT)
    text = f.read_text(encoding='utf-8')
    for m in link_re.finditer(text):
        label, target = m.group(1), m.group(2)
        # ignore absolute URLs
        if target.startswith('http://') or target.startswith('https://'):
            continue
        # strip anchors and query
        target_path = target.split('#')[0].split('?')[0]
        # handle leading slash (repo root)
        if target_path.startswith('/'):
            target_path = target_path[1:]
        candidate = REPO_ROOT / target_path
        if not candidate.exists():
            errors.append((str(rel), target, str(candidate)))

if errors:
    print('Broken links found:')
    for src, target, resolved in errors:
        print(f"- In {src}: {target} -> {resolved} (MISSING)")
    raise SystemExit(2)

print('All local links in AGENT.md files resolved successfully.')
