#!/usr/bin/env node
/**
 * PR comment generator - creates standardized PR comments
 */

const fs = require("fs");
const path = require("path");

function generatePRComment() {
  console.log("📝 Generating PR comment...");

  // Check if we're in a git repository
  if (!fs.existsSync(".git")) {
    console.warn("⚠️  Not in a git repository");
    return;
  }

  // Get current branch name
  try {
    const gitHead = fs.readFileSync(".git/HEAD", "utf8").trim();
    const branchMatch = gitHead.match(/ref: refs\/heads\/(.+)/);
    const branchName = branchMatch ? branchMatch[1] : "unknown";

    // Generate comment based on branch name patterns
    let comment = "";

    if (branchName.startsWith("feature/")) {
      const featureName = branchName.replace("feature/", "");
      comment = `## 🚀 Feature PR\n\n**Feature:** ${featureName}\n\n### Changes\n- [ ] Describe the changes made\n- [ ] Link to relevant issues\n\n### Testing\n- [ ] Unit tests pass\n- [ ] Integration tests pass\n- [ ] Manual testing completed\n\n### Checklist\n- [ ] Code follows project standards\n- [ ] Documentation updated\n- [ ] Breaking changes documented`;
    } else if (branchName.startsWith("fix/")) {
      const fixName = branchName.replace("fix/", "");
      comment = `## 🐛 Bug Fix PR\n\n**Fix:** ${fixName}\n\n### Issue\nFixes # [issue number]\n\n### Root Cause\n[Describe what caused the bug]\n\n### Solution\n[Describe how the bug was fixed]\n\n### Testing\n- [ ] Reproduction case verified\n- [ ] Fix tested manually\n- [ ] Regression tests pass`;
    } else if (branchName.startsWith("docs/")) {
      const docName = branchName.replace("docs/", "");
      comment = `## 📚 Documentation PR\n\n**Documentation:** ${docName}\n\n### Changes\n- [ ] Updated documentation\n- [ ] Added examples where needed\n- [ ] Verified links work\n\n### Review\n- [ ] Technical accuracy verified\n- [ ] Clarity and completeness checked`;
    } else {
      comment = `## 🔄 General PR\n\n**Branch:** ${branchName}\n\n### Changes\n[Describe the changes made]\n\n### Testing\n[Describe how changes were tested]\n\n### Review\n[ anything specific reviewers should focus on?]`;
    }

    console.log("\n" + comment);
    console.log("\n💡 Copy this comment to your PR description");
  } catch (error) {
    console.error("❌ Error generating PR comment:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generatePRComment();
}

module.exports = { generatePRComment };
