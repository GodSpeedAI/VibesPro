/**
 * Tests for the meta-generator.
 * @traceability DEV-PRD-019
 */

import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import generatorGenerator from '../../generators/generator/generator';

describe('generator generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate basic generator structure', async () => {
    await generatorGenerator(tree, {
      name: 'my-feature',
    });

    // Verify core files exist
    expect(tree.exists('generators/my-feature/generator.ts')).toBeTruthy();
    expect(tree.exists('generators/my-feature/schema.json')).toBeTruthy();
    expect(tree.exists('generators/my-feature/schema.d.ts')).toBeTruthy();
    expect(tree.exists('generators/my-feature/generators.json')).toBeTruthy();
    expect(tree.exists('generators/my-feature/package.json')).toBeTruthy();
    expect(tree.exists('generators/my-feature/README.md')).toBeTruthy();
  });

  it('should generate with hexagonal patterns when requested', async () => {
    await generatorGenerator(tree, {
      name: 'order-aggregate',
      type: 'domain',
      withHexagonal: true,
    });

    expect(tree.exists('generators/order-aggregate/generator.ts')).toBeTruthy();
    expect(tree.exists('generators/order-aggregate/schema.json')).toBeTruthy();
  });

  it('should generate tests when requested', async () => {
    await generatorGenerator(tree, {
      name: 'test-gen',
      withTests: true,
    });

    expect(tree.exists('generators/test-gen/generator.spec.ts')).toBeTruthy();
  });

  it('should generate spec documentation when requested', async () => {
    await generatorGenerator(tree, {
      name: 'doc-gen',
      withSpec: true,
    });

    expect(tree.exists('docs/specs/generators/doc-gen.generator.spec.md')).toBeTruthy();
  });

  it('should validate kebab-case name', async () => {
    await expect(
      generatorGenerator(tree, {
        name: 'InvalidName',
      }),
    ).rejects.toThrow(/must be kebab-case/);
  });

  it('should require composition generators when composition is enabled', async () => {
    await expect(
      generatorGenerator(tree, {
        name: 'composed-gen',
        withComposition: true,
        // Missing compositionGenerators
      }),
    ).rejects.toThrow(/must provide --compositionGenerators/);
  });

  it('should generate correct generators.json structure', async () => {
    await generatorGenerator(tree, {
      name: 'my-gen',
      description: 'Test generator description',
    });

    const generatorsJson = readJson(tree, 'generators/my-gen/generators.json');
    expect(generatorsJson.generators['my-gen']).toBeDefined();
    expect(generatorsJson.generators['my-gen'].factory).toBe('./generator');
    expect(generatorsJson.generators['my-gen'].schema).toBe('./schema.json');
  });

  it('should be idempotent (no diff on second run)', async () => {
    // First run
    await generatorGenerator(tree, { name: 'idem-gen' });

    // Capture state
    const firstRunFiles = tree.listChanges().map((c) => ({
      path: c.path,
      content: c.content?.toString(),
    }));

    // Create fresh tree with same files
    const tree2 = createTreeWithEmptyWorkspace();
    firstRunFiles.forEach((f) => {
      if (f.content !== undefined) {
        tree2.write(f.path, f.content);
      }
    });

    const normalizeChange = (change: { path: string; type: string; content?: Buffer | null }) => ({
      path: change.path,
      type: change.type,
      content: change.content?.toString() ?? null,
    });

    const beforeSecondRunChanges = tree2.listChanges().map((change) => normalizeChange(change));

    // Second run
    await generatorGenerator(tree2, { name: 'idem-gen' });

    const afterSecondRunChanges = tree2.listChanges().map((change) => normalizeChange(change));

    const baselineSet = new Set(beforeSecondRunChanges.map((change) => JSON.stringify(change)));
    const newOrModifiedChanges = afterSecondRunChanges.filter(
      (change) => !baselineSet.has(JSON.stringify(change)),
    );
    expect(newOrModifiedChanges).toHaveLength(0);

    // Verify no destructive changes occurred
    expect(tree2.exists('generators/idem-gen/generator.ts')).toBeTruthy();
  });
});
