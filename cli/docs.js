#!/usr/bin/env node

/**
 * MERGE-TASK-011: Documentation Generator CLI
 * Traceability: PRD-MERGE-006, ADR-MERGE-008
 *
 * Command-line interface for generating project documentation
 */

import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { DocumentationGenerator } from '../tools/docs/generator.js';

// Restrict paths to the current working directory
function resolveUnderCwd(p) {
    const resolved = path.resolve(p);
    const cwd = path.resolve(process.cwd());
    if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
        throw new Error(`Path escapes project root: ${p}`);
    }
    return resolved;
}
// Command line argument parsing
const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
    console.log(`
📝 Documentation Generator CLI

Usage:
  node cli/docs.js generate [options]   # Generate project documentation
  node cli/docs.js templates [options]  # Generate Copier templates only
  node cli/docs.js validate [options]   # Validate existing documentation
  node cli/docs.js help                 # Show this help

Options:
  --project-name NAME          Project name (default: from package.json)
  --description DESC           Project description (default: from package.json)
  --domains DOMAINS            Comma-separated list of domains
  --frameworks FRAMEWORKS      Comma-separated list of frameworks
  --output-dir DIR             Output directory (default: ./docs)
  --include-ai                 Include AI integration features
  --config FILE                Use configuration file (JSON/YAML)

Examples:
  # Generate full documentation
  node cli/docs.js generate --domains user,billing --frameworks next,fastapi

  # Generate templates only for Copier
  node cli/docs.js templates --output-dir ./templates/docs

  # Use configuration file
  node cli/docs.js generate --config ./docs-config.json

Configuration file format (docs-config.json):
{
  "projectName": "my-project",
  "description": "My awesome project",
  "domains": ["user-management", "billing"],
  "frameworks": ["next", "fastapi"],
  "includeAI": true
}
`);
}

async function loadConfig(configPath) {
    try {
        const safeConfigPath = resolveUnderCwd(configPath);
        const content = await fs.readFile(safeConfigPath, 'utf8');

        if (safeConfigPath.endsWith('.json')) {
            return JSON.parse(content);
        } else if (safeConfigPath.endsWith('.yaml') || safeConfigPath.endsWith('.yml')) {
            // Simple YAML parsing for basic key-value pairs
            const lines = content.split('\n');
            const config = {};

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, ...valueParts] = trimmed.split(':');
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join(':').trim();

                        // Parse arrays
                        if (value.startsWith('[') && value.endsWith(']')) {
                            config[key.trim()] = value
                                .slice(1, -1)
                                .split(',')
                                .map(s => s.trim().replace(/"/g, ''));
                        }
                        // Parse booleans
                        else if (value === 'true' || value === 'false') {
                            config[key.trim()] = value === 'true';
                        }
                        // Parse strings
                        else {
                            config[key.trim()] = value.replace(/"/g, '');
                        }
                    }
                }
            }

            return config;
        }

        throw new Error('Unsupported config file format');
        console.error(`❌ Error loading config from ${configPath}:`, error.message);
        process.exit(1);
    }
}

async function loadPackageJson() {
    try {
        if (existsSync('./package.json')) {
            const content = await fs.readFile('./package.json', 'utf8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.warn('⚠️  Could not load package.json:', error.message);
    }
    return {};
}

function parseArguments(args) {
    const options = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--project-name' && i + 1 < args.length) {
            options.projectName = args[++i];
        } else if (arg === '--description' && i + 1 < args.length) {
            options.description = args[++i];
        } else if (arg === '--domains' && i + 1 < args.length) {
            options.domains = args[++i].split(',').map(d => d.trim());
        } else if (arg === '--frameworks' && i + 1 < args.length) {
            options.frameworks = args[++i].split(',').map(f => f.trim());
        } else if (arg === '--output-dir' && i + 1 < args.length) {
            options.outputDir = args[++i];
        } else if (arg === '--config' && i + 1 < args.length) {
            options.configFile = args[++i];
        } else if (arg === '--include-ai') {
            options.includeAI = true;
        }
    }

    return options;
}

