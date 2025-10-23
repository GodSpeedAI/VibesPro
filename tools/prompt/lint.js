/* Prompt/Mode/Instruction linter
 - Validates title and YAML frontmatter presence
 - Enforces taxonomy fields: kind, domain, task (phase optional)
 - Validates model field against .github/models.yaml
 Implements: PRD-014/017; DEV-PRD-007/010
 */
const fs = require("node:fs");
const path = require("node:path");
const { extractFrontmatter, stripQuotes } = require("../utils/frontmatter");

// Constants
const FILE_EXTENSIONS = {
  PROMPT: ".prompt.md",
  CHATMODE: ".chatmode.md",
  INSTRUCTIONS: ".instructions.md",
  MARKDOWN: ".md",
};

const REQUIRED_FIELDS = {
  PROMPT: ["kind", "domain", "task", "thread", "matrix_ids"],
  CHATMODE: ["kind", "domain", "task", "thread", "matrix_ids"],
  INSTRUCTIONS: ["kind", "domain", "thread", "matrix_ids"],
};

const RECOMMENDED_FIELDS = {
  PROMPT: ["budget"],
  CHATMODE: ["budget"],
  INSTRUCTIONS: ["precedence"],
};

const GITHUB_DIR = path.join(path.dirname(path.dirname(__dirname)), ".github");

// Utility functions
function handleFileError(error, filePath, operation) {
  const baseMessage = `[prompt:lint] Warning: ${operation} ${filePath}`;

  if (error.code === "ENOENT") {
    console.warn(`${baseMessage} not found`);
  } else if (error.code === "EACCES") {
    console.warn(`${baseMessage} permission denied`);
  } else if (error instanceof SyntaxError || error.message.includes("YAML")) {
    console.warn(`${baseMessage} invalid format: ${error.message}`);
  } else {
    console.warn(`${baseMessage}: ${error.message}`);
  }
}

// Configuration loading functions
function loadModelsConfig() {
  const modelsPath = path.join(GITHUB_DIR, "models.yaml");

  try {
    // Check if file exists first
    if (!fs.existsSync(modelsPath)) {
      console.warn(
        `[prompt:lint] Warning: models.yaml not found at ${modelsPath}`,
      );
      return {};
    }

    const content = fs.readFileSync(modelsPath, "utf8");
    const models = {};

    // Parse the YAML content to extract models
    const lines = content.split("\n");
    let inDefaultsSection = false;

    for (const line of lines) {
      // Skip empty lines and comments
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      // Track section boundaries
      if (trimmedLine === "defaults:") {
        inDefaultsSection = true;
        continue;
      } else if (
        trimmedLine &&
        !line.startsWith(" ") &&
        !line.startsWith("\t")
      ) {
        inDefaultsSection = false;
        continue;
      }

      // Only process lines within the defaults section
      if (!inDefaultsSection) continue;

      // Match nested keys (with 2-space indentation) in defaults section
      const match = line.match(/^(\s*)([A-Za-z0-9_\-]+)\s*:\s*(.+)$/);
      if (match) {
        const indentation = match[1];
        const key = match[2].trim();
        let value = match[3].trim();

        // Only process keys with exactly 2-space indentation in defaults section
        if (indentation === "  " && key.endsWith("_model")) {
          // strip quotes if present
          value = stripQuotes(value);
          // Validate that we have a non-empty model name
          if (value && value.length > 0) {
            models[value] = true;
          }
        }
      }
    }

    if (Object.keys(models).length === 0) {
      console.warn(
        `[prompt:lint] Warning: No valid models found in ${modelsPath}`,
      );
    }

    return models;
  } catch (error) {
    handleFileError(error, modelsPath, "models.yaml");
    return {};
  }
}
function loadInstructionsConfig() {
  const instructionsPath = path.join(GITHUB_DIR, "instructions");

  try {
    // Check if directory exists first
    if (!fs.existsSync(instructionsPath)) {
      console.warn(
        `[prompt:lint] Warning: instructions directory not found at ${instructionsPath}`,
      );
      return {};
    }

    const instructions = {};

    // Read all files in the instructions directory
    const files = fs.readdirSync(instructionsPath);
    for (const file of files) {
      // Only process .md files
      if (file.endsWith(FILE_EXTENSIONS.MARKDOWN)) {
        const filePath = path.join(instructionsPath, file);
        const stats = fs.statSync(filePath);

        // Only process regular files, not directories
        if (stats.isFile()) {
          // Store the filename without extension as the key
          const key = file.replace(FILE_EXTENSIONS.MARKDOWN, "");
          instructions[key] = true;
        }
      }
    }

    if (Object.keys(instructions).length === 0) {
      console.warn(
        `[prompt:lint] Warning: No instruction files found in ${instructionsPath}`,
      );
    }

    return instructions;
  } catch (error) {
    handleFileError(error, instructionsPath, "instructions directory");
    return {};
  }
}

