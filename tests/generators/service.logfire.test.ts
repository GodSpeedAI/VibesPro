import * as fs from 'fs';
import * as path from 'path';
import { cleanupGeneratorOutputs, runGenerator } from './utils';

describe('Service Generator Logfire Integration', () => {
  afterEach(async () => {
    await cleanupGeneratorOutputs();
  });

  it('wires bootstrap_logfire and configure_logger for Python services', async () => {
    const result = await runGenerator('service', {
      name: 'observability-demo',
      language: 'python',
    });

    expect(result.success).toBe(true);

    const mainPath = path.join(result.outputPath, 'apps/observability-demo/src/main.py');

    expect(fs.existsSync(mainPath)).toBe(true);
    const contents = await fs.promises.readFile(mainPath, 'utf-8');

    expect(contents).toContain('bootstrap_logfire');
    expect(contents).toContain('configure_logger("observability-demo")');
    expect(contents).toContain('LogCategory.APP');
  }, 60000);
});
