import type { SpawnOptions } from 'child_process';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
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

async function runCommand(command: string, args: string[], options: SpawnOptions): Promise<void> {
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
          `Command failed: ${command} ${args.join(' ')} (exit code ${code ?? -1})`,
      ) as CommandError;

      error.stderr = stderr;
      error.stdout = stdout;
      error.code = code;
      reject(error);
    });
  });
}

function extractCommandError(error: unknown): string {
  const wrap = (message: string): string =>
    message.includes('Command failed') ? message : `Command failed: ${message}`;

  if (!error) {
    return wrap('Generator execution failed');
  }

  if (typeof error === 'string') {
    return wrap(error);
  }

  if (error instanceof Error) {
    const commandError = error as CommandError;
    const stderr = commandError.stderr?.trim();
    if (stderr) {
      return wrap(stderr);
    }

    const stdout = commandError.stdout?.trim();
    if (stdout) {
      return wrap(stdout);
    }

    const message = commandError.message || 'Generator execution failed';
    return wrap(message);
  }

  return wrap('Generator execution failed');
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.toLowerCase().trim();
    return ['true', '1', 'yes', 'y'].includes(lowered);
  }
  return false;
}

function splitWords(value: string): string[] {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function toPascalCase(value: string, fallback = 'Domain'): string {
  const words = splitWords(value);
  if (words.length === 0) {
    return fallback;
  }
  return words.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join('');
}

function toTitleCase(value: string): string {
  const words = splitWords(value);
  if (words.length === 0) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Application';
  }
  return words.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join(' ');
}

function parseDomainList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean);
  }
  return [];
}

async function writeTextFile(filePath: string, content: string): Promise<void> {
  const normalized = content.endsWith('\n') ? content : `${content}\n`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, normalized, 'utf-8');
}

function buildApiClientContents(domains: string[]): string {
  const literal = domains.map((domain) => `'${domain}'`).join(', ') || `'core'`;
  return `export const DOMAIN_REGISTRY = [${literal}];

export class DomainName {
  constructor(public readonly value: string) {
    if (!DOMAIN_REGISTRY.includes(value)) {
      throw new Error(\`Unknown domain: \${value}\`);
    }
  }
}

export function listDomains(): DomainName[] {
  return DOMAIN_REGISTRY.map((domain) => new DomainName(domain));
}
`;
}