// File classification functions
function classify(file) {
  if (!file || typeof file !== "string") {
    return "unknown";
  }

  if (file.endsWith(FILE_EXTENSIONS.PROMPT)) return "prompt";
  if (file.endsWith(FILE_EXTENSIONS.CHATMODE)) return "chatmode";
  if (file.endsWith(FILE_EXTENSIONS.INSTRUCTIONS)) return "instructions";
  return "unknown";
}

// Frontmatter extraction and parsing
// extractFrontmatter and stripQuotes are provided by tools/utils/frontmatter.js

// Validation functions
function validateInstructionField(fields, findings) {
  if (fields.instruction) {
    const instructions = loadInstructionsConfig();
    if (!instructions[fields.instruction]) {
      findings.push(
        `Instruction file "${
          fields.instruction
        }" not found in .github/instructions/. Available instructions: ${
          Object.keys(instructions).join(", ") || "none"
        }`,
      );
    }
  }
}

function validateRequiredFields(fields, kind, findings) {
  const required = REQUIRED_FIELDS[kind.toUpperCase()];
  if (required) {
    for (const field of required) {
      if (!fields[field]) {
        findings.push(`Missing frontmatter field: ${field}`);
      }
    }
  }
}

function validateRecommendedFields(fields, kind, findings) {
  const recommended = RECOMMENDED_FIELDS[kind.toUpperCase()];
  if (recommended) {
    for (const field of recommended) {
      if (!fields[field]) {
        findings.push(`Recommend adding frontmatter field: ${field}`);
      }
    }
  }
}

function validateModelField(fields, findings) {
  if (fields.model) {
    const models = loadModelsConfig();
    if (!models[fields.model]) {
      findings.push(
        `Model "${
          fields.model
        }" not found in .github/models.yaml. Available models: ${
          Object.keys(models).join(", ") || "none"
        }`,
      );
    }
  }
}

function validateTitle(text, findings) {
  if (!/^#\s+.+/m.test(text)) {
    findings.push("Missing H1 title (# ...)");
  }
}

function validateFrontmatterPresence(raw, findings) {
  if (!raw) {
    findings.push("Missing frontmatter (---)");
  }
}

// Main linting function
function lintPromptFile(file) {
  try {
    const text = fs.readFileSync(file, "utf8");
    const findings = [];

    // Validate title presence
    validateTitle(text, findings);

    // Extract and validate frontmatter
    const { fields, raw } = extractFrontmatter(text);
    validateFrontmatterPresence(raw, findings);

    // Classify file type and perform validations
    const kind = classify(file);

    // Validate required fields based on file type
    validateRequiredFields(fields, kind, findings);

    // Validate recommended fields based on file type
    validateRecommendedFields(fields, kind, findings);

    // Validate specific fields
    validateInstructionField(fields, findings);
    validateModelField(fields, findings);

    // Separate errors from warnings - only errors make ok: false
    const errors = findings.filter(
      (finding) => !finding.startsWith("Recommend adding"),
    );
    const warnings = findings.filter((finding) =>
      finding.startsWith("Recommend adding"),
    );

    return {
      ok: errors.length === 0,
      findings,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { ok: false, findings: [`File not found: ${file}`] };
    } else if (error.code === "EACCES") {
      return {
        ok: false,
        findings: [`Permission denied reading file: ${file}`],
      };
    } else {
      return { ok: false, findings: [`Error reading file: ${error.message}`] };
    }
  }
}

// CLI interface
if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: lint.js <file>");
    process.exit(2);
  }
  const res = lintPromptFile(path.resolve(file));
  if (!res.ok) {
    console.error(
      `[prompt:lint] FAIL ${file}:\n - ${res.findings.join("\n - ")}`,
    );
    process.exit(1);
  } else {
    // If only recommendations present, still PASS
    const allMessages = res.findings.join("\n - ");
    const hasWarnings = res.warnings && res.warnings.length > 0;

    if (allMessages) {
      if (hasWarnings) {
        console.log(`[prompt:lint] PASS ${file} (warnings)\n - ${allMessages}`);
      } else {
        console.log(`[prompt:lint] PASS ${file} (notes)\n - ${allMessages}`);
      }
    } else {
      console.log(`[prompt:lint] PASS ${file}`);
    }
  }
}

// Export public API
module.exports = {
  lintPromptFile,
  extractFrontmatter,
  loadModelsConfig,
  loadInstructionsConfig,
  validateInstructionField,
  classify,
  stripQuotes,
  handleFileError,
};
