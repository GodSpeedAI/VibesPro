import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { apiServiceGenerator } from './generator';

describe('api-service generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('FastAPI Service Creation', () => {
    it('should create FastAPI service structure', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
      });

      expect(tree.exists('apps/test-api/main.py')).toBe(true);
      expect(tree.exists('apps/test-api/pyproject.toml')).toBe(true);
      expect(tree.exists('apps/test-api/__init__.py')).toBe(true);
    });

    it('should create health check endpoint', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
      });

      const mainContent = tree.read('apps/test-api/main.py', 'utf-8');
      expect(mainContent).toContain('def health_check()');
      expect(mainContent).toContain('FastAPI');
    });

    it('should create test structure', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
      });

      expect(tree.exists('apps/test-api/tests/__init__.py')).toBe(true);
      expect(tree.exists('apps/test-api/tests/test_main.py')).toBe(true);
    });
  });

  describe('Logfire Integration', () => {
    it('should inject Logfire bootstrap when withLogfire is true', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
        withLogfire: true,
      });

      const mainContent = tree.read('apps/test-api/main.py', 'utf-8');
      expect(mainContent).toContain('from libs.python.vibepro_logging import');
      expect(mainContent).toContain('bootstrap_logfire(app, service="test-api")');
      expect(mainContent).toContain('configure_logger("test-api")');
    });

    it('should not inject Logfire when withLogfire is false', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
        withLogfire: false,
      });

      const mainContent = tree.read('apps/test-api/main.py', 'utf-8');
      expect(mainContent).not.toContain('from libs.python.vibepro_logging import');
    });

    it('should be idempotent with Logfire injection', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
        withLogfire: true,
      });

      const firstContent = tree.read('apps/test-api/main.py', 'utf-8');
      // use firstContent to satisfy unused variable checks and ensure file exists
      expect(firstContent).toBeTruthy();

      await apiServiceGenerator(tree, {
        name: 'test-api',
        withLogfire: true,
      });

      const secondContent = tree.read('apps/test-api/main.py', 'utf-8');

      const logfireCount = ((secondContent ?? '').match(/bootstrap_logfire/g) || []).length;
      expect(logfireCount).toBe(1);
    });
  });

  describe('Hexagonal Architecture', () => {
    it('should create hexagonal directory structure when withHexagonal is true', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
        withHexagonal: true,
      });

      expect(tree.exists('apps/test-api/domain/entities/__init__.py')).toBe(true);
      expect(tree.exists('apps/test-api/domain/value_objects/__init__.py')).toBe(true);
      expect(tree.exists('apps/test-api/application/ports/__init__.py')).toBe(true);
      expect(tree.exists('apps/test-api/application/use_cases/__init__.py')).toBe(true);
      expect(tree.exists('apps/test-api/infrastructure/adapters/in_memory/__init__.py')).toBe(true);
      expect(tree.exists('apps/test-api/infrastructure/adapters/supabase/__init__.py')).toBe(true);
    });

    it('should create repository port example', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
        withHexagonal: true,
      });

      expect(tree.exists('apps/test-api/application/ports/repository.py')).toBe(true);

      const repoContent = tree.read('apps/test-api/application/ports/repository.py', 'utf-8');
      expect(repoContent).toContain('class Repository(Protocol[T])');
      expect(repoContent).toContain('async def find_by_id');
      expect(repoContent).toContain('async def save');
      expect(repoContent).toContain('async def delete');
    });

    it('should create domain entity example', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
        withHexagonal: true,
      });

      const entityContent = tree.read('apps/test-api/domain/entities/__init__.py', 'utf-8');
      expect(entityContent).toContain('@dataclass');
      expect(entityContent).toContain('class Entity');
    });

    it('should not create hexagonal structure when withHexagonal is false', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
        withHexagonal: false,
      });

      expect(tree.exists('apps/test-api/domain/entities/__init__.py')).toBe(false);
      expect(tree.exists('apps/test-api/application/ports/repository.py')).toBe(false);
    });
  });

  describe('Pydantic Type Sync', () => {
    it('should create schemas.py with base schema', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
      });

      expect(tree.exists('apps/test-api/schemas.py')).toBe(true);

      const schemasContent = tree.read('apps/test-api/schemas.py', 'utf-8');
      expect(schemasContent).toContain('class BaseSchema(BaseModel)');
      expect(schemasContent).toContain('AUTO-GENERATED from Supabase schema');
      expect(schemasContent).toContain('model_config = ConfigDict(from_attributes=True)');
    });

    it('should not duplicate schemas.py on multiple runs', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
      });

      const firstContent = tree.read('apps/test-api/schemas.py', 'utf-8');

      await apiServiceGenerator(tree, {
        name: 'test-api',
      });

      const secondContent = tree.read('apps/test-api/schemas.py', 'utf-8');
      expect(firstContent).toBe(secondContent);
    });
  });

  describe('OpenAPI Export', () => {
    it('should add OpenAPI export endpoint', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
      });

      const mainContent = tree.read('apps/test-api/main.py', 'utf-8');
      expect(mainContent).toContain('/api/openapi.json');
      expect(mainContent).toContain('def export_openapi():');
      expect(mainContent).toContain('return app.openapi()');
    });

    it('should be idempotent with OpenAPI export', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
      });

      const firstContent = tree.read('apps/test-api/main.py', 'utf-8');
      // use firstContent to satisfy unused variable checks and ensure file exists
      expect(firstContent).toBeTruthy();

      await apiServiceGenerator(tree, {
        name: 'test-api',
      });

      const secondContent = tree.read('apps/test-api/main.py', 'utf-8');

      const openapiCount = ((secondContent ?? '').match(/def export_openapi/g) || []).length;
      expect(openapiCount).toBe(1);
    });
  });

  describe('Idempotency', () => {
    it('should be fully idempotent (double-run produces same output)', async () => {
      const options = { name: 'test-api', withLogfire: true, withHexagonal: true };

      await apiServiceGenerator(tree, options);
      const firstRunChanges = tree.listChanges().map((c) => ({ path: c.path, type: c.type }));

      const tree2 = createTreeWithEmptyWorkspace();
      await apiServiceGenerator(tree2, options);
      await apiServiceGenerator(tree2, options);
      const secondRunChanges = tree2.listChanges().map((c) => ({ path: c.path, type: c.type }));

      expect(firstRunChanges.length).toBeGreaterThan(0);
      expect(secondRunChanges.length).toBe(firstRunChanges.length);
    });
  });

  describe('Custom Directory', () => {
    it('should create service in custom directory', async () => {
      await apiServiceGenerator(tree, {
        name: 'test-api',
        directory: 'services',
      });

      expect(tree.exists('services/test-api/main.py')).toBe(true);
    });
  });
});
