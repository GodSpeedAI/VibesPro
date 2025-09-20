/* Token budget utilities with optional accurate tokenizer.
 - Default: heuristic by words (fast, offline)
 - Accurate: @dqbd/tiktoken when PROMPT_TOKENIZER=accurate or --accurate flag
 Implements: PRD-017; DEV-PRD-010 */
function estimateTokensByHeuristic(text) {
    const words = (text.trim().match(/\S+/g) || []).length;
    // crude heuristic: ~0.75 tokens per word for English prose
    return Math.round(words * 0.75);
}

const DEFAULT_BUDGETS = {
    default: { warn: 2000, hard: 3000 },
};

function evaluateAgainstBudget(tokens, mode = 'default', budgets = DEFAULT_BUDGETS) {
    const cfg = budgets[mode] || budgets.default;
    if (!cfg) return { within: true, level: 'none' };
    if (tokens >= cfg.hard) return { within: false, level: 'hard' };
    if (tokens >= cfg.warn) return { within: true, level: 'warn' };
    return { within: true, level: 'ok' };
}

function estimateTokensAccurate(text, encodingName) {
    try {
        // Lazy require to avoid hard dependency when not enabled
        const { encoding_for_model, get_encoding } = require('@dqbd/tiktoken');
        let enc;
        if (encodingName) {
            enc = get_encoding(encodingName);
        } else {
            // Default to o200k_base (GPT-5 family); fallback to cl100k_base
            try {
                enc = get_encoding('o200k_base');
            } catch {
                enc = get_encoding('cl100k_base');
            }
        }
        const tokens = enc.encode(text);
        const count = tokens.length;
        enc.free();
        return count;
    } catch (e) {
        // Fallback silently to heuristic if tokenizer not available
        return estimateTokensByHeuristic(text);
    }
}

function estimateTokens(text, opts = {}) {
    const flag = opts.flag || process.env.PROMPT_TOKENIZER || '';
    const encoding = opts.encoding || process.env.TOKENIZER_ENCODING;
    if (flag.toLowerCase() === 'accurate' || opts.accurate === true) {
        return estimateTokensAccurate(text, encoding);
    }
    return estimateTokensByHeuristic(text);
}

module.exports = {
    estimateTokensByHeuristic,
    estimateTokensAccurate,
    estimateTokens,
    evaluateAgainstBudget,
    DEFAULT_BUDGETS,
};
