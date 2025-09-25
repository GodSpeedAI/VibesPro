import fs from 'node:fs';
import { deriveServiceDefaults } from '../../generators/_utils/stack_defaults';
import { compareSnapshot, getSnapshotPath, writeSnapshot } from '../../tools/test/snapshot';

describe('Stack Defaults Tests', () => {
    it('should derive correct defaults for fastapi', () => {
        const stack = { categories: { core_application_dependencies: { web_frameworks: ['fastapi'] } } };
        const d = deriveServiceDefaults(stack);

        expect(d).toEqual({ language: 'python', backendFramework: 'fastapi', packageManager: 'pnpm' });

        const name = 'stack_defaults.fastapi';
        const content = JSON.stringify(d);
        const snapPath = getSnapshotPath(name);

        if (!fs.existsSync(snapPath)) {
            writeSnapshot(name, content);
        } else {
            expect(compareSnapshot(name, content)).toBeTruthy();
        }
    });

    it('should derive correct defaults for express', () => {
        const stack = { categories: { core_application_dependencies: { web_frameworks: ['express'] } } };
        const d = deriveServiceDefaults(stack);

        expect(d.language).toBe('typescript');
        expect(d.backendFramework).toBe('express');

        const name = 'stack_defaults.express';
        const content = JSON.stringify(d);
        const snapPath = getSnapshotPath(name);

        if (!fs.existsSync(snapPath)) {
            writeSnapshot(name, content);
        } else {
            expect(compareSnapshot(name, content)).toBeTruthy();
        }
    });

    it('should handle empty stack with fallback defaults', () => {
        const d = deriveServiceDefaults({ categories: {} });

        expect(d).toEqual({ language: 'python', backendFramework: 'none', packageManager: 'pnpm' });

        const name = 'stack_defaults.empty';
        const content = JSON.stringify(d);
        const snapPath = getSnapshotPath(name);

        if (!fs.existsSync(snapPath)) {
            writeSnapshot(name, content);
        } else {
            expect(compareSnapshot(name, content)).toBeTruthy();
        }
    });
});
