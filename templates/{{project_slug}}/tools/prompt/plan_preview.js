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
    const file = args[0];
    const mode = args[1] && !args[1].startsWith('--') ? args[1] : 'default';
    const accurate = args.includes('--accurate');
    const encArg = args.find(a => a.startsWith('--encoding='));
    const encoding = encArg ? encArg.split('=')[1] : undefined;
    if (!file) {
        console.error('Usage: plan_preview.js <prompt-file> [mode] [--accurate] [--encoding=<name>]');
        process.exit(2);
    }
    const res = planPreview(file, mode, { accurate, encoding });
    const accTag = accurate || (process.env.PROMPT_TOKENIZER||'')==='accurate' ? 'accurate' : 'heuristic';
    console.log(`[prompt:plan] tokens=${res.tokens} budget=${res.budget.level} mode=${mode} tokenizer=${accTag}`);
    if (!res.budget.within) process.exit(1);
}

module.exports = { planPreview };
