#!/usr/bin/env bash
set -euo pipefail

# Safely update `.devbox/gen/flake/flake.nix` to point to a newer nixpkgs branch
# This script is intended as a best-effort, idempotent helper for maintainers in
# case the generated flake pins an older commit which lacks packages (e.g. supabase).

FLAKE=".devbox/gen/flake/flake.nix"
if [[ ! -f "${FLAKE}" ]]; then
  echo "⚠️  ${FLAKE} not found — run 'devbox update' first to generate it."
  exit 0
fi

BACKUP="${FLAKE}.bak"
cp "${FLAKE}" "${BACKUP}"
echo "→ Backed up ${FLAKE} to ${BACKUP}"

# Replace the pinned nixpkgs URL with the useful `nixpkgs-unstable` ref to ensure more
# packages are available while still keeping the flake structure intact.
sed -n '1,200p' "${FLAKE}" > "${FLAKE}.tmp"
# Ensure a nixpkgs-unstable input exists and is used as a source for supabase if the
# default pinned nixpkgs lacks it.
if ! grep -q "nixpkgs-unstable.url" "${FLAKE}.tmp"; then
  awk '/inputs = \{/{print; print "     nixpkgs-unstable.url = \"github:NixOS/nixpkgs/nixpkgs-unstable\";"; next}1' "${FLAKE}.tmp" > "${FLAKE}.tmp2" && mv "${FLAKE}.tmp2" "${FLAKE}.tmp"
  echo "→ Added nixpkgs-unstable input to flake"
fi

# Add a nixpkgs-unstable-pkgs import under the let block if missing
if ! grep -q "nixpkgs-unstable-pkgs = (import nixpkgs-unstable" "${FLAKE}.tmp"; then
  awk '/let/ && c==0 {print; print "        nixpkgs-unstable-pkgs = (import nixpkgs-unstable {"; print "          system = \"x86_64-linux\";"; print "          config.allowUnfree = true;"; print "          config.permittedInsecurePackages = [ ];"; print "        });"; c=1; next}1' "${FLAKE}.tmp" > "${FLAKE}.tmp2" && mv "${FLAKE}.tmp2" "${FLAKE}.tmp"
  echo "→ Added nixpkgs-unstable-pkgs import in flake let block"
fi

# Inject supabase from the new imported pkgs into the buildInputs if it's not present
if ! grep -q "nixpkgs-unstable-pkgs.supabase" "${FLAKE}.tmp"; then
  awk 'BEGIN{p=0} /buildInputs = \[/ && p==0 {print; print "            (builtins.trace \"evaluating nixpkgs-unstable-pkgs.supabase\" nixpkgs-unstable-pkgs.supabase)"; p=1; next}1' "${FLAKE}.tmp" > "${FLAKE}.tmp2" && mv "${FLAKE}.tmp2" "${FLAKE}.tmp"
  echo "→ Injected nixpkgs-unstable-pkgs.supabase into buildInputs"
fi

mv "${FLAKE}.tmp" "${FLAKE}"
echo "→ Updated flake: added nixpkgs-unstable input and ensured supabase is referenced from it"

echo "→ Re-running: DEVBOX_DEBUG=1 devbox update"
DEVBOX_DEBUG=1 devbox update || { echo "❌ devbox update failed — you may need to run locally for full diagnostics"; exit 1; }

echo "✅ devbox pin updated and devbox update re-run. Verify 'supabase' is available via: devbox shell && supabase --version"

exit 0
