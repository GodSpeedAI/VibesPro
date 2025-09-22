// Global test types for Jest setup
declare global {
    namespace NodeJS {
        interface Global {
            testUtils: {
                createTempDir: () => string;
                cleanupTempDir: (dirPath: string) => void;
                createMockFiles: (baseDir: string, structure: Record<string, string>) => void;
            };
        }
    }

    var testUtils: {
        createTempDir: () => string;
        cleanupTempDir: (dirPath: string) => void;
        createMockFiles: (baseDir: string, structure: Record<string, string>) => void;
    };
}

// Custom Jest matchers
declare namespace jest {
    interface Matchers<R> {
        toBeFile(): R;
        toBeDirectory(): R;
        toHaveValidTypeScript(): R;
    }
}

export { };
