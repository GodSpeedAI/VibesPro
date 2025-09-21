import type { SpawnOptions } from 'child_process';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface GeneratorResult {
  files: string[];
  success: boolean;
  outputPath: string;
  errorMessage?: string;
}

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const TEST_OUTPUT_ROOT = path.join(os.tmpdir(), 'vibespro-generator-tests');

const BASE_CONTEXT: Record<string, unknown> = {
  project_name: 'Test Project',
  project_slug: 'test-project',
  author_name: 'Test Author',
  author_email: 'test@example.com',
  architecture_style: 'hexagonal',
  include_ai_workflows: false,
  enable_temporal_learning: false,
  app_framework: 'next',
  backend_framework: 'fastapi',
  database_type: 'postgresql',
  include_supabase: false,
  app_name: 'primary-app',
  domains: [],
};

interface CommandError extends Error {
  stdout?: string;
  stderr?: string;
  code?: number | null;
}

async function runCommand(
  command: string,
  args: string[],
  options: SpawnOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });

    const MAX_CAPTURE = 1024 * 1024; // cap captured output to 1MB per stream
    let stdout = '';
    let stderr = '';

    const appendChunk = (buffer: string, chunk: Buffer): string => {
      if (buffer.length >= MAX_CAPTURE) {
        return buffer;
      }
      const remaining = MAX_CAPTURE - buffer.length;
      return buffer + chunk.toString('utf-8', 0, remaining);
    };

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout = appendChunk(stdout, chunk);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr = appendChunk(stderr, chunk);
    });

    child.on('error', reject);

    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }

      const error = new Error(
        stderr.trim() ||
        stdout.trim() ||
        `Command failed: ${command} ${args.join(' ')} (exit code ${code ?? -1})`
      ) as CommandError;

      error.stderr = stderr;
      error.stdout = stdout;
      error.code = code;
      reject(error);
    });
  });
}

function extractCommandError(error: unknown): string {
  if (!error) {
    return 'Generator execution failed';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const commandError = error as CommandError;
    const stderr = commandError.stderr?.trim();
    if (stderr) {
      return stderr;
    }

    const stdout = commandError.stdout?.trim();
    if (stdout) {
      return stdout;
    }

    return commandError.message || 'Generator execution failed';
  }

  return 'Generator execution failed';
}

export function serializeValue(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${key}: []`;
    }

    const serialized = value.map((item) => `  - "${String(item)}"`).join('\n');
    return `${key}:\n${serialized}`;
  }

  if (value === null) {
    return `${key}: null`;
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return `${key}: ${value}`;
  }

  if (typeof value === 'object' && value !== undefined) {
    const nested = Object.entries(value)
      .map(([childKey, childValue]) => `  ${childKey}: ${JSON.stringify(childValue)}`)
      .join('\n');
    return `${key}:\n${nested}`;
  }

  if (value === undefined) {
    return `${key}: null`;
  }

  return `${key}: "${String(value)}"`;
}

export function buildYaml(options: Record<string, unknown>): string {
  return Object.entries(options)
    .map(([key, value]) => serializeValue(key, value))
    .filter(Boolean)
    .join('\n');
}

async function ensureTestRoot(): Promise<void> {
  await fs.promises.mkdir(TEST_OUTPUT_ROOT, { recursive: true });
}

export async function runGenerator(
  generatorType: string,
  overrides: Record<string, unknown>
): Promise<GeneratorResult> {
  await ensureTestRoot();

  const timestamp = Date.now();
  const outputPath = path.join(TEST_OUTPUT_ROOT, `${generatorType}-${timestamp}`);
  const dataFilePath = path.join(TEST_OUTPUT_ROOT, `answers-${generatorType}-${timestamp}.yml`);

  const context: Record<string, unknown> = {
    ...BASE_CONTEXT,
    project_slug: `${BASE_CONTEXT.project_slug}-${timestamp}`,
    generator_type: generatorType,
    ...overrides,
  };

  // Always use the 'name' field if provided, overriding the default app_name
  if (overrides.name) {
    context.app_name = overrides.name;
  }

  const requestedFramework = (overrides.app_framework ?? overrides.framework) as string | undefined;
  if (requestedFramework) {
    context.app_framework = requestedFramework;
  }

  if (overrides.app_domains !== undefined) {
    // Convert array to comma-separated string for Copier validator
    context.app_domains = Array.isArray(overrides.app_domains)
      ? overrides.app_domains.join(',')
      : overrides.app_domains;
  }

  if (overrides.domains !== undefined) {
    context.domains = Array.isArray(overrides.domains) ? overrides.domains : [overrides.domains];
  }

  const yamlData = buildYaml(context);
  await fs.promises.writeFile(dataFilePath, yamlData, 'utf-8');

  const env = {
    ...process.env,
    COPIER_SKIP_PROJECT_SETUP: '1',
    COPIER_SILENT: '1',
  } as NodeJS.ProcessEnv;

  const copierCommand = process.env.COPIER_COMMAND ?? 'copier';
  const args = [
    'copy',
    PROJECT_ROOT,
    outputPath,
    '--data-file',
    dataFilePath,
    '--force',
    '--defaults',
  ];

  let errorMessage: string | undefined;

  try {
    await runCommand(copierCommand, args, { env });
  } catch (error: unknown) {
    errorMessage = extractCommandError(error);
    process.stderr.write(`${errorMessage}\n`);
  } finally {
    await fs.promises.rm(dataFilePath, { force: true });
  }

  if (errorMessage) {
    return {
      files: [],
      success: false,
      outputPath,
      errorMessage,
    };
  }

  const files: string[] = [];

  async function collectFiles(dir: string, basePath = ''): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        await collectFiles(fullPath, relativePath);
      } else {
        files.push(relativePath);
      }
    }
  }

  await collectFiles(outputPath);

  return {
    files,
    success: true,
    outputPath,
  };
}

export async function cleanupGeneratorOutputs(): Promise<void> {
  try {
    const entries = await fs.promises.readdir(TEST_OUTPUT_ROOT);
    for (const entry of entries) {
      await fs.promises.rm(path.join(TEST_OUTPUT_ROOT, entry), { recursive: true, force: true });
    }
  } catch (error: unknown) {
    const err = error as { code?: string } | undefined;
    if (err && err.code !== 'ENOENT') {
      throw error as Error;
    }
  }
}
