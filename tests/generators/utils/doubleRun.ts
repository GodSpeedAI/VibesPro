import { Tree, GeneratorCallback } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as crypto from 'crypto';

function captureTreeState(tree: Tree): Tree {
  const capturedTree = createTreeWithEmptyWorkspace();
  for (const change of tree.listChanges()) {
    if (change.type !== 'DELETE') {
      capturedTree.write(change.path, change.content ?? '');
    }
  }
  return capturedTree;
}

export async function runGeneratorTwice<T extends object>(
  generator: (
    tree: Tree,
    options: T,
  ) => Promise<void | GeneratorCallback> | void | GeneratorCallback,
  options: T,
): Promise<{ firstRunTree: Tree; secondRunTree: Tree }> {
  const tree = createTreeWithEmptyWorkspace();

  await generator(tree, options);
  const firstRunTree = captureTreeState(tree);

  await generator(tree, options);
  const secondRunTree = captureTreeState(tree);

  return { firstRunTree, secondRunTree };
}

export function snapshotWorkspace(tree: Tree): Record<string, string> {
  const result: Record<string, string> = {};
  for (const change of tree.listChanges()) {
    if (change.type === 'DELETE') {
      continue;
    }
    result[change.path] = crypto
      .createHash('sha1')
      .update(change.content || '')
      .digest('hex');
  }
  return result;
}

export function assertNoChanges(firstRunTree: Tree, secondRunTree: Tree) {
  const firstRunChanges = snapshotWorkspace(firstRunTree);
  const secondRunChanges = snapshotWorkspace(secondRunTree);

  expect(secondRunChanges).toEqual(firstRunChanges);
}
