import re
import subprocess
import os

# Get files from report
with open("docs/work/summaries/docs-classification-report.md", "r") as f:
    content = f.read()

files = re.findall(r'\| \`(.*?)\` \|', content)
target_files = []
for f in files:
    # Filter only the files we migrated (exclude bundles/workspace)
    if 'ai_context_bundle' in f: continue
    if '.code-workspace' in f: continue
    if 'docs/work/summaries' in f: continue
    target_files.append(f)

print(f"Cleaning {len(target_files)} files from history...")

# Construct git-filter-repo command
cmd = ["git-filter-repo", "--force"]
for f in target_files:
    cmd.extend(["--path", f])
cmd.append("--invert-paths")

print("Running: " + " ".join(cmd))
subprocess.run(cmd)

# Restore stubs (which are now deleted from history and checking out purely from history might miss them?)
# Wait, filter-repo modifies the checkout. The stubs might be gone if we invert-paths on them?
# Yes, if we exclude 'docs/specs/core.adr.md', it is gone from HEAD too.
# But we have the stubs on disk right now? No, filter-repo works on the repo DB.
# We should BACKUP the current stubs, run filter-repo, then restore stubs.
