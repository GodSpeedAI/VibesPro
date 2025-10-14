#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
DB_PATH="${TMP_DIR}/temporal"  # sqlite path derived by repo
BASELINE_PATH="${TMP_DIR}/baselines.json"
export DB_PATH
export PYTHONPATH="${ROOT_DIR}:${PYTHONPATH:-}"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

if ! python -m temporal_db.python.export_recommendations --db "${DB_PATH}" --dry-run 2>&1; then
  echo "Warning: export_recommendations initialization failed" >&2
fi

# Seed the temporal DB using an embedded Python here-doc. Keep the block self-contained
# so shellcheck won't mis-parse it.
python - <<'PY'
import asyncio
import os
from datetime import UTC, datetime, timedelta

from temporal_db.python.repository import initialize_temporal_database
from temporal_db.python.types import ArchitecturalPattern, PatternType, SpecificationRecord, SpecificationType

async def seed(db_path: str) -> None:
    repo = await initialize_temporal_database(db_path)
    spec = SpecificationRecord.create(
        spec_type=SpecificationType.ADR,
        identifier="ADR-CLI-001",
        title="CLI Smoke",
        content="Smoke test for AI advice CLI",
        author="cli"
    )
    await repo.store_specification(spec)

    pattern = ArchitecturalPattern.create(
        pattern_name="Repository Pattern",
        pattern_type=PatternType.DOMAIN,
        pattern_definition={"summary": "Repository abstraction"}
    )
    pattern.context_similarity = 0.9
    pattern.success_rate = 0.82
    pattern.usage_frequency = 4
    pattern.last_used = datetime.now(UTC) - timedelta(days=1)
    await repo.store_architectural_pattern(pattern)

    for idx in range(2):
        await repo.record_decision(
            spec_id=f"ADR-CLI-001-{idx}",
            decision_point="persistence_strategy",
            selected_option="repository",
            context="Favour repository for persistence abstraction",
            author="cli",
            confidence=0.92
        )

    await repo.close()

asyncio.run(seed(os.environ["DB_PATH"]))
print("Seeding completed successfully", flush=True)
PY

cat >"${BASELINE_PATH}" <<'JSON'
{
  "baselines": {
    "context-loading": {
      "baseline": 10,
      "samples": 3,
      "lastObserved": 10
    }
  }
}
JSON

OUTPUT=$(cd "${ROOT_DIR}" && pnpm exec tsx tools/ai/advice-cli.ts --db "${DB_PATH}" --baseline "${BASELINE_PATH}" --dry-run --task "Plan repository layer")

if ! grep -q "Pattern Recommendations" <<<"${OUTPUT}"; then
  echo "Expected pattern recommendations section" >&2
  exit 1
fi

if ! grep -q "Performance Advisories" <<<"${OUTPUT}"; then
  echo "Expected performance advisories section" >&2
  exit 1
fi

if ! grep -q "Context Bundle for Task" <<<"${OUTPUT}"; then
  echo "Expected context bundle section" >&2
  exit 1
fi

# Show a short preview of the output for diagnostics
printf '%s\n' "${OUTPUT}" | head -n 20
