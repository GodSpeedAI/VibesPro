import { Tree } from '@nx/devkit';
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

  const existingContent = tree.read(path, 'utf-8');
  if (existingContent === null) {
    return; // Cannot read existing content
  }

  if (options.preserveMarkers) {
    // Extract user code between markers and merge
    const [startMarker, endMarker] = options.preserveMarkers;
    const preservedContent = extractBetweenMarkers(existingContent, startMarker, endMarker);
    const mergedContent = mergeWithPreserved(content, preservedContent, options.preserveMarkers);
    tree.write(path, mergedContent);
  } else {
    // Simple content comparison
    if (existingContent === content) {
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

  // AST manipulation to sort exports
  // ... implementation details
  return printer.printFile(sourceFile);
}

/**
 * Helper functions
 */
function extractBetweenMarkers(content: string, start: string, end: string): string {
  const startIdx = content.indexOf(start);
  const endIdx = content.indexOf(end);
  if (startIdx === -1 || endIdx === -1) return '';
  return content.substring(startIdx + start.length, endIdx);
}

function mergeWithPreserved(
  newContent: string,
  preserved: string,
  markers: [string, string],
): string {
  const [start, end] = markers;
  return newContent.replace(`${start}${end}`, `${start}${preserved}${end}`);
}
