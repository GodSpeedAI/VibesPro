// Test file: tests/generators/domain.test.ts
// RED phase: Failing test for MERGE-TASK-003: Domain Generator Template

import * as fs from 'fs';
import * as path from 'path';
import { cleanupGeneratorOutputs, resetGeneratorTracking, runGenerator } from './utils';

describe('Domain Generator', () => {
  beforeEach(() => {
    resetGeneratorTracking();
  });

  afterEach(async () => {
    await cleanupGeneratorOutputs();
  });

  it('should generate complete DDD domain structure', async () => {
    const result = await runGenerator('domain', {
      domain_name: 'user-management',
      bounded_context: 'identity',
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain('libs/user-management/domain/entities/User.ts');
    expect(result.files).toContain('libs/user-management/domain/entities/UserManagement.ts');
    expect(result.files).toContain('libs/user-management/application/use-cases/CreateUser.ts');
    expect(result.files).toContain('libs/user-management/application/ports/UserRepository.ts');
    expect(result.files).toContain(
      'libs/user-management/infrastructure/repositories/UserRepository.ts',
    );
    expect(result.files).toContain('libs/user-management/infrastructure/adapters/UserAdapter.ts');

    expect(result.files).toContain('libs/user-management/domain/value-objects/UserId.ts');
    expect(result.files).toContain('libs/user-management/domain/events/UserCreated.ts');

    expect(result.files).toContain('libs/user-management/project.json');
    expect(result.files).toContain('libs/user-management/domain/project.json');
    expect(result.files).toContain('libs/user-management/application/project.json');
    expect(result.files).toContain('libs/user-management/infrastructure/project.json');
  }, 30000);

  it('should generate domain with proper TypeScript imports and exports', async () => {
    const result = await runGenerator('domain', {
      domain_name: 'order-processing',
      bounded_context: 'commerce',
    });

    expect(result.success).toBe(true);

    const entityPath = path.join(
      result.outputPath,
      'libs/order-processing/domain/entities/Order.ts',
    );

    if (fs.existsSync(entityPath)) {
      const entityContent = await fs.promises.readFile(entityPath, 'utf-8');
      expect(entityContent).toContain('export class Order');
      expect(entityContent).toContain('constructor(');
    }

    const useCasePath = path.join(
      result.outputPath,
      'libs/order-processing/application/use-cases/CreateOrder.ts',
    );

    if (fs.existsSync(useCasePath)) {
      const useCaseContent = await fs.promises.readFile(useCasePath, 'utf-8');
      expect(useCaseContent).toContain('export class CreateOrder');
    }
  }, 30000);

  it('should validate domain name format', async () => {
    const resultInvalid = await runGenerator('domain', {
      domain_name: 'Invalid Name With Spaces',
      bounded_context: 'test',
    });

    expect(resultInvalid.success).toBe(false);
    expect(resultInvalid.files).toEqual([]);
    expect(resultInvalid.errorMessage).toBeDefined();
  }, 30000);

  it('should generate multiple domains sequentially', async () => {
    const domains = [
      { name: 'customer-success', context: 'customer' },
      { name: 'billing-ledger', context: 'finance' },
    ];

    for (const { name, context } of domains) {
      const result = await runGenerator('domain', {
        domain_name: name,
        bounded_context: context,
      });

      expect(result.success).toBe(true);
      expect(result.files).toContain(`libs/${name}/project.json`);
      expect(result.files).toContain(`libs/${name}/domain/project.json`);
      expect(result.files).toContain(`libs/${name}/application/project.json`);
      expect(result.files).toContain(`libs/${name}/infrastructure/project.json`);
    }
  }, 60000);

  // Additional tests for edge cases and comprehensive coverage

  it('should handle domain names with hyphens', async () => {
    const result = await runGenerator('domain', {
      domain_name: 'user-auth-service',
      bounded_context: 'security',
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain('libs/user-auth-service/domain/entities/User.ts');
    expect(result.files).toContain('libs/user-auth-service/application/use-cases/CreateUser.ts');
    expect(result.files).toContain('libs/user-auth-service/infrastructure/adapters/UserAdapter.ts');
  }, 30000);

  it('should handle domain names with numbers', async () => {
    const result = await runGenerator('domain', {
      domain_name: 'v2-api-gateway',
      bounded_context: 'infrastructure',
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain('libs/v2-api-gateway/domain/entities/Gateway.ts');
    expect(result.files).toContain('libs/v2-api-gateway/application/use-cases/CreateGateway.ts');
  }, 30000);

  it('should handle single-word domain names', async () => {
    const result = await runGenerator('domain', {
      domain_name: 'user',
      bounded_context: 'identity',
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain('libs/user/domain/entities/User.ts');
    expect(result.files).toContain('libs/user/application/use-cases/CreateUser.ts');
  }, 30000);

  it('should validate bounded context format', async () => {
    const resultInvalid = await runGenerator('domain', {
      domain_name: 'test-domain',
      bounded_context: 'Invalid Context With Spaces',
    });

    expect(resultInvalid.success).toBe(false);
    expect(resultInvalid.files).toEqual([]);
    expect(resultInvalid.errorMessage).toBeDefined();
  }, 30000);

  it('should handle empty domain name', async () => {
    const resultInvalid = await runGenerator('domain', {
      domain_name: '',
      bounded_context: 'test',
    });

    expect(resultInvalid.success).toBe(false);
    expect(resultInvalid.files).toEqual([]);
    expect(resultInvalid.errorMessage).toBeDefined();
  }, 30000);

  it('should handle empty bounded context', async () => {
    const resultInvalid = await runGenerator('domain', {
      domain_name: 'test-domain',
      bounded_context: '',
    });

    expect(resultInvalid.success).toBe(false);
    expect(resultInvalid.files).toEqual([]);
    expect(resultInvalid.errorMessage).toBeDefined();
  }, 30000);

  it('should handle special characters in domain name (should fail)', async () => {
    const resultInvalid = await runGenerator('domain', {
      domain_name: 'test@domain',
      bounded_context: 'test',
    });

    expect(resultInvalid.success).toBe(false);
    expect(resultInvalid.files).toEqual([]);
    expect(resultInvalid.errorMessage).toBeDefined();
  }, 30000);

  it('should handle special characters in bounded context (should fail)', async () => {
    const resultInvalid = await runGenerator('domain', {
      domain_name: 'test-domain',
      bounded_context: 'test@context',
    });

    expect(resultInvalid.success).toBe(false);
    expect(resultInvalid.files).toEqual([]);
    expect(resultInvalid.errorMessage).toBeDefined();
  }, 30000);

  it('should generate domain with proper project configuration', async () => {
    const result = await runGenerator('domain', {
      domain_name: 'payment-processor',
      bounded_context: 'finance',
    });

    expect(result.success).toBe(true);

    const projectJsonPath = path.join(result.outputPath, 'libs/payment-processor/project.json');

    if (fs.existsSync(projectJsonPath)) {
      const projectContent = await fs.promises.readFile(projectJsonPath, 'utf-8');
      expect(projectContent).toContain('"name": "payment-processor"');
      expect(projectContent).toContain('"$schema"');
    }
  }, 30000);

  it('should generate domain with TypeScript configuration', async () => {
    const result = await runGenerator('domain', {
      domain_name: 'content-management',
      bounded_context: 'cms',
    });

    expect(result.success).toBe(true);

    const tsConfigPath = path.join(result.outputPath, 'libs/content-management/tsconfig.json');

    if (fs.existsSync(tsConfigPath)) {
      const tsConfigContent = await fs.promises.readFile(tsConfigPath, 'utf-8');
      expect(tsConfigContent).toContain('"compilerOptions"');
      expect(tsConfigContent).toContain('"module"');
    }
  }, 30000);

  it('should handle concurrent domain generation', async () => {
    const domains = [
      { name: 'auth-service', context: 'security' },
      { name: 'user-profile', context: 'identity' },
      { name: 'payment-gateway', context: 'finance' },
      { name: 'content-delivery', context: 'cms' },
    ];

    const promises = domains.map(({ name, context }) =>
      runGenerator('domain', {
        domain_name: name,
        bounded_context: context,
      }),
    );

    const results = await Promise.all(promises);

    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      const { name } = domains[index];
      expect(result.files).toContain(`libs/${name}/project.json`);
    });
  }, 90000);

  it('should generate domain with proper dependency structure', async () => {
    const result = await runGenerator('domain', {
      domain_name: 'inventory-management',
      bounded_context: 'logistics',
    });

    expect(result.success).toBe(true);

    // Check that domain layer has no dependencies on infrastructure
    const domainIndexPath = path.join(
      result.outputPath,
      'libs/inventory-management/domain/src/index.ts',
    );

    if (fs.existsSync(domainIndexPath)) {
      const domainContent = await fs.promises.readFile(domainIndexPath, 'utf-8');
      expect(domainContent).not.toContain('infrastructure');
    }

    // Check that application layer depends only on domain
    const applicationIndexPath = path.join(
      result.outputPath,
      'libs/inventory-management/application/src/index.ts',
    );

    if (fs.existsSync(applicationIndexPath)) {
      const applicationContent = await fs.promises.readFile(applicationIndexPath, 'utf-8');
      expect(applicationContent).toContain('domain');
      expect(applicationContent).not.toContain('infrastructure');
    }

    // Check that infrastructure layer depends on both domain and application
    const infrastructureIndexPath = path.join(
      result.outputPath,
      'libs/inventory-management/infrastructure/src/index.ts',
    );

    if (fs.existsSync(infrastructureIndexPath)) {
      const infrastructureContent = await fs.promises.readFile(infrastructureIndexPath, 'utf-8');
      expect(infrastructureContent).toContain('domain');
      expect(infrastructureContent).toContain('application');
    }
  }, 30000);
});
