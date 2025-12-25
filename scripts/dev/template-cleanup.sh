#!/usr/bin/env bash
# Template cleanup script - removes maintainer-specific files from template
# Safe to run multiple times (idempotent)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE_DIR="${REPO_ROOT}/templates/{{project_slug}}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if template directory exists
if [[ ! -d "${TEMPLATE_DIR}" ]]; then
  error "Template directory not found: ${TEMPLATE_DIR}"
  exit 1
fi

if [[ -z "${1}" ]]; then
  echo "usage: $0 <target-dir>"
  exit 1
fi
TARGET="$1"
if [[ -d "${TARGET}" ]]; then
  find "${TARGET}" -type f -name '*.j2' -delete
  echo "cleaned templates in ${TARGET}"
else
  echo "no such directory: ${TARGET}"
fi

info "Starting template cleanup..."
info "Template directory: ${TEMPLATE_DIR}"

# Counter for removed files/dirs
REMOVED_COUNT=0

# Function to safely remove file or directory
safe_remove() {
  local path="$1"
  local description="$2"

  if [[ -e "${path}" ]]; then
    info "Removing: ${description}"
    rm -rf "${path}"
    REMOVED_COUNT=$((REMOVED_COUNT + 1))
  else
    warn "Already removed: ${description}"
  fi
}

# Remove maintainer-specific docs files
info ""
info "=== Removing maintainer-specific documentation files ==="
safe_remove "${TEMPLATE_DIR}/docs/dev_devkit-integration-plan.md" "dev_devkit-integration-plan.md"
safe_remove "${TEMPLATE_DIR}/docs/dev_implementation_plan.md" "dev_implementation_plan.md"
safe_remove "${TEMPLATE_DIR}/docs/devkit-prompts-instructions-integration.md" "devkit-prompts-instructions-integration.md"
safe_remove "${TEMPLATE_DIR}/docs/ideation-insights.md" "ideation-insights.md"
safe_remove "${TEMPLATE_DIR}/docs/mapping.md" "mapping.md"
safe_remove "${TEMPLATE_DIR}/docs/template_structure_analysis.md" "template_structure_analysis.md"
safe_remove "${TEMPLATE_DIR}/docs/vibecoder_integration_plan.md" "vibecoder_integration_plan.md"
safe_remove "${TEMPLATE_DIR}/docs/environment_report.md" "environment_report.md"
safe_remove "${TEMPLATE_DIR}/docs/migration-from-yaml.md" "migration-from-yaml.md"
safe_remove "${TEMPLATE_DIR}/docs/vibelog.txt" "vibelog.txt"
safe_remove "${TEMPLATE_DIR}/docs/techstack.schema copy.json" "techstack.schema copy.json"

# Remove maintainer directories
info ""
info "=== Removing maintainer-specific directories ==="
safe_remove "${TEMPLATE_DIR}/docs/work-summaries" "work-summaries/"

# Remove test artifacts from specs/
info ""
info "=== Removing test artifacts from specs/ ==="
safe_remove "${TEMPLATE_DIR}/docs/specs/10914THREAD_VALUE" "specs/10914THREAD_VALUE/"
safe_remove "${TEMPLATE_DIR}/docs/specs/11409THREAD_VALUE" "specs/11409THREAD_VALUE/"
safe_remove "${TEMPLATE_DIR}/docs/specs/9336THREAD" "specs/9336THREAD/"
safe_remove "${TEMPLATE_DIR}/docs/specs/THREAD=test-feature-final" "specs/THREAD=test-feature-final/"
safe_remove "${TEMPLATE_DIR}/docs/specs/THREAD=test-feature-fixed" "specs/THREAD=test-feature-fixed/"
safe_remove "${TEMPLATE_DIR}/docs/specs/test-feature-direct" "specs/test-feature-direct/"

# Replace pre-generated spec files with minimal starters
info ""
info "=== Replacing spec files with minimal starters ==="

replace_spec_file() {
  local old_file="$1"
  local new_file="$2"
  local description="$3"

  if [[ -f "${new_file}" ]]; then
    if [[ -f "${old_file}" ]]; then
      info "Replacing: ${description}"
      mv "${new_file}" "${old_file}"
      REMOVED_COUNT=$((REMOVED_COUNT + 1))
    else
      info "Creating new: ${description}"
      mv "${new_file}" "${old_file}"
      REMOVED_COUNT=$((REMOVED_COUNT + 1))
    fi
  else
    warn "New file not found: ${new_file}"
  fi
}

replace_spec_file "${TEMPLATE_DIR}/docs/dev_adr.md.j2" \
  "${TEMPLATE_DIR}/docs/dev_adr.md.j2.new" \
  "dev_adr.md.j2 (minimal starter)"

replace_spec_file "${TEMPLATE_DIR}/docs/dev_prd.md.j2" \
  "${TEMPLATE_DIR}/docs/dev_prd.md.j2.new" \
  "dev_prd.md.j2 (minimal starter)"

replace_spec_file "${TEMPLATE_DIR}/docs/dev_sds.md.j2" \
  "${TEMPLATE_DIR}/docs/dev_sds.md.j2.new" \
  "dev_sds.md.j2 (minimal starter)"

replace_spec_file "${TEMPLATE_DIR}/docs/dev_technical-specifications.md.j2" \
  "${TEMPLATE_DIR}/docs/dev_technical-specifications.md.j2.new" \
  "dev_technical-specifications.md.j2 (minimal starter)"

replace_spec_file "${TEMPLATE_DIR}/docs/spec_index.md.j2" \
  "${TEMPLATE_DIR}/docs/spec_index.md.j2.new" \
  "spec_index.md.j2 (minimal starter)"

replace_spec_file "${TEMPLATE_DIR}/docs/traceability_matrix.md.j2" \
  "${TEMPLATE_DIR}/docs/traceability_matrix.md.j2.new" \
  "traceability_matrix.md.j2 (minimal starter)"

# Remove non-.j2 spec_index.md if it exists (shouldn't be in template)
info ""
info "=== Removing non-template files ==="
safe_remove "${TEMPLATE_DIR}/docs/spec_index.md" "spec_index.md (non-template version)"
safe_remove "${TEMPLATE_DIR}/docs/traceability_matrix.md" "traceability_matrix.md (non-template version)"
safe_remove "${TEMPLATE_DIR}/docs/commit_message_guidelines.md" "commit_message_guidelines.md (non-template version)"

# Clean up any leftover .new files if they weren't moved
info ""
info "=== Cleaning up temporary files ==="
find "${TEMPLATE_DIR}/docs" -name "*.md.j2.new" -delete 2>/dev/null || true

# Summary
info ""
info "==================================================="
info "Template cleanup complete!"
info "Total items processed: ${REMOVED_COUNT}"
info "==================================================="
info ""
info "Next steps:"
info "1. Review changes in template directory"
info "2. Test template generation: pnpm generate"
info "3. Commit changes with appropriate message"
info ""
info "Template directory: ${TEMPLATE_DIR}"

exit 0
