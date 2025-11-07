#!/usr/bin/env python3
from pathlib import Path

files = [
    "docs/plans/hexddd_integration/PHASE-003-PROMPT.md",
    "docs/plans/hexddd_integration/PHASE-004-PROMPT.md",
    "docs/plans/hexddd_integration/PHASE-005-PROMPT.md",
]
for fp in files:
    p = Path(fp)
    if not p.exists():
        print(f"missing: {fp}")
        continue
    text = p.read_text(encoding="utf-8")
    lines = text.splitlines(True)
    out = []
    in_code = False
    for ln in lines:
        if ln.startswith("```"):
            in_code = not in_code
            out.append(ln)
            continue
        if not in_code:
            # remove up to 4 leading spaces if present
            if ln.startswith("    "):
                out.append(ln[4:])
            else:
                out.append(ln)
        else:
            out.append(ln)
    new = "".join(out)
    if new != text:
        p.write_text(new, encoding="utf-8")
        print(f"patched: {fp}")
    else:
        print(f"no change: {fp}")
