import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import serviceGenerator from '../../generators/service/generator';

describe('Service Generator Structure', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should create Python service with FastAPI structure', async () => {
    await serviceGenerator(tree, {
      name: 'my-api',
      language: 'python',
    });

    // Check basic structure
    expect(tree.exists('apps/my-api/src/main.py')).toBe(true);
    expect(tree.exists('apps/my-api/src/models.py')).toBe(true);

    // Verify main.py contains FastAPI app
    const mainContent = tree.read('apps/my-api/src/main.py', 'utf-8');
    expect(mainContent).toContain('from fastapi import FastAPI');
    expect(mainContent).toContain('app = FastAPI(');
    expect(mainContent).toContain('bootstrap_logfire');
    expect(mainContent).toContain('configure_logger');
  });

  it('should create hexagonal architecture directories', async () => {
    await serviceGenerator(tree, {
      name: 'my-api',
      language: 'python',
    });

    // Check hexagonal directories
    expect(tree.exists('apps/my-api/domain/entities/.gitkeep')).toBe(true);
    expect(tree.exists('apps/my-api/domain/value_objects/.gitkeep')).toBe(true);
    expect(tree.exists('apps/my-api/application/ports/.gitkeep')).toBe(true);
    expect(tree.exists('apps/my-api/application/use_cases/.gitkeep')).toBe(true);
    expect(tree.exists('apps/my-api/infrastructure/adapters/in_memory/.gitkeep')).toBe(true);
    expect(tree.exists('apps/my-api/infrastructure/adapters/supabase/.gitkeep')).toBe(true);

    // Check repository port example
    expect(tree.exists('apps/my-api/application/ports/repository.py')).toBe(true);
    const portContent = tree.read('apps/my-api/application/ports/repository.py', 'utf-8');
    expect(portContent).toContain('class Repository(Protocol');
    expect(portContent).toContain('async def find_by_id');
    expect(portContent).toContain('async def save');
  });

  it('should be idempotent when run twice', async () => {
    // First run
    await serviceGenerator(tree, {
      name: 'my-api',
      language: 'python',
    });

    const firstMainContent = tree.read('apps/my-api/src/main.py', 'utf-8');
    const firstPortContent = tree.read('apps/my-api/application/ports/repository.py', 'utf-8');

    // Second run
    await serviceGenerator(tree, {
      name: 'my-api',
      language: 'python',
    });

    const secondMainContent = tree.read('apps/my-api/src/main.py', 'utf-8');
    const secondPortContent = tree.read('apps/my-api/application/ports/repository.py', 'utf-8');

    // Should be identical
    expect(firstMainContent).toBe(secondMainContent);
    expect(firstPortContent).toBe(secondPortContent);
  });

  it('should include Logfire bootstrap with correct service name', async () => {
    await serviceGenerator(tree, {
      name: 'user-service',
      language: 'python',
    });

    const mainContent = tree.read('apps/user-service/src/main.py', 'utf-8');

    // Check service name is used correctly
    expect(mainContent).toContain('title="user-service"');
    expect(mainContent).toContain('bootstrap_logfire(app, service="user-service")');
    expect(mainContent).toContain('configure_logger("user-service")');
  });
});
