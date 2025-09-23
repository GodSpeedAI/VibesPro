#!/usr/bin/env node

/**
 * Simple TypeScript Generator Parser for testing
 */

import { existsSync } from 'fs';
import path from 'path';
import { Project } from 'ts-morph';

class SimpleTypeScriptParser {
    constructor() {
        this.project = new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                target: 'ES2020',
                module: 'CommonJS',
                strict: false,
                allowJs: true,
            },
        });
    }

    parseFile(filePath) {
        const result = {
            functions: [],
            imports: [],
            errors: [],
            warnings: []
        };

        try {
            const resolvedPath = path.resolve(filePath);

            if (!existsSync(resolvedPath)) {
                result.errors.push(`File not found: ${resolvedPath}`);
                return result;
            }

            const sourceFile = this.project.addSourceFileAtPath(resolvedPath);

            // Parse imports
            const imports = sourceFile.getImportDeclarations();
            console.error(`Found ${imports.length} imports`);

            imports.forEach(importDecl => {
                const moduleSpecifier = importDecl.getModuleSpecifierValue();
                console.error(`Import: ${moduleSpecifier}`);
                result.imports.push({ module: moduleSpecifier });
            });

            // Parse functions
            const functions = sourceFile.getFunctions();
            console.error(`Found ${functions.length} functions`);

            functions.forEach(func => {
                const name = func.getName() || 'anonymous';
                console.error(`Function: ${name}`);
                result.functions.push({ name });
            });

        } catch (error) {
            result.errors.push(`Error parsing file: ${error.message}`);
        }

        return result;
    }
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Usage: simple-parser.mjs <file>');
        process.exit(1);
    }

    const parser = new SimpleTypeScriptParser();
    const result = parser.parseFile(filePath);
    console.log(JSON.stringify(result, null, 2));
}

export { SimpleTypeScriptParser };
