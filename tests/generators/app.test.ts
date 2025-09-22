// Test file: tests/generators/app.test.ts
// Test for MERGE-TASK-004: Application Generator Template

import * as fs from 'fs';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupGeneratorOutputs, runGenerator } from './utils';

// Helper function to verify API client content
async function verifyApiClientContent(filePath: string, expectedDomains: string[]): Promise<void> {
  if (fs.existsSync(filePath)) {
    const contents = await fs.promises.readFile(filePath, 'utf-8');
    for (const domain of expectedDomains) {
      expect(contents).toContain(domain);
    }
    expect(contents).toContain('DomainName');
  }
}

// Helper function to verify config file content
async function verifyConfigContent(filePath: string, expectedContent: string[]): Promise<void> {
  if (fs.existsSync(filePath)) {
    const contents = await fs.promises.readFile(filePath, 'utf-8');
    for (const content of expectedContent) {
      expect(contents).toContain(content);
    }
  }
}

// Helper function to verify page content
async function verifyPageContent(filePath: string, shouldIncludeExample: boolean, shouldIncludeSupabase = false): Promise<void> {
  if (fs.existsSync(filePath)) {
    const contents = await fs.promises.readFile(filePath, 'utf-8');
    if (shouldIncludeExample) {
      expect(contents).toContain('Example Domain Integration');
      expect(contents).toContain('ExampleEntity');
      expect(contents).toContain('Welcome to');
    } else {
      expect(contents).not.toContain('Example Domain Integration');
    }
    if (shouldIncludeSupabase) {
      expect(contents.toLowerCase()).toContain('supabase');
    }
  }
}

