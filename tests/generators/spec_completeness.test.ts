/**
 * Generator Spec Completeness Tests
 *
 * Validates that generator specification templates:
 * - Contain no TODO/FIXME/TBD/PLACEHOLDER markers
 * - Include all required sections
 * - Have sufficient examples and guidance
 *
 * Traceability: DEV-PRD-019, DEV-SDS-019, DEV-ADR-019
 */

import { readFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

describe('Generator Spec Completeness', () => {
  const specPattern = 'templates/{{project_slug}}/docs/specs/generators/*.md';
  let specFiles: string[] = [];

  beforeAll(() => {
    specFiles = glob.sync(specPattern);

    if (specFiles.length === 0) {
      throw new Error(`No spec files found matching pattern: ${specPattern}`);
    }
  });

  test('spec files contain no TODO markers', () => {
    const todoMarkers = ['TODO', 'FIXME', 'TBD', 'PLACEHOLDER', 'XXX', 'HACK'];
    const failures: string[] = [];

    specFiles.forEach((file) => {
      const content = readFileSync(file, 'utf-8');
      const foundMarkers: string[] = [];

      todoMarkers.forEach((marker) => {
        const regex = new RegExp(`\\b${marker}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          foundMarkers.push(...matches);
        }
      });

      if (foundMarkers.length > 0) {
        failures.push(`${file}: ${foundMarkers.join(', ')}`);
      }
    });

    if (failures.length > 0) {
      fail(`Found placeholder markers:\n${failures.join('\n')}`);
    }
  });

  test('GENERATOR_SPEC.md has all required sections', () => {
    const specPath = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';
    const spec = readFileSync(specPath, 'utf-8');

    const requiredSections = [
      '## 1) Purpose & Scope',
      '## 2) Invocation & Placement',
      '## 3) Inputs / Options (Schema)',
      '### 3.1 Type Mapping Matrix',
      '## 4) Outputs / Artifacts',
      '## 6) Generator Composition',
      '## 7) Idempotency Strategy',
      '## 8) Implementation Hints',
    ];

    const missingSections: string[] = [];
    requiredSections.forEach((section) => {
      if (!spec.includes(section)) {
        missingSections.push(section);
      }
    });

    if (missingSections.length > 0) {
      fail(`Missing required sections: ${missingSections.join(', ')}`);
    }
  });

  test('GENERATOR_SPEC.md has sufficient code examples', () => {
    const specPath = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';
    const spec = readFileSync(specPath, 'utf-8');

    // Extract code blocks (markdown ```...```)
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = spec.match(codeBlockRegex) || [];

    // Should have at least 10 code examples
    expect(codeBlocks.length).toBeGreaterThanOrEqual(10);
  });

  test('GENERATOR_SPEC.md has type mapping table', () => {
    const specPath = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';
    const spec = readFileSync(specPath, 'utf-8');

    expect(spec).toContain('Type Mapping Matrix');

    const requiredTypes = ['string', 'number', 'boolean', 'array', 'object'];
    const matrixSection = extractTypeMappingSection(spec);
    const discoveredTypes = new Set<string>();

    const rowRegex = /\|\s*([a-zA-Z]+)\s*\|/g;
    let match: RegExpExecArray | null;
    while ((match = rowRegex.exec(matrixSection)) !== null) {
      discoveredTypes.add(match[1].toLowerCase());
    }

    const missingTypes = requiredTypes.filter((type) => !discoveredTypes.has(type));
    if (missingTypes.length > 0) {
      fail(`Missing type mappings for: ${missingTypes.join(', ')}`);
    }
  });

  test('GENERATOR_SPEC.md has idempotency strategy', () => {
    const specPath = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';
    const spec = readFileSync(specPath, 'utf-8');

    expect(spec).toContain('Idempotency Strategy');
    expect(spec).toContain('tree.exists');
  });

  test('GENERATOR_SPEC.md has @nx/devkit references', () => {
    const specPath = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';
    const spec = readFileSync(specPath, 'utf-8');

    const nxDevkitHelpers = ['generateFiles', 'formatFiles', 'addProjectConfiguration', 'names'];

    nxDevkitHelpers.forEach((helper) => {
      expect(spec).toContain(helper);
    });
  });
});

function extractTypeMappingSection(spec: string): string {
  const heading = '### 3.1 Type Mapping Matrix';
  const headingIndex = spec.indexOf(heading);

  if (headingIndex === -1) {
    return spec;
  }

  const afterHeading = spec.slice(headingIndex + heading.length);
  const nextSectionIndex = afterHeading.indexOf('\n## ');

  return nextSectionIndex === -1 ? afterHeading : afterHeading.slice(0, nextSectionIndex);
}
