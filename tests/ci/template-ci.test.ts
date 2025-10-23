/**
 * TASK-011: Template CI Pipeline Update Tests
 *
 * Verifies that generated project CI workflows include all required automation steps.
 *
 * Traceability: AI_ADR-005, AI_PRD-005, AI_SDS-004, AI_TS-003, AI_TS-004, AI_TS-005
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const TEMPLATE_WORKFLOWS_DIR = join(
  __dirname,
  "../../templates/{{project_slug}}/.github/workflows",
);

describe("TASK-011: Template CI Pipeline Validation", () => {
  describe("Workflow File Structure", () => {
    it("should have spec-guard.yml workflow", () => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, "spec-guard.yml");
      expect(existsSync(workflowPath)).toBe(true);
    });

    it("should have node-tests.yml workflow", () => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, "node-tests.yml");
      expect(existsSync(workflowPath)).toBe(true);
    });

    it("should have markdownlint.yml workflow", () => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, "markdownlint.yml");
      expect(existsSync(workflowPath)).toBe(true);
    });
  });

  describe("Spec Guard Workflow Steps", () => {
    let workflowContent: any;

    beforeAll(() => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, "spec-guard.yml");
      const content = readFileSync(workflowPath, "utf-8");
      workflowContent = parse(content);
    });

    it("should run just test-generation command", () => {
      const ciJob = workflowContent.jobs?.ci;
      expect(ciJob).toBeDefined();

      const steps = ciJob.steps || [];
      const testGenStep = steps.find(
        (step: any) =>
          step.run?.includes("just test-generation") ||
          step.name?.toLowerCase().includes("test generation"),
      );

      expect(testGenStep).toBeDefined();
    });

    it("should run pnpm prompt:lint command", () => {
      const ciJob = workflowContent.jobs?.ci;
      expect(ciJob).toBeDefined();

      const steps = ciJob.steps || [];
      const promptLintStep = steps.find(
        (step: any) =>
          step.run?.includes("pnpm prompt:lint") ||
          step.run?.includes("just prompt-lint") ||
          step.name?.toLowerCase().includes("lint prompt"),
      );

      expect(promptLintStep).toBeDefined();
    });

    it("should run pnpm spec:matrix command", () => {
      const ciJob = workflowContent.jobs?.ci;
      expect(ciJob).toBeDefined();

      const steps = ciJob.steps || [];
      const specMatrixStep = steps.find(
        (step: any) =>
          step.run?.includes("pnpm spec:matrix") ||
          step.run?.includes("just spec-matrix") ||
          step.name?.toLowerCase().includes("traceability matrix"),
      );

      expect(specMatrixStep).toBeDefined();
    });
  });

  describe("Caching Configuration", () => {
    let specGuardWorkflow: any;
    let nodeTestsWorkflow: any;

    beforeAll(() => {
      const specGuardPath = join(TEMPLATE_WORKFLOWS_DIR, "spec-guard.yml");
      const nodeTestsPath = join(TEMPLATE_WORKFLOWS_DIR, "node-tests.yml");

      specGuardWorkflow = parse(readFileSync(specGuardPath, "utf-8"));
      nodeTestsWorkflow = parse(readFileSync(nodeTestsPath, "utf-8"));
    });

    it("should use setup-node-pnpm composite action in spec-guard workflow", () => {
      const ciJob = specGuardWorkflow.jobs?.ci;
      expect(ciJob).toBeDefined();

      const setupStep = ciJob.steps?.find(
        (step: any) =>
          step.uses?.includes("setup-node-pnpm") ||
          step.name?.toLowerCase().includes("setup node"),
      );

      expect(setupStep).toBeDefined();
      expect(setupStep.uses || setupStep.with).toBeDefined();
    });

    it("should use setup-node-pnpm composite action in node-tests workflow", () => {
      const testJob = nodeTestsWorkflow.jobs?.test;
      expect(testJob).toBeDefined();

      const setupStep = testJob.steps?.find(
        (step: any) =>
          step.uses?.includes("setup-node-pnpm") ||
          step.name?.toLowerCase().includes("setup node"),
      );

      expect(setupStep).toBeDefined();
      expect(setupStep.uses || setupStep.with).toBeDefined();
    });
  });

  describe("Environment Variable Documentation", () => {
    let specGuardWorkflow: any;

    beforeAll(() => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, "spec-guard.yml");
      const content = readFileSync(workflowPath, "utf-8");
      specGuardWorkflow = content; // Keep as string for comment checking
    });

    it("should document environment variables in workflow comments", () => {
      // Check for comments documenting key environment variables or workflow purpose
      const hasComments =
        specGuardWorkflow.includes("# Environment") ||
        specGuardWorkflow.includes("# Spec Guard") ||
        specGuardWorkflow.includes("# CI") ||
        specGuardWorkflow.includes("# Automation");

      expect(hasComments).toBe(true);
    });
  });

  describe("Node.js Version Consistency", () => {
    let workflows: { name: string; content: any }[];

    beforeAll(() => {
      const workflowFiles = [
        "spec-guard.yml",
        "node-tests.yml",
        "markdownlint.yml",
      ];

      workflows = workflowFiles.map((file) => ({
        name: file,
        content: parse(
          readFileSync(join(TEMPLATE_WORKFLOWS_DIR, file), "utf-8"),
        ),
      }));
    });

    it("should use Node.js 20.x consistently across workflows", () => {
      workflows.forEach(({ name, content }) => {
        const jobs = content.jobs || {};
        Object.entries(jobs).forEach(([jobName, job]: [string, any]) => {
          const setupNodeStep = job.steps?.find(
            (step: any) => step.uses?.includes("setup-node"),
          );

          if (setupNodeStep) {
            const nodeVersion = setupNodeStep.with?.["node-version"];
            expect(nodeVersion).toMatch(/^20/);
          }
        });
      });
    });
  });

  describe("Permissions Configuration", () => {
    let nodeTestsWorkflow: any;

    beforeAll(() => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, "node-tests.yml");
      nodeTestsWorkflow = parse(readFileSync(workflowPath, "utf-8"));
    });

    it("should have explicit permissions set", () => {
      expect(nodeTestsWorkflow.permissions).toBeDefined();
      expect(nodeTestsWorkflow.permissions.contents).toBe("read");
    });
  });
});
