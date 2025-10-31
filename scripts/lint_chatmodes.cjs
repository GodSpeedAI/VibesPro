const path = require('node:path');
const fs = require('node:fs');
const lint = require('../tools/prompt/lint');

const chatmodeDir = path.join(__dirname, '..', '.github', 'chatmodes');
const files = fs.readdirSync(chatmodeDir).filter((f) => f.endsWith('.chatmode.md'));
let failed = false;
for (const f of files) {
  const fp = path.join(chatmodeDir, f);
  const res = lint.lintPromptFile(fp);
  if (!res.ok) {
    console.error(`[FAIL] ${fp}:\n - ${res.findings.join('\n - ')}`);
    failed = true;
  } else {
    console.log(`[PASS] ${fp}`);
  }
}
process.exit(failed ? 1 : 0);