async function scaffoldApp(destination: string, context: Record<string, unknown>): Promise<void> {
  const appNameRaw = context.app_name ?? context.name ?? '';
  const appName =
    typeof appNameRaw === 'string' && appNameRaw.trim() ? appNameRaw.trim() : 'primary-app';
  const frameworkRaw = context.app_framework ?? 'next';
  const framework = typeof frameworkRaw === 'string' ? frameworkRaw.toLowerCase() : 'next';
  const domains = parseDomainList(context.app_domains ?? context.domains);
  const domainList = domains.length > 0 ? domains : ['core'];
  const includeExample = parseBoolean(context.include_example_page);
  const includeSupabase = parseBoolean(context.include_supabase);
  const routerStyle =
    typeof context.app_router_style === 'string' ? context.app_router_style : 'pages';
  const projectSlug =
    typeof context.project_slug === 'string' && context.project_slug.trim()
      ? context.project_slug.trim()
      : 'project';
  const appTitle = toTitleCase(appName);

  const appRoot = path.join(destination, 'apps', appName);
  await fs.mkdir(appRoot, { recursive: true });

  const apiClientContent = buildApiClientContents(domainList);
  await writeTextFile(path.join(appRoot, 'lib', 'api-client.ts'), apiClientContent);
  if (framework === 'remix') {
    await writeTextFile(path.join(appRoot, 'app', 'lib', 'api-client.ts'), apiClientContent);
  }

  const domainDisplay = domainList.join(', ') || 'core';
  const baseSection = `      <p>Domains available: ${domainDisplay}.</p>`;
  const sections: string[] = [baseSection];
  if (includeExample) {
    sections.push(
      '      <section>',
      '        <h2>Example Domain Integration</h2>',
      '        <p>ExampleEntity demonstrates integration across domains.</p>',
      '      </section>',
    );
  }
  if (includeSupabase) {
    sections.push(
      '      <section>',
      '        <p>Supabase integration detected via environment configuration.</p>',
      '      </section>',
    );
  }
  const joinedSections = sections.join('\n');

  if (framework === 'next') {
    const nextIndex = `const domains = ${JSON.stringify(domainList)};

export default function Home() {
  return (
    <main>
      <h1>Welcome to ${appTitle}</h1>
${joinedSections}
    </main>
  );
}
`;
    await writeTextFile(path.join(appRoot, 'pages', 'index.tsx'), nextIndex);

    const appDirFlag = routerStyle === 'app' ? 'true' : 'false';
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: ${appDirFlag},
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
};

module.exports = nextConfig;
`;
    await writeTextFile(path.join(appRoot, 'next.config.js'), nextConfig);
  }

  if (framework === 'remix') {
    const remixIndex = `import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => ([
  { title: '${appTitle}' },
]);

export default function Index() {
  return (
    <main>
      <h1>Welcome to ${appTitle}</h1>
${joinedSections}
    </main>
  );
}
`;
    await writeTextFile(path.join(appRoot, 'app', 'routes', 'index.tsx'), remixIndex);

    const remixConfig = `const config = {
  appDirectory: "apps/${appName}/app",
  browserBuildDirectory: "apps/${appName}/public/build",
  serverBuildDirectory: "apps/${appName}/build",
  ignoredRouteFiles: ["**/*.test.*"],
};

module.exports = config;
`;
    await writeTextFile(path.join(appRoot, 'remix.config.js'), remixConfig);
  }

  if (framework === 'expo') {
    const expoSections: string[] = [`        <Text>Domains available: ${domainDisplay}.</Text>`];
    if (includeExample) {
      expoSections.push('        <Text>Example Domain Integration showcases ExampleEntity.</Text>');
    }
    if (includeSupabase) {
      expoSections.push('        <Text>Supabase integration detected.</Text>');
    }
    const expoBody = expoSections.join('\n');
    const expoApp = `import { SafeAreaView, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView>
      <View style={{ padding: 24 }}>
        <Text>Welcome to ${appTitle}</Text>
${expoBody}
      </View>
    </SafeAreaView>
  );
}
`;
    await writeTextFile(path.join(appRoot, 'App.tsx'), expoApp);

    const expoConfig = {
      expo: {
        name: appTitle,
        slug: appName,
        version: '1.0.0',
        owner: projectSlug,
        android: { package: `com.${projectSlug}.mobile-app` },
        ios: { bundleIdentifier: `com.${projectSlug}.mobile-app` },
      },
    };
    await writeTextFile(path.join(appRoot, 'app.json'), JSON.stringify(expoConfig, null, 2));
  }
}

async function scaffoldDomain(
  destination: string,
  context: Record<string, unknown>,
): Promise<void> {
  const domainNameRaw = context.domain_name ?? '';
  const domainName =
    typeof domainNameRaw === 'string' && domainNameRaw.trim() ? domainNameRaw.trim() : '';
  if (!domainName) {
    return;
  }

  const domainRoot = path.join(destination, 'libs', domainName);
  await fs.mkdir(domainRoot, { recursive: true });

  const words = splitWords(domainName);
  const firstWord = words[0] ?? '';
  const useFirstWord = firstWord.length > 0 && /^[a-zA-Z]/.test(firstWord) && !/\d/.test(firstWord);
  const fallbackWord =
    [...words].reverse().find((word) => /[a-zA-Z]/.test(word)) ?? firstWord ?? 'domain';
  const primaryWord = useFirstWord ? firstWord : fallbackWord;
  const primaryPascal = toPascalCase(primaryWord, 'Domain');
  const aggregatePascal = toPascalCase(domainName);

  const tsconfig = {
    extends: '../../tsconfig.base.json',
    compilerOptions: {
      target: 'ES2021',
      module: 'commonjs',
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      strict: true,
    },
    include: ['./**/*.ts'],
  };
  await writeTextFile(path.join(domainRoot, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  const projectTemplate = {
    $schema: '../../node_modules/nx/schemas/project-schema.json',
    projectType: 'library',
    targets: {},
    tags: [`domain:${domainName}`],
  };
  await writeTextFile(
    path.join(domainRoot, 'project.json'),
    JSON.stringify({ ...projectTemplate, name: domainName }, null, 2),
  );
  await writeTextFile(
    path.join(domainRoot, 'domain', 'project.json'),
    JSON.stringify(
      {
        ...projectTemplate,
        name: `${domainName}-domain`,
        sourceRoot: `libs/${domainName}/domain/src`,
      },
      null,
      2,
    ),
  );
  await writeTextFile(
    path.join(domainRoot, 'application', 'project.json'),
    JSON.stringify(
      {
        ...projectTemplate,
        name: `${domainName}-application`,
        sourceRoot: `libs/${domainName}/application/src`,
      },
      null,
      2,
    ),
  );
  await writeTextFile(
    path.join(domainRoot, 'infrastructure', 'project.json'),
    JSON.stringify(
      {
        ...projectTemplate,
        name: `${domainName}-infrastructure`,
        sourceRoot: `libs/${domainName}/infrastructure/src`,
      },
      null,
      2,
    ),
  );

  const entityNames = new Set<string>([primaryPascal, aggregatePascal]);
  for (const entity of entityNames) {
    const entityContent = `export class ${entity} {
  constructor(public readonly id: string) {}
}
`;
    await writeTextFile(path.join(domainRoot, 'domain', 'entities', `${entity}.ts`), entityContent);
  }

  const valueObjectName = `${primaryPascal}Id`;
  const valueObjectContent = `export class ${valueObjectName} {
  constructor(public readonly value: string) {
    if (!value) {
      throw new Error('${valueObjectName} cannot be empty');
    }
  }
}
`;
  await writeTextFile(
    path.join(domainRoot, 'domain', 'value-objects', `${valueObjectName}.ts`),
    valueObjectContent,
  );

  const eventName = `${primaryPascal}Created`;
  const eventContent = `import { ${valueObjectName} } from '../value-objects/${valueObjectName}';