async function generateDocumentation(options) {
    console.log('📝 Generating project documentation...');

    // Load configuration from various sources
    let config = {};

    if (options.configFile) {
        config = await loadConfig(options.configFile);
        console.log(`✅ Loaded configuration from ${options.configFile}`);
    }

    const packageJson = await loadPackageJson();

    // Merge configuration (CLI args > config file > package.json > defaults)
    const context = {
        projectName: options.projectName ?? config.projectName ?? packageJson.name ?? 'my-project',
        description: options.description ?? config.description ?? packageJson.description ?? 'A project built with hexagonal architecture',
        domains: options.domains ?? config.domains ?? ['core'],
        frameworks: options.frameworks ?? config.frameworks ?? ['next'],
        includeAI: options.includeAI ?? config.includeAI ?? false,
        architecture: 'hexagonal' // Fixed for this merger
    };

    const outputDir = options.outputDir || './docs';

    console.log(`📂 Output directory: ${outputDir}`);
    console.log(`🏗️  Project: ${context.projectName}`);
    console.log(`📋 Domains: ${context.domains.join(', ')}`);
    console.log(`🛠️  Frameworks: ${context.frameworks.join(', ')}`);
    console.log(`🤖 AI Features: ${context.includeAI ? 'enabled' : 'disabled'}`);

    // Generate documentation
    const generator = new DocumentationGenerator(outputDir);
    const docs = await generator.generateDocumentation(context);

    // Save documentation files
    const files = [
        { name: 'README.md', content: docs.readme },
        { name: 'ARCHITECTURE.md', content: docs.architectureGuide },
        { name: 'API-REFERENCE.md', content: docs.apiDocs },
        { name: 'MIGRATION-GUIDE.md', content: docs.migrationGuide }
    ];

    for (const file of files) {
        const filePath = path.join(outputDir, file.name);
        await fs.writeFile(filePath, file.content, 'utf8');
        console.log(`✅ Generated ${file.name}`);
    }

    // Validate documentation
    const validation = await generator.validateDocumentation(docs);
    console.log(`\n📊 Documentation Quality Score: ${Math.round(validation.score * 100)}%`);

    if (!validation.isValid) {
        console.log('⚠️  Issues found:');
        validation.missingSection.forEach(issue => console.log(`   - ${issue}`));
    }

    console.log(`\n🎉 Documentation generated successfully in ${outputDir}`);
}

async function generateTemplates(options) {
    console.log('📝 Generating Copier documentation templates...');

    let config = {};

    if (options.configFile) {
        config = await loadConfig(options.configFile);
    }

    const packageJson = await loadPackageJson();

    const context = {
        projectName: options.projectName ?? config.projectName ?? packageJson.name ?? 'my-project',
        description: options.description ?? config.description ?? packageJson.description ?? 'A project built with hexagonal architecture',
        domains: options.domains ?? config.domains ?? ['core'],
        frameworks: options.frameworks ?? config.frameworks ?? ['next'],
        includeAI: options.includeAI ?? config.includeAI ?? false,
        architecture: 'hexagonal'
    };
    const outputDir = options.outputDir || './templates/docs';
    const safeOutputDir = resolveUnderCwd(outputDir);

    const generator = new DocumentationGenerator(safeOutputDir);
    await generator.generateAndSaveTemplates(context);

    console.log(`\n🎉 Documentation templates generated successfully in ${safeOutputDir}`);
    console.log('📝 Template files:');
    console.log('   - README.md.j2');
    console.log('   - ARCHITECTURE.md.j2');
    console.log('   - API-REFERENCE.md.j2');
    console.log('   - MIGRATION-GUIDE.md.j2');
}

async function validateDocumentation(options) {
    console.log('🔍 Validating existing documentation...');

    const docsDir = options.outputDir || './docs';

    if (!existsSync(docsDir)) {
        console.error(`❌ Documentation directory not found: ${docsDir}`);
        process.exit(1);
    }

    // Read existing documentation files
    const files = ['README.md', 'ARCHITECTURE.md', 'API-REFERENCE.md', 'MIGRATION-GUIDE.md'];
    const docs = {};

    for (const filename of files) {
        const filePath = path.join(docsDir, filename);

        if (existsSync(filePath)) {
            const content = await fs.readFile(filePath, 'utf8');
            const key = filename.replace('.md', '').toLowerCase().replace('-', '');

            if (filename === 'README.md') docs.readme = content;
            else if (filename === 'ARCHITECTURE.md') docs.architectureGuide = content;
            else if (filename === 'API-REFERENCE.md') docs.apiDocs = content;
            else if (filename === 'MIGRATION-GUIDE.md') docs.migrationGuide = content;

            console.log(`✅ Found ${filename}`);
        } else {
            console.log(`⚠️  Missing ${filename}`);
        }
    }

    // Validate documentation
    const generator = new DocumentationGenerator(docsDir);
    const validation = await generator.validateDocumentation(docs);

    console.log(`\n📊 Documentation Quality Report`);
    console.log(`===============================`);
    console.log(`Overall Score: ${Math.round(validation.score * 100)}%`);
    console.log(`Status: ${validation.isValid ? '✅ Valid' : '❌ Issues Found'}`);

    if (validation.missingSection.length > 0) {
        console.log(`\n⚠️  Missing sections:`);
        validation.missingSection.forEach(issue => console.log(`   - ${issue}`));
    }

    if (validation.warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        validation.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (validation.brokenLinks.length > 0) {
        console.log(`\n💔 Broken links:`);
        validation.brokenLinks.forEach(link => console.log(`   - ${link}`));
    }

    if (validation.isValid) {
        console.log(`\n🎉 Documentation validation passed!`);
    } else {
        console.log(`\n❌ Documentation validation failed. Please address the issues above.`);
        process.exit(1);
    }
}

async function main() {
    if (args.length === 0 || command === 'help') {
        printUsage();
        return;
    }

    const options = parseArguments(args.slice(1));

    try {
        switch (command) {
            case 'generate':
                await generateDocumentation(options);
                break;

            case 'templates':
                await generateTemplates(options);
                break;

            case 'validate':
                await validateDocumentation(options);
                break;

            default:
                console.error(`❌ Unknown command: ${command}`);
                printUsage();
                process.exit(1);
        }
    } catch (error) {
        console.error(`💥 Error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
