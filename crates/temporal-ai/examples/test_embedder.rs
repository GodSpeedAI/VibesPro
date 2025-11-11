//! Simple embedder test without git2 dependency

use anyhow::Result;
use std::path::PathBuf;
use temporal_ai::Embedder;

fn main() -> Result<()> {
    println!("Testing Temporal AI Embedder\n");

    let model_path = PathBuf::from("models/embeddinggemma-300M-Q8_0.gguf");

    if !model_path.exists() {
        eprintln!("Error: Model not found at {}", model_path.display());
        eprintln!("\nDownload from:");
        eprintln!(
            "  https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf"
        );
        std::process::exit(1);
    }

    println!("Loading model from {}...", model_path.display());
    let embedder = Embedder::from_gguf(&model_path)?;
    println!("✓ Model loaded successfully\n");

    // Test embedding generation
    let test_texts = vec![
        "Implement authentication middleware for FastAPI",
        "Add database migration for user table",
        "Fix memory leak in connection pool",
    ];

    println!("Generating embeddings for test texts:");
    for (i, text) in test_texts.iter().enumerate() {
        print!("  {}. \"{}\"... ", i + 1, text);
        let start = std::time::Instant::now();
        let embedding = embedder.embed(text)?;
        let duration = start.elapsed();

        println!(
            "✓ ({:.2}ms, {} dims)",
            duration.as_millis(),
            embedding.len()
        );

        // Verify dimension
        assert_eq!(embedding.len(), 768, "Expected 768 dimensions");

        // Verify normalization (L2 norm should be ~1.0)
        let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        println!("     L2 norm: {:.6}", norm);
        assert!((norm - 1.0).abs() < 0.01, "Expected L2 norm ≈ 1.0");
    }

    println!("\n✓ All tests passed!");
    Ok(())
}
