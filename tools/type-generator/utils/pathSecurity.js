const fs = require('fs');
const path = require('path');

const SAFE_PATH_SEGMENT_REGEX = /^[a-zA-Z0-9_.@\- ]+$/;

function sanitizePathInput(input, label) {
  if (typeof input !== 'string') {
    throw new Error(`${label} must be a string`);
  }

  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error(`${label} cannot be empty`);
  }

  if (trimmed.includes('\0')) {
    throw new Error(`${label} contains invalid characters`);
  }

  return trimmed;
}

function isPathSafe(inputPath) {
  if (typeof inputPath !== 'string') {
    return false;
  }

  if (inputPath.includes('\0')) {
    return false;
  }

  const normalized = path.normalize(inputPath);
  const segments = normalized.split(/[\\/]+/).filter(Boolean);

  if (segments.some(segment => segment === '..' || segment === '~')) {
    return false;
  }

  return segments.every(segment => SAFE_PATH_SEGMENT_REGEX.test(segment));
}

function resolveRealPath(targetPath) {
  const candidate = path.resolve(targetPath);
  try {
    return fs.realpathSync(candidate);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return candidate;
    }
    throw error;
  }
}

function buildAllowedRoots(workspace, allowedRoots = []) {
  const roots = new Set();
  const normalizedWorkspace = resolveRealPath(workspace);
  roots.add(normalizedWorkspace);

  for (const root of allowedRoots) {
    if (typeof root !== 'string' || !root.trim()) {
      continue;
    }

    const sanitizedRoot = sanitizePathInput(root, 'allowed root');
    if (!isPathSafe(sanitizedRoot)) {
      throw new Error(`allowed root contains invalid path characters: ${root}`);
    }

    const normalized = path.normalize(sanitizedRoot);
    const absolute = path.isAbsolute(normalized)
      ? normalized
      : path.resolve(normalizedWorkspace, normalized);

    const resolvedRoot = resolveRealPath(absolute);
    roots.add(resolvedRoot);
  }

  return [...roots];
}

function ensureWithinWorkspace(resolvedPath, workspace, options = {}) {
  const allowedRoots = buildAllowedRoots(workspace, options.allowedRoots);
  const normalizedPath = resolveRealPath(resolvedPath);

  return allowedRoots.some(root => {
    const normalizedRoot = resolveRealPath(root);
    const rootWithSep = normalizedRoot.endsWith(path.sep)
      ? normalizedRoot
      : `${normalizedRoot}${path.sep}`;
    return (
      normalizedPath === normalizedRoot ||
      normalizedPath.startsWith(rootWithSep)
    );
  });
}

function resolvePathWithinWorkspace(inputPath, workspace, description, options = {}) {
  const sanitizedInput = sanitizePathInput(inputPath, description);

  if (!isPathSafe(sanitizedInput)) {
    throw new Error(`${description} contains invalid path characters: ${inputPath}`);
  }

  const normalized = path.normalize(sanitizedInput);
  if (normalized.startsWith('..')) {
    throw new Error(`${description} may not traverse outside the workspace: ${inputPath}`);
  }

  const workspaceRoot = resolveRealPath(workspace);
  const absolute = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(workspaceRoot, normalized);

  const resolvedPath = resolveRealPath(absolute);

  if (!ensureWithinWorkspace(resolvedPath, workspaceRoot, options)) {
    throw new Error(`${description} path is outside the workspace: ${inputPath}`);
  }

  return resolvedPath;
}

function assertFilenameSafe(filename, label = 'filename') {
  if (typeof filename !== 'string' || !filename.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }

  if (/[\\/]/.test(filename) || filename.includes('..')) {
    throw new Error(`Invalid ${label}: ${filename}`);
  }

  if (!SAFE_PATH_SEGMENT_REGEX.test(filename.replace(/\.[^.]+$/, ''))) {
    throw new Error(`Invalid ${label}: ${filename}`);
  }
}

module.exports = {
  assertFilenameSafe,
  ensureWithinWorkspace,
  isPathSafe,
  resolvePathWithinWorkspace,
  sanitizePathInput,
};
