/**
 * Generator Spec Validation Utilities
 *
 * Provides reusable validation functions for generator specifications.
 *
 * Traceability: DEV-SDS-019
 */

import { readFileSync } from 'fs';

const PLACEHOLDER_MARKERS = ['TODO', 'FIXME', 'TBD', 'PLACEHOLDER', 'XXX', 'HACK'];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SectionCheck {
  name: string;
  found: boolean;
}

/**
 * Validate generator specification completeness.
 *
 * @param specPath - Path to generator spec markdown file
 * @returns Validation result with errors if any
 */
export function validateGeneratorSpec(specPath: string): ValidationResult {
  const errors: string[] = [];

  try {
    const content = readFileSync(specPath, 'utf-8');

    // Check for TODO markers
    const placeholders = countPlaceholders(content, PLACEHOLDER_MARKERS);
    if (placeholders.count > 0) {
      errors.push(
        `Found ${placeholders.count} TODO/placeholder marker(s): ${placeholders.matches.join(
          ', ',
        )}`,
      );
    }

    // Check required sections
    const requiredSections = [
      'Purpose & Scope',
      'Invocation & Placement',
      'Inputs / Options (Schema)',
      'Type Mapping Matrix',
      'Outputs / Artifacts',
      'Generator Composition',
      'Idempotency Strategy',
      'Implementation Hints',
    ];

    const missingSections: string[] = [];
    requiredSections.forEach((section) => {
      if (!content.includes(section)) {
        missingSections.push(section);
      }
    });

    if (missingSections.length > 0) {
      errors.push(`Missing required sections: ${missingSections.join(', ')}`);
    }

    // Check for code examples
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = content.match(codeBlockRegex) || [];

    if (codeBlocks.length < 10) {
      errors.push(
        `Insufficient examples: only ${codeBlocks.length} code blocks (minimum 10 expected)`,
      );
    }

    // Check for @nx/devkit utilities
    const nxDevkitHelpers = ['generateFiles', 'formatFiles', 'names'];
    const missingHelpers: string[] = [];

    nxDevkitHelpers.forEach((helper) => {
      if (!content.includes(helper)) {
        missingHelpers.push(helper);
      }
    });

    if (missingHelpers.length > 0) {
      errors.push(`Missing @nx/devkit helper references: ${missingHelpers.join(', ')}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to read spec file: ${message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract code blocks from markdown content.
 *
 * @param content - Markdown content
 * @param language - Optional language filter (e.g., 'json', 'typescript')
 * @returns Array of code block contents
 */
export function extractCodeBlocks(content: string, language?: string): string[] {
  const escapedLanguage = language ? escapeRegExp(language) : undefined;
  const pattern = escapedLanguage
    ? new RegExp(`\`\`\`${escapedLanguage}(?:[^\r\n]*)?[\r\n]+([\\s\\S]*?)\n?\`\`\``, 'g')
    : /```(?:[^\r\n]*)?[\r\n]+([\s\S]*?)\n?```/g;

  const blocks: string[] = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    blocks.push(match[1]);
  }

  return blocks;
}

/**
 * Check which sections are present in a specification.
 *
 * @param content - Spec markdown content
 * @param sections - Array of section names to check
 * @returns Array of section check results
 */
export function checkSections(content: string, sections: string[]): SectionCheck[] {
  return sections.map((name) => ({
    name,
    found: content.includes(name),
  }));
}

/**
 * Count placeholder markers in content.
 *
 * @param content - Text content to check
 * @returns Count of TODO/FIXME/etc markers found
 */
export function countPlaceholders(
  content: string,
  markers: string[] = PLACEHOLDER_MARKERS,
): { count: number; matches: string[] } {
  let count = 0;
  const matches: string[] = [];

  markers.forEach((marker) => {
    const regex = new RegExp(`\\b${marker}\\b`, 'gi');
    const markerMatches = content.match(regex);
    if (markerMatches) {
      count += markerMatches.length;
      matches.push(...markerMatches);
    }
  });

  return { count, matches };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
