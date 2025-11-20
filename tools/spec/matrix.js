/* Generate/update docs/specs/traceability_matrix.md by scanning docs/specs for Spec IDs.
Implements: PRD-002/PRD-007; SDS-003 */
const fs = require('node:fs');
const path = require('node:path');
const { extractIdsFromFile, validateIdFormat } = require('./ids');

// Extract frontmatter from markdown text
function extractFrontmatter(text) {
  if (!text || typeof text !== 'string') {
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
    if (!trimmedLine || trimmedLine.startsWith('#')) {
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
    if (key === 'matrix_ids' && val) {
      // Parse array values, removing quotes and whitespace
      fields[key] = val
        .split(',')
        .map((item) => item.trim().replace(/['"]/g, ''))
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
    val = val.replace(/^['"]|['"]$/g, '');

    if (key && key.length > 0 && val !== undefined) {
      fields[key] = val;
    }
  }
}

// Extract IDs from frontmatter matrix_ids field
function extractIdsFromFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const text = fs.readFileSync(filePath, 'utf8');
  const { fields } = extractFrontmatter(text);
  const ids = [];

  if (fields.matrix_ids && Array.isArray(fields.matrix_ids)) {
    for (const id of fields.matrix_ids) {
      if (validateIdFormat(id)) {
        ids.push({ id, type: id.split('-')[0], source: filePath });
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
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      out.push(...gatherMarkdownFiles(p));
    } else if (e.isFile() && e.name.endsWith('.md')) {
      out.push(p);
    }
  }
  return out;
}

// Add spec ID to matrix row
function addSpecIdToMatrix(rows, specId, filePath, rootDir, specsDir) {
  if (!validateIdFormat(specId.id)) return;

  const row = rows.get(specId.id) || {
    artifacts: new Set(),
    status: 'referenced',
    notes: '',
  };

  // Get the relative path from specs directory
  const relativePath = path.relative(specsDir, specId.source || filePath);
  row.artifacts.add(relativePath);
  rows.set(specId.id, row);
}

function buildMatrix(rootDir) {
  // Prefer `docs/specs` when present, but accept top-level `docs` as a fallback
  let specsDir = path.join(rootDir, 'docs/specs');
  if (!fs.existsSync(specsDir)) {
    const alt = path.join(rootDir, 'docs');
    if (fs.existsSync(alt)) specsDir = alt;
  }
  const files = gatherMarkdownFiles(specsDir);
  const rows = new Map(); // id -> { artifacts: Set, status, notes }
  const idSourceMap = new Map(); // id -> filePath (for uniqueness check)

  for (const f of files) {
    // Extract IDs from content (existing functionality)
    const contentIds = extractIdsFromFile(f);
    for (const specId of contentIds) {
      // Uniqueness check: Ensure ID is defined in only one spec file
      if (idSourceMap.has(specId.id) && idSourceMap.get(specId.id) !== f) {
        throw new Error(
          `Duplicate Spec ID definition found: ${specId.id} in ${path.relative(
            rootDir,
            f,
          )} and ${path.relative(rootDir, idSourceMap.get(specId.id))}`,
        );
      }
      idSourceMap.set(specId.id, f);

      addSpecIdToMatrix(rows, specId, f, rootDir, specsDir);
    }

    // Extract IDs from frontmatter matrix_ids
    const frontmatterIds = extractIdsFromFrontmatter(f);
    for (const specId of frontmatterIds) {
      addSpecIdToMatrix(rows, specId, f, rootDir, specsDir);
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

// Group specs by subdirectory for better organization
function groupBySubdirectory(rows) {
  const groups = new Map();

  for (const row of rows) {
    // Get the subdirectory from the first artifact
    const firstArtifact = row.artifacts[0] || '';
    const parts = firstArtifact.split(path.sep);
    const subdir = parts.length > 1 ? parts[0] : 'unsorted';

    if (!groups.has(subdir)) {
      groups.set(subdir, []);
    }
    groups.get(subdir).push(row);
  }

  // Sort groups alphabetically, but put 'unsorted' last
  const sortedGroups = [...groups.entries()].sort((a, b) => {
    if (a[0] === 'unsorted') return 1;
    if (b[0] === 'unsorted') return -1;
    return a[0].localeCompare(b[0]);
  });

  return sortedGroups;
}

function renderMatrixTable(rows) {
  const groupedSpecs = groupBySubdirectory(rows);
  const sections = [];

  for (const [subdir, groupRows] of groupedSpecs) {
    // Create section header
    const sectionTitle =
      subdir === 'unsorted'
        ? '📋 Unsorted Specifications'
        : `📁 ${subdir.charAt(0).toUpperCase() + subdir.slice(1)} Specifications`;

    sections.push(`\n## ${sectionTitle}\n`);

    // Create table for this section
    const header = ['Spec ID', 'Artifacts', 'Status', 'Notes'];
    const dataRows = groupRows.map((r) => [
      `\`${r.id}\``,
      r.artifacts.map((a) => `\`${a}\``).join('<br>'),
      r.status ?? '',
      r.notes ?? '',
    ]);

    const widths = header.map((colHeader, idx) =>
      Math.max(colHeader.length, ...dataRows.map((row) => (row[idx] ?? '').length)),
    );

    const formatRow = (cells) =>
      `| ${cells.map((cell, idx) => (cell ?? '').padEnd(widths[idx], ' ')).join(' | ')} |`;

    const separator = `| ${widths.map((w) => '-'.repeat(w)).join(' | ')} |`;
    const formattedRows = dataRows.map(formatRow);

    sections.push([formatRow(header), separator, ...formattedRows].join('\n'));
    sections.push(`\n**Total**: ${groupRows.length} specification(s)\n`);
  }

  return sections.join('\n');
}

function updateMatrixFile(rootDir) {
  const rows = buildMatrix(rootDir);
  const table = renderMatrixTable(rows);
  const file = path.join(rootDir, 'docs', 'specs', 'traceability_matrix.md');

  const banner = `# 🔍 Traceability Matrix

> **Note**: This file is auto-generated by \`tools/spec/matrix.js\`. Do not edit manually.
>
> **Last Updated**: ${new Date().toISOString().split('T')[0]}

This matrix tracks all specification IDs across the project, organized by subdirectory for easy navigation.

---
`;

  const summary = `
---

## 📊 Summary

- **Total Specifications**: ${rows.length}
- **Subdirectories**: ${
    new Set(
      rows.map((r) => {
        const firstArtifact = r.artifacts[0] || '';
        const parts = firstArtifact.split(path.sep);
        return parts.length > 1 ? parts[0] : 'unsorted';
      }),
    ).size
  }

`;

  const content = banner + table + summary;
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;

  if (existing !== content) {
    fs.writeFileSync(file, content, 'utf8');
  }

  return { file, count: rows.length, changed: existing !== content };
}

if (require.main === module) {
  const root = process.cwd();
  const result = updateMatrixFile(root);
  const status = result.changed ? 'Updated' : 'Up-to-date';
  console.log(`[matrix] ${status} ${result.file} with ${result.count} row(s).`);
}

module.exports = {
  buildMatrix,
  renderMatrixTable,
  updateMatrixFile,
  extractFrontmatter,
  extractIdsFromFrontmatter,
};
