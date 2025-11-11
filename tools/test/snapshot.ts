/* Simple snapshot helper.
Usage: writeSnapshot(name, content); compareSnapshot(name, content) → boolean */
import fs from 'node:fs';
import path from 'node:path';

const SNAP_DIR = path.join(process.cwd(), 'tests', 'snapshots');
const SNAP_SUFFIX = '.snapshot.json';

function snapPath(name: string): string {
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

  // Try JSON-aware comparison first (robust to formatting differences)
  try {
    const ex = JSON.parse(existing);
    const now = JSON.parse(content);

    // Stable stringify with sorted keys for deterministic comparison
    const stable = (v: unknown): string => {
      if (v === null || typeof v !== 'object') return JSON.stringify(v);
      if (Array.isArray(v)) return `[${v.map((x) => stable(x)).join(',')}]`;
      const keys = Object.keys(v as object).sort();
      return `{${keys
        .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
        .join(',')}}`;
    };

    return stable(ex) === stable(now);
  } catch {
    // Fallback to plain string compare if not valid JSON
    return existing.trimEnd() === content.trimEnd();
  }
}

export function getSnapshotPath(name: string): string {
  return snapPath(name);
}
