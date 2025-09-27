/* Frontmatter parsing utilities (shared)
 * Provide extractFrontmatter and related helpers so other tools can reuse parsing logic.
 */
const fs = require('node:fs');

function stripQuotes(value) {
  if (!value || typeof value !== 'string') return value;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function parseFrontmatterArray(line, fields) {
  const arrayMatch = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*\[([^\]]*)\]/);
  if (arrayMatch) {
    const key = arrayMatch[1].trim();
    const val = arrayMatch[2].trim();
    if (key === 'matrix_ids' && val) {
      fields[key] = val
        .split(',')
        .map(item => item.trim().replace(/[\'"]+/g, ''))
        .filter(item => item);
    }
    return true;
  }
  return false;
}

function parseFrontmatterSimple(line, fields) {
  const simpleMatch = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.+)$/);
  if (simpleMatch) {
    const key = simpleMatch[1].trim();
    let val = simpleMatch[2].trim();

    val = val.replace(/^['"]|['"]$/g, '');

    if (key && key.length > 0 && val !== undefined) {
      fields[key] = val;
    }
  }
}

function extractFrontmatter(text) {
  if (!text || typeof text !== 'string') {
    return { raw: null, fields: {} };
  }

  const m = text.match(/^---\n([\s\S]*?)\n---/m);
  if (!m) return { raw: null, fields: {} };

  const raw = m[1];
  const fields = {};

  if (!raw || raw.trim().length === 0) {
    return { raw, fields: {} };
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    if (parseFrontmatterArray(line, fields)) continue;
    parseFrontmatterSimple(line, fields);
  }
  return { raw, fields };
}

function extractIdsFromFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const text = fs.readFileSync(filePath, 'utf8');
  const { fields } = extractFrontmatter(text);
  const ids = [];

  if (fields.matrix_ids && Array.isArray(fields.matrix_ids)) {
    for (const id of fields.matrix_ids) {
      ids.push({ id, type: id.split('-')[0], source: filePath });
    }
  }

  return ids;
}

module.exports = { extractFrontmatter, parseFrontmatterArray, parseFrontmatterSimple, extractIdsFromFrontmatter, stripQuotes };
