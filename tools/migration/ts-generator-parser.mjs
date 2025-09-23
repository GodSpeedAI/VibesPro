#!/usr/bin/env node

/**
 * TypeScript Generator Parser using ts-morph
 *
 * This tool parses TypeScript generator files and extracts structured information
 * that can be used by the Python migration tool to generate equivalent Python code.
 */

import { existsSync } from 'fs';
import path from 'path';
import { Node, Project, SyntaxKind } from 'ts-morph';

/**
 * @typedef {Object} ParsedFunction
 * @property {string} name
 * @property {string[]} parameters
 * @property {boolean} isExported
 * @property {string} [body]
 */

/**
 * @typedef {Object} ParsedWriteOperation
 * @property {'writeFileSync'|'writeFile'} type
 * @property {string} filenameExpression
 * @property {string} contentExpression
 * @property {boolean} isLiteral
 * @property {string} [literalContent]
 * @property {number} lineNumber
 */

/**
 * @typedef {Object} ParsedImport
 * @property {string} module
 * @property {string[]} imports
 * @property {boolean} isDefault
 * @property {number} lineNumber
 */

/**
 * @typedef {Object} ParsedGeneratorInfo
 * @property {ParsedFunction[]} functions
 * @property {ParsedWriteOperation[]} writeOperations
 * @property {ParsedImport[]} imports
 * @property {string[]} templateLiterals
 * @property {Record<string, string>} variables
 * @property {string[]} errors
 * @property {string[]} warnings
 */

class TypeScriptGeneratorParser {
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

    /**
     * Parse a TypeScript generator file and extract structured information
     * @param {string} filePath - Path to the TypeScript file
     * @returns {ParsedGeneratorInfo} Parsed information
     */
    parseFile(filePath) {
        const result = {
            functions: [],
            writeOperations: [],
            imports: [],
            templateLiterals: [],
            variables: {},
            errors: [],
            warnings: []
        };

        try {
            // Resolve the file path to absolute path
            const resolvedPath = path.resolve(filePath);

            if (!existsSync(resolvedPath)) {
                result.errors.push(`File not found: ${resolvedPath}`);
                return result;
            }

            const sourceFile = this.project.addSourceFileAtPath(resolvedPath);

            // Parse imports
            sourceFile.getImportDeclarations().forEach(importDecl => {
                try {
                    const moduleSpecifier = importDecl.getModuleSpecifierValue();
                    const namedImports = importDecl.getNamedImports().map(ni => ni.getName());
                    const defaultImport = importDecl.getDefaultImport()?.getText();

                    result.imports.push({
                        module: moduleSpecifier,
                        imports: defaultImport ? [defaultImport, ...namedImports] : namedImports,
                        isDefault: !!defaultImport,
                        lineNumber: importDecl.getStartLineNumber()
                    });
                } catch (e) {
                    result.warnings.push(`Failed to parse import: ${e.message}`);
                }
            });

            // Parse functions
            sourceFile.getFunctions().forEach(func => {
                try {
                    const funcInfo = {
                        name: func.getName() || 'anonymous',
                        parameters: func.getParameters().map(p => p.getNameNode()?.getText() || ''),
                        isExported: func.isExported(),
                        body: func.getBodyText()
                    };
                    result.functions.push(funcInfo);
                } catch (e) {
                    result.warnings.push(`Failed to parse function: ${e.message}`);
                }
            });

            // Parse variable declarations with template literals
            sourceFile.getVariableDeclarations().forEach(varDecl => {
                try {
                    const name = varDecl.getName();
                    const initializer = varDecl.getInitializer();
                    if (initializer) {
                        const text = initializer.getText();
                        result.variables[name] = text;

                        // Check for template literals
                        if (Node.isTemplateExpression(initializer) || text.startsWith('`')) {
                            result.templateLiterals.push(text);
                        }
                    }
                } catch (e) {
                    result.warnings.push(`Failed to parse variable: ${e.message}`);
                }
            });

            // Parse writeFileSync calls
            sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
                try {
                    const expression = callExpr.getExpression();
                    let functionName = '';

                    if (Node.isIdentifier(expression)) {
                        functionName = expression.getText();
                    } else if (Node.isPropertyAccessExpression(expression)) {
                        functionName = expression.getName();
                    }

                    if (functionName === 'writeFileSync' || functionName === 'writeFile') {
                        const args = callExpr.getArguments();
                        if (args.length >= 2) {
                            const filenameArg = args[0];
                            const contentArg = args[1];

                            const writeOp = {
                                type: functionName,
                                filenameExpression: filenameArg.getText(),
                                contentExpression: contentArg.getText(),
                                isLiteral: Node.isStringLiteral(contentArg) || Node.isTemplateExpression(contentArg),
                                lineNumber: callExpr.getStartLineNumber()
                            };

                            // Extract literal content if possible
                            if (Node.isStringLiteral(contentArg)) {
                                writeOp.literalContent = contentArg.getLiteralValue();
                            } else if (Node.isTemplateExpression(contentArg)) {
                                writeOp.literalContent = contentArg.getText();
                            }

                            result.writeOperations.push(writeOp);
                        }
                    }
                } catch (e) {
                    result.warnings.push(`Failed to parse call expression: ${e.message}`);
                }
            });

            // Extract all template literals
            sourceFile.getDescendantsOfKind(SyntaxKind.TemplateExpression).forEach(templateExpr => {
                try {
                    result.templateLiterals.push(templateExpr.getText());
                } catch (e) {
                    result.warnings.push(`Failed to parse template literal: ${e.message}`);
                }
            });

            // Also check for NoSubstitutionTemplateLiteral (simple backtick strings)
            sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral).forEach(templateLiteral => {
                try {
                    result.templateLiterals.push(templateLiteral.getText());
                } catch (e) {
                    result.warnings.push(`Failed to parse simple template literal: ${e.message}`);
                }
            });

        } catch (error) {
            result.errors.push(`Failed to parse file: ${error.message}`);
        }

        return result;
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    if (args.includes('--version')) {
        console.log('TypeScript Generator Parser v1.0.0');
        process.exit(0);
    }

    if (args.length === 0) {
        console.error('Usage: ts-generator-parser.mjs [--version] <typescript-file>');
        process.exit(1);
    }

    const filePath = args[0];
    const parser = new TypeScriptGeneratorParser();
    const result = parser.parseFile(filePath);

    // Output as JSON for Python consumption
    console.log(JSON.stringify(result, null, 2));
}

export { TypeScriptGeneratorParser };
