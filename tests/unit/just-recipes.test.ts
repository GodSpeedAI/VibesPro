/**
 * Unit tests for justfile recipes expansion (TASK-006)
 * Traceability: AI_ADR-004, AI_PRD-003, AI_SDS-003, AI_TS-004
 *
 * Tests that new just recipes from VibePDK integration are present
 * and properly configured for AI-assisted workflows.
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('Justfile Recipes', () => {
    const justfilePath = join(process.cwd(), 'justfile');

    it('should have justfile in repository root', () => {
        expect(existsSync(justfilePath)).toBe(true);
    });

    describe('AI workflow recipes', () => {
        let recipes: string[];

        beforeAll(() => {
            try {
                // Get list of available recipes
                const output = execSync('just --list --unsorted', {
                    cwd: process.cwd(),
                    encoding: 'utf8',
                });
                recipes = output
                    .split('\n')
                    .filter((line) => line.trim() && !line.startsWith('Available recipes:'))
                    .map((line) => line.trim().split(/\s+/)[0]);
            } catch (error) {
                recipes = [];
            }
        });

        it('should have ai-context-bundle recipe', () => {
            expect(recipes).toContain('ai-context-bundle');
        });

        it('should have ai-validate recipe', () => {
            expect(recipes).toContain('ai-validate');
        });

        it('should have ai-scaffold recipe', () => {
            expect(recipes).toContain('ai-scaffold');
        });

        it('should have spec-guard recipe', () => {
            expect(recipes).toContain('spec-guard');
        });

        it('should have spec-matrix recipe', () => {
            expect(recipes).toContain('spec-matrix');
        });

        it('should have tdd-red recipe', () => {
            expect(recipes).toContain('tdd-red');
        });

        it('should have tdd-green recipe', () => {
            expect(recipes).toContain('tdd-green');
        });

        it('should have tdd-refactor recipe', () => {
            expect(recipes).toContain('tdd-refactor');
        });
    });

    describe('Generation workflow recipes', () => {
        let recipes: string[];

        beforeAll(() => {
            try {
                const output = execSync('just --list --unsorted', {
                    cwd: process.cwd(),
                    encoding: 'utf8',
                });
                recipes = output
                    .split('\n')
                    .filter((line) => line.trim() && !line.startsWith('Available recipes:'))
                    .map((line) => line.trim().split(/\s+/)[0]);
            } catch (error) {
                recipes = [];
            }
        });

        it('should have test-generation recipe', () => {
            expect(recipes).toContain('test-generation');
        });

        it('should have clean recipe', () => {
            expect(recipes).toContain('clean');
        });

        it('should have setup recipe', () => {
            expect(recipes).toContain('setup');
        });
    });
});
