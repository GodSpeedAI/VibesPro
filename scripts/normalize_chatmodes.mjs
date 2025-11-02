#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();

async function walk(dir, list = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(p, list);
    } else if (e.isFile() && p.endsWith('.chatmode.md')) {
      list.push(p);
    }
  }
  return list;
}

function titleFromFilename(fn) {
  const base = path.basename(fn, '.chatmode.md');
  const parts = base.split(/[._-]/).filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function defaultToolsForFilename(fn) {
  const lower = fn.toLowerCase();
  if (lower.includes('debug')) return ['codebase', 'search', 'runInTerminal', 'runTests'];
  if (lower.includes('tdd')) return ['codebase', 'search', 'runTests'];
  if (lower.includes('spec') || lower.includes('specs')) return ['codebase', 'search'];
  if (lower.includes('persona') || lower.includes('product')) return ['codebase', 'search'];
  return ['codebase', 'search'];
}

function joinToolsArray(arr) {
  // return YAML array inline
  return '[' + arr.map((s) => `"${s}"`).join(', ') + ']';
}

async function processFile(file) {
  let changed = false;
  const text = await fs.readFile(file, 'utf8');

  // Try to find first frontmatter block (--- ... ---), even if wrapped in code fences
  const firstDash = text.indexOf('---');
  if (firstDash === -1 || firstDash > 200) {
    // no obvious frontmatter near top; skip
    return { file, changed: false, reason: 'no-frontmatter' };
  }
  const secondDash = text.indexOf('---', firstDash + 3);
  if (secondDash === -1) return { file, changed: false, reason: 'no-closing-frontmatter' };

  // Extract frontmatter raw content between dashes
  const fmStart = firstDash + 3;
  const fmContent = text.slice(fmStart, secondDash).trim();

  // Determine the rest of the document after the frontmatter closing markers and any trailing fences
  // Determine the rest of the document after the frontmatter closing markers and strip any leading code-fence
  // that may wrap the content.
  // (we don't need to keep an intermediate variable)

  // Normalize frontmatter block
  let fmLines = fmContent.split(/\r?\n/).map((l) => l.replace(/\r?\n$/, ''));

  // Check presence
  const hasName = fmLines.some((l) => /^name\s*:/.test(l));
  const hasTools = fmLines.some((l) => /^tools\s*:/.test(l));

  if (!hasName) {
    const name = titleFromFilename(file);
    // Prefer to insert after model if present, otherwise after task/domain, otherwise top
    let insertIndex = fmLines.findIndex((l) => /^model\s*:/.test(l));
    if (insertIndex === -1) insertIndex = fmLines.findIndex((l) => /^task\s*:/.test(l));
    if (insertIndex === -1) insertIndex = fmLines.findIndex((l) => /^domain\s*:/.test(l));
    const entry = `name: "${name}"`;
    if (insertIndex === -1) {
      fmLines.unshift(entry);
    } else {
      fmLines.splice(insertIndex + 1, 0, entry);
    }
    changed = true;
  }

  if (!hasTools) {
    const tools = defaultToolsForFilename(file);
    // Insert tools after name if present, otherwise after model/task/domain
    let insertIndex = fmLines.findIndex((l) => /^name\s*:/.test(l));
    if (insertIndex === -1) insertIndex = fmLines.findIndex((l) => /^model\s*:/.test(l));
    if (insertIndex === -1) insertIndex = fmLines.findIndex((l) => /^task\s*:/.test(l));
    const entry = `tools: ${joinToolsArray(tools)}`;
    if (insertIndex === -1) {
      // place before the end so description stays last
      fmLines.push(entry);
    } else {
      fmLines.splice(insertIndex + 1, 0, entry);
    }
    changed = true;
  }

  // Rebuild normalized frontmatter
  const normalized = ['---', ...fmLines, '---'].join('\n') + '\n\n';

  // If original had fences around the frontmatter, remove them by replacing the original slice
  // Reconstruct new content
  const secondDashEnd = secondDash + 3;
  // Skip any following fence markers that immediately followed the closing dashes
  let trailing = text.slice(secondDashEnd);
  trailing = trailing.replace(/^\s*```[a-zA-Z0-9_-]*\n?/, '');

  const newContent = normalized + trailing.trimStart();

  if (changed) {
    await fs.writeFile(file, newContent, 'utf8');
    return { file, changed: true };
  }
  return { file, changed: false };
}

async function main() {
  console.log('Scanning for .chatmode.md files...');
  const all = await walk(ROOT);
  if (all.length === 0) {
    console.log('No .chatmode.md files found.');
    return;
  }

  let modified = [];
  let skipped = [];
  for (const f of all) {
    try {
      const r = await processFile(f);
      if (r.changed) modified.push(f);
      else skipped.push({ f, reason: r.reason || 'unchanged' });
    } catch (err) {
      console.error('ERROR processing', f, err);
    }
  }

  console.log('\nSummary:');
  console.log('Total chatmodes found:', all.length);
  console.log('Modified:', modified.length);
  if (modified.length) modified.forEach((m) => console.log('  +', path.relative(ROOT, m)));
  console.log('Unchanged/Skipped:', skipped.length);
  if (skipped.length && skipped.length < 50)
    skipped.forEach((s) => console.log('  -', path.relative(ROOT, s.f), s.reason));
}

main().catch((err) => {
  console.error('Fatal error', err);
  process.exit(2);
});
