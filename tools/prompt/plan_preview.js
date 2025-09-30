/* Plan preview: concatenates a prompt file for token estimation (simple).
Implements: PRD-014/017; DEV-PRD-007/010 */
const fs = require('node:fs');
const { estimateTokens, evaluateAgainstBudget } = require('./budgets');

function planPreview(file, mode = 'default', opts = {}) {
    const content = fs.readFileSync(file, 'utf8');
    const tokens = estimateTokens(content, opts);
    const budget = evaluateAgainstBudget(tokens, mode);
    return { content, tokens, budget };
}

if (require.main === module) {
    const args = process.argv.slice(2);
    let file;
    let mode = 'default';
    let modeExplicit = false;
    let accurate = false;
    let encoding;

    for (const arg of args) {
        if (arg === '--accurate') {
            accurate = true;
            continue;
        }
        if (arg.startsWith('--encoding=')) {
            const [, value] = arg.split('=');
            encoding = value || undefined;
            continue;
        }
        if (!file) {
            file = arg;
            continue;
        }
        if (!modeExplicit && !arg.startsWith('--')) {
            mode = arg;
            modeExplicit = true;
            continue;
        }
    }

    if (!file) {
        console.error('Usage: plan_preview.js <prompt-file> [mode] [--accurate] [--encoding=<name>]');
        process.exit(2);
    }

    const res = planPreview(file, mode, { accurate, encoding });
    const envAccurate = (process.env.PROMPT_TOKENIZER || '') === 'accurate';
    const accTag = accurate || envAccurate ? 'accurate' : 'heuristic';
    console.log(`[prompt:plan] tokens=${res.tokens} budget=${res.budget.level} mode=${mode} tokenizer=${accTag}`);
    if (!res.budget.within) process.exit(1);
}

module.exports = { planPreview };
