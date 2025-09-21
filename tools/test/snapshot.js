/* Simple snapshot helper.
Usage: writeSnapshot(name, content); compareSnapshot(name, content) → boolean */
const fs = require('node:fs');
const path = require('node:path');

const SNAP_DIR = path.join(process.cwd(), 'tests', 'snapshots');

function snapPath(name) { return path.join(SNAP_DIR, name + '.snap'); }

function writeSnapshot(name, content) {
    fs.mkdirSync(SNAP_DIR, { recursive: true });
    fs.writeFileSync(snapPath(name), content, 'utf8');
}

function compareSnapshot(name, content) {
    const p = snapPath(name);
    if (!fs.existsSync(p)) return false;
    const existing = fs.readFileSync(p, 'utf8');
    return existing === content;
}

module.exports = { writeSnapshot, compareSnapshot };
