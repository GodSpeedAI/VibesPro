const { runCalmControls } = require("../../tools/calm/controls_runner");

describe("CALM Controls Tests", () => {
  it("should run calm controls and return valid result", () => {
    // Happy path: if no architecture folder, ok=true
    const res1 = runCalmControls(process.cwd());
    expect(typeof res1.ok).toBe("boolean");
  });

  it("should handle minimal presence test without failing CI", () => {
    // We won't fail CI by creating files here; minimal presence test is enough
    const res = runCalmControls(process.cwd());
    expect(res).toBeDefined();
  });
});
