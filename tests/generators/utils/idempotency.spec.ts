import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, formatFiles } from '@nx/devkit';
import { withIdempotency } from '../../../src/generators/utils/idempotency';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  formatFiles: jest.fn(),
}));

describe('withIdempotency', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();
  });

  it('should call the generator and formatFiles', async () => {
    const generator = jest.fn();
    const idempotentGenerator = withIdempotency(generator);

    await idempotentGenerator(tree, {});

    expect(generator).toHaveBeenCalledWith(tree, {});
    expect(formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should return a generator callback', async () => {
    const generator = jest.fn();
    const idempotentGenerator = withIdempotency(generator);

    const callback = await idempotentGenerator(tree, {});

    expect(callback).toBeInstanceOf(Function);
  });
});
