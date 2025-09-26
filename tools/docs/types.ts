/**
 * MERGE-TASK-011: Documentation Generation Types
 * Traceability: PRD-MERGE-006, ADR-MERGE-008
 */

export interface ProjectContext {
    projectName: string;
    description: string;
    domains: string[];
    architecture: string;
    frameworks: string[];
    includeAI: boolean;
    author?: string;
    version?: string;
    license?: string;
    repository?: string;
}

export interface GeneratedDocs {
    readme: string;
    apiDocs: string;
    architectureGuide: string;
}

export interface ValidationResult {
    isValid: boolean;
    missingSection: string[];
    brokenLinks: string[];
    score: number;
    warnings: string[];
}

export interface TemplateConfig {
    templateDir: string;
    outputDir: string;
    overwrite: boolean;
}

export interface DocumentationSection {
    title: string;
    content: string;
    order: number;
    required: boolean;
}
