// Jest setup file - runs before each test file
// Global test utilities and configurations

// Set test timeout
jest.setTimeout(30000);

// Mock console methods in tests by default
beforeEach(() => {
    // Suppress console.log/warn/error in tests unless explicitly needed
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    // Restore console methods after each test
    jest.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
    // Helper to create temporary directories for testing
    createTempDir: () => {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibes-pro-test-'));
        return tempDir;
    },

    // Helper to clean up temporary directories
    cleanupTempDir: (dirPath) => {
        const fs = require('fs');
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    },

    // Helper to create mock file system structure
    createMockFiles: (baseDir, structure) => {
        const fs = require('fs');
        const path = require('path');

        Object.entries(structure).forEach(([filePath, content]) => {
            const fullPath = path.join(baseDir, filePath);
            const dir = path.dirname(fullPath);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(fullPath, content);
        });
    },
};

// Add custom matchers for file system testing
expect.extend({
    toBeFile(received) {
        const fs = require('fs');
        const pass = fs.existsSync(received) && fs.statSync(received).isFile();

        return {
            pass,
            message: () => pass
                ? `expected ${received} not to be a file`
                : `expected ${received} to be a file`,
        };
    },

    toBeDirectory(received) {
        const fs = require('fs');
        const pass = fs.existsSync(received) && fs.statSync(received).isDirectory();

        return {
            pass,
            message: () => pass
                ? `expected ${received} not to be a directory`
                : `expected ${received} to be a directory`,
        };
    },

    toHaveValidTypeScript(received) {
        const ts = require('typescript');
        const fs = require('fs');

        if (!fs.existsSync(received)) {
            return {
                pass: false,
                message: () => `File ${received} does not exist`,
            };
        }

        const content = fs.readFileSync(received, 'utf-8');
        const sourceFile = ts.createSourceFile(
            received,
            content,
            ts.ScriptTarget.Latest,
            true
        );

        const diagnostics = ts.getPreEmitDiagnostics(
            ts.createProgram([received], { strict: true })
        );

        const pass = diagnostics.length === 0;

        return {
            pass,
            message: () => pass
                ? `expected ${received} to have TypeScript errors`
                : `expected ${received} to be valid TypeScript, but found errors: ${diagnostics.map(d => d.messageText).join(', ')}`,
        };
    },
});
