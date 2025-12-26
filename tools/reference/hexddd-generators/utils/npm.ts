import { Tree, readJson } from '@nx/devkit';

export function getNpmScope(tree: Tree): string {
  const { name } = tree.exists('package.json')
    ? readJson<{ name?: string }>(tree, 'package.json')
    : { name: null };

  if (name?.startsWith('@')) {
    const scope = name.split('/')[0];
    if (scope) return scope;
  }

  return '@vibes-pro';
}
