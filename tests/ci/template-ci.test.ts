/**
 * TASK-011: Template CI Pipeline Update Tests
 *
 * Verifies that generated project CI workflows include all required automation steps.
 *
 * Traceability: AI_ADR-005, AI_PRD-005, AI_SDS-004, AI_TS-003, AI_TS-004, AI_TS-005
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

interface WorkflowStep {
  name?: string;
  run?: string;
  uses?: string;
  with?: Record<string, string>;
}

interface WorkflowJob {
  steps?: WorkflowStep[];
}

interface WorkflowContent {
  jobs?: Record<string, WorkflowJob>;
  permissions?: {
    contents?: string;
  };
}

const TEMPLATE_WORKFLOWS_DIR = join(
  __dirname,
  '../../templates/{{project_slug}}/.github/workflows',
);

describe('TASK-011: Template CI Pipeline Validation', () => {
  describe('Workflow File Structure', () => {
    it('should have spec-guard.yml workflow', () => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, 'spec-guard.yml');
      expect(existsSync(workflowPath)).toBe(true);
    });

    it('should have node-tests.yml workflow', () => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, 'node-tests.yml');
      expect(existsSync(workflowPath)).toBe(true);
    });

    it('should have markdownlint.yml workflow', () => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, 'markdownlint.yml');
      expect(existsSync(workflowPath)).toBe(true);
    });
  });

  describe('Spec Guard Workflow Steps', () => {
    let workflowContent: WorkflowContent;

    beforeAll(() => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, 'spec-guard.yml');
      const content = readFileSync(workflowPath, 'utf-8');
      workflowContent = parse(content) as WorkflowContent;
    });

    it('should run just test-generation command', () => {
      const ciJob = workflowContent.jobs?.ci;
      if (!ciJob) {
        throw new Error('ci job not found');
      }

      const steps = ciJob.steps ?? [];
      const testGenStep = steps.find(
        (step: WorkflowStep) =>
          step.run?.includes('just test-generation') ??
          step.name?.toLowerCase().includes('test generation'),
      );

      expect(testGenStep).toBeDefined();
    });

    it('should run pnpm prompt:lint command', () => {
      const ciJob = workflowContent.jobs?.ci;
      if (!ciJob) {
        throw new Error('ci job not found');
      }

      const steps = ciJob.steps ?? [];
      const promptLintStep = steps.find(
        (step: WorkflowStep) =>
          step.run?.includes('pnpm prompt:lint') ??
          step.run?.includes('just prompt-lint') ??
          step.name?.toLowerCase().includes('lint prompt'),
      );

      expect(promptLintStep).toBeDefined();
    });

    it('should run pnpm spec:matrix command', () => {
      const ciJob = workflowContent.jobs?.ci;
      if (!ciJob) {
        throw new Error('ci job not found');
      }

      const steps = ciJob.steps ?? [];
      const specMatrixStep = steps.find(
        (step: WorkflowStep) =>
          step.run?.includes('pnpm spec:matrix') ??
          step.run?.includes('just spec-matrix') ??
          step.name?.toLowerCase().includes('traceability matrix'),
      );

      expect(specMatrixStep).toBeDefined();
    });
  });

  describe('Caching Configuration', () => {
    let specGuardWorkflow: WorkflowContent;
    let nodeTestsWorkflow: WorkflowContent;

    beforeAll(() => {
      const specGuardPath = join(TEMPLATE_WORKFLOWS_DIR, 'spec-guard.yml');
      const nodeTestsPath = join(TEMPLATE_WORKFLOWS_DIR, 'node-tests.yml');

      specGuardWorkflow = parse(readFileSync(specGuardPath, 'utf-8')) as WorkflowContent;
      nodeTestsWorkflow = parse(readFileSync(nodeTestsPath, 'utf-8')) as WorkflowContent;
    });

    it('should use setup-node-pnpm composite action in spec-guard workflow', () => {
      const ciJob = specGuardWorkflow.jobs?.ci;
      if (!ciJob) {
        throw new Error('ci job not found');
      }

      const setupStep = ciJob.steps?.find(
        (step: WorkflowStep) =>
          step.uses?.includes('setup-node-pnpm') ?? step.name?.toLowerCase().includes('setup node'),
      );

      expect(setupStep).toBeDefined();
      if (setupStep) {
        expect(setupStep.uses ?? setupStep.with).toBeDefined();
      }
    });

    it('should use setup-node-pnpm composite action in node-tests workflow', () => {
      const testJob = nodeTestsWorkflow.jobs?.test;
      if (!testJob) {
        throw new Error('test job not found');
      }

      const setupStep = testJob.steps?.find(
        (step: WorkflowStep) =>
          step.uses?.includes('setup-node-pnpm') ?? step.name?.toLowerCase().includes('setup node'),
      );

      expect(setupStep).toBeDefined();
      if (setupStep) {
        expect(setupStep.uses ?? setupStep.with).toBeDefined();
      }
    });
  });

  describe('Environment Variable Documentation', () => {
    let specGuardWorkflow: string;

    beforeAll(() => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, 'spec-guard.yml');
      const content = readFileSync(workflowPath, 'utf-8');
      specGuardWorkflow = content; // Keep as string for comment checking
    });

    it('should document environment variables in workflow comments', () => {
      // Check for comments documenting key environment variables or workflow purpose
      const hasComments =
        specGuardWorkflow.includes('# Environment') ??
        specGuardWorkflow.includes('# Spec Guard') ??
        specGuardWorkflow.includes('# CI') ??
        specGuardWorkflow.includes('# Automation');

      expect(hasComments).toBe(true);
    });
  });

  describe('Node.js Version Consistency', () => {
    let workflows: { name: string; content: WorkflowContent }[];

    beforeAll(() => {
      const workflowFiles = ['spec-guard.yml', 'node-tests.yml', 'markdownlint.yml'];

      workflows = workflowFiles.map((file) => ({
        name: file,
        content: parse(readFileSync(join(TEMPLATE_WORKFLOWS_DIR, file), 'utf-8')),
      }));
    });

    it('should use Node.js 20.x consistently across workflows', () => {
      workflows.forEach(({ name: _name, content }) => {
        const jobs = content.jobs ?? {};
        Object.entries(jobs).forEach(([_jobName, job]: [string, WorkflowJob]) => {
          const setupNodeStep = job.steps?.find((step) => step.uses?.includes('setup-node'));

          if (setupNodeStep) {
            const nodeVersion = setupNodeStep.with?.['node-version'];
            expect(nodeVersion).toMatch(/^20/);
          }
        });
      });
    });
  });

  describe('Permissions Configuration', () => {
    let nodeTestsWorkflow: WorkflowContent;

    beforeAll(() => {
      const workflowPath = join(TEMPLATE_WORKFLOWS_DIR, 'node-tests.yml');
      nodeTestsWorkflow = parse(readFileSync(workflowPath, 'utf-8')) as WorkflowContent;
    });

    it('should have explicit permissions set', () => {
      if (!nodeTestsWorkflow.permissions) {
        throw new Error('Permissions not found');
      }
      expect(nodeTestsWorkflow.permissions).toBeDefined();
      expect(nodeTestsWorkflow.permissions.contents).toBe('read');
    });
  });
});
