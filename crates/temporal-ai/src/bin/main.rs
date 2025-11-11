//! Temporal AI CLI - Pattern recommendation engine

use anyhow::{Context, Result};
use std::path::PathBuf;
use temporal_ai::{
    Embedder, PatternExtractor, RecommendationRanker, SimilaritySearch, VectorStore,
};

#[derive(Debug)]
enum Command {
    Refresh { commits: usize },
    Query { text: String, top: usize },
    Init,
    Stats,
}

fn parse_args() -> Result<Command> {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        print_usage();
        std::process::exit(1);
    }

    match args[1].as_str() {
        "init" => Ok(Command::Init),
        "stats" => Ok(Command::Stats),
        "refresh" => {
            let commits = if args.len() > 2 && args[2] == "--commits" && args.len() > 3 {
                args[3].parse().context("Invalid commit count")?
            } else {
                1000
            };
            Ok(Command::Refresh { commits })
        }
        "query" => {
            if args.len() < 3 {
                anyhow::bail!("Query text required");
            }
            let text = args[2].clone();
            let top = if args.len() > 3 && args[3] == "--top" && args.len() > 4 {
                args[4].parse().context("Invalid top count")?
            } else {
                5
            };
            Ok(Command::Query { text, top })
        }
        cmd => {
            anyhow::bail!("Unknown command: {}", cmd);
        }
    }
}

fn print_usage() {
    eprintln!("Temporal AI - Pattern Recommendation Engine\n");
    eprintln!("USAGE:");
    eprintln!("  temporal-ai init");
    eprintln!("  temporal-ai refresh [--commits N]");
    eprintln!("  temporal-ai query <text> [--top N]");
    eprintln!("  temporal-ai stats\n");
    eprintln!("COMMANDS:");
    eprintln!("  init              Initialize empty database");
    eprintln!("  refresh           Index patterns from Git history");
    eprintln!("  query             Find similar patterns");
    eprintln!("  stats             Show database statistics\n");
    eprintln!("EXAMPLES:");
    eprintln!("  temporal-ai refresh --commits 1000");
    eprintln!("  temporal-ai query \"Add FastAPI authentication\" --top 5");
}

fn get_model_path() -> PathBuf {
    PathBuf::from("models/embeddinggemma-300M-Q8_0.gguf")
}

fn get_db_path() -> PathBuf {
    PathBuf::from("data/temporal-ai.redb")
}

fn get_repo_path() -> PathBuf {
    PathBuf::from(".")
}

fn main() -> Result<()> {
    let command = parse_args()?;

    match command {
        Command::Init => {
            println!("Initializing temporal-ai database...");
            let db_path = get_db_path();
            VectorStore::open(&db_path).context("Failed to create database")?;
            println!("✓ Database created at: {}", db_path.display());
            Ok(())
        }

        Command::Refresh { commits } => {
            println!("Refreshing pattern database from Git history...");
            println!("Loading embedding model...");

            let model_path = get_model_path();
            if !model_path.exists() {
                anyhow::bail!(
                    "Model not found: {}\n\nDownload it from:\n  https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf",
                    model_path.display()
                );
            }

            let embedder =
                Embedder::from_gguf(&model_path).context("Failed to load embedding model")?;
            println!("✓ Model loaded");

            println!("Opening database...");
            let store = VectorStore::open(&get_db_path()).context("Failed to open database")?;
            println!("✓ Database opened");

            println!("Extracting patterns from last {} commits...", commits);
            let extractor =
                PatternExtractor::new(get_repo_path()).context("Failed to open Git repository")?;
            let patterns = extractor
                .extract_recent(commits)
                .context("Failed to extract patterns")?;

            println!("✓ Extracted {} patterns", patterns.len());

            if patterns.is_empty() {
                println!("No patterns found");
                return Ok(());
            }

            println!("Generating embeddings and storing...");
            let total = patterns.len();
            for (idx, pattern) in patterns.into_iter().enumerate() {
                print!("\r  Progress: {}/{}", idx + 1, total);
                std::io::Write::flush(&mut std::io::stdout())?;

                let embedding = embedder.embed(&pattern.description)?;
                store.insert(&pattern, embedding)?;
            }

            println!("\n✓ Processed {} patterns", total);
            println!("Database size: {} bytes", store.size()?);
            Ok(())
        }

        Command::Query { text, top } => {
            println!("Searching for: \"{}\"", text);

            let model_path = get_model_path();
            if !model_path.exists() {
                anyhow::bail!("Model not found: {}", model_path.display());
            }

            println!("Loading model...");
            let embedder = Embedder::from_gguf(&model_path)?;

            let store = VectorStore::open(&get_db_path())?;

            println!("Generating query embedding...");
            let query_embedding = embedder.embed(&text)?;

            println!("Searching for similar patterns...");
            let search = SimilaritySearch::new(&store);
            let results = search.search(&query_embedding, top * 2)?;

            if results.is_empty() {
                println!("\nNo patterns found. Run 'temporal-ai refresh' first.");
                return Ok(());
            }

            println!("Ranking recommendations...");
            let ranker = RecommendationRanker::new(&store);
            let recommendations = ranker.rank(results)?;

            println!("\n=== Top {} Recommendations ===\n", top);
            for (i, rec) in recommendations.iter().take(top).enumerate() {
                println!(
                    "{}. [Score: {:.3}] {}",
                    i + 1,
                    rec.final_score,
                    rec.explanation
                );
                println!("   Files: {}", rec.pattern.file_paths.join(", "));
                println!("   Commit: {}\n", rec.pattern.commit_sha);
            }

            Ok(())
        }

        Command::Stats => {
            let store = VectorStore::open(&get_db_path())?;
            let patterns = store.list_patterns()?;

            println!("=== Temporal AI Database Statistics ===\n");
            println!("Total patterns: {}", patterns.len());
            println!(
                "Database size: {} bytes ({:.2} MB)",
                store.size()?,
                store.size()? as f64 / 1_000_000.0
            );
            println!("Database path: {}", get_db_path().display());
            println!("Model path: {}", get_model_path().display());

            Ok(())
        }
    }
}
