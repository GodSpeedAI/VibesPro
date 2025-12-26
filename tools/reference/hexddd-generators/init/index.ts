import { formatFiles, Tree } from '@nx/devkit';
import { updateDepConst } from '../utils/update-dep-const';

export default async function (tree: Tree, _schema?: Record<string, unknown>) {
  updateDepConst(tree, (depConst) => {
    const jokerIndex = depConst.findIndex((entry) => {
      const e = entry as unknown;
      if (typeof e !== 'object' || e === null) return false;
      const rec = e as Record<string, unknown>;
      return (
        !!rec['sourceTag'] &&
        rec['sourceTag'] === '*' &&
        !!rec['onlyDependOnLibsWithTags'] &&
        Array.isArray(rec['onlyDependOnLibsWithTags']) &&
        (rec['onlyDependOnLibsWithTags'] as unknown[]).length > 0 &&
        (rec['onlyDependOnLibsWithTags'] as unknown[])[0] === '*'
      );
    });

    if (jokerIndex !== -1) {
      depConst.splice(jokerIndex, 1);
    }

    depConst.push({
      sourceTag: 'type:app',
      onlyDependOnLibsWithTags: [
        'type:api',
        'type:feature',
        'type:ui',
        'type:domain-logic',
        'type:util',
      ],
    });

    depConst.push({
      sourceTag: 'type:api',
      onlyDependOnLibsWithTags: ['type:ui', 'type:domain-logic', 'type:util'],
    });

    depConst.push({
      sourceTag: 'type:feature',
      onlyDependOnLibsWithTags: ['type:ui', 'type:domain-logic', 'type:util'],
    });

    depConst.push({
      sourceTag: 'type:ui',
      onlyDependOnLibsWithTags: ['type:domain-logic', 'type:util'],
    });

    depConst.push({
      sourceTag: 'type:domain-logic',
      onlyDependOnLibsWithTags: ['type:util'],
    });

    depConst.push({
      sourceTag: 'domain:shared',
      onlyDependOnLibsWithTags: ['domain:shared'],
    });
  });

  await formatFiles(tree);
}
