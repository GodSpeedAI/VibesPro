import { getCategory, loadResolvedStack } from "../../generators/_utils/stack";

describe("Stack Adapter Tests", () => {
  it("should get category from stack configuration", () => {
    const stack = {
      categories: {
        core_application_dependencies: { web_frameworks: ["fastapi"] },
      },
    };

    const result = getCategory(stack, "core_application_dependencies");
    expect(result?.web_frameworks).toEqual(["fastapi"]);
    expect(getCategory(stack, "missing")).toBeNull();
    expect(getCategory(null, "core_application_dependencies")).toBeNull();
  });

  it("should handle loadResolvedStack", () => {
    // Test loadResolvedStack (will return null as the file doesn't exist in test context)
    const resolved = loadResolvedStack("/tmp/non-existent-project");
    expect(resolved).toBeNull();
  });
});
