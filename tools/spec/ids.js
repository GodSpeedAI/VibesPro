/* Spec ID utilities: extract and validate product and developer spec IDs.
Implements: PRD-001/PRD-002; DEV-SPEC-003 */
const fs = require('node:fs');

function extractIdsFromText(text, source) {
    const found = [];
    const product = /(PRD|ADR|SDS|TS|TASK)-(\d{1,4})/g;
    const dev = /DEV-(PRD|ADR|SDS|TS|TASK)-(\d{1,4})/g;
    for (const m of text.matchAll(product)) {
        const id = `${m[1]}-${m[2]}`;
        const type = m[1];
        found.push({ id, type, source });
    }
    for (const m of text.matchAll(dev)) {
        const id = `DEV-${m[1]}-${m[2]}`;
        const type = `DEV-${m[1]}`;
        found.push({ id, type, source });
    }
    const uniq = new Map();
    for (const s of found) uniq.set(`${s.id}::${s.source}`, s);
    return [...uniq.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function extractIdsFromFile(path) {
    if (!fs.existsSync(path)) return [];
    const text = fs.readFileSync(path, 'utf8');
    return extractIdsFromText(text, path);
}

function validateIdFormat(id) {
    return /^(?:DEV-)?(?:PRD|ADR|SDS|TS|TASK)-\d{1,4}$/.test(id);
}

module.exports = { extractIdsFromText, extractIdsFromFile, validateIdFormat };
