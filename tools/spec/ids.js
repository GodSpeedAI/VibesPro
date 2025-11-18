/* Spec ID utilities: extract and validate product and developer spec IDs.
Implements: PRD-001/PRD-002; DEV-SPEC-003 */
const fs = require('node:fs');

function extractIdsFromText(text, source) {
  const found = [];
  const lines = text.split('\n');

  // Only extract IDs from markdown headers (## DEV-PRD-001 — Title format)
  const headerRegex = /^##\s+((?:DEV-)?(?:PRD|ADR|SDS|TS|TASK|SPEC)-\d{1,4})\s*[—:-]/;

  for (const line of lines) {
    const match = line.match(headerRegex);
    if (match) {
      const id = match[1];
      const type = id.includes('DEV-') ? id.split('-')[1] : id.split('-')[0];
      found.push({ id, type, source });
    }
  }

  const uniq = new Map();
  for (const s of found) uniq.set(`${s.id}::${s.source}`, s);
  return [...uniq.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/* Spec ID function buildMatrix(rootDir) {
  const files = gatherMarkdownFiles(path.join(rootDir, 'docs/specs'));
  const rows = new Map(); // id -> { artifacts: Set, status, notes }
  const idSourceMap = new Map(); // id -> filePath (for uniqueness check)

  for (const f of files) {
    // Extract IDs from content (existing functionality)
    const contentIds = extractIdsFromFile(f);
    for (const specId of contentIds) {
      // Uniqueness check: Ensure ID appears in only one file
      if (idSourceMap.has(specId.id)) {
        const existingFile = idSourceMap.get(specId.id);
        if (existingFile !== f) {
          throw new Error(`Duplicate Spec ID definition found: ${specId.id} in ${path.relative(rootDir, f)} and ${path.relative(rootDir, existingFile)}`);
        }
      }
      idSourceMap.set(specId.id, f);

      addSpecIdToMatrix(rows, specId, f, rootDir);
    }

    // Extract IDs from frontmatter matrix_ids
    const frontmatterIds = extractIdsFromFrontmatter(f);
    for (const specId of frontmatterIds) {
      addSpecIdToMatrix(rows, specId, f, rootDir);
    }
  }

  const sorted = [...rows.entries()].sort((a, b) => a[0].localeCompare(b[0]));
} */

function extractIdsFromFile(path) {
  if (!fs.existsSync(path)) return [];
  const text = fs.readFileSync(path, 'utf8');
  return extractIdsFromText(text, path);
}

function validateIdFormat(id) {
  return /^(?:DEV-)?(?:PRD|ADR|SDS|TS|TASK)-\d{1,4}$/.test(id);
}

module.exports = { extractIdsFromText, extractIdsFromFile, validateIdFormat };
