import fs from "fs/promises";
import {
  buildYaml,
  cleanupGeneratorOutputs,
  runGenerator,
  serializeValue,
} from "./utils";

describe("serializeValue", () => {
  it("serializes string values with quotes", () => {
    expect(serializeValue("name", "John")).toBe('name: "John"');
  });

  it("serializes numeric values without quotes", () => {
    expect(serializeValue("age", 30)).toBe("age: 30");
  });

  it("serializes boolean values without quotes", () => {
    expect(serializeValue("active", true)).toBe("active: true");
  });

  it("serializes null as literal null", () => {
    expect(serializeValue("metadata", null)).toBe("metadata: null");
  });

  it("serializes undefined as null to maintain stable YAML keys", () => {
    expect(serializeValue("missing", undefined)).toBe("missing: null");
  });

  it("serializes empty arrays inline", () => {
    expect(serializeValue("items", [])).toBe("items: []");
  });

  it("serializes array of primitives on multiple lines", () => {
    expect(serializeValue("tags", ["a", "b"])).toBe('tags:\n  - "a"\n  - "b"');
  });

  it("serializes objects with nested key-value pairs", () => {
    expect(serializeValue("config", { enabled: true })).toBe(
      "config:\n  enabled: true",
    );
  });
});

describe("buildYaml", () => {
  it("builds YAML from heterogeneous data", () => {
    const yaml = buildYaml({
      name: "Test",
      age: 42,
      active: false,
      tags: ["x", "y"],
      empty: [],
      optional: undefined,
      metadata: null,
      config: { retries: 3 },
    });

    expect(yaml).toContain('name: "Test"');
    expect(yaml).toContain("age: 42");
    expect(yaml).toContain("active: false");
    expect(yaml).toContain('tags:\n  - "x"\n  - "y"');
    expect(yaml).toContain("empty: []");
    expect(yaml).toContain("optional: null");
    expect(yaml).toContain("metadata: null");
    expect(yaml).toContain("config:\n  retries: 3");
  });
});

describe("runGenerator Error Handling", () => {
  beforeEach(async () => {
    // Clean up any existing test outputs before each test
    await cleanupGeneratorOutputs();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupGeneratorOutputs();
  });

  it("should handle copier command not found", async () => {
    // Set an invalid copier command to simulate command not found
    process.env.COPIER_COMMAND = "invalid-copier-command-that-does-not-exist";

    const result = await runGenerator("app", {
      name: "test-app",
      framework: "next",
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.files).toEqual([]);
    expect(result.errorMessage).toContain("Command failed");
  });

  it("should handle invalid generator type", async () => {
    const result = await runGenerator("invalid-generator-type", {
      name: "test-app",
      framework: "next",
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.files).toEqual([]);
    expect(result.errorMessage).toContain("Command failed");
  });

  it("should handle missing required parameters", async () => {
    const result = await runGenerator("app", {});

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.files).toEqual([]);
    expect(result.errorMessage).toContain("Command failed");
  });

  it("should handle invalid framework parameter", async () => {
    const result = await runGenerator("app", {
      name: "test-app",
      framework: "invalid-framework",
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.files).toEqual([]);
    expect(result.errorMessage).toContain("Command failed");
  });

  it("should handle file system errors during cleanup", async () => {
    // Mock fs.rm to throw an error during cleanup
    const originalRm = fs.rm;
    const mockRm = jest.fn().mockRejectedValue(new Error("Permission denied"));
    jest.mocked(fs.rm).mockImplementation(mockRm);

    try {
      const result = await runGenerator("app", {
        name: "test-app",
        framework: "next",
      });

      // The generator should still return success if the main command worked
      // but the cleanup error should be handled gracefully
      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);
    } finally {
      // Restore original implementation
      jest.mocked(fs.rm).mockImplementation(originalRm);
    }
  });

  it("should handle YAML file creation errors", async () => {
    // Mock fs.writeFile to throw an error
    const originalWriteFile = fs.writeFile;
    const mockWriteFile = jest.fn().mockRejectedValue(new Error("Disk full"));
    jest.mocked(fs.writeFile).mockImplementation(mockWriteFile);

    try {
      const result = await runGenerator("app", {
        name: "test-app",
        framework: "next",
      });

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeDefined();
      expect(result.files).toEqual([]);
      expect(result.errorMessage).toContain("Disk full");
    } finally {
      // Restore original implementation
      jest.mocked(fs.writeFile).mockImplementation(originalWriteFile);
    }
  });

  it("should handle directory creation errors", async () => {
    // Mock fs.mkdir to throw an error
    const originalMkdir = fs.mkdir;
    const mockMkdir = jest
      .fn()
      .mockRejectedValue(new Error("Permission denied"));
    jest.mocked(fs.mkdir).mockImplementation(mockMkdir);

    try {
      const result = await runGenerator("app", {
        name: "test-app",
        framework: "next",
      });

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeDefined();
      expect(result.files).toEqual([]);
      expect(result.errorMessage).toContain("Permission denied");
    } finally {
      // Restore original implementation
      jest.mocked(fs.mkdir).mockImplementation(originalMkdir);
    }
  });

  it("should handle file collection errors", async () => {
    // Mock fs.readdir to throw an error during file collection
    const originalReaddir = fs.readdir;
    const mockReaddir = jest
      .fn()
      .mockResolvedValueOnce(["some-file.ts"]) // First call succeeds
      .mockRejectedValueOnce(new Error("Permission denied")); // Second call fails
    jest.mocked(fs.readdir).mockImplementation(mockReaddir);

    try {
      const result = await runGenerator("app", {
        name: "test-app",
        framework: "next",
      });

      // The generator should still return success if the main command worked
      // but the file collection error should be handled gracefully
      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
    } finally {
      // Restore original implementation
      jest.mocked(fs.readdir).mockImplementation(originalReaddir);
    }
  });
});
