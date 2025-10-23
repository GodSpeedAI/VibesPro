export declare const SAFE_PATH_SEGMENT_REGEX: RegExp;

export declare function sanitizePathInput(
  input: unknown,
  label: string,
): string;

export declare function isPathSafe(inputPath: unknown): inputPath is string;

export declare function ensureWithinWorkspace(
  resolvedPath: string,
  workspace: string,
  options?: {
    allowedRoots?: string[];
  },
): boolean;

export declare function resolvePathWithinWorkspace(
  inputPath: string,
  workspace: string,
  description: string,
  options?: {
    allowedRoots?: string[];
  },
): string;

export declare function assertFilenameSafe(
  filename: string,
  label?: string,
): void;
