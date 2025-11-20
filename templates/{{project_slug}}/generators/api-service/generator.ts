import { Tree, formatFiles, joinPathFragments, logger, names } from '@nx/devkit';
import { ApiServiceGeneratorSchema } from './schema';

function getModuleName(name: string): string {
  return names(name).fileName.replace(/-/g, '_');
}

function getMainFilePath(tree: Tree, projectRoot: string, moduleName: string): string {
  // Check for package structure first
  const packageMain = joinPathFragments(projectRoot, moduleName, 'main.py');
  if (tree.exists(packageMain)) return packageMain;

  // Check for root structure
  const rootMain = joinPathFragments(projectRoot, 'main.py');
  if (tree.exists(rootMain)) return rootMain;

  // Default to package structure for new files
  return packageMain;
}

async function tryGenerateFastAPIApp(tree: Tree, options: ApiServiceGeneratorSchema) {
  try {
    const uvProjectGenerator = (await import('@nxlv/python/src/generators/uv-project/generator'))
      .default;
    const appNames = names(options.name);
    const directory = joinPathFragments(options.directory ?? 'apps', appNames.fileName);

    await uvProjectGenerator(tree, {
      name: appNames.fileName,
      projectType: 'application',
      directory,
      tags: options.tags,
      description: `${options.name} service`,
      linter: 'ruff',
      unitTestRunner: 'pytest',
      buildSystem: 'hatch',
    });

    // Post-generation cleanup and setup
    const moduleName = getModuleName(options.name);
    const projectRoot = directory;

    // Remove hello.py if it exists
    const helloPath = joinPathFragments(projectRoot, moduleName, 'hello.py');
    if (tree.exists(helloPath)) {
      tree.delete(helloPath);
    }

    // Create main.py
    const mainPath = joinPathFragments(projectRoot, moduleName, 'main.py');
    createMainPy(tree, mainPath, options);

    // Add dependencies
    addFastAPIDependencies(tree, projectRoot);
  } catch (e) {
    logger.warn(
      '[api-service] @nxlv/python uv-project generator failed, creating manual structure',
    );
    // logger.error(e); // Uncomment for debugging
    createManualFastAPIStructure(tree, options);
  }
}

function createMainPy(tree: Tree, path: string, options: ApiServiceGeneratorSchema) {
  tree.write(
    path,
    `"""${options.name} FastAPI service."""
from fastapi import FastAPI

app = FastAPI(
    title="${options.name}",
    description="Service for ${options.name}",
    version="0.1.0",
)

@app.get("/")
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "${options.name}"}
`,
  );
}

function addFastAPIDependencies(tree: Tree, projectRoot: string) {
  const pyprojectPath = joinPathFragments(projectRoot, 'pyproject.toml');
  if (tree.exists(pyprojectPath)) {
    let content = tree.read(pyprojectPath, 'utf-8') ?? '';
    if (!content.includes('"fastapi>=0.104.0"')) {
      content = content.replace(
        /dependencies = \[/,
        `dependencies = [
    "fastapi>=0.104.0",
    "uvicorn>=0.24.0",
    "pydantic>=2.0.0",`,
      );
      tree.write(pyprojectPath, content);
    }
  }
}

function createManualFastAPIStructure(tree: Tree, options: ApiServiceGeneratorSchema) {
  const appNames = names(options.name);
  const projectRoot = joinPathFragments(options.directory ?? 'apps', appNames.fileName);
  const moduleName = getModuleName(options.name);

  // Create package structure
  tree.write(joinPathFragments(projectRoot, moduleName, '__init__.py'), '');
  createMainPy(tree, joinPathFragments(projectRoot, moduleName, 'main.py'), options);

  tree.write(
    joinPathFragments(projectRoot, 'pyproject.toml'),
    `[project]
name = "${options.name}"
version = "0.1.0"
description = "${options.name} service"
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn>=0.24.0",
    "pydantic>=2.0.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["${moduleName}"]
`,
  );

  tree.write(joinPathFragments(projectRoot, 'tests', '__init__.py'), '');
  tree.write(
    joinPathFragments(projectRoot, 'tests', 'test_main.py'),
    `"""Tests for ${options.name} service."""
from fastapi.testclient import TestClient
from ${moduleName}.main import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
`,
  );
}

async function injectLogfireBootstrap(tree: Tree, options: ApiServiceGeneratorSchema) {
  if (!options.withLogfire) return;

  const appNames = names(options.name);
  const projectRoot = joinPathFragments(options.directory ?? 'apps', appNames.fileName);
  const moduleName = getModuleName(options.name);
  const mainPath = getMainFilePath(tree, projectRoot, moduleName);

  if (tree.exists(mainPath)) {
    const content = tree.read(mainPath, 'utf-8') ?? '';

    // Remove any existing partial Logfire integration so we can inject a single canonical block.
    let cleaned = content
      .split('\n')
      .filter(
        (l) =>
          !l.includes('from libs.python.vibepro_logging import') &&
          !l.includes('bootstrap_logfire') &&
          !l.includes('configure_logger') &&
          !l.includes('LogCategory') &&
          !l.includes('logger ='),
      )
      .join('\n');

    const logfireImports = `from libs.python.vibepro_logging import bootstrap_logfire, configure_logger, LogCategory\n\n`;

    if (/from fastapi import FastAPI\s*/.test(cleaned)) {
      cleaned = cleaned.replace(
        /from fastapi import FastAPI\s*/,
        'from fastapi import FastAPI\n' + logfireImports,
      );
    } else {
      cleaned = logfireImports + cleaned;
    }

    if (/(app\s*=\s*FastAPI\([^\)]*\))/.test(cleaned)) {
      cleaned = cleaned.replace(
        /(app\s*=\s*FastAPI\([^\)]*\))/,
        '$1\n\nbootstrap_logfire(app, service="' +
          options.name +
          '")\nlogger = configure_logger("' +
          options.name +
          '")',
      );
    } else {
      cleaned =
        cleaned +
        '\n\nbootstrap_logfire(app, service="' +
        options.name +
        '")\nlogger = configure_logger("' +
        options.name +
        '")';
    }

    if (
      /def health_check\(\) -> dict\[str, str\]:/.test(cleaned) &&
      !/logger.info\("health check"/.test(cleaned)
    ) {
      cleaned = cleaned.replace(
        /def health_check\(\) -> dict\[str, str\]:\n\s*"""Health check endpoint."""\n/,
        `def health_check() -> dict[str, str]:\n    """Health check endpoint."""\n    logger.info("health check", category=LogCategory.APP)\n`,
      );
    }

    tree.write(mainPath, cleaned);
  }
}

