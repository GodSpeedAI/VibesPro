/* CLI: Orchestrate lint → plan → run with metrics. Implements Phase 2 lifecycle. */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { lintPromptFile } = require('../prompt/lint');
const { planPreview } = require('../prompt/plan_preview');
const { appendTranscript } = require('../metrics/logger');

function runLifecycle(promptFile, opts = {}) {
    if (!fs.existsSync(promptFile)) {
        throw new Error(`Prompt not found: ${promptFile}`);
    }
    const mode = opts.mode || 'default';
    // Lint
    const lint = lintPromptFile(promptFile);
    if (!lint.ok) {
        const msg = `Lint failed for ${promptFile}:\n - ${lint.findings.join('\n - ')}`;
        throw new Error(msg);
    }
    // Plan/Budget
    const plan = planPreview(promptFile, mode);
    if (!plan.budget.within) {
        throw new Error(`Budget exceeded (${plan.tokens} tokens, level=${plan.budget.level})`);
    }
    // Run prompt script and measure latency
    const start = Date.now();
    const res = spawnSync('bash', ['-lc', `./scripts/run_prompt.sh "${promptFile}"`], {
        cwd: process.cwd(), stdio: 'inherit', env: process.env,
    });
    const ms = Date.now() - start;
    if (res.status !== 0) {
        throw new Error(`run_prompt.sh failed with exit ${res.status}`);
    }
    appendTranscript({ label: path.basename(promptFile), tokens: plan.tokens, latencyMs: ms, variant: mode });
    return { tokens: plan.tokens, latencyMs: ms };
}

if (require.main === module) {
    const file = process.argv[2];
    const mode = process.argv[3] || 'default';
    if (!file) {
        console.error('Usage: node tools/cli/prompt_lifecycle.js <prompt-file> [mode]');
        process.exit(2);
    }
    try {
        const out = runLifecycle(file, { mode });
        console.log(`[lifecycle] Done tokens=${out.tokens} latencyMs=${out.latencyMs}`);
    } catch (e) {
        console.error(`[lifecycle] ERROR: ${e.message}`);
        process.exit(1);
    }
}

module.exports = { runLifecycle };
