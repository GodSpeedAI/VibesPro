// Test file: tests/generators/app.test.ts
// Test for MERGE-TASK-004: Application Generator Template

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { runGenerator, cleanupGeneratorOutputs } from './utils';

describe('Application Generator', () => {
  afterEach(async () => {
    await cleanupGeneratorOutputs();
  });

  it('should generate Next.js applications with proper architecture', async () => {
    const result = await runGenerator('app', {
      name: 'admin-portal',
      framework: 'next',
      app_domains: 'user-management,billing',
      app_router_style: 'app',
      include_example_page: true,
      include_supabase: true,
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain('apps/admin-portal/pages/index.tsx');
    expect(result.files).toContain('apps/admin-portal/lib/api-client.ts');
    expect(result.files).toContain('apps/admin-portal/next.config.js');

    // Check API client domain integration
    const apiClientPath = path.join(result.outputPath, 'apps/admin-portal/lib/api-client.ts');
    if (fs.existsSync(apiClientPath)) {
      const contents = await fs.promises.readFile(apiClientPath, 'utf-8');
      expect(contents).toContain('user-management');
      expect(contents).toContain('billing');
      expect(contents).toContain('DomainName');
    }

    // Check Next.js configuration
    const nextConfigPath = path.join(result.outputPath, 'apps/admin-portal/next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const contents = await fs.promises.readFile(nextConfigPath, 'utf-8');
      expect(contents).toContain('experimental');
      expect(contents).toContain('appDir');
      expect(contents).toContain('NEXT_PUBLIC_SUPABASE_URL');
    }

    // Check main page has example integration
    const indexPath = path.join(result.outputPath, 'apps/admin-portal/pages/index.tsx');
    if (fs.existsSync(indexPath)) {
      const contents = await fs.promises.readFile(indexPath, 'utf-8');
      expect(contents).toContain('Example Domain Integration');
      expect(contents).toContain('ExampleEntity');
      expect(contents).toContain('Welcome to');
    }
  }, 30000);

  it('should generate Remix applications with proper configuration', async () => {
    const result = await runGenerator('app', {
      name: 'remix-app',
      framework: 'remix',
      app_domains: 'content-management',
      include_example_page: false,
      include_supabase: false,
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain('apps/remix-app/lib/api-client.ts');
    expect(result.files).toContain('apps/remix-app/remix.config.js');

    // Check Remix configuration
    const remixConfigPath = path.join(result.outputPath, 'apps/remix-app/remix.config.js');
    if (fs.existsSync(remixConfigPath)) {
      const contents = await fs.promises.readFile(remixConfigPath, 'utf-8');
      expect(contents).toContain('appDirectory');
      expect(contents).toContain('browserBuildDirectory');
      expect(contents).toContain('serverBuildDirectory');
    }

    // Check API client has single domain
    const apiClientPath = path.join(result.outputPath, 'apps/remix-app/lib/api-client.ts');
    if (fs.existsSync(apiClientPath)) {
      const contents = await fs.promises.readFile(apiClientPath, 'utf-8');
      expect(contents).toContain('content-management');
      expect(contents).toContain('DomainName');
    }
  }, 30000);

  it('should generate Expo mobile applications with proper configuration', async () => {
    const result = await runGenerator('app', {
      name: 'mobile-app',
      framework: 'expo',
      app_domains: 'user-profile',
      include_example_page: false,
      include_supabase: true,
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain('apps/mobile-app/lib/api-client.ts');
    expect(result.files).toContain('apps/mobile-app/app.json');

    // Check Expo configuration
    const appJsonPath = path.join(result.outputPath, 'apps/mobile-app/app.json');
    if (fs.existsSync(appJsonPath)) {
      const contents = await fs.promises.readFile(appJsonPath, 'utf-8');
      expect(contents).toContain('expo');
      expect(contents).toContain('name');
      expect(contents).toContain('slug');
      expect(contents).toContain('version');
      expect(contents).toContain('com.{{ project_slug }}.mobile-app');
    }

    // Check API client for mobile
    const apiClientPath = path.join(result.outputPath, 'apps/mobile-app/lib/api-client.ts');
    if (fs.existsSync(apiClientPath)) {
      const contents = await fs.promises.readFile(apiClientPath, 'utf-8');
      expect(contents).toContain('user-profile');
      expect(contents).toContain('DomainName');
    }
  }, 30000);

  it('should handle no domains gracefully', async () => {
    const result = await runGenerator('app', {
      name: 'simple-app',
      framework: 'next',
      app_domains: '',
      include_example_page: false,
      include_supabase: false,
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain('apps/simple-app/lib/api-client.ts');

    // Check API client defaults to 'core' domain
    const apiClientPath = path.join(result.outputPath, 'apps/simple-app/lib/api-client.ts');
    if (fs.existsSync(apiClientPath)) {
      const contents = await fs.promises.readFile(apiClientPath, 'utf-8');
      expect(contents).toContain('core');
      expect(contents).toContain('DomainName');
    }
  }, 30000);

  it('should generate all required files for different frameworks', async () => {
    const frameworks = ['next', 'remix', 'expo'];

    for (const framework of frameworks) {
      const result = await runGenerator('app', {
        name: `${framework}-test`,
        framework,
        app_domains: 'test-domain',
        include_example_page: false,
        include_supabase: false,
      });

      expect(result.success).toBe(true);
      expect(result.files).toContain(`apps/${framework}-test/lib/api-client.ts`);

      // Framework-specific files
      if (framework === 'next') {
        expect(result.files).toContain(`apps/${framework}-test/next.config.js`);
      } else if (framework === 'remix') {
        expect(result.files).toContain(`apps/${framework}-test/remix.config.js`);
      } else if (framework === 'expo') {
        expect(result.files).toContain(`apps/${framework}-test/app.json`);
      }
    }
  }, 60000);
});