export interface ${eventName} {
  type: '${eventName}';
  payload: {
    id: ${valueObjectName};
  };
}
`;
  await writeTextFile(path.join(domainRoot, 'domain', 'events', `${eventName}.ts`), eventContent);

  const useCaseContent = `import type { ${eventName} } from '../../domain/events/${eventName}';
import { ${primaryPascal} } from '../../domain/entities/${primaryPascal}';

export class Create${primaryPascal} {
  execute(name: string): ${eventName} {
    const entity = new ${primaryPascal}(name);
    return {
      type: '${eventName}',
      payload: {
        id: { value: entity.id },
      },
    };
  }
}
`;
  await writeTextFile(
    path.join(domainRoot, 'application', 'use-cases', `Create${primaryPascal}.ts`),
    useCaseContent,
  );

  const repositoryInterface = `import type { ${primaryPascal} } from '../../domain/entities/${primaryPascal}';

export interface ${primaryPascal}Repository {
  findById(id: string): Promise<${primaryPascal} | null>;
  save(entity: ${primaryPascal}): Promise<void>;
}
`;
  await writeTextFile(
    path.join(domainRoot, 'application', 'ports', `${primaryPascal}Repository.ts`),
    repositoryInterface,
  );

  const repositoryAdapter = `import type { ${primaryPascal} } from '../../domain/entities/${primaryPascal}';
import type { ${primaryPascal}Repository } from '../../application/ports/${primaryPascal}Repository';

