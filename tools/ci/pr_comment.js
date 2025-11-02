/* Generate PR comment body summarizing traceability, prompts, and environment. */
const fs = require('node:fs');
const path = require('node:path');

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function buildSummary(root = process.cwd()) {
  const lines = [];
  lines.push('<!-- vibePDK-spec-guard:summary -->');
  lines.push('# Spec Guard Summary');
  lines.push('');
  // Traceability matrix stats
  const matrixPath = path.join(root, 'docs', 'traceability_matrix.md');
  const m = readFileSafe(matrixPath);
  const rowCount = (m.match(/^\|\s*(?:DEV-|PRD|ADR|SDS|TS)/gm) || []).length;
  lines.push(`- Traceability matrix rows: ${rowCount}`);

  // Prompt budgets: look at plan preview concept by scanning tokens in transcript (last run)
  const transcript = readFileSafe(path.join(root, 'transcript.md'));
  const last = transcript.trim().split('\n').filter(Boolean).slice(-1)[0] || '';
  if (last) lines.push(`- Last prompt run: ${last}`);

  // Environment report present?
  const envRep = fs.existsSync(path.join(root, 'docs', 'environment_report.md'))
    ? 'present'
    : 'missing';
  lines.push(`- Environment report: ${envRep}`);

  lines.push('');
  lines.push('Artifacts:');
  lines.push('- docs/traceability_matrix.md');
  lines.push('- docs/environment_report.md');
  lines.push('');
  return lines.join('\n');
}

if (require.main === module) {
  const body = buildSummary(process.cwd());
  const outDir = path.join(process.cwd(), '.tmp');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'pr_comment.md');
  fs.writeFileSync(out, body, 'utf8');
  console.log(`[pr-comment] Wrote ${out}`);
}

module.exports = { buildSummary };
