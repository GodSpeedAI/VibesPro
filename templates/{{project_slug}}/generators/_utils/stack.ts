/**
 * Stack Configuration Utilities
 *
 * Provides safe access to resolved tech stack configuration for generator defaults.
 * Supports environment variable override for testing and custom deployments.
 *
 * Traceability: AI_ADR-004, AI_PRD-004, AI_SDS-003, AI_TS-002
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Resolved tech stack structure
 */
export interface ResolvedStack {
    categories: Record<string, any>;
    [key: string]: any;
}

/**
 * Load resolved tech stack JSON produced by translator.py
 *
 * The resolved stack contains normalized technology choices that generators
 * can use to provide intelligent defaults.
 *
 * @param root - Workspace root directory
 * @returns Parsed stack configuration or null if not found/invalid
 *
 * @example
 * const stack = loadResolvedStack(tree.root);
 * if (stack) {
 *   const defaults = deriveServiceDefaults(stack);
 * }
 *
 * Environment Variables:
 * - VIBEPRO_TECHSTACK_RESOLVED: Override default path to resolved stack file
 *
 * Default Path: tools/transformers/.derived/techstack.resolved.json
 */
export function loadResolvedStack(root: string): ResolvedStack | null {
    const override = process.env.VIBEPRO_TECHSTACK_RESOLVED;
    const defaultPath = join(root, 'tools', 'transformers', '.derived', 'techstack.resolved.json');
    const stackPath = override || defaultPath;

    if (!existsSync(stackPath)) {
        return null;
    }

    try {
        const content = readFileSync(stackPath, 'utf8');
        const parsed = JSON.parse(content);

        // Validate basic structure
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        return parsed as ResolvedStack;
    } catch (error) {
        // Invalid JSON or read error
        return null;
    }
}

/**
 * Safely retrieve a category subtree from the resolved stack
 *
 * Categories organize technologies by concern (e.g., core_application_dependencies,
 * data_persistence, infrastructure).
 *
 * @param stack - Resolved stack configuration
 * @param name - Category name to retrieve
 * @returns Category object or null if not found
 *
 * @example
 * const core = getCategory(stack, 'core_application_dependencies');
 * if (core && core.web_frameworks) {
 *   console.log('Web frameworks:', core.web_frameworks);
 * }
 */
export function getCategory(stack: ResolvedStack | null, name: string): any | null {
    if (!stack || typeof stack !== 'object') {
        return null;
    }

    const categories = stack.categories;
    if (!categories || typeof categories !== 'object') {
        return null;
    }

    return categories[name] ?? null;
}