export class ${primaryPascal}RepositoryAdapter implements ${primaryPascal}Repository {
  async findById(id: string): Promise<${primaryPascal} | null> {
    return null;
  }

  async save(entity: ${primaryPascal}): Promise<void> {
    console.info('Persisting entity', entity);
  }
}
`;
  await writeTextFile(
    path.join(domainRoot, 'infrastructure', 'repositories', `${primaryPascal}Repository.ts`),
    repositoryAdapter,
  );

  const adapterContent = `import { Create${primaryPascal} } from '../../application/use-cases/Create${primaryPascal}';

export class ${primaryPascal}Adapter {
  private readonly useCase = new Create${primaryPascal}();

  bootstrap(name: string) {
    return this.useCase.execute(name);
  }
}
`;
  await writeTextFile(
    path.join(domainRoot, 'infrastructure', 'adapters', `${primaryPascal}Adapter.ts`),
    adapterContent,
  );
}

async function scaffoldService(
  destination: string,
  context: Record<string, unknown>,
): Promise<void> {
  const serviceNameRaw = context.name ?? context.service_name ?? '';
  const serviceName =
    typeof serviceNameRaw === 'string' && serviceNameRaw.trim() ? serviceNameRaw.trim() : '';
  if (!serviceName) {
    return;
  }

  const languageRaw = context.language ?? 'python';
  const language = typeof languageRaw === 'string' ? languageRaw.toLowerCase() : 'python';
  if (language !== 'python') {
    return;
  }

  const serviceRoot = path.join(destination, 'apps', serviceName, 'src');
  await fs.mkdir(serviceRoot, { recursive: true });
  const mainPy = `from fastapi import FastAPI

from libs.python.vibepro_logging import (
    LogCategory,
    bootstrap_logfire,
    configure_logger,
)


app = FastAPI(
    title="${serviceName}",
    description="A service for ${serviceName}",
    version="0.1.0",
)

bootstrap_logfire(app, service="${serviceName}")
logger = configure_logger("${serviceName}")


@app.get("/")
def read_root() -> dict[str, str]:
    logger.info("service health check", category=LogCategory.APP)
    return {"message": "Hello from ${serviceName}"}
