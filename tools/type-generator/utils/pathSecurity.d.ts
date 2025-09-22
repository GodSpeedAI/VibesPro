export interface WorkspaceGuardOptions {
  allowedRoots?: string[];
}

export function sanitizePathInput(input: unknown, label: string): string;

export function isPathSafe(inputPath: string): boolean;

export function ensureWithinWorkspace(
  resolvedPath: string,
  workspace: string,
  options?: WorkspaceGuardOptions
): boolean;

export function resolvePathWithinWorkspace(
  inputPath: string,
  workspace: string,
  description: string,
  options?: WorkspaceGuardOptions
): string;

export function assertFilenameSafe(filename: string, label?: string): void;
