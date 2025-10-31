/**
 * TASK-009: MCP Descriptor Import Tests
 *
 * Traceability: AI_ADR-002, AI_ADR-004, AI_PRD-004, AI_SDS-003, AI_TS-002
 *
 * Tests validate that MCP tool descriptors are properly copied and templated
 * into the generated project structure with correct placeholders and documentation.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const TEMPLATE_BASE = path.resolve(__dirname, '../../templates/{{project_slug}}');
const MCP_DIR = path.join(TEMPLATE_BASE, 'mcp');

describe('MCP Descriptor Files', () => {
  describe('Directory Structure', () => {
    test('mcp directory should exist in template', () => {
      expect(fs.existsSync(MCP_DIR)).toBe(true);
      expect(fs.statSync(MCP_DIR).isDirectory()).toBe(true);
    });

    test('tool_index.md should exist', () => {
      const indexPath = path.join(MCP_DIR, 'tool_index.md');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    test('example-http.tool.md should exist', () => {
      const examplePath = path.join(MCP_DIR, 'example-http.tool.md');
      expect(fs.existsSync(examplePath)).toBe(true);
    });
  });

  describe('Tool Index Content', () => {
    const indexPath = path.join(MCP_DIR, 'tool_index.md');

    test('should contain MCP configuration example', () => {
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('MCP Tool Index');
      expect(content).toContain('.vscode/mcp.json');
      expect(content).toContain('mcpServers');
    });

    test('should warn against hardcoded secrets', () => {
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toMatch(/(?:Do not|Never) hardcode secrets/i);
      expect(content).toMatch(/env(?:ironment)?\s+variable/i);
    });

    test('should reference environment variables correctly', () => {
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('${env:');
      expect(content).toMatch(/EXAMPLE_HTTP_\w+/);
    });

    test('should document *.tool.md convention', () => {
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('.tool.md');
    });
  });

  describe('Example Tool Descriptor', () => {
    const examplePath = path.join(MCP_DIR, 'example-http.tool.md');

    test('should be valid markdown', () => {
      const content = fs.readFileSync(examplePath, 'utf-8');
      expect(content).toMatch(/^#\s+/m); // Has at least one heading
      expect(content.length).toBeGreaterThan(50);
    });

    test('should document authentication approach', () => {
      const content = fs.readFileSync(examplePath, 'utf-8');
      expect(content).toMatch(/auth(?:entication)?/i);
      expect(content).toContain('environment variable');
    });

    test('should warn against committing secrets', () => {
      const content = fs.readFileSync(examplePath, 'utf-8');
      expect(content).toContain('do not commit secrets');
    });
  });

  describe('Markdown Lint Compliance', () => {
    test('tool_index.md should have proper heading structure', () => {
      const indexPath = path.join(MCP_DIR, 'tool_index.md');
      const content = fs.readFileSync(indexPath, 'utf-8');

      // Should start with h1
      expect(content).toMatch(/^# /);

      // No duplicate h1s
      const h1Count = (content.match(/^# /gm) || []).length;
      expect(h1Count).toBeLessThanOrEqual(1);
    });

    test('example-http.tool.md should have proper heading structure', () => {
      const examplePath = path.join(MCP_DIR, 'example-http.tool.md');
      const content = fs.readFileSync(examplePath, 'utf-8');

      // Should start with h1
      expect(content).toMatch(/^# /);

      // No duplicate h1s
      const h1Count = (content.match(/^# /gm) || []).length;
      expect(h1Count).toBeLessThanOrEqual(1);
    });

    test('all markdown files should end with newline', () => {
      const mdFiles = fs
        .readdirSync(MCP_DIR)
        .filter((f) => f.endsWith('.md'))
        .map((f) => path.join(MCP_DIR, f));

      mdFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        expect(content.endsWith('\n')).toBe(true);
      });
    });
  });
});