describe('Application Generator', () => {
  afterEach(async () => {
    await cleanupGeneratorOutputs();
  });

  describe('Next.js Applications', () => {
    it('should generate Next.js applications with proper architecture', async () => {
      const result = await runGenerator('app', {
        name: 'admin-portal',
        app_framework: 'next',
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
      const nextApiClientPath = path.join(result.outputPath, 'apps/admin-portal/lib/api-client.ts');
      await verifyApiClientContent(nextApiClientPath, ['user-management', 'billing']);

      // Check Next.js configuration
      const nextConfigPath = path.join(result.outputPath, 'apps/admin-portal/next.config.js');
      await verifyConfigContent(nextConfigPath, ['experimental', 'appDir', 'NEXT_PUBLIC_SUPABASE_URL']);

      // Check main page has example integration
      const nextIndexPath = path.join(result.outputPath, 'apps/admin-portal/pages/index.tsx');
      await verifyPageContent(nextIndexPath, true);
    }, 30000);

    it('should handle no domains gracefully', async () => {
      const result = await runGenerator('app', {
        name: 'simple-app',
        app_framework: 'next',
        app_domains: '',
        include_example_page: false,
        include_supabase: false,
      });

      expect(result.success).toBe(true);
      expect(result.files).toContain('apps/simple-app/lib/api-client.ts');

      // Check API client defaults to 'core' domain
      const simpleApiClientPath = path.join(result.outputPath, 'apps/simple-app/lib/api-client.ts');
      await verifyApiClientContent(simpleApiClientPath, ['core']);
    }, 30000);
  });

  describe('Remix Applications', () => {
    it('should generate Remix applications with proper configuration', async () => {
      const result = await runGenerator('app', {
        name: 'remix-app',
        app_framework: 'remix',
        app_domains: 'content-management',
        include_example_page: false,
        include_supabase: false,
      });

      expect(result.success).toBe(true);
      expect(result.files).toContain('apps/remix-app/lib/api-client.ts');
      expect(result.files).toContain('apps/remix-app/remix.config.js');

      // Check Remix configuration
      const remixConfigPath = path.join(result.outputPath, 'apps/remix-app/remix.config.js');
      await verifyConfigContent(remixConfigPath, ['appDirectory', 'browserBuildDirectory', 'serverBuildDirectory']);

      // Check API client has single domain
      const remixApiClientPath = path.join(result.outputPath, 'apps/remix-app/lib/api-client.ts');
      await verifyApiClientContent(remixApiClientPath, ['content-management']);

      // If a routes index exists, ensure content is reasonable when example page excluded
      const remixIndexPath = path.join(result.outputPath, 'apps/remix-app/app/routes/index.tsx');
      await verifyPageContent(remixIndexPath, false);
    }, 30000);

    it('should generate Remix with example pages when requested', async () => {
      const result = await runGenerator('app', {
        name: 'remix-with-example',
        app_framework: 'remix',
        app_domains: 'user-management,billing',
        include_example_page: true,
        include_supabase: true,
      });

      expect(result.success).toBe(true);
      expect(result.files).toContain('apps/remix-with-example/app/routes/index.tsx');
      expect(result.files).toContain('apps/remix-with-example/app/lib/api-client.ts');

      // Check API client domain integration
      const remixExampleApiClientPath = path.join(result.outputPath, 'apps/remix-with-example/app/lib/api-client.ts');
      await verifyApiClientContent(remixExampleApiClientPath, ['user-management', 'billing']);

      // Check main page has example integration
      const remixExampleIndexPath = path.join(result.outputPath, 'apps/remix-with-example/app/routes/index.tsx');
      await verifyPageContent(remixExampleIndexPath, true);
    }, 30000);
  });

  describe('Expo Applications', () => {
    it('should generate Expo mobile applications with proper configuration', async () => {
      const result = await runGenerator('app', {
        name: 'mobile-app',
        app_framework: 'expo',
        app_domains: 'user-profile',
        include_example_page: false,
        include_supabase: true,
      });

      expect(result.success).toBe(true);
      expect(result.files).toContain('apps/mobile-app/lib/api-client.ts');
      expect(result.files).toContain('apps/mobile-app/app.json');

      // Check Expo configuration - get the actual project slug from the result
      const expoAppJsonPath = path.join(result.outputPath, 'apps/mobile-app/app.json');
      if (fs.existsSync(expoAppJsonPath)) {
        const contents = await fs.promises.readFile(expoAppJsonPath, 'utf-8');
        expect(contents).toContain('expo');
        expect(contents).toContain('name');
        expect(contents).toContain('slug');
        expect(contents).toContain('version');
        // Instead of checking for literal template string, check for valid bundle identifier pattern
        expect(contents).toMatch(/com\.[a-zA-Z0-9-]+\.mobile-app/);
      }

      // Check API client for mobile
      const expoApiClientPath = path.join(result.outputPath, 'apps/mobile-app/lib/api-client.ts');
      await verifyApiClientContent(expoApiClientPath, ['user-profile']);

      // If App.tsx exists, ensure example page is not present but Supabase is
      const expoAppTsxPath = path.join(result.outputPath, 'apps/mobile-app/App.tsx');
      await verifyPageContent(expoAppTsxPath, false, true);
    }, 30000);

    it('should generate Expo with example pages when requested', async () => {
      const result = await runGenerator('app', {
        name: 'expo-with-example',
        app_framework: 'expo',
        app_domains: 'user-management,billing',
        include_example_page: true,
        include_supabase: true,
      });

      expect(result.success).toBe(true);
      expect(result.files).toContain('apps/expo-with-example/App.tsx');
      expect(result.files).toContain('apps/expo-with-example/lib/api-client.ts');

      // Check API client domain integration
      const expoExampleApiClientPath = path.join(result.outputPath, 'apps/expo-with-example/lib/api-client.ts');
      await verifyApiClientContent(expoExampleApiClientPath, ['user-management', 'billing']);

      // Check App.tsx has example integration and Supabase
      const expoExampleAppTsxPath = path.join(result.outputPath, 'apps/expo-with-example/App.tsx');
      await verifyPageContent(expoExampleAppTsxPath, true, true);

      // Verify Expo-specific content checks
      const expoApiClientPath = path.join(result.outputPath, 'apps/expo-with-example/lib/api-client.ts');
      if (fs.existsSync(expoApiClientPath)) {
        const expoContents = await fs.promises.readFile(expoApiClientPath, 'utf-8');
        expect(expoContents).toContain('user-management');
        expect(expoContents).toContain('billing');
        expect(expoContents).toContain('DomainName');
      }
    }, 30000);
  });

  describe('Multi-Framework Validation', () => {
    it('should generate all required files for different frameworks', async () => {
      const frameworks = ['next', 'remix', 'expo'];

      for (const framework of frameworks) {
        const result = await runGenerator('app', {
          name: `${framework}-test`,
          app_framework: framework,
          app_domains: 'test-domain',
          include_example_page: false,
          include_supabase: false,
        });

        expect(result.success).toBe(true);
        expect(result.files).toContain(`apps/${framework}-test/lib/api-client.ts`);

        // Framework-specific files and content verification
        if (framework === 'next') {
          expect(result.files).toContain(`apps/${framework}-test/next.config.js`);
          const multiNextConfigPath = path.join(result.outputPath, `apps/${framework}-test/next.config.js`);
          await verifyConfigContent(multiNextConfigPath, ['appDir']);
        } else if (framework === 'remix') {
          expect(result.files).toContain(`apps/${framework}-test/remix.config.js`);
          const multiRemixConfigPath = path.join(result.outputPath, `apps/${framework}-test/remix.config.js`);
          await verifyConfigContent(multiRemixConfigPath, ['appDirectory']);
        } else if (framework === 'expo') {
          expect(result.files).toContain(`apps/${framework}-test/app.json`);
          const multiExpoAppJsonPath = path.join(result.outputPath, `apps/${framework}-test/app.json`);
          await verifyConfigContent(multiExpoAppJsonPath, ['expo']);
        }
      }
    }, 60000);
  });
});
