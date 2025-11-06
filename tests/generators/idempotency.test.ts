import { runGeneratorTwice, assertNoChanges } from './utils/doubleRun';
import serviceGenerator from '../../generators/service/generator';

describe('Generator idempotency', () => {
  it('service generator should be idempotent', async () => {
    const { firstRunTree, secondRunTree } = await runGeneratorTwice(serviceGenerator, {
      name: 'test-service',
      language: 'python',
    });

    assertNoChanges(firstRunTree, secondRunTree);
  });
});
