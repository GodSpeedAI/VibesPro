/* Simple snapshot helper.
Usage: writeSnapshot(name, content); compareSnapshot(name, content) → boolean */
import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.join(process.cwd(), 'tests', 'snapshots');
const SNAP_SUFFIX = '.snapshot.json';

function snapPath(name: string) {
    return path.join(SNAP_DIR, `${name}${SNAP_SUFFIX}`);
}

export function writeSnapshot(name: string, content: string): void {
    fs.mkdirSync(SNAP_DIR, { recursive: true });
    const normalized = content.endsWith('\n') ? content : content + '\n';
    fs.writeFileSync(snapPath(name), normalized, 'utf8');
}

export function compareSnapshot(name: string, content: string): boolean {
    const p = snapPath(name);
    if (!fs.existsSync(p)) return false;
    const existing = fs.readFileSync(p, 'utf8');
    return existing.trimEnd() === content.trimEnd();
}

export function getSnapshotPath(name: string): string {
    return snapPath(name);
}
