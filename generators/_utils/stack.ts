import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Load resolved tech stack JSON produced by translator.py.
 * - Default path: project/tools/transformers/.derived/techstack.resolved.json
 * - Override via env: VIBEPDK_TECHSTACK_RESOLVED
 */
export function loadResolvedStack(root: string): unknown | null {
    const override = process.env.VIBEPDK_TECHSTACK_RESOLVED;
    const p = override || join(root, 'tools', 'transformers', '.derived', 'techstack.resolved.json');
    if (!existsSync(p)) return null;
    try {
        const txt = readFileSync(p, 'utf8');
        return JSON.parse(txt);
    } catch (_e) {
        return null;
    }
}

/**
 * Get category from tech stack configuration
 */
export function getCategory(stack: any, key: string): any | null {
    if (!stack || !stack.categories || !stack.categories[key]) {
        return null;
    }
    return stack.categories[key];
}

/**
 * Tech stack interface definition
 */
export interface TechStack {
    categories: Record<string, string>;
    frameworks: string[];
    languages: string[];
    tools: string[];
}
