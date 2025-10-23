/* Append transcript entries with metrics. Implements: DEV-PRD-010 */
const fs = require("node:fs");
const path = require("node:path");

function appendTranscript({
  label,
  tokens,
  latencyMs,
  variant = "default",
  root = process.cwd(),
}) {
  const line = `${new Date().toISOString()}|label=${label}|tokens=${tokens}|latencyMs=${latencyMs}|variant=${variant}\n`;
  const file = path.join(root, "transcript.md");
  fs.appendFileSync(file, line, "utf8");
  return { file };
}

module.exports = { appendTranscript };
