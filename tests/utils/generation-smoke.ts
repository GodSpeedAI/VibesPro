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

const runCopier = async (targetDir: string): Promise<void> => {
    const command = [
        'copier',
        'copy',
        '.',
        targetDir,
        '--data-file',
        'tests/fixtures/test-data.yml',
        '--defaults',
        '--force'
    ];

    const result = spawnSync(command[0], command.slice(1), {
        cwd: process.cwd(),
        stdio: 'inherit'
    });

    if (result.status !== 0) {
        throw new Error(`Copier generation failed with status ${result.status ?? -1}`);
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
        await runCopier(workspaceRoot);

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
};
