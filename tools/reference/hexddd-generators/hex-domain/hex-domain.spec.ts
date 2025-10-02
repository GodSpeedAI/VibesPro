import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration, readJson } from '@nx/devkit';
import { hexDomainGenerator } from './generator';
import { HexDomainGeneratorSchema } from './schema';

describe('hexDomainGenerator', () => {
  let tree: Tree;
  const options: HexDomainGeneratorSchema = { name: 'test-domain' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate the domain, application, and infrastructure layers', async () => {
    await hexDomainGenerator(tree, options);

    const domainConfig = readProjectConfiguration(tree, 'test-domain-domain');
    const applicationConfig = readProjectConfiguration(tree, 'test-domain-application');
    const infrastructureConfig = readProjectConfiguration(tree, 'test-domain-infrastructure');

    expect(domainConfig).toBeDefined();
    expect(applicationConfig).toBeDefined();
    expect(infrastructureConfig).toBeDefined();
  });

  it('should set the correct tags for each layer', async () => {
    await hexDomainGenerator(tree, options);

    const domainConfig = readProjectConfiguration(tree, 'test-domain-domain');
    const applicationConfig = readProjectConfiguration(tree, 'test-domain-application');
    const infrastructureConfig = readProjectConfiguration(tree, 'test-domain-infrastructure');

    expect(domainConfig.tags).toEqual(['type:domain', 'domain:test-domain']);
    expect(applicationConfig.tags).toEqual(['type:application', 'domain:test-domain']);
    expect(infrastructureConfig.tags).toEqual(['type:infrastructure', 'domain:test-domain']);
  });

  it('should create placeholder files with marker regions', async () => {
    await hexDomainGenerator(tree, options);

    const domainIndexPath = 'libs/test-domain/domain/src/index.ts';
    const applicationIndexPath = 'libs/test-domain/application/src/index.ts';
    const infrastructureIndexPath = 'libs/test-domain/infrastructure/src/index.ts';

    expect(tree.exists(domainIndexPath)).toBe(true);
    expect(tree.exists(applicationIndexPath)).toBe(true);
    expect(tree.exists(infrastructureIndexPath)).toBe(true);

    // @ts-expect-error - Legacy generator test
    const domainFile = tree.read(domainIndexPath);
    // @ts-expect-error - Legacy generator test
    const applicationFile = tree.read(applicationIndexPath);
    // @ts-expect-error - Legacy generator test
    const infrastructureFile = tree.read(infrastructureIndexPath);
    expect(domainFile).toBeTruthy();
    expect(applicationFile).toBeTruthy();
    expect(infrastructureFile).toBeTruthy();
    const domainIndexContent = domainFile!.toString();
    const applicationIndexContent = applicationFile!.toString();
    const infrastructureIndexContent = infrastructureFile!.toString();

    expect(domainIndexContent).toContain('// DOMAIN_EXPORTS');
    expect(applicationIndexContent).toContain('// APPLICATION_EXPORTS');
    expect(infrastructureIndexContent).toContain('// INFRASTRUCTURE_EXPORTS');
  });

  it('should be idempotent', async () => {
    await hexDomainGenerator(tree, options);
    const initialTree = tree.listChanges();

    await hexDomainGenerator(tree, options);
    const subsequentTree = tree.listChanges();

    expect(initialTree).toEqual(subsequentTree);
  });
});
