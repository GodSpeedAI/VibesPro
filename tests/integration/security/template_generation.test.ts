/**
 * Security-hardened template generation red-phase tests.
 *
 * Phase: PHASE-006 / TASK-014
 * Traceability: AI_ADR-006, AI_PRD-006, AI_SDS-005, AI_TS-006
 */

import * as fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { runCopierGeneration } from '../../utils/generation-smoke';

describe('Security-Hardened Template Generation', () => {
  const removeWorkspace = async (workspace?: string): Promise<void> => {
    if (!workspace) {
      return;
    }

    await fsp.rm(workspace, { recursive: true, force: true });
  };

  it('includes SecureDb when hardening enabled', async () => {
    let workspace: string | undefined;

    try {
      workspace = await runCopierGeneration({
        skipPostGenSetup: true,
        project_name: 'test-secure-project',
        enable_security_hardening: true,
        encryption_backend: 'xchacha20poly1305',
      });

      const secureDbPath = join(workspace, 'libs', 'security', 'src', 'secure_db.rs');
      expect(fs.existsSync(secureDbPath)).toBe(true);

      const cargoTomlPath = join(workspace, 'libs', 'security', 'Cargo.toml');
      const cargoToml = fs.readFileSync(cargoTomlPath, 'utf-8');
      expect(cargoToml).toContain('chacha20poly1305');
    } finally {
      await removeWorkspace(workspace);
    }
  });

  it('omits security libraries when hardening disabled', async () => {
    let workspace: string | undefined;

    try {
      workspace = await runCopierGeneration({
        skipPostGenSetup: true,
        project_name: 'test-plain-project',
        enable_security_hardening: false,
      });

      const securityDir = join(workspace, 'libs', 'security');
      expect(fs.existsSync(securityDir)).toBe(false);
    } finally {
      await removeWorkspace(workspace);
    }
  });

  it('uses distroless Dockerfile with non-root user', async () => {
    let workspace: string | undefined;

    try {
      workspace = await runCopierGeneration({
        skipPostGenSetup: true,
        project_name: 'test-docker',
        enable_security_hardening: true,
      });

      const dockerfilePath = join(workspace, 'Dockerfile');
      const dockerfile = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(dockerfile).toContain('gcr.io/distroless/cc');
      expect(dockerfile).toContain('USER 65532:65532');
    } finally {
      await removeWorkspace(workspace);
    }
  });

  it('adds security options to docker-compose.yml', async () => {
    let workspace: string | undefined;

    try {
      workspace = await runCopierGeneration({
        skipPostGenSetup: true,
        project_name: 'test-compose',
        enable_security_hardening: true,
      });

      const composePath = join(workspace, 'docker-compose.yml');
      const composeFile = fs.readFileSync(composePath, 'utf-8');
      expect(composeFile).toContain('no-new-privileges:true');
      expect(composeFile).toContain('cap_drop');
    } finally {
      await removeWorkspace(workspace);
    }
  });

  it('generates security documentation', async () => {
    let workspace: string | undefined;

    try {
      workspace = await runCopierGeneration({
        skipPostGenSetup: true,
        project_name: 'test-docs',
        enable_security_hardening: true,
      });

      const encryptionDocPath = join(workspace, 'docs', 'security', 'ENCRYPTION.md');
      expect(fs.existsSync(encryptionDocPath)).toBe(true);

      const docContent = fs.readFileSync(encryptionDocPath, 'utf-8');
      expect(docContent).toContain('XChaCha20-Poly1305');
      expect(docContent).toContain('key rotation');
    } finally {
      await removeWorkspace(workspace);
    }
  });
});
