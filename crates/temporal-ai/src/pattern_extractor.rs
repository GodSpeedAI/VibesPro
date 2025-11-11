//! Git commit pattern extraction

use crate::{Result, TemporalAIError};
use chrono::Utc;
use git2::{Commit, DiffOptions, Repository};
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fmt::Write;
use std::path::{Path, PathBuf};

/// Extracted pattern from Git commit history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pattern {
    /// Unique identifier (SHA-256 hash of content)
    pub id: String,

    /// Human-readable summary
    pub description: String,

    /// Affected file paths
    pub file_paths: Vec<String>,

    /// Git commit SHA
    pub commit_sha: String,

    /// Commit timestamp (Unix seconds)
    pub timestamp: i64,

    /// Extracted tags (language, framework, commit type)
    pub tags: Vec<String>,
}

impl Pattern {
    /// Generate unique ID from content
    fn generate_id(commit_sha: &str, description: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(commit_sha.as_bytes());
        hasher.update(description.as_bytes());
        let digest = hasher.finalize();
        let mut id = String::with_capacity(digest.len() * 2);
        for byte in digest {
            write!(&mut id, "{:02x}", byte).expect("write to string");
        }
        id
    }
}

/// Extract patterns from Git repository
pub struct PatternExtractor {
    repo: Repository,
    conventional_commit_re: Regex,
}

impl PatternExtractor {
    /// Create new extractor for a repository
    pub fn new(repo_path: impl AsRef<Path>) -> Result<Self> {
        let repo = Repository::open(repo_path)?;

        // Conventional commits: type(scope)?: subject
        let conventional_commit_re = Regex::new(
            r"^(feat|fix|docs|style|refactor|perf|test|chore|build|ci)(\([^)]+\))?: (.+)$",
        )
        .unwrap();

        Ok(Self {
            repo,
            conventional_commit_re,
        })
    }

    /// Extract patterns from last N commits
    pub fn extract_recent(&self, count: usize) -> Result<Vec<Pattern>> {
        let mut revwalk = self.repo.revwalk()?;
        revwalk.push_head()?;

        let mut patterns = Vec::new();

        for oid in revwalk {
            if patterns.len() >= count {
                break;
            }
            let oid = oid?;
            let commit = self.repo.find_commit(oid)?;

            // Skip merge commits
            if commit.parent_count() > 1 {
                continue;
            }

            if let Some(pattern) = self.extract_from_commit(&commit)? {
                patterns.push(pattern);
            }
        }

        Ok(patterns)
    }

    /// Extract patterns matching file glob
    pub fn extract_by_path(&self, glob: &str) -> Result<Vec<Pattern>> {
        let mut revwalk = self.repo.revwalk()?;
        revwalk.push_head()?;

        let mut patterns = Vec::new();
        let glob_pattern = glob::Pattern::new(glob).map_err(|e| {
            TemporalAIError::IoError(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                e.to_string(),
            ))
        })?;

        for oid in revwalk {
            let oid = oid?;
            let commit = self.repo.find_commit(oid)?;

            if commit.parent_count() > 1 {
                continue;
            }

            if let Some(pattern) = self.extract_from_commit(&commit)? {
                // Check if any file path matches glob
                if pattern.file_paths.iter().any(|p| glob_pattern.matches(p)) {
                    patterns.push(pattern);
                }
            }
        }

