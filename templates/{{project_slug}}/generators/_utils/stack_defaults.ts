/**
 * Stack-Aware Generator Defaults
 *
 * Derives intelligent defaults for generators based on resolved tech stack configuration.
 * Enables consistent technology choices across generated code.
 *
 * Traceability: AI_ADR-004, AI_PRD-004, AI_SDS-003, AI_TS-002
 */
import { getCategory, ResolvedStack } from './stack';

/**
 * Service generation defaults derived from tech stack
 */
export interface ServiceDefaults {
    /** Primary programming language for the service */
    language: 'python' | 'typescript';
    /** Web framework to use (or 'none' for minimal setup) */
    backendFramework: 'fastapi' | 'express' | 'nest' | 'none';
    /** Package manager for dependencies */
    packageManager: 'pnpm' | 'npm' | 'yarn';
}

/**
 * Mapping of web frameworks to their primary languages
 *
 * This map is used to auto-detect the language when a web framework
 * is specified in the tech stack.
 */
const FRAMEWORK_LANGUAGE_MAP: Record<string, ServiceDefaults['language']> = {
    express: 'typescript',
    nest: 'typescript',
    '@nestjs': 'typescript',
    nestjs: 'typescript',
    fastapi: 'python',
    flask: 'python',
    django: 'python',
};

/**
 * Derive service generator defaults from resolved tech stack
 *
 * Pure function with no side effects - safe for dry-runs and planning.
 * Deterministic output ensures consistent generation results.
 *
 * @param stack - Resolved tech stack configuration (or null)
 * @returns Service defaults with fallbacks
 *
 * @example
 * // Tech stack with FastAPI
 * const stack = { categories: { core_application_dependencies: { web_frameworks: ['fastapi'] } } };
 * const defaults = deriveServiceDefaults(stack);
 * // Returns: { language: 'python', backendFramework: 'fastapi', packageManager: 'pnpm' }
 *
 * @example
 * // No tech stack available
 * const defaults = deriveServiceDefaults(null);
 * // Returns: { language: 'python', backendFramework: 'none', packageManager: 'pnpm' }
 */
export function deriveServiceDefaults(stack: ResolvedStack | null): ServiceDefaults {
    // Start with sensible defaults
    const defaults: ServiceDefaults = {
        language: 'python',
        backendFramework: 'none',
        packageManager: 'pnpm',
    };

    // Attempt to derive from stack configuration
    const core = getCategory(stack, 'core_application_dependencies');
    if (core && typeof core === 'object') {
        const webFrameworks = core.web_frameworks;

        if (Array.isArray(webFrameworks) && webFrameworks.length > 0) {
            // Normalize framework names to lowercase for comparison
            const normalizedFrameworks = webFrameworks
                .map(String)
                .map((fw) => fw.toLowerCase().trim());

            // Find first recognized framework
            for (const framework of normalizedFrameworks) {
                const language = FRAMEWORK_LANGUAGE_MAP[framework];
                if (language) {
                    defaults.backendFramework = framework as ServiceDefaults['backendFramework'];
                    defaults.language = language;
                    break; // First match wins
                }
            }
        }
    }

    return defaults;
}

/**
 * Validate service defaults for correctness
 *
 * @param defaults - Service defaults to validate
 * @returns true if valid, false otherwise
 */
export function validateServiceDefaults(defaults: ServiceDefaults): boolean {
    const validLanguages = ['python', 'typescript'];
    const validFrameworks = ['fastapi', 'express', 'nest', 'none'];
    const validPackageManagers = ['pnpm', 'npm', 'yarn'];

    return (
        validLanguages.includes(defaults.language) &&
        validFrameworks.includes(defaults.backendFramework) &&
        validPackageManagers.includes(defaults.packageManager)
    );
}
