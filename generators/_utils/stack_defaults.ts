/**
 * @file Derives default settings for service generators from the resolved tech stack.
 * @author Jules
 *
 * @description
 * This module provides a pure function, `deriveServiceDefaults`, which intelligently determines
 * the appropriate default language and framework for a new service based on the project's
 * overall technology stack. This ensures that Nx generators are pre-configured with sensible
 * defaults that align with the project's established patterns, improving developer experience
 * and consistency.
 */

import { getCategory } from './stack';

/**
 * @typedef {'python' | 'typescript'} LanguageOption
 *   The programming language for the service.
 */

/**
 * @typedef {'fastapi' | 'express' | 'nest' | 'none'} BackendFrameworkOption
 *   The backend web framework for the service. 'none' indicates a non-web service.
 */

/**
 * @typedef {'pnpm' | 'npm' | 'yarn'} PackageManagerOption
 *   The package manager for Node.js-based services.
 */

/**
 * @type {object} ServiceDefaults
 * @description Defines the set of default options for a new service, which are derived
 *   from the project's tech stack. This type provides a clear contract for the output of
 *   the `deriveServiceDefaults` function.
 * @property {LanguageOption} language - The default programming language.
 * @property {BackendFrameworkOption} backendFramework - The default backend framework.
 * @property {PackageManagerOption} packageManager - The default package manager.
 */
export type ServiceDefaults = {
  language: 'python' | 'typescript';
  backendFramework: 'fastapi' | 'express' | 'nest' | 'none';
  packageManager: 'pnpm' | 'npm' | 'yarn';
};

/**
 * @constant {Record<string, ServiceDefaults['language']>} frameworkToLanguage
 * @description A private mapping from lowercase web framework names to their corresponding
 *   programming languages. This is used to infer the language from the framework choice.
 */
const frameworkToLanguage: Record<string, ServiceDefaults['language']> = {
  express: 'typescript',
  nest: 'typescript',
  '@nestjs': 'typescript',
  fastapi: 'python',
};

/**
 * Derives generator defaults for a new service from the resolved tech stack.
 *
 * This is a pure function, meaning it has no side effects and its output is solely
 * determined by its input. This makes it safe to use in generator dry-runs and for planning.
 * It inspects the 'core_application_dependencies' category of the tech stack to identify
 * the primary web framework, and from that, infers the language.
 *
 * @param {unknown | null} stack - The parsed tech stack object, as returned by `loadResolvedStack`.
 *   The function is designed to handle `null` or malformed inputs gracefully.
 * @returns {ServiceDefaults} An object containing the derived default settings for language,
 *   framework, and package manager. It returns a set of sensible fallbacks if the tech
- *   stack is not available or doesn't specify a web framework.
 */
export function deriveServiceDefaults(stack: unknown | null): ServiceDefaults {
  // Start with a sensible baseline set of defaults.
  const defaults: ServiceDefaults = {
    language: 'python',
    backendFramework: 'none',
    packageManager: 'pnpm',
  };

  const core = getCategory(stack, 'core_application_dependencies');
  if (core && typeof core === 'object') {
    const coreRec = core as Record<string, unknown>;
    const webFrameworks = coreRec['web_frameworks'];
    if (Array.isArray(webFrameworks)) {
      // Normalize to lowercase to make matching case-insensitive.
      const lower = webFrameworks.map(String).map((s) => s.toLowerCase());
      for (const fw of lower) {
        if (frameworkToLanguage[fw]) {
          defaults.backendFramework = fw as ServiceDefaults['backendFramework'];
          defaults.language = frameworkToLanguage[fw];
          break; // The first recognized framework in the list wins.
        }
      }
    }
  }

  return defaults;
}
