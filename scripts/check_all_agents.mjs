import fs from 'node:fs';
import path from 'node:path';

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadModels(modelsPath) {
  const content = fs.readFileSync(modelsPath, 'utf8');
  const lines = content.split(/\r?\n/);
  let inDefaults = false;
  const models = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (trimmed === 'defaults:') {
      inDefaults = true;
      continue;
    }
    if (inDefaults && (line.startsWith(' ') || line.startsWith('\t'))) {
      // ok
    } else if (inDefaults && !line.startsWith(' ') && !line.startsWith('\t')) {
      inDefaults = false;
    }
    if (!inDefaults) continue;
    const m = line.match(/^([\s]*)([A-Za-z0-9_\-]+)\s*:\s*(.+)$/);
    if (m) {
      const indent = m[1];
      const key = m[2];
      let val = stripQuotes(m[3]);
      if (!val) continue;
      if (indent === '  ') {
        if (models[val] === undefined) {
          models[val] = true;
        }
        if (models[key] === undefined) {
          models[key] = val;
        }
        if (key.endsWith('_model')) {
          const alias = key.replace(/_model$/, '');
          if (alias && models[alias] === undefined) {
            models[alias] = val;
          }
        }
        if (key === 'default_model' || key === 'default') {
          models.default = val;
          models['default_model'] = val;
        }
      }
    }
  }
  return models;
}

function extractModelFromFile(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8');
  // Detect fenced frontmatter like ```\n---\n...\n---\n```
  const fencedRe = /^\s*```[^\n]*\n\s*---\n([\s\S]*?)\n---\n\s*```/m;
  const rawRe = /^\s*---\n([\s\S]*?)\n---/m;
  let m = fencedRe.exec(txt);
  if (m) {
    // Return object indicating fenced frontmatter detected
    return { raw: m[1], fenced: true };
  }
  m = rawRe.exec(txt);
  if (!m) return null;
  return { raw: m[1], fenced: false };
}

const repoRoot = path.resolve('.');
const modelsPath = path.join(repoRoot, '.github', 'models.yaml');
const models = loadModels(modelsPath);
console.log('Loaded models:', Object.keys(models));

const agentsDir = path.join(repoRoot, '.github', 'agents');

// Check if agents directory exists (migrated from chatmodes)
if (!fs.existsSync(agentsDir)) {
  console.error(
    '[FAIL] .github/agents directory not found. Expected after migration from chatmodes.',
  );
  process.exit(1);
}

const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.agent.md'));

if (files.length === 0) {
  console.log('[INFO] No .agent.md files found in .github/agents directory');
  process.exit(0);
}

let failed = false;
for (const f of files) {
  const fp = path.join(agentsDir, f);
  const parsed = extractModelFromFile(fp);
  if (!parsed) {
    console.error(`[FAIL] ${fp}: no frontmatter detected`);
    failed = true;
    continue;
  }
  if (parsed.fenced) {
    console.error(
      `[FAIL] ${fp}: frontmatter is wrapped in code fences (remove the surrounding \`\`\` block)`,
    );
    failed = true;
    continue;
  }

  const raw = parsed.raw;
  const fmLines = raw.split(/\r?\n/);
  let model = null;
  let hasName = false;
  let hasTools = false;
  for (const line of fmLines) {
    const mm = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.+)$/);
    if (!mm) continue;
    const k = mm[1].trim();
    let v = mm[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (k === 'model') model = v;
    if (k === 'name') hasName = true;
    if (k === 'tools') hasTools = true;
  }

  if (!model) {
    console.error(`[FAIL] ${fp}: no model field in frontmatter`);
    failed = true;
    continue;
  }

  if (!hasName) {
    console.error(`[FAIL] ${fp}: frontmatter missing required key 'name'`);
    failed = true;
    continue;
  }
  if (!hasTools) {
    console.error(`[FAIL] ${fp}: frontmatter missing required key 'tools'`);
    failed = true;
    continue;
  }

  let resolvedModel = model;
  // detect template placeholders like ${ default_model } or ${some_key}
  const tplRe = /^\$\{\s*([A-Za-z0-9_\-]+)\s*\}$/;
  const tplMatch = tplRe.exec(model);
  if (tplMatch) {
    const placeholderKey = tplMatch[1];
    // Try resolving the placeholder by looking up mapping in models
    let mapped = models[placeholderKey];
    // provide fallback aliases for common default keys
    if (!mapped && placeholderKey === 'default')
      mapped = models.default || models['default'] || models.default_model;
    if (!mapped && placeholderKey === 'default_model')
      mapped = models.default || models['default'] || models.default_model;
    if (typeof mapped === 'string') {
      resolvedModel = mapped;
      console.log(`[INFO] ${fp}: resolved template placeholder "${model}" -> "${resolvedModel}"`);
    } else {
      console.error(
        `[FAIL] ${fp}: template placeholder "${model}" present but no mapping for "${placeholderKey}" found in .github/models.yaml`,
      );
      failed = true;
      continue;
    }
  }

  if (!tplMatch && typeof models[model] === 'string') {
    const mapped = models[model];
    console.log(`[INFO] ${fp}: resolved model alias "${model}" -> "${mapped}"`);
    resolvedModel = mapped;
  }

  if (!models[resolvedModel]) {
    console.error(`[FAIL] ${fp}: Model "${resolvedModel}" not found in .github/models.yaml`);
    failed = true;
  } else {
    console.log(`[PASS] ${fp}: ${resolvedModel}`);
  }
}
process.exit(failed ? 1 : 0);
