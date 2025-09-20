import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface GeneratorResult {
  files: string[];
  success: boolean;
  outputPath: string;
  errorMessage?: string;
}

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const TEST_OUTPUT_ROOT = path.join(os.tmpdir(), 'vibespro-generator-tests');

const BASE_CONTEXT: Record<string, any> = {
  project_name: 'Test Project',
  project_slug: 'test-project',
  author_name: 'Test Author',
  author_email: 'test@example.com',
  architecture_style: 'hexagonal',
  include_ai_workflows: false,
  enable_temporal_learning: false,
  frontend_framework: 'next',
  backend_framework: 'fastapi',
  database_type: 'postgresql',
  include_supabase: false,
  app_name: 'primary-app',
  domains: [],
};

function serializeValue(key: string, value: any): string {
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
    return '';
  }

  return `${key}: "${String(value)}"`;
}

function buildYaml(options: Record<string, any>): string {
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
  overrides: Record<string, any>
): Promise<GeneratorResult> {
  await ensureTestRoot();

  const timestamp = Date.now();
  const outputPath = path.join(TEST_OUTPUT_ROOT, `${generatorType}-${timestamp}`);
  const dataFilePath = path.join(TEST_OUTPUT_ROOT, `answers-${generatorType}-${timestamp}.yml`);

  const context: Record<string, any> = {
    ...BASE_CONTEXT,
    project_slug: `${BASE_CONTEXT.project_slug}-${timestamp}`,
    generator_type: generatorType,
    ...overrides,
  };

  if (overrides.name && !context.app_name) {
    context.app_name = overrides.name;
  }

  if (overrides.framework && !context.frontend_framework) {
    context.frontend_framework = overrides.framework;
  }

  if (overrides.framework && !context.app_framework) {
    context.app_framework = overrides.framework;
  }

  if (overrides.app_domains && !context.app_domains) {
    context.app_domains = overrides.app_domains;
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
  };

  const copierCommand = process.env.COPIER_COMMAND ?? "copier";
  const command = `${copierCommand} copy "${PROJECT_ROOT}" "${outputPath}" --data-file "${dataFilePath}" --force --defaults`;

  let success = true;
  let errorMessage: string | undefined;

  try {
    await execAsync(command, { env, maxBuffer: 1024 * 1024 * 20 });
  } catch (error) {
    success = false;
    const execError = error as { stderr?: string; stdout?: string; message?: string } | undefined;
    if (execError?.stderr) {
      errorMessage = execError.stderr.trim();
      process.stderr.write(`${errorMessage}
`);
    } else if (execError?.message) {
      errorMessage = execError.message;
      process.stderr.write(`${errorMessage}
`);
    } else {
      errorMessage = 'Generator execution failed';
      process.stderr.write(`${errorMessage}
`);
    }
  } finally {
    await fs.promises.rm(dataFilePath, { force: true });
  }

  if (!success) {
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
  } catch (error: any) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }
}

