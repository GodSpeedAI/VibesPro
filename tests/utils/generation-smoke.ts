/**
 * Generation smoke test harness utilities.
 *
 * Phase: PHASE-001 / TASK-003
 * Traceability: AI_ADR-005, AI_PRD-005, AI_SDS-004, AI_TS-004, AI_TS-005
 */

import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type CopierDataValue = string | number | boolean;

interface CopierOptions extends Record<string, CopierDataValue | undefined> {
    readonly dataFile?: string;
    readonly useDefaults?: boolean;
    readonly force?: boolean;
    readonly skipPostGenSetup?: boolean;
}

type CommandResult = {
    readonly command: string;
    readonly status: number;
    readonly stdout: string;
    readonly stderr: string;
};

type SmokeTestResult = {
    readonly workspace: string;
    readonly promptLint: CommandResult;
    readonly specMatrix: CommandResult;
};

const runCopier = (targetDir: string, options: CopierOptions = {}): void => {
    const {
        dataFile = 'tests/fixtures/test-data.yml',
        useDefaults = true,
        force = true,
        skipPostGenSetup = false
    } = options;

    const command = ['copier', 'copy', '.', targetDir, '--trust'];

    // Use --vcs-ref=HEAD to include staged but uncommitted template changes
    command.push('--vcs-ref=HEAD');

    if (dataFile) {
        command.push('--data-file', dataFile);
    }

    if (useDefaults) {
        command.push('--defaults');
    }

    if (force) {
        command.push('--force');
    }

    // Note: --force already includes --overwrite behavior
    // No need to add --overwrite separately

    const reservedKeys = new Set(['dataFile', 'useDefaults', 'force', 'skipPostGenSetup']);
    const dataEntries: Array<[string, CopierDataValue]> = [];

    for (const [key, value] of Object.entries(options)) {
        if (reservedKeys.has(key) || typeof value === 'undefined') {
            continue;
        }

        dataEntries.push([key, value as CopierDataValue]);
    }

    for (const [key, value] of dataEntries) {
        const renderedValue = typeof value === 'boolean' ? String(value) : `${value}`;
        command.push('--data', `${key}=${renderedValue}`);
    }

    const env = { ...process.env };
    if (skipPostGenSetup) {
        env.COPIER_SKIP_PROJECT_SETUP = '1';
    }

    if (typeof options.enable_security_hardening !== 'undefined') {
        env.COPIER_ENABLE_SECURITY_HARDENING = String(Boolean(options.enable_security_hardening));
    }

    const result = spawnSync(command[0], command.slice(1), {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: 'pipe',
        env
    });

    if (result.status !== 0) {
        const stdout = result.stdout ?? '';
        const stderr = result.stderr ?? '';
        throw new Error(
            `Copier generation failed with status ${result.status ?? -1}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`
        );
    }
};

const ensureScriptExists = async (projectRoot: string, scriptName: string): Promise<boolean> => {
    const packageJsonPath = join(projectRoot, 'package.json');
    const raw = await fs.readFile(packageJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
    return Boolean(parsed.scripts && parsed.scripts[scriptName]);
};

const runScript = (projectRoot: string, scriptName: string): CommandResult => {
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

export const runGenerationSmokeTest = async (): Promise<SmokeTestResult> => {
    const workspaceRoot = await fs.mkdtemp(join(tmpdir(), 'vibes-smoke-'));

    try {
        runCopier(workspaceRoot, { skipPostGenSetup: true });

        const promptsAvailable = await ensureScriptExists(workspaceRoot, 'prompt:lint');
        const specMatrixAvailable = await ensureScriptExists(workspaceRoot, 'spec:matrix');

        const promptLintResult = promptsAvailable
            ? runScript(workspaceRoot, 'prompt:lint')
            : { command: 'pnpm run prompt:lint', status: 1, stdout: '', stderr: 'prompt:lint script missing' };

        const specMatrixResult = specMatrixAvailable
            ? runScript(workspaceRoot, 'spec:matrix')
            : { command: 'pnpm run spec:matrix', status: 1, stdout: '', stderr: 'spec:matrix script missing' };

        return {
            workspace: workspaceRoot,
            promptLint: promptLintResult,
            specMatrix: specMatrixResult
        };
    } finally {
        await fs.rm(workspaceRoot, { recursive: true, force: true });
    }
}; export const runCopierGeneration = async (options: CopierOptions = {}): Promise<string> => {
    const workspaceRoot = await fs.mkdtemp(join(tmpdir(), 'vibes-gen-'));

    try {
        runCopier(workspaceRoot, options);
        return workspaceRoot;
    } catch (error) {
        await fs.rm(workspaceRoot, { recursive: true, force: true });
        throw error;
    }
};
