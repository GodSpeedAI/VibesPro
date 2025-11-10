import { Tree, formatFiles, joinPathFragments, names } from '@nx/devkit';
import { ApiServiceGeneratorSchema } from './schema';

async function tryGenerateFastAPIApp(tree: Tree, options: ApiServiceGeneratorSchema) {
  try {
    const { fastApiApplicationGenerator } = require('@nxlv/python');
    const appNames = names(options.name);
    const directory = joinPathFragments(options.directory || 'apps', appNames.fileName);
    
    await fastApiApplicationGenerator(tree, {
      name: appNames.fileName,
      directory,
      tags: options.tags,
    });
  } catch (e) {
    console.warn('[api-service] @nxlv/python not available or failed, creating manual structure');
    createManualFastAPIStructure(tree, options);
  }
}

function createManualFastAPIStructure(tree: Tree, options: ApiServiceGeneratorSchema) {
  const appNames = names(options.name);
  const projectRoot = joinPathFragments(options.directory || 'apps', appNames.fileName);
  
  tree.write(
    joinPathFragments(projectRoot, 'main.py'),
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
`
  );
  
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
`
  );
  
  tree.write(joinPathFragments(projectRoot, '__init__.py'), '');
  tree.write(joinPathFragments(projectRoot, 'tests', '__init__.py'), '');
  tree.write(
    joinPathFragments(projectRoot, 'tests', 'test_main.py'),
    `"""Tests for ${options.name} service."""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
`
  );
}

async function injectLogfireBootstrap(tree: Tree, options: ApiServiceGeneratorSchema) {
  if (!options.withLogfire) return;
  
  const appNames = names(options.name);
  const projectRoot = joinPathFragments(options.directory || 'apps', appNames.fileName);
  const mainPath = joinPathFragments(projectRoot, 'main.py');
  
  if (tree.exists(mainPath)) {
    const content = tree.read(mainPath, 'utf-8') || '';
    
    if (content.includes('from libs.python.vibepro_logging import')) {
      return;
    }
    
    const logfireImports = `from libs.python.vibepro_logging import (
    bootstrap_logfire,
    configure_logger,
    LogCategory,
)

`;
    
    let updatedContent = content.replace(
      /from fastapi import FastAPI\n/,
      `from fastapi import FastAPI\n${logfireImports}`
    );
    
    updatedContent = updatedContent.replace(
      /(app = FastAPI\([^)]*\))/,
      `$1\n\nbootstrap_logfire(app, service="${options.name}")\nlogger = configure_logger("${options.name}")`
    );
    
    updatedContent = updatedContent.replace(
      /def health_check\(\) -> dict\[str, str\]:\n    """Health check endpoint."""\n/,
      `def health_check() -> dict[str, str]:
    """Health check endpoint."""
    logger.info("health check", category=LogCategory.APP)
`
    );
    
    tree.write(mainPath, updatedContent);
  }
}

async function addHexagonalStructure(tree: Tree, options: ApiServiceGeneratorSchema) {
  if (!options.withHexagonal) return;
  
  const appNames = names(options.name);
  const projectRoot = joinPathFragments(options.directory || 'apps', appNames.fileName);
  
  const dirs = [
    'domain/entities',
    'domain/value_objects',
    'application/ports',
    'application/use_cases',
    'infrastructure/adapters/in_memory',
    'infrastructure/adapters/supabase',
  ];
  
  dirs.forEach(dir => {
    const fullPath = joinPathFragments(projectRoot, dir, '__init__.py');
    tree.write(fullPath, '');
  });
  
  tree.write(
    joinPathFragments(projectRoot, 'application/ports/repository.py'),
    `"""Repository port (interface) following hexagonal architecture."""
from typing import Protocol, TypeVar, Generic
from domain.entities import Entity

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
`
  );
  
  tree.write(
    joinPathFragments(projectRoot, 'domain/entities/__init__.py'),
    `"""Domain entities following hexagonal architecture."""
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Entity:
    """Base entity with common fields."""
    id: str
    created_at: datetime
    updated_at: datetime
`
  );
}

async function configurePydanticTypeSync(tree: Tree, options: ApiServiceGeneratorSchema) {
  const appNames = names(options.name);
  const projectRoot = joinPathFragments(options.directory || 'apps', appNames.fileName);
  const schemasPath = joinPathFragments(projectRoot, 'schemas.py');
  
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
`
  );
}

async function addOpenAPIExport(tree: Tree, options: ApiServiceGeneratorSchema) {
  const appNames = names(options.name);
  const projectRoot = joinPathFragments(options.directory || 'apps', appNames.fileName);
  const mainPath = joinPathFragments(projectRoot, 'main.py');
  
  if (tree.exists(mainPath)) {
    const content = tree.read(mainPath, 'utf-8') || '';
    
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
