/* eslint-env es2020 */
/* Generate/update docs/traceability_matrix.md by scanning docs for Spec IDs.
Implements: PRD-002/PRD-007; SDS-003 */
const fs = require("node:fs");
const path = require("node:path");
const { extractIdsFromFile, validateIdFormat } = require("./ids");
const {
  extractFrontmatter,
  extractIdsFromFrontmatter,
} = require("../utils/frontmatter");

// extractIdsFromFrontmatter and extractFrontmatter are provided by ../utils/frontmatter

function gatherMarkdownFiles(root) {
  const out = [];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      out.push(...gatherMarkdownFiles(p));
    } else if (e.isFile() && e.name.endsWith(".md")) {
      out.push(p);
    }
  }
  return out;
}

function addSpecIdToMatrix(rows, specId, filePath, rootDir) {
  if (!validateIdFormat(specId.id)) return;

  const row = rows.get(specId.id) || {
    artifacts: new Set(),
    status: "referenced",
    notes: "",
  };
  row.artifacts.add(path.relative(rootDir, specId.source || filePath));
  rows.set(specId.id, row);
}

function buildMatrix(rootDir) {
  const files = gatherMarkdownFiles(path.join(rootDir, "docs"));
  const rows = new Map();

  for (const f of files) {
    const contentIds = extractIdsFromFile(f);
    for (const specId of contentIds) {
      addSpecIdToMatrix(rows, specId, f, rootDir);
    }

    // Use shared frontmatter extractor (includes matrix_ids parsing)
    const frontmatterIds = extractIdsFromFrontmatter(f);
    for (const specId of frontmatterIds) {
      addSpecIdToMatrix(rows, specId, f, rootDir);
    }
  }

  const sorted = [...rows.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return sorted.map(([id, row]) => ({
    id,
    artifacts: [...row.artifacts].sort(),
    status: row.status,
    notes: row.notes,
  }));
}

function renderMatrixTable(rows) {
  const header = "| Spec ID | Artifacts | Status | Notes |\n|---|---|---|---|";
  const lines = rows.map(
    (r) =>
      `| ${r.id} | ${r.artifacts.join("<br>")} | ${r.status} | ${r.notes} |`,
  );
  return [header, ...lines].join("\n");
}

function updateMatrixFile(rootDir) {
  const rows = buildMatrix(rootDir);
  const table = renderMatrixTable(rows);
  const file = path.join(rootDir, "docs", "traceability_matrix.md");
  const banner =
    "# Traceability Matrix\n\nNote: This file is generated/updated by tools/spec/matrix.js. Do not edit manually.\n\n";
  const content = banner + table + "\n";
  fs.writeFileSync(file, content, "utf8");
  return { file, count: rows.length };
}

if (require.main === module) {
  const root = process.cwd();
  const result = updateMatrixFile(root);
  console.log(`[matrix] Updated ${result.file} with ${result.count} row(s).`);
}

module.exports = {
  buildMatrix,
  renderMatrixTable,
  updateMatrixFile,
  extractFrontmatter,
  extractIdsFromFrontmatter,
};
