/* Generate/update docs/traceability_matrix.md by scanning docs for Spec IDs.
Implements: PRD-002/PRD-007; SDS-003 */
const fs = require("node:fs");
const path = require("node:path");
const { extractIdsFromFile, validateIdFormat } = require("./ids");

// Extract frontmatter from markdown text
function extractFrontmatter(text) {
  if (!text || typeof text !== "string") {
    return { raw: null, fields: {} };
  }

  const m = text.match(/^---\n([\s\S]*?)\n---/m);
  if (!m) return { raw: null, fields: {} };

  const raw = m[1];
  const fields = {};

  // Skip empty frontmatter
  if (!raw || raw.trim().length === 0) {
    return { raw, fields: {} };
  }

  // Parse simple YAML frontmatter
  for (const line of raw.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    // Handle array format: matrix_ids: [PRD-101, SDS-201]
    if (parseFrontmatterArray(line, fields)) continue;

    // Handle simple key: value format
    parseFrontmatterSimple(line, fields);
  }
  return { raw, fields };
}

// Helper function to parse array format frontmatter
function parseFrontmatterArray(line, fields) {
  const arrayMatch = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*\[([^\]]*)\]/);
  if (arrayMatch) {
    const key = arrayMatch[1].trim();
    const val = arrayMatch[2].trim();
    if (key === "matrix_ids" && val) {
      // Parse array values, removing quotes and whitespace
      fields[key] = val
        .split(",")
        .map((item) => item.trim().replace(/['"]/g, ""))
        .filter((item) => item);
    }
    return true;
  }
  return false;
}

// Helper function to parse simple key: value format frontmatter
function parseFrontmatterSimple(line, fields) {
  const simpleMatch = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.+)$/);
  if (simpleMatch) {
    const key = simpleMatch[1].trim();
    let val = simpleMatch[2].trim();

    // Strip quotes if present
    val = val.replace(/^['"]|['"]$/g, "");

    if (key && key.length > 0 && val !== undefined) {
      fields[key] = val;
    }
  }
}

// Extract IDs from frontmatter matrix_ids field
function extractIdsFromFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const text = fs.readFileSync(filePath, "utf8");
  const { fields } = extractFrontmatter(text);
  const ids = [];

  if (fields.matrix_ids && Array.isArray(fields.matrix_ids)) {
    for (const id of fields.matrix_ids) {
      if (validateIdFormat(id)) {
        ids.push({ id, type: id.split("-")[0], source: filePath });
      }
    }
  }

  return ids;
}

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

// Add spec ID to matrix row
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
  const rows = new Map(); // id -> { artifacts: Set, status, notes }

  for (const f of files) {
    // Extract IDs from content (existing functionality)
    const contentIds = extractIdsFromFile(f);
    for (const specId of contentIds) {
      addSpecIdToMatrix(rows, specId, f, rootDir);
    }

    // Extract IDs from frontmatter matrix_ids
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
  const header = ["Spec ID", "Artifacts", "Status", "Notes"];
  const dataRows = rows.map((r) => [
    r.id,
    r.artifacts.join("<br>"),
    r.status ?? "",
    r.notes ?? "",
  ]);

  const widths = header.map((colHeader, idx) =>
    Math.max(
      colHeader.length,
      ...dataRows.map((row) => (row[idx] ?? "").length),
    ),
  );

  const formatRow = (cells) =>
    `| ${cells
      .map((cell, idx) => (cell ?? "").padEnd(widths[idx], " "))
      .join(" | ")} |`;

  const separator = `| ${widths.map((w) => "-".repeat(w)).join(" | ")} |`;
  const formattedRows = dataRows.map(formatRow);

  return [formatRow(header), separator, ...formattedRows].join("\n");
}

function updateMatrixFile(rootDir) {
  const rows = buildMatrix(rootDir);
  const table = renderMatrixTable(rows);
  const file = path.join(rootDir, "docs", "traceability_matrix.md");
  const banner =
    "# Traceability Matrix\n\nNote: This file is generated/updated by tools/spec/matrix.js. Do not edit manually.\n\n";
  const content = banner + table + "\n";
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;

  if (existing !== content) {
    fs.writeFileSync(file, content, "utf8");
  }

  return { file, count: rows.length, changed: existing !== content };
}

if (require.main === module) {
  const root = process.cwd();
  const result = updateMatrixFile(root);
  const status = result.changed ? "Updated" : "Up-to-date";
  console.log(`[matrix] ${status} ${result.file} with ${result.count} row(s).`);
}

module.exports = {
  buildMatrix,
  renderMatrixTable,
  updateMatrixFile,
  extractFrontmatter,
  extractIdsFromFrontmatter,
};
