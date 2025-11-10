//! Embedding generation using GGUF models
//!
//! NOTE: This is currently a stub implementation.
//! TODO: Integrate with llama-cpp-rs or candle for actual GGUF model loading.

use crate::{Result, TemporalAIError, EMBEDDING_DIM};
use std::path::Path;

/// Embedding generator
pub struct Embedder {
    _model_path: std::path::PathBuf,
}

impl Embedder {
    /// Load model from GGUF file
    pub fn from_gguf(model_path: impl AsRef<Path>) -> Result<Self> {
        let model_path = model_path.as_ref();

        if !model_path.exists() {
            return Err(TemporalAIError::ModelLoadError(
                format!("Model file not found: {}", model_path.display())
            ));
        }

        eprintln!("⚠️  WARNING: Using stub embedder implementation");
        eprintln!("⚠️  Real GGUF model loading not yet implemented");
        eprintln!("⚠️  Generating random embeddings for testing only\n");

        Ok(Self {
            _model_path: model_path.to_path_buf(),
        })
    }

    /// Generate 768-dimensional embedding for text
    ///
    /// NOTE: Currently returns deterministic hash-based embeddings for testing.
    /// Replace with actual model inference.
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        // Simple deterministic embedding based on text hash
        // This allows testing the rest of the system
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        text.hash(&mut hasher);
        let seed = hasher.finish();

        // Generate deterministic "embedding" from seed
        let mut embedding = Vec::with_capacity(EMBEDDING_DIM);
        let mut rng_state = seed;

        for _ in 0..EMBEDDING_DIM {
            // Simple LCG for deterministic random numbers
            rng_state = rng_state.wrapping_mul(6364136223846793005).wrapping_add(1);
            let val = (rng_state >> 32) as f32 / u32::MAX as f32;
            embedding.push(val * 2.0 - 1.0); // Range [-1, 1]
        }

        // L2 normalization
        let norm = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        if norm > 0.0 {
            for val in &mut embedding {
                *val /= norm;
            }
        }

        Ok(embedding)
    }

    /// Batch processing for efficiency
    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        texts.iter().map(|text| self.embed(text)).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_embedding_dimension() {
        assert_eq!(EMBEDDING_DIM, 768);
    }

    #[test]
    fn test_deterministic_embeddings() {
        // Same text should produce same embedding
        let text = "test text";

        let emb1 = {
            let mut h = std::collections::hash_map::DefaultHasher::new();
            use std::hash::{Hash, Hasher};
            text.hash(&mut h);
            h.finish()
        };

        let emb2 = {
            let mut h = std::collections::hash_map::DefaultHasher::new();
            use std::hash::{Hash, Hasher};
            text.hash(&mut h);
            h.finish()
        };

        assert_eq!(emb1, emb2);
    }

    #[test]
    fn test_normalization() {
        let text = "test normalization";
        let embedding = vec![3.0, 4.0]; // Will have norm = 5.0

        let norm = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert_eq!(norm, 5.0);

        let mut normalized = embedding.clone();
        for val in &mut normalized {
            *val /= norm;
        }

        let new_norm = normalized.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((new_norm - 1.0).abs() < 0.001);
    }
}
