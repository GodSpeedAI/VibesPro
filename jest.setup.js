// Jest setup file - runs before each test file
// Global test utilities and configurations

const fs = require("fs");
const path = require("path");
const os = require("os");

const {
  isPathSafe,
  sanitizePathInput,
} = require("./tools/type-generator/utils/pathSecurity");

const WORKSPACE_ROOT = (() => {
  const cwd = path.resolve(process.cwd());
  try {
    return fs.realpathSync(cwd);
  } catch (error) {
    return cwd;
  }
})();

const TEMP_ROOT = (() => {
  const tmp = os.tmpdir();
  try {
    return fs.realpathSync(tmp);
  } catch (error) {
    return path.resolve(tmp);
  }
})();

const SCRIPTS_DIR = path.join(WORKSPACE_ROOT, "scripts");
if (process.env.PATH) {
  if (!process.env.PATH.split(path.delimiter).includes(SCRIPTS_DIR)) {
    process.env.PATH = `${SCRIPTS_DIR}${path.delimiter}${process.env.PATH}`;
  }
} else {
  process.env.PATH = SCRIPTS_DIR;
}
process.env.COPIER_COMMAND = path.join(SCRIPTS_DIR, "copier");
process.env.JUST_COMMAND = path.join(SCRIPTS_DIR, "just");

function isWithinAllowedRoots(targetPath, roots) {
  const normalizedTarget = path.resolve(targetPath);
  return roots.some((root) => {
    const normalizedRoot = path.resolve(root);
    const rootWithSep = normalizedRoot.endsWith(path.sep)
      ? normalizedRoot
      : `${normalizedRoot}${path.sep}`;
    return (
      normalizedTarget === normalizedRoot ||
      normalizedTarget.startsWith(rootWithSep)
    );
  });
}

function resolveSafeTestPath(inputPath, label, { allowTemp = false } = {}) {
  const sanitized = sanitizePathInput(inputPath, label);
  if (!isPathSafe(sanitized)) {
    throw new Error(`${label} contains invalid path characters: ${inputPath}`);
  }

  const normalized = path.normalize(sanitized);
  const absolute = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(WORKSPACE_ROOT, normalized);

  const allowedRoots = allowTemp
    ? [WORKSPACE_ROOT, TEMP_ROOT]
    : [WORKSPACE_ROOT];

  if (!isWithinAllowedRoots(absolute, allowedRoots)) {
    throw new Error(
      `${label} must reside within the workspace or approved temp directory: ${inputPath}`,
    );
  }

  let realPath = absolute;
  try {
    realPath = fs.realpathSync(absolute);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw new Error(`Unable to resolve ${label}: ${absolute}`);
    }
  }

  if (!isWithinAllowedRoots(realPath, allowedRoots)) {
    throw new Error(
      `${label} must reside within the workspace or approved temp directory: ${inputPath}`,
    );
  }

  return realPath;
}

function ensureDirectory(targetPath, label, options = {}) {
  const safePath = resolveSafeTestPath(targetPath, label, options);

  if (fs.existsSync(safePath)) {
    const stats = fs.lstatSync(safePath);

    if (stats.isSymbolicLink()) {
      const actual = fs.realpathSync(safePath);
      const allowedRoots = options.allowTemp
        ? [WORKSPACE_ROOT, TEMP_ROOT]
        : [WORKSPACE_ROOT];

      if (!isWithinAllowedRoots(actual, allowedRoots)) {
        throw new Error(
          `${label} symlink must resolve within allowed roots: ${safePath}`,
        );
      }

      if (!fs.statSync(actual).isDirectory()) {
        throw new Error(
          `${label} symlink must resolve to a directory: ${safePath}`,
        );
      }

      return actual;
    }

    if (!stats.isDirectory()) {
      throw new Error(`${label} must be a directory: ${safePath}`);
    }

    return safePath;
  }

  fs.mkdirSync(safePath, { recursive: true });
  return resolveSafeTestPath(safePath, label, options);
}

// Set test timeout
jest.setTimeout(30000);

