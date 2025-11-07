import { formatFiles, GeneratorCallback, logger, Tree } from '@nx/devkit';
import * as ts from 'typescript';

/**
 * Ensures idempotent writes by checking file existence and content
 */
export function ensureIdempotentWrite(
  tree: Tree,
  path: string,
  content: string,
  options?: {
    merge?: boolean;
    preserveMarkers?: [string, string];
  },
): void {
  const exists = tree.exists(path);

  if (!exists) {
    tree.write(path, content);
    return;
  }

  if (!options?.merge) {
    // File exists, no merge requested -> skip
    return;
  }

  const existingBuffer = tree.read(path);
  if (existingBuffer === null) {
    return; // Cannot read existing content
  }
  const existingContent = existingBuffer.toString('utf-8');

  if (options.preserveMarkers) {
    // Extract user code between markers and merge
    const [startMarker, endMarker] = options.preserveMarkers;
    const preservedContent = extractBetweenMarkers(existingContent, startMarker, endMarker);
    const mergedContent = mergeWithPreserved(content, preservedContent, options.preserveMarkers);
    tree.write(path, mergedContent);
  } else {
    // Simple content comparison (normalize line endings first)
    if (normalizeLineEndings(existingContent) === normalizeLineEndings(content)) {
      return; // Already correct
    }
    tree.write(path, content);
  }
}

/**
 * Sorts exports alphabetically for deterministic output
 */
export function sortExports(sourceCode: string): string {
  const sourceFile = ts.createSourceFile('temp.ts', sourceCode, ts.ScriptTarget.Latest, true);

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const updatedStatements = sourceFile.statements.map((statement) => {
    if (!ts.isExportDeclaration(statement)) {
      return statement;
    }

    const { exportClause } = statement;
    if (!exportClause || !ts.isNamedExports(exportClause)) {
      return statement;
    }

    const sortedElements = [...exportClause.elements].sort((a, b) =>
      a.name.text.localeCompare(b.name.text),
    );

    const sameOrder = exportClause.elements.every(
      (element, idx) => element === sortedElements[idx],
    );
    if (sameOrder) {
      return statement;
    }

    const updatedExportClause = ts.factory.updateNamedExports(exportClause, sortedElements);
    return ts.factory.updateExportDeclaration(
      statement,
      statement.modifiers,
      statement.isTypeOnly,
      updatedExportClause,
      statement.moduleSpecifier,
      statement.assertClause,
    );
  });

  const updatedSourceFile = ts.factory.updateSourceFile(sourceFile, updatedStatements);
  return printer.printFile(updatedSourceFile);
}

/**
 * Higher-order function to create a configurable idempotent generator wrapper.
 * This wrapper ensures that files are formatted and a post-processing hook can be run.
 *
 * @param generator The base Nx generator function.
 * @param options Configuration for the wrapper.
 * @returns A new generator function that is idempotent.
 */
export function createIdempotentWrapper<T extends object>(
  generator: (tree: Tree, options: T) => void | Promise<void | GeneratorCallback>,
  options: {
    postProcess?: (tree: Tree, options: T) => void | Promise<void>;
    message?: string;
  },
) {
  return async (tree: Tree, genOptions: T): Promise<GeneratorCallback> => {
    logger.info(options.message || 'Running idempotent generator...');

    // Run the base generator
    const callback = await generator(tree, genOptions);

    // Always format files for deterministic output
    await formatFiles(tree);

    // Run post-processing hook if provided
    if (options.postProcess) {
      await options.postProcess(tree, genOptions);
    }

    return async () => {
      if (callback) {
        await callback();
      }
      logger.info(`Idempotent generator finished successfully: ${options.message || 'OK'}`);
    };
  };
}

/**
 * A simple HOF wrapper to make a generator idempotent by running formatFiles
 * after the generator completes. This ensures that the output is deterministic.
 *
 * @param generator The base Nx generator function to wrap.
 * @returns A new generator function that is idempotent.
 */
export function withIdempotency<T extends object>(
  generator: (tree: Tree, options: T) => void | Promise<void | GeneratorCallback>,
) {
  return createIdempotentWrapper(generator, {
    message: 'Running generator with idempotency...',
  });
}

/**
 * Helper functions
 */
function extractBetweenMarkers(content: string, start: string, end: string): string {
  const startIdx = content.indexOf(start);
  if (startIdx === -1) {
    return '';
  }
  const afterStart = startIdx + start.length;
  const endIdx = content.indexOf(end, afterStart);
  if (endIdx === -1 || endIdx <= startIdx) {
    return '';
  }
  return content.substring(afterStart, endIdx);
}

function mergeWithPreserved(
  newContent: string,
  preserved: string,
  markers: [string, string],
): string {
  const [start, end] = markers;
  const startIdx = newContent.indexOf(start);
  if (startIdx === -1) {
    return newContent;
  }
  const afterStart = startIdx + start.length;
  const endIdx = newContent.indexOf(end, afterStart);
  if (endIdx === -1) {
    return newContent;
  }

  return `${newContent.slice(0, afterStart)}${preserved}${newContent.slice(endIdx)}`;
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}
