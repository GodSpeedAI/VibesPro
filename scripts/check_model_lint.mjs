import fs from 'node:fs';
import path from 'node:path';

function loadModels(modelsPath) {
    if (!fs.existsSync(modelsPath)) {
        console.error(`models.yaml not found at ${modelsPath}`);
        return {};
    }

    const content = fs.readFileSync(modelsPath, 'utf8');
    const lines = content.split(/\r?\n/);
    let inDefaults = false;
    const models = {};
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        if (trimmed === 'defaults:') { inDefaults = true; continue; }
        if (inDefaults && (line.startsWith(' ') || line.startsWith('\t'))) {
            // process
        } else if (inDefaults && !line.startsWith(' ') && !line.startsWith('\t')) {
            inDefaults = false;
        }
        if (!inDefaults) continue;
        const m = line.match(/^(\s*)([A-Za-z0-9_\-]+)\s*:\s*(.+)$/);
        if (m) {
            const indent = m[1];
            const key = m[2];
            let val = m[3].trim();
            if (indent === '  ' && key.endsWith('_model')) {
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                models[val] = true;
            }
        }
    }
    return models;
}

function extractModelFromFile(filePath) {
    const txt = fs.readFileSync(filePath, 'utf8');
    const m = txt.match(/^---\n([\s\S]*?)\n---/m);
    if (!m) return null;
    const raw = m[1];
    for (const line of raw.split(/\r?\n/)) {
        const mm = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.+)$/);
        if (!mm) continue;
        const k = mm[1].trim();
        let v = mm[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (k === 'model') return v;
    }
    return null;
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: node scripts/check_model_lint.mjs <file>');
    process.exit(2);
}

const file = args[0];
const repoRoot = path.resolve('.');
const modelsPath = path.join(repoRoot, '.github', 'models.yaml');
const models = loadModels(modelsPath);
const modelInFile = extractModelFromFile(file);

console.log('Models loaded from .github/models.yaml:', Object.keys(models));
console.log(`Model in ${file}:`, modelInFile);

if (!modelInFile) {
    console.error('No model field found in frontmatter.');
    process.exit(1);
}

if (!models[modelInFile]) {
    console.error(`Model "${modelInFile}" not found in ${modelsPath}`);
    process.exit(1);
}

console.log('Model is valid.');
process.exit(0);
