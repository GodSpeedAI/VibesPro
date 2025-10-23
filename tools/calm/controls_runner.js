/* CALM controls runner (stub). Implements PRD-008 (DevKit) / DEV-PRD-008 (VibePDK). */
const fs = require("node:fs");
const path = require("node:path");

function runCalmControls(root = process.cwd()) {
  // Stub rule: ensure architecture/calm/system.calm.json exists if architecture is present
  const calmDir = path.join(root, "architecture", "calm");
  const system = path.join(calmDir, "system.calm.json");
  if (fs.existsSync(path.join(root, "architecture"))) {
    if (!fs.existsSync(system)) {
      return { ok: false, files: [], violations: [`Missing ${system}`] };
    }
  }

  // Check for proper CALM structure
  const violations = [];

  if (fs.existsSync(calmDir)) {
    const files = fs.readdirSync(calmDir);
    if (!files.includes("system.calm.json")) {
      violations.push("Missing system.calm.json in architecture/calm/");
    }
  }

  return {
    ok: violations.length === 0,
    files: fs.existsSync(calmDir) ? fs.readdirSync(calmDir) : [],
    violations,
  };
}

module.exports = { runCalmControls };
