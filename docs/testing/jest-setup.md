# Jest Testing Setup Documentation

## Overview

This document describes the comprehensive Jest testing setup for the VibesPro project, configured with TypeScript support, custom matchers, and best practices.

## Configuration Files

### Main Configuration

- **`jest.config.json`** - Main Jest configuration for the workspace
- **`jest.setup.js`** - Global setup file with custom matchers and utilities
- **`jest.d.ts`** - TypeScript type definitions for custom matchers and globals
- **`tsconfig.spec.json`** - TypeScript configuration specifically for tests

### Key Features

1. **TypeScript Support**: Full TypeScript support with ts-jest transformer
2. **Custom Matchers**: Extended Jest matchers for file system and TypeScript validation
3. **Global Test Utilities**: Shared utilities for creating temporary directories and mock files
4. **Console Mocking**: Automatic console method mocking to reduce test noise
5. **Coverage Reporting**: Comprehensive code coverage with multiple output formats
6. **Type Safety**: Strict TypeScript compilation for test files

## Available Scripts

```bash
# Run all Jest tests
pnpm test:jest

# Run Jest tests in watch mode
pnpm test:jest:watch

# Run Jest tests with coverage
pnpm test:jest:coverage

# Run specific test file
pnpm test:jest tests/unit/jest-configuration.test.ts
```

## Configuration Details

### Test Patterns

Jest will automatically discover and run tests matching these patterns:

- `tests/**/*.{test,spec}.{ts,js}`
- `tools/**/*.{test,spec}.{ts,js}`
- `generators/**/*.{test,spec}.{ts,js}`

### Coverage Configuration

- **Threshold**: 80% for branches, functions, lines, and statements
- **Output**: Text, LCOV, HTML, and Clover formats
- **Directory**: `coverage/` in workspace root

### Custom Matchers

#### File System Matchers

```typescript
expect('/path/to/file').toBeFile();
expect('/path/to/directory').toBeDirectory();
```

#### TypeScript Validation Matcher

```typescript
expect('/path/to/typescript-file.ts').toHaveValidTypeScript();
```

### Global Test Utilities

The `testUtils` global object provides:

```typescript
// Create temporary directory
const tempDir = testUtils.createTempDir();

// Clean up temporary directory
testUtils.cleanupTempDir(tempDir);

// Create mock file structure
testUtils.createMockFiles(baseDir, {
    'file1.ts': 'export const foo = "bar";',
    'dir/file2.js': 'console.log("hello");',
});
```

## Test Structure Best Practices

### Test File Naming

- Use `.test.ts` or `.spec.ts` for test files
- Place tests close to the code they test when possible
- Use descriptive names: `user-service.test.ts`, `domain-generator.spec.ts`

### Test Organization

```typescript
describe('ComponentName', () => {
    describe('method or feature', () => {
        it('should do something specific', () => {
            // Test implementation
        });

        it('should handle error cases', () => {
            // Error handling test
        });
    });
});
```

### Async Testing

```typescript
it('should handle async operations', async () => {
    const result = await asyncFunction();
    expect(result).toBe('expected value');
});
```

### Mocking Console Output

Console methods are automatically mocked in tests. To test actual console output:

```typescript
it('should log specific message', () => {
    const consoleSpy = jest.spyOn(console, 'log');

    functionThatLogs();

    expect(consoleSpy).toHaveBeenCalledWith('expected message');
    consoleSpy.mockRestore();
});
```

## TypeScript Configuration

### Test-Specific TypeScript Config

The `tsconfig.spec.json` extends the base configuration with:

- CommonJS module support for Jest compatibility
- Jest and jest-extended types
- Source maps for debugging
- Relaxed isolation for test files

### Type Definitions

Custom types are defined in `jest.d.ts`:

- Global test utilities interface
- Custom matcher declarations
- Extended NodeJS global types

## Coverage Reports

Coverage reports are generated in multiple formats:

- **Text**: Console output during test runs
- **HTML**: Interactive browser-viewable report in `coverage/lcov-report/`
- **LCOV**: Machine-readable format in `coverage/lcov.info`
- **Clover**: XML format for CI integration

## Integration with Nx

While Jest is configured as a standalone tool, it integrates with the Nx workspace:

- Test files are discovered across all workspace projects
- Coverage collection includes workspace libraries and tools
- Respects Nx project boundaries and structure

## Troubleshooting

### Common Issues

1. **TypeScript Compilation Errors**
    - Ensure `tsconfig.spec.json` includes the test file
    - Check that custom types are properly imported
    - Verify Jest globals are available in test files

2. **Module Resolution Issues**
    - Check `moduleNameMapping` in Jest config
    - Ensure relative imports use correct paths
    - Verify external dependencies are installed

3. **Test Discovery Problems**
    - Confirm test files match the pattern in `testMatch`
    - Check file extensions are supported
    - Ensure test files are not in ignored directories

### Debug Mode

Run tests with debugging enabled:

```bash
# Enable verbose output
pnpm test:jest --verbose

# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Performance Optimization

### Parallel Execution

- Jest runs tests in parallel by default
- Use `--runInBand` for debugging or CI environments with limited resources

### Cache Management

- Jest caches transformed files for faster subsequent runs
- Clear cache if experiencing issues: `pnpm test:jest --clearCache`

### Selective Testing

```bash
# Run tests matching pattern
pnpm test:jest --testNamePattern="should handle async"

# Run only changed files
pnpm test:jest --onlyChanged

# Watch mode for development
pnpm test:jest:watch
```

## CI/CD Integration

For continuous integration:

```bash
# Run with coverage and CI-friendly output
pnpm test:jest:coverage --ci --coverageReporters=text-lcov
```

## Legacy Reference

### From Vitest

When porting tests that originally targeted Vitest:

1. Change import statements to use Jest globals
2. Update custom matchers to Jest format
3. Adjust async test patterns if needed
4. Update mock implementations to use Jest mocks

### Adding New Tests

When adding new test files:

1. Use `.test.ts` or `.spec.ts` extension
2. Place in appropriate directory (`tests/`, `tools/`, or `generators/`)
3. Follow the established patterns for describe/it blocks
4. Include type annotations for better IDE support

This setup provides a robust, maintainable testing foundation that follows industry best practices and integrates well with the existing TypeScript and Nx workspace configuration.
