/* Minimal local markdown link checker (no network). */
const fs = require('node:fs');
const path = require('node:path');

function listMarkdown(root) {
    const out = [];
    const entries = fs.readdirSync(root, { withFileTypes: true });
    for (const e of entries) {
        const p = path.join(root, e.name);
        if (e.isDirectory()) out.push(...listMarkdown(p));
        else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
    }
    return out;
}

function checkLinksInFile(file, root) {
    const text = fs.readFileSync(file, 'utf8');
    const rx = /\[[^\]]*\]\(([^)]+)\)/g; // markdown links
    const findings = [];
    for (const m of text.matchAll(rx)) {
        let target = m[1];
        if (target.startsWith('http://') || target.startsWith('https://')) continue; // skip external
        if (target.startsWith('#')) continue; // intra-file anchors
        target = target.split('#')[0]; // drop fragment
        const resolved = path.resolve(path.dirname(file), target);
        if (!fs.existsSync(resolved)) {
            findings.push({ file, target });
        }
    }
    return findings;
}

function main() {
    const root = process.cwd();
    const docs = path.join(root, 'docs');
    if (!fs.existsSync(docs)) return;
    const files = listMarkdown(docs);
    const all = [];
    for (const f of files) all.push(...checkLinksInFile(f, root));
    if (all.length) {
        console.error('[link-check] Broken links:');
        for (const f of all) console.error(` - ${path.relative(root, f.file)} -> ${f.target}`);
        process.exit(1);
    } else {
        console.log('[link-check] OK');
    }
}

if (require.main === module) main();

module.exports = { checkLinksInFile };
