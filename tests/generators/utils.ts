/**
 * Generator Spec Validation Utilities
 *
 * Provides reusable validation functions for generator specifications.
 *
 * Traceability: DEV-SDS-019
 */

import { readFileSync } from 'fs';

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
    const todoMarkers = ['TODO', 'FIXME', 'TBD', 'PLACEHOLDER', 'XXX', 'HACK'];
    const foundMarkers: string[] = [];

    todoMarkers.forEach((marker) => {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        foundMarkers.push(...matches);
      }
    });

    if (foundMarkers.length > 0) {
      errors.push(
        `Found ${foundMarkers.length} TODO/placeholder marker(s): ${foundMarkers.join(', ')}`,
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
    errors.push(`Failed to read spec file: ${error}`);
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
  const pattern = language
    ? new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\\n\`\`\``, 'g')
    : /```[\s\S]*?\n([\s\S]*?)\n```/g;

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
export function countPlaceholders(content: string): number {
  const markers = ['TODO', 'FIXME', 'TBD', 'PLACEHOLDER', 'XXX', 'HACK'];
  let count = 0;

  markers.forEach((marker) => {
    const regex = new RegExp(`\\b${marker}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
    }
  });

  return count;
}
