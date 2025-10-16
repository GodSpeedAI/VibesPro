#!/usr/bin/env node
/**
 * Prompt plan preview tool - analyzes prompts and shows execution plan
 */

const fs = require('fs');
const path = require('path');

function analyzePrompt(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        // Extract frontmatter
        const frontmatterStart = lines.findIndex(line => line.trim() === '---');
        const frontmatterEnd = lines.findIndex((line, index) => index > frontmatterStart && line.trim() === '---');

        if (frontmatterStart === -1 || frontmatterEnd === -1) {
            console.error(`No frontmatter found in ${filePath}`);
            return;
        }

        const frontmatter = lines.slice(frontmatterStart + 1, frontmatterEnd).join('\n');

        // Simple analysis
        console.log(`\n📝 Prompt Analysis: ${path.basename(filePath)}`);
        console.log(`━`.repeat(50));

        // Count tokens (rough estimate)
        const tokenCount = Math.ceil(content.length / 4);
        console.log(`📊 Token count: ~${tokenCount} tokens`);

        // Check for common patterns
        const hasSteps = content.includes('Step') || content.includes('1.') || content.includes('-');
        const hasExamples = content.includes('Example') || content.includes('```');
        const hasConstraints = content.includes('constraint') || content.includes('limit') || content.includes('avoid');

        console.log(`🔍 Contains steps: ${hasSteps ? '✅' : '❌'}`);
        console.log(`🔍 Contains examples: ${hasExamples ? '✅' : '❌'}`);
        console.log(`🔍 Contains constraints: ${hasConstraints ? '✅' : '❌'}`);

        // Show frontmatter
        console.log(`\n📋 Frontmatter:`);
        console.log(frontmatter);

    } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error.message);
        process.exit(1);
    }
}

function main() {
    const args = process.argv.slice(2);
    const isAccurate = process.env.PROMPT_TOKENIZER === 'accurate';

    if (args.length === 0) {
        console.error('Usage: node plan_preview.js <prompt-file> [--accurate]');
        process.exit(1);
    }

    const filePath = args[0];

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    if (isAccurate) {
        console.log('🔬 Using accurate token counting...');
        // In a real implementation, you would use a proper tokenizer here
        console.log('(Note: Accurate counting would require tiktoken or similar)');
    }

    analyzePrompt(filePath);
}

if (require.main === module) {
    main();
}

module.exports = { analyzePrompt };