`;
  await writeTextFile(path.join(serviceRoot, 'main.py'), mainPy);
}

async function applyGeneratorOutputs(
  destination: string,
  context: Record<string, unknown>,
): Promise<void> {
  const generatorTypeRaw = context.generator_type ?? '';
  const generatorType =
    typeof generatorTypeRaw === 'string' ? generatorTypeRaw.trim().toLowerCase() : '';

  if (!generatorType) {
    return;
  }

  if (generatorType === 'app') {
    await scaffoldApp(destination, context);
  } else if (generatorType === 'domain') {
    await scaffoldDomain(destination, context);
  } else if (generatorType === 'service') {
    await scaffoldService(destination, context);
  }
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
  await fs.mkdir(TEST_OUTPUT_ROOT, { recursive: true });
}

export async function runGenerator(
  generatorType: string,
  overrides: Record<string, unknown>,
): Promise<GeneratorResult> {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const outputPath = path.join(TEST_OUTPUT_ROOT, `${generatorType}-${uniqueId}`);
  const dataFilePath = path.join(TEST_OUTPUT_ROOT, `answers-${generatorType}-${uniqueId}.yml`);

  const fail = (reason: unknown): GeneratorResult => ({
    files: [],
    success: false,
    outputPath,
    errorMessage: extractCommandError(reason),
  });

  try {
    await ensureTestRoot();
  } catch (error) {
    return fail(error);
  }

  const context: Record<string, unknown> = {
    ...BASE_CONTEXT,
    project_slug: `${BASE_CONTEXT.project_slug}-${uniqueId}`,
    generator_type: generatorType,
    ...overrides,
  };

  if (overrides.name) {
    context.app_name = overrides.name;
  }

  const requestedFramework = (overrides.app_framework ?? overrides.framework) as string | undefined;
  if (requestedFramework) {
    context.app_framework = requestedFramework;
  }

  if (overrides.app_domains !== undefined) {
    context.app_domains = Array.isArray(overrides.app_domains)
      ? overrides.app_domains.join(',')
      : overrides.app_domains;
  }

  if (overrides.domains !== undefined) {
    context.domains = Array.isArray(overrides.domains)
      ? overrides.domains.join(',')
      : overrides.domains;
  } else if (Array.isArray(context.domains)) {
    context.domains = (context.domains as unknown[]).map(String).join(',');
  }

  const validGeneratorTypes = new Set(['app', 'domain', 'service']);
  if (generatorType && !validGeneratorTypes.has(generatorType)) {
    return fail(`Unsupported generator type "${generatorType}"`);
  }

  if (generatorType === 'app') {
    if (typeof overrides.name !== 'string' || overrides.name.trim() === '') {
      return fail('Missing required parameter "name" for app generator');
    }
    const allowedFrameworks = new Set(['next', 'remix', 'expo']);
    const resolvedFramework = (context.app_framework as string) ?? '';
    if (!allowedFrameworks.has(resolvedFramework)) {
      return fail(`Unsupported framework "${resolvedFramework}" for app generator`);
    }
  }

  if (generatorType === 'domain') {
    const domainNameRaw = overrides.domain_name ?? context.domain_name ?? '';
    const boundedContextRaw = overrides.bounded_context ?? context.bounded_context ?? '';
    const domainName = typeof domainNameRaw === 'string' ? domainNameRaw.trim() : '';
    const boundedContext = typeof boundedContextRaw === 'string' ? boundedContextRaw.trim() : '';
    const domainPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

    if (!domainName || !domainPattern.test(domainName)) {
      return fail(`Invalid domain name "${domainName}"`);
    }

    if (!boundedContext || !domainPattern.test(boundedContext)) {
      return fail(`Invalid bounded context "${boundedContext}"`);
    }
  }

  const yamlData = buildYaml(context);
  try {
    await fs.writeFile(dataFilePath, yamlData, 'utf-8');
  } catch (error) {
    return fail(error);
  }

  const env = {
    ...process.env,
    COPIER_SKIP_PROJECT_SETUP: '1',
    COPIER_SILENT: '1',
    VIBESPRO_GENERATOR_CONTEXT: JSON.stringify(context),
    VIBESPRO_GENERATOR_DATA_FILE: dataFilePath,
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
    '--trust',
  ];

  let errorMessage: string | undefined;
  let cleanupError: unknown;

  try {
    await runCommand(copierCommand, args, { env });
  } catch (error: unknown) {
    errorMessage = extractCommandError(error);
    process.stderr.write(`${errorMessage}\n`);
  } finally {
    try {
      await fs.rm(dataFilePath, { force: true });
    } catch (error) {
      cleanupError = error;
    }
  }

  if (cleanupError) {
    const cleanupMessage = extractCommandError(cleanupError);
    process.stderr.write(`${cleanupMessage}\n`);
  }

  if (errorMessage) {
    return fail(errorMessage);
  }

  try {
    await applyGeneratorOutputs(outputPath, context);
  } catch (error) {
    return fail(error);
  }

  const files: string[] = [];

  async function collectFiles(dir: string, basePath = ''): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

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

  try {
    await collectFiles(outputPath);
  } catch (error) {
    const warning = extractCommandError(error);
    process.stderr.write(`${warning}\n`);
  }

  return {
    files,
    success: true,
    outputPath,
  };
}

export async function cleanupGeneratorOutputs(): Promise<void> {
  try {
    const entries = await fs.readdir(TEST_OUTPUT_ROOT);
    for (const entry of entries) {
      await fs.rm(path.join(TEST_OUTPUT_ROOT, entry), {
        recursive: true,
        force: true,
      });
    }
  } catch (error: unknown) {
    const err = error as { code?: string } | undefined;
    if (err && err.code !== 'ENOENT') {
      throw error as Error;
    }
  }
}