        Ok(patterns)
    }

    /// Extract patterns from date range
    pub fn extract_by_date(&self, since: i64, until: i64) -> Result<Vec<Pattern>> {
        let mut revwalk = self.repo.revwalk()?;
        revwalk.push_head()?;

        let mut patterns = Vec::new();

        for oid in revwalk {
            let oid = oid?;
            let commit = self.repo.find_commit(oid)?;

            let commit_time = commit.time().seconds();

            if commit_time < since {
                break;
            }

            if commit_time > until {
                continue;
            }

            if commit.parent_count() > 1 {
                continue;
            }

            if let Some(pattern) = self.extract_from_commit(&commit)? {
                patterns.push(pattern);
            }
        }

        Ok(patterns)
    }

    /// Extract pattern from a single commit
    fn extract_from_commit(&self, commit: &Commit) -> Result<Option<Pattern>> {
        let message = commit.message().unwrap_or("");

        // Skip automated commits
        if self.is_automated_commit(message) {
            return Ok(None);
        }

        let (commit_type, description) = self.parse_commit_message(message);

        // Get file paths from diff
        let file_paths = self.extract_file_paths(commit)?;

        if file_paths.is_empty() {
            return Ok(None);
        }

        // Extract tags
        let mut tags = vec![commit_type.to_string()];
        tags.extend(self.extract_language_tags(&file_paths));

        let pattern = Pattern {
            id: Pattern::generate_id(&commit.id().to_string(), description),
            description: description.to_string(),
            file_paths,
            commit_sha: commit.id().to_string(),
            timestamp: commit.time().seconds(),
            tags,
        };

        Ok(Some(pattern))
    }

    /// Parse commit message into type and description
    fn parse_commit_message<'a>(&self, message: &'a str) -> (&'a str, &'a str) {
        let first_line = message.lines().next().unwrap_or("");

        if let Some(caps) = self.conventional_commit_re.captures(first_line) {
            let commit_type = caps.get(1).map_or("chore", |m| m.as_str());
            let subject = caps.get(3).map_or(first_line, |m| m.as_str());
            (commit_type, subject)
        } else {
            ("chore", first_line)
        }
    }

    /// Check if commit is automated
    fn is_automated_commit(&self, message: &str) -> bool {
        let automated_patterns = [
            "Merge pull request",
            "Merge branch",
            "Auto-generated",
            "Automated commit",
            "Version bump",
            "[skip ci]",
            "[ci skip]",
        ];

        automated_patterns.iter().any(|p| message.contains(p))
    }

    /// Extract file paths from commit diff
    fn extract_file_paths(&self, commit: &Commit) -> Result<Vec<String>> {
        let mut file_paths = HashSet::new();

        let tree = commit.tree()?;
        let parent_tree = if commit.parent_count() > 0 {
            Some(commit.parent(0)?.tree()?)
        } else {
            None
        };

        let mut diff_opts = DiffOptions::new();
        let diff = if let Some(parent) = parent_tree {
            self.repo
                .diff_tree_to_tree(Some(&parent), Some(&tree), Some(&mut diff_opts))?
        } else {
            self.repo
                .diff_tree_to_tree(None, Some(&tree), Some(&mut diff_opts))?
        };

        diff.foreach(
            &mut |delta, _| {
                if let Some(path) = delta.new_file().path() {
                    if let Some(path_str) = path.to_str() {
                        file_paths.insert(path_str.to_string());
                    }
                }
                true
            },
            None,
            None,
            None,
        )?;

        Ok(file_paths.into_iter().collect())
    }

    /// Extract language tags from file extensions
    fn extract_language_tags(&self, file_paths: &[String]) -> Vec<String> {
        let mut tags = HashSet::new();

        for path in file_paths {
            if let Some(ext) = Path::new(path).extension().and_then(|e| e.to_str()) {
                let tag = match ext {
                    "rs" => "rust",
                    "py" => "python",
                    "ts" | "tsx" => "typescript",
                    "js" | "jsx" => "javascript",
                    "go" => "go",
                    "java" => "java",
                    "c" | "h" => "c",
                    "cpp" | "cc" | "cxx" | "hpp" => "cpp",
                    _ => continue,
                };
                tags.insert(tag.to_string());
            }

            // Framework detection
            if path.contains("react") || path.ends_with(".jsx") || path.ends_with(".tsx") {
                tags.insert("react".to_string());
            }
            if path.contains("fastapi") || (path.contains("api") && path.ends_with(".py")) {
                tags.insert("fastapi".to_string());
            }
        }

        tags.into_iter().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_conventional_commit() {
        let extractor = PatternExtractor {
            repo: unsafe { std::mem::zeroed() }, // Not used in this test
            conventional_commit_re: Regex::new(
                r"^(feat|fix|docs|style|refactor|perf|test|chore|build|ci)(\([^)]+\))?: (.+)$",
            )
            .unwrap(),
        };

        let (typ, desc) = extractor.parse_commit_message("feat(auth): add JWT validation");
        assert_eq!(typ, "feat");
        assert_eq!(desc, "add JWT validation");

        let (typ, desc) = extractor.parse_commit_message("fix: resolve memory leak");
        assert_eq!(typ, "fix");
        assert_eq!(desc, "resolve memory leak");
    }

    #[test]
    fn test_automated_commit_detection() {
        let extractor = PatternExtractor {
            repo: unsafe { std::mem::zeroed() },
            conventional_commit_re: Regex::new("").unwrap(),
        };

        assert!(extractor.is_automated_commit("Merge pull request #123"));
        assert!(extractor.is_automated_commit("Version bump to 1.2.3"));
        assert!(!extractor.is_automated_commit("feat: add new feature"));
    }

    #[test]
    fn test_language_tag_extraction() {
        let extractor = PatternExtractor {
            repo: unsafe { std::mem::zeroed() },
            conventional_commit_re: Regex::new("").unwrap(),
        };

        let paths = vec![
            "src/main.rs".to_string(),
            "app/api.py".to_string(),
            "components/Button.tsx".to_string(),
        ];

        let tags = extractor.extract_language_tags(&paths);
        assert!(tags.contains(&"rust".to_string()));
        assert!(tags.contains(&"python".to_string()));
        assert!(tags.contains(&"typescript".to_string()));
        assert!(tags.contains(&"react".to_string()));
    }
}
