/**
 * Generation smoke test harness utilities.
 *
 * Phase: PHASE-001 / TASK-003 (Enhanced for PHASE-002 deferred items)
 * Traceability: AI_ADR-005, AI_PRD-005, AI_SDS-004, AI_TS-004, AI_TS-005
 *
 * Provides reusable helpers for template generation testing:
 * - runCopierGeneration: Generate project with custom options
 * - runGenerationSmokeTest: Full smoke test (prompt:lint + spec:matrix)
 * - ensureScriptExists: Verify package.json scripts
 * - runProjectScript: Execute npm/pnpm script in generated project
 */

import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type CommandResult = {
    readonly command: string;
    readonly status: number;
    readonly stdout: string;
    readonly stderr: string;
};

export type SmokeTestResult = {
    readonly workspace: string;
    readonly promptLint: CommandResult;
    readonly specMatrix: CommandResult;
};

export type CopierOptions = {
    readonly dataFile?: string;
    readonly customData?: Record<string, string | boolean>;
    readonly targetDir?: string;
    readonly useDefaults?: boolean;
    readonly force?: boolean;
};

/**
 * Run Copier template generation with customizable options.
 * Exported for reuse in integration tests.
 *
 * @param options - Configuration for copier generation
 * @returns Promise that resolves when generation completes
 * @throws Error if generation fails
 */
export const runCopierGeneration = async (options: CopierOptions = {}): Promise<string> => {
    const {
        dataFile = 'tests/fixtures/test-data.yml',
        customData = {},
        targetDir,
        useDefaults = true,
        force = true
    } = options;

    const actualTargetDir = targetDir ?? await fs.mkdtemp(join(tmpdir(), 'vibes-gen-'));

    const command = ['copier', 'copy', '.', actualTargetDir];

    // Add data file if specified
    if (dataFile) {
        command.push('--data-file', dataFile);
    }

    // Add custom data overrides
    for (const [key, value] of Object.entries(customData)) {
        command.push('--data', `${key}=${String(value)}`);
    }

    // Add flags
    if (useDefaults) {
        command.push('--defaults');
    }
    if (force) {
        command.push('--force');
    }

    const result = spawnSync(command[0], command.slice(1), {
        cwd: process.cwd(),
        stdio: 'inherit'
    });

    if (result.status !== 0) {
        throw new Error(`Copier generation failed with status ${result.status ?? -1}`);
    }

    return actualTargetDir;
};

/**
 * Check if a package.json script exists in a project.
 * Exported for reuse in test assertions.
 */
export const ensureScriptExists = async (projectRoot: string, scriptName: string): Promise<boolean> => {
    const packageJsonPath = join(projectRoot, 'package.json');
    const raw = await fs.readFile(packageJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
    return Boolean(parsed.scripts && parsed.scripts[scriptName]);
};

/**
 * Run a package.json script in a generated project.
 * Exported for reuse in integration tests.
 */
export const runProjectScript = (projectRoot: string, scriptName: string): CommandResult => {
    const command = ['run', scriptName];
    const execution = spawnSync('pnpm', command, {
        cwd: projectRoot,
        encoding: 'utf-8'
    });

    if (execution.error) {
        return {
            command: ['pnpm', ...command].join(' '),
            status: execution.status ?? 1,
            stdout: execution.stdout ?? '',
            stderr: `${execution.stderr ?? ''}${execution.error.message}`
        };
    }

    return {
        command: ['pnpm', ...command].join(' '),
        status: execution.status ?? 1,
        stdout: execution.stdout ?? '',
        stderr: execution.stderr ?? ''
    };
};

/**
 * Run complete smoke test: generate project and verify prompt:lint + spec:matrix.
 * Primary entry point for TASK-003 smoke testing.
 */
export const runGenerationSmokeTest = async (): Promise<SmokeTestResult> => {
    const workspaceRoot = await runCopierGeneration({
        dataFile: 'tests/fixtures/test-data.yml',
        useDefaults: true,
        force: true
    });

    try {
        const promptsAvailable = await ensureScriptExists(workspaceRoot, 'prompt:lint');
        const specMatrixAvailable = await ensureScriptExists(workspaceRoot, 'spec:matrix');

        const promptLintResult = promptsAvailable
            ? runProjectScript(workspaceRoot, 'prompt:lint')
            : { command: 'pnpm run prompt:lint', status: 1, stdout: '', stderr: 'prompt:lint script missing' };

        const specMatrixResult = specMatrixAvailable
            ? runProjectScript(workspaceRoot, 'spec:matrix')
            : { command: 'pnpm run spec:matrix', status: 1, stdout: '', stderr: 'spec:matrix script missing' };

        return {
            workspace: workspaceRoot,
            promptLint: promptLintResult,
            specMatrix: specMatrixResult
        };
    } finally {
        await fs.rm(workspaceRoot, { recursive: true, force: true });
    }
};