async function addHexagonalStructure(tree: Tree, options: ApiServiceGeneratorSchema) {
  if (!options.withHexagonal) return;

  const appNames = names(options.name);
  const projectRoot = joinPathFragments(options.directory ?? 'apps', appNames.fileName);
  const moduleName = getModuleName(options.name);
  const packageRoot = joinPathFragments(projectRoot, moduleName);

  // Ensure package root exists (it should)
  if (!tree.exists(packageRoot)) {
    // If manual structure created root-level main.py, we might want to put hex structure in root too?
    // But we are moving to package structure.
    // If package root doesn't exist, maybe we are in legacy mode?
    // Let's assume package structure for hex as well.
    // Or better, put hex structure inside the module/package.
  }

  // Actually, for a service, the hex structure usually lives at the top level of the source,
  // which is `moduleName/` in this case.

  const dirs = [
    'domain/entities',
    'domain/value_objects',
    'application/ports',
    'application/use_cases',
    'infrastructure/adapters/in_memory',
    'infrastructure/adapters/supabase',
  ];

  dirs.forEach((dir) => {
    const fullPath = joinPathFragments(packageRoot, dir, '__init__.py');
    tree.write(fullPath, '');
  });

  tree.write(
    joinPathFragments(packageRoot, 'application/ports/repository.py'),
    `"""Repository port (interface) following hexagonal architecture."""
from typing import Protocol, TypeVar, Generic
from ${moduleName}.domain.entities import Entity

T = TypeVar('T', bound=Entity)

class Repository(Protocol[T]):
    """Generic repository protocol for domain entities."""

    async def find_by_id(self, id: str) -> T | None:
        """Find entity by ID."""
        ...

    async def save(self, entity: T) -> None:
        """Save entity."""
        ...

    async def delete(self, id: str) -> None:
        """Delete entity by ID."""
        ...
`,
  );

  tree.write(
    joinPathFragments(packageRoot, 'domain/entities/__init__.py'),
    `"""Domain entities following hexagonal architecture."""
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Entity:
    """Base entity with common fields."""
    id: str
    created_at: datetime
    updated_at: datetime
`,
  );
}

async function configurePydanticTypeSync(tree: Tree, options: ApiServiceGeneratorSchema) {
  const appNames = names(options.name);
  const projectRoot = joinPathFragments(options.directory ?? 'apps', appNames.fileName);
  const moduleName = getModuleName(options.name);
  const schemasPath = joinPathFragments(projectRoot, moduleName, 'schemas.py');

  if (tree.exists(schemasPath)) return;

  tree.write(
    schemasPath,
    `"""Pydantic schemas for ${options.name}.

AUTO-GENERATED from Supabase schema - do not edit manually.
Regenerate with: just gen-types
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class BaseSchema(BaseModel):
    """Base schema with common fields."""
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="UUID primary key")
    created_at: datetime
    updated_at: datetime

# Add your domain-specific schemas here
# They will be auto-generated from Supabase in PHASE-004
`,
  );
}

async function addOpenAPIExport(tree: Tree, options: ApiServiceGeneratorSchema) {
  const appNames = names(options.name);
  const projectRoot = joinPathFragments(options.directory ?? 'apps', appNames.fileName);
  const moduleName = getModuleName(options.name);
  const mainPath = getMainFilePath(tree, projectRoot, moduleName);

  if (tree.exists(mainPath)) {
    const content = tree.read(mainPath, 'utf-8') ?? '';

    if (content.includes('/api/openapi.json')) {
      return;
    }

    const openapiEndpoint = `

@app.get("/api/openapi.json", include_in_schema=False)
def export_openapi():
    """Export OpenAPI schema for frontend type generation."""
    return app.openapi()
`;

    tree.write(mainPath, content + openapiEndpoint);
  }
}

export async function apiServiceGenerator(tree: Tree, options: ApiServiceGeneratorSchema) {
  await tryGenerateFastAPIApp(tree, options);

  if (options.withLogfire !== false) {
    await injectLogfireBootstrap(tree, options);
  }

  if (options.withHexagonal !== false) {
    await addHexagonalStructure(tree, options);
  }

  await configurePydanticTypeSync(tree, options);
  await addOpenAPIExport(tree, options);

  await formatFiles(tree);
}

export default apiServiceGenerator;
