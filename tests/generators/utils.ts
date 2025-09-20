import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { rimraf } from 'rimraf';

const execAsync = promisify(exec);

export interface GeneratorResult {
  files: string[];
  success: boolean;
  outputPath: string;
}

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const TEST_OUTPUT_ROOT = path.join(os.tmpdir(), 'vibespro-generator-tests');

const BASE_CONTEXT = {
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
};

function serializeValue(key: string, value: any): string {
  if (Array.isArray(value)) {
    const serialized = value.map((item) => `  - "${item}"`).join('\n');
    return `${key}:\n${serialized}`;
  }

  if (typeof value === 'boolean' || value === null) {
    return `${key}: ${value}`;
  }

  if (typeof value === 'number') {
    return `${key}: ${value}`;
  }

  return `${key}: "${String(value)}"`;
}

function buildYaml(options: Record<string, any>): string {
  return Object.entries(options)
    .map(([key, value]) => serializeValue(key, value))
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

  const context = {
    ...BASE_CONTEXT,
    project_slug: `${BASE_CONTEXT.project_slug}-${timestamp}`,
    ...overrides,
  };

  const yamlData = buildYaml(context);
  await fs.promises.writeFile(dataFilePath, yamlData, 'utf-8');

  const env = {
    ...process.env,
    COPIER_SKIP_PROJECT_SETUP: '1',
    COPIER_SILENT: '1',
  };

  try {
    await execAsync(
      `copier copy ${PROJECT_ROOT} ${outputPath} --data-file ${dataFilePath} --force --defaults`,
      { env }
    );
  } catch (error) {
    return {
      files: [],
      success: false,
      outputPath,
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
      await rimraf(path.join(TEST_OUTPUT_ROOT, entry));
    }
  } catch (error: any) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }
}

