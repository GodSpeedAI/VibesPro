import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const budgets = require("../../tools/prompt/budgets");
const lint = require("../../tools/prompt/lint");

describe("Prompt Tools Tests", () => {
  // Use an isolated temp directory for fixtures so tests don't dirty the repo
  let tmpDir: string;

  beforeAll(() => {
    const prefix = path.join(os.tmpdir(), "vibes-pro-fixtures-");
    tmpDir = fs.mkdtempSync(prefix);
  });

  afterAll(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (err) {
        // best effort cleanup; don't fail the test suite for cleanup errors

        console.warn("Could not remove temp fixtures dir:", String(err));
      }
    }
  });

  describe("Budget checks", () => {
    it("should estimate tokens correctly", () => {
      const tokens = budgets.estimateTokensByHeuristic("word ".repeat(4000));
      expect(tokens).toBeGreaterThan(0);
    });

    it("should evaluate against budget", () => {
      const tokens = budgets.estimateTokensByHeuristic("word ".repeat(4000));
      const res = budgets.evaluateAgainstBudget(tokens, "default");
      expect(["warn", "hard", "ok"]).toContain(res.level);
    });
  });

  describe("Lint checks", () => {
    it("should validate correct prompt file", () => {
      const okPrompt = path.join(tmpDir, "ok.prompt.md");
      fs.writeFileSync(
        okPrompt,
        `---\nname: test\nkind: prompt\ndomain: spec\ntask: implement\nthread: example-thread\nmatrix_ids: SAMPLE-1\n---\n# Title\nBody`,
        "utf8",
      );

      const lint1 = lint.lintPromptFile(okPrompt);
      expect(lint1.ok).toBe(true);
    });

    it("should catch bad prompt file", () => {
      const badPrompt = path.join(tmpDir, "bad.prompt.md");
      fs.writeFileSync(badPrompt, `No frontmatter\nNo title`, "utf8");

      const lint2 = lint.lintPromptFile(badPrompt);
      expect(lint2.ok).toBe(false);
      expect(lint2.findings.length).toBeGreaterThanOrEqual(1);
    });
  });
});
