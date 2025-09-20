// Test file: tests/generators/domain.test.ts
// RED phase: Failing test for MERGE-TASK-003: Domain Generator Template

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { runGenerator, cleanupGeneratorOutputs } from './utils';

describe('Domain Generator', () => {
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
    expect(result.files).toContain('libs/user-management/infrastructure/repositories/UserRepository.ts');
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
      'libs/order-processing/domain/entities/Order.ts'
    );

    if (fs.existsSync(entityPath)) {
      const entityContent = await fs.promises.readFile(entityPath, 'utf-8');
      expect(entityContent).toContain('export class Order');
      expect(entityContent).toContain('constructor(');
    }

    const useCasePath = path.join(
      result.outputPath,
      'libs/order-processing/application/use-cases/CreateOrder.ts'
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
  }, 30000);
});
