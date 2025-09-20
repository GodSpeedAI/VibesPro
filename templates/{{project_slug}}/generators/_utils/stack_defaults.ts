import { getCategory } from './stack';

export type ServiceDefaults = {
    language: 'python' | 'typescript';
    backendFramework: 'fastapi' | 'express' | 'nest' | 'none';
    packageManager: 'pnpm' | 'npm' | 'yarn';
};

const frameworkToLanguage: Record<string, ServiceDefaults['language']> = {
    express: 'typescript',
    nest: 'typescript',
    '@nestjs': 'typescript',
    fastapi: 'python',
};

/**
 * Derive generator defaults from resolved tech stack (deterministic, minimal).
 * Pure function; safe to use in dry-runs and planning.
 */
export function deriveServiceDefaults(stack: any | null): ServiceDefaults {
    const defaults: ServiceDefaults = {
        language: 'python',
        backendFramework: 'none',
        packageManager: 'pnpm',
    };

    const core = getCategory(stack, 'core_application_dependencies');
    if (core && typeof core === 'object') {
        const webFrameworks = (core as any).web_frameworks;
        if (Array.isArray(webFrameworks)) {
            const lower = webFrameworks.map(String).map((s) => s.toLowerCase());
            for (const fw of lower) {
                if (frameworkToLanguage[fw]) {
                    defaults.backendFramework = fw as ServiceDefaults['backendFramework'];
                    defaults.language = frameworkToLanguage[fw];
                    break; // First match wins
                }
            }
        }
    }

    return defaults;
}
