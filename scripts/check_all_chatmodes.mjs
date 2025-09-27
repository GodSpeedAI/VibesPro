import fs from 'node:fs';
import path from 'node:path';

function loadModels(modelsPath) {
    const content = fs.readFileSync(modelsPath, 'utf8');
    const lines = content.split(/\r?\n/);
    let inDefaults = false;
    const models = {};
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        if (trimmed === 'defaults:') { inDefaults = true; continue; }
        if (inDefaults && (line.startsWith(' ') || line.startsWith('\t'))) {
            // ok
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
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
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

const repoRoot = path.resolve('.');
const modelsPath = path.join(repoRoot, '.github', 'models.yaml');
const models = loadModels(modelsPath);
console.log('Loaded models:', Object.keys(models));

const chatDir = path.join(repoRoot, '.github', 'chatmodes');
const files = fs.readdirSync(chatDir).filter(f => f.endsWith('.chatmode.md'));
let failed = false;
for (const f of files) {
    const fp = path.join(chatDir, f);
    const model = extractModelFromFile(fp);
    if (!model) {
        console.error(`[FAIL] ${fp}: no model field`);
        failed = true;
        continue;
    }
    if (!models[model]) {
        console.error(`[FAIL] ${fp}: Model "${model}" not found in .github/models.yaml`);
        failed = true;
    } else {
        console.log(`[PASS] ${fp}: ${model}`);
    }
}
process.exit(failed ? 1 : 0);