// Mock console methods in tests by default
beforeEach(() => {
  // Suppress console.log/warn/error in tests unless explicitly needed
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods after each test
  jest.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
  // Helper to create temporary directories for testing
  createTempDir: () => {
    const tempDir = fs.mkdtempSync(path.join(TEMP_ROOT, "vibes-pro-test-"));
    return resolveSafeTestPath(tempDir, "temporary directory", {
      allowTemp: true,
    });
  },

  // Helper to clean up temporary directories
  cleanupTempDir: (dirPath) => {
    const safeDir = resolveSafeTestPath(dirPath, "temporary directory", {
      allowTemp: true,
    });

    if (!fs.existsSync(safeDir)) {
      return;
    }

    const stats = fs.lstatSync(safeDir);
    const target = stats.isSymbolicLink() ? fs.realpathSync(safeDir) : safeDir;

    if (!isWithinAllowedRoots(target, [TEMP_ROOT, WORKSPACE_ROOT])) {
      throw new Error(
        `Refusing to remove directory outside allowed roots: ${target}`,
      );
    }

    if (!fs.existsSync(target)) {
      return;
    }

    const targetStats = fs.lstatSync(target);
    if (!targetStats.isDirectory()) {
      throw new Error(
        `Temporary directory must resolve to a directory: ${target}`,
      );
    }

    fs.rmSync(target, { recursive: true, force: true });
  },

  // Helper to create mock file system structure
  createMockFiles: (baseDir, structure) => {
    const safeBaseDir = ensureDirectory(baseDir, "mock file base directory", {
      allowTemp: true,
    });

    Object.entries(structure).forEach(([filePath, content]) => {
      const sanitizedPath = sanitizePathInput(filePath, "mock file path");
      if (!isPathSafe(sanitizedPath)) {
        throw new Error(
          `mock file path contains invalid characters: ${filePath}`,
        );
      }

      const normalizedRelative = path.normalize(sanitizedPath);
      if (normalizedRelative.startsWith("..")) {
        throw new Error(
          `mock file path may not traverse directories: ${filePath}`,
        );
      }

      const fullPath = path.join(safeBaseDir, normalizedRelative);
      const safeFullPath = resolveSafeTestPath(
        fullPath,
        "mock file destination",
        {
          allowTemp: true,
        },
      );

      const dir = path.dirname(safeFullPath);
      ensureDirectory(dir, "mock file directory", { allowTemp: true });

      fs.writeFileSync(safeFullPath, content);
    });
  },
};

// Add custom matchers for file system testing
expect.extend({
  toBeFile(received) {
    const safePath = resolveSafeTestPath(received, "expected file path", {
      allowTemp: true,
    });
    const pass = fs.existsSync(safePath) && fs.statSync(safePath).isFile();

    return {
      pass,
      message: () =>
        pass
          ? `expected ${safePath} not to be a file`
          : `expected ${safePath} to be a file`,
    };
  },

  toBeDirectory(received) {
    const safePath = resolveSafeTestPath(received, "expected directory path", {
      allowTemp: true,
    });
    const pass = fs.existsSync(safePath) && fs.statSync(safePath).isDirectory();

    return {
      pass,
      message: () =>
        pass
          ? `expected ${safePath} not to be a directory`
          : `expected ${safePath} to be a directory`,
    };
  },

  toHaveValidTypeScript(received) {
    const ts = require("typescript");
    const safePath = resolveSafeTestPath(
      received,
      "TypeScript validation path",
      {
        allowTemp: true,
      },
    );

    if (!fs.existsSync(safePath)) {
      return {
        pass: false,
        message: () => `File ${safePath} does not exist`,
      };
    }

    const content = fs.readFileSync(safePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      safePath,
      content,
      ts.ScriptTarget.Latest,
      true,
    );

    const diagnostics = ts.getPreEmitDiagnostics(
      ts.createProgram([safePath], { strict: true }),
    );

    const pass = diagnostics.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? `expected ${safePath} to have TypeScript errors`
          : `expected ${safePath} to be valid TypeScript, but found errors: ${diagnostics
              .map((d) => d.messageText)
              .join(", ")}`,
    };
  },
});
