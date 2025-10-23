import path from "path";
import {
  assertFilenameSafe,
  isPathSafe,
  resolvePathWithinWorkspace,
  sanitizePathInput,
} from "../utils/pathSecurity";

describe("pathSecurity utilities", () => {
  const workspace = path.resolve(__dirname, "..", "..", "..");

  it("sanitizes and resolves safe relative paths", () => {
    const sanitized = sanitizePathInput(
      "tools/type-generator",
      "workspace path",
    );
    expect(sanitized).toBe("tools/type-generator");

    const resolved = resolvePathWithinWorkspace(
      sanitized,
      workspace,
      "workspace path",
    );
    expect(resolved).toBe(path.join(workspace, "tools/type-generator"));
  });

  it("rejects traversal attempts", () => {
    expect(() =>
      sanitizePathInput("../etc/passwd", "unsafe path"),
    ).not.toThrow();
    expect(isPathSafe("../etc/passwd")).toBe(false);
    expect(() =>
      resolvePathWithinWorkspace("../etc/passwd", workspace, "unsafe path"),
    ).toThrow(/invalid path characters/);
  });

  it("validates filenames", () => {
    expect(() => assertFilenameSafe("types.ts", "type file")).not.toThrow();
    expect(() => assertFilenameSafe("../types.ts", "type file")).toThrow(
      /Invalid/,
    );
  });
});
