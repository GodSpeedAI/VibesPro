import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';
import { webAppGenerator } from './generator';

describe('web-app generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('Next.js', () => {
    it('should create Next.js app with App Router', async () => {
      await webAppGenerator(tree, {
        name: 'test-next',
        framework: 'next',
        routerStyle: 'app',
      });

      expect(tree.exists('apps/test-next/app/page.tsx')).toBe(true);
    });

    it('should inject shared-web imports in App Router', async () => {
      await webAppGenerator(tree, {
        name: 'test-next',
        framework: 'next',
        routerStyle: 'app',
        apiClient: true,
      });

      if (tree.exists('apps/test-next/app/page.tsx')) {
        const content = tree.read('apps/test-next/app/page.tsx', 'utf-8');
        expect(content).toContain('@shared/web');
      }
    });

    it('should create api-client helper for App Router', async () => {
      await webAppGenerator(tree, {
        name: 'test-next',
        framework: 'next',
        routerStyle: 'app',
        apiClient: true,
      });

      expect(tree.exists('apps/test-next/app/lib/api-client.ts')).toBe(true);
    });

    it('should create Next.js app with Pages Router', async () => {
      await webAppGenerator(tree, {
        name: 'test-next-pages',
        framework: 'next',
        routerStyle: 'pages',
      });

      expect(tree.exists('apps/test-next-pages/pages/index.tsx')).toBe(true);
    });

    it('should be idempotent (double-run produces same output)', async () => {
      const options = { name: 'test-app', framework: 'next' as const, routerStyle: 'app' as const };

      await webAppGenerator(tree, options);
      const firstRunChanges = tree.listChanges().map((c) => ({ path: c.path, type: c.type }));

      const tree2 = createTreeWithEmptyWorkspace();
      await webAppGenerator(tree2, options);
      await webAppGenerator(tree2, options);
      const secondRunChanges = tree2.listChanges().map((c) => ({ path: c.path, type: c.type }));

      expect(firstRunChanges.length).toBeGreaterThan(0);
      expect(secondRunChanges.length).toBe(firstRunChanges.length);
    });
  });

  describe('Remix', () => {
    it('should create Remix app', async () => {
      await webAppGenerator(tree, {
        name: 'test-remix',
        framework: 'remix',
      });

      expect(tree.exists('apps/test-remix/app/routes/_index.tsx')).toBe(true);
    });

    it('should inject shared-web imports with loader pattern', async () => {
      await webAppGenerator(tree, {
        name: 'test-remix',
        framework: 'remix',
        apiClient: true,
      });

      if (tree.exists('apps/test-remix/app/routes/_index.tsx')) {
        const content = tree.read('apps/test-remix/app/routes/_index.tsx', 'utf-8');
        expect(content).toContain('@shared/web');
        expect(content).toContain('loader');
      }
    });

    it('should create api-client helper', async () => {
      await webAppGenerator(tree, {
        name: 'test-remix',
        framework: 'remix',
        apiClient: true,
      });

      expect(tree.exists('apps/test-remix/app/utils/api-client.ts')).toBe(true);
    });
  });

  describe('Expo', () => {
    it('should create Expo app', async () => {
      await webAppGenerator(tree, {
        name: 'test-expo',
        framework: 'expo',
      });

      const appExists =
        tree.exists('apps/test-expo/src/app/App.tsx') || tree.exists('apps/test-expo/App.tsx');
      expect(appExists).toBe(true);
    });

    it('should inject shared-web imports in React Native', async () => {
      await webAppGenerator(tree, {
        name: 'test-expo',
        framework: 'expo',
        apiClient: true,
      });

      const appPath = tree.exists('apps/test-expo/src/app/App.tsx')
        ? 'apps/test-expo/src/app/App.tsx'
        : 'apps/test-expo/App.tsx';

      if (tree.exists(appPath)) {
        const content = tree.read(appPath, 'utf-8');
        expect(content).toContain('@shared/web');
        expect(content).toContain('react-native');
      }
    });

    it('should create api-client helper', async () => {
      await webAppGenerator(tree, {
        name: 'test-expo',
        framework: 'expo',
        apiClient: true,
      });

      expect(tree.exists('apps/test-expo/src/utils/api-client.ts')).toBe(true);
    });
  });

  describe('Shared Web Library', () => {
    it('should create shared-web library when apiClient is enabled', async () => {
      await webAppGenerator(tree, {
        name: 'test-app',
        framework: 'next',
        apiClient: true,
      });

      expect(tree.exists('libs/shared/web/src/lib/client.ts')).toBe(true);
      expect(tree.exists('libs/shared/web/src/lib/errors.ts')).toBe(true);
      expect(tree.exists('libs/shared/web/src/lib/env.ts')).toBe(true);
      expect(tree.exists('libs/shared/web/src/lib/schemas.ts')).toBe(true);
      expect(tree.exists('libs/shared/web/src/index.ts')).toBe(true);
    });

    it('should not duplicate shared-web library on multiple runs', async () => {
      await webAppGenerator(tree, {
        name: 'test-app-1',
        framework: 'next',
        apiClient: true,
      });

      const firstContent = tree.read('libs/shared/web/src/lib/client.ts', 'utf-8');

      await webAppGenerator(tree, {
        name: 'test-app-2',
        framework: 'remix',
        apiClient: true,
      });

      const secondContent = tree.read('libs/shared/web/src/lib/client.ts', 'utf-8');

      expect(firstContent).toBe(secondContent);
    });

    it('should not create shared-web library when apiClient is false', async () => {
      await webAppGenerator(tree, {
        name: 'test-app',
        framework: 'next',
        apiClient: false,
      });

      expect(tree.exists('libs/shared/web/src/lib/client.ts')).toBe(false);
    });
  });
});
