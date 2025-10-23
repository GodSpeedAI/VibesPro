/**
 * Copier generation utilities for integration tests.
 *
 * Phase: PHASE-001 / TASK-002
 * Traceability: AI_ADR-003, AI_PRD-002, AI_SDS-002, AI_TS-005
 */

import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type CopierAnswers = Record<string, string | number | boolean>;

export interface GeneratedWorkspace {
  readonly path: string;
  cleanup(): Promise<void>;
}

export interface GenerateWorkspaceOptions {
  readonly answers?: CopierAnswers;
  readonly dataFile?: string;
  readonly defaults?: boolean;
  readonly force?: boolean;
}

const DEFAULT_DATA_FILE = "tests/fixtures/test-data.yml";

const serializeAnswer = (value: string | number | boolean): string => {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
};

export const generateWorkspace = async (
  options: GenerateWorkspaceOptions = {},
): Promise<GeneratedWorkspace> => {
  const workspacePath = await fs.mkdtemp(join(tmpdir(), "vibes-copier-"));

  const args: string[] = [
    "copy",
    ".",
    workspacePath,
    "--data-file",
    options.dataFile ?? DEFAULT_DATA_FILE,
    "--trust", // Allow tasks to run
  ];

  if (options.defaults !== false) {
    args.push("--defaults");
  }

  if (options.force !== false) {
    args.push("--force");
  }

  for (const [key, value] of Object.entries(options.answers ?? {})) {
    args.push("--data", `${key}=${serializeAnswer(value)}`);
  }

  const result = spawnSync("copier", args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      COPIER_SKIP_PROJECT_SETUP: "1", // Skip heavy setup steps in tests
    },
  });

  if (result.status !== 0) {
    throw new Error(
      `Copier generation failed with status ${result.status ?? -1}`,
    );
  }

  return {
    path: workspacePath,
    cleanup: async () => {
      await fs.rm(workspacePath, { recursive: true, force: true });
    },
  };
};
