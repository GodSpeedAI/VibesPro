//! Embedding generation using GGUF models via llama.cpp

use crate::{Result, TemporalAIError, EMBEDDING_DIM};
use llama_cpp_2::{
    context::params::LlamaContextParams,
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::{params::LlamaModelParams, AddBos, LlamaModel},
};
use std::num::NonZeroU32;
use std::path::Path;
use std::sync::Arc;

/// Embedding generator using llama.cpp
pub struct Embedder {
    _backend: Arc<LlamaBackend>,
    model: LlamaModel,
    n_ctx: u32,
}

impl Embedder {
    /// Load model from GGUF file
    pub fn from_gguf(model_path: impl AsRef<Path>) -> Result<Self> {
        let model_path = model_path.as_ref();

        if !model_path.exists() {
            return Err(TemporalAIError::ModelLoadError(format!(
                "Model file not found: {}",
                model_path.display()
            )));
        }

        // Initialize backend
        let backend = LlamaBackend::init().map_err(|e| {
            TemporalAIError::ModelLoadError(format!("Backend init failed: {:?}", e))
        })?;

        // Load model with default params
        let model_params = LlamaModelParams::default();

        let model = LlamaModel::load_from_file(&backend, model_path, &model_params)
            .map_err(|e| TemporalAIError::ModelLoadError(format!("Model load failed: {:?}", e)))?;

        // Context size for embeddings (smaller is fine for embedding models)
        let n_ctx = 512;

        Ok(Self {
            _backend: Arc::new(backend),
            model,
            n_ctx,
        })
    }

    /// Generate 768-dimensional embedding for text
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        // Tokenize input
        let tokens = self.model.str_to_token(text, AddBos::Always).map_err(|e| {
            TemporalAIError::InferenceError(format!("Tokenization failed: {:?}", e))
        })?;

        // Create context with embeddings enabled using builder pattern
        let n_ctx = NonZeroU32::new(self.n_ctx).ok_or_else(|| {
            TemporalAIError::InferenceError("Context size must be non-zero".to_string())
        })?;
        let ctx_params = LlamaContextParams::default()
            .with_n_ctx(Some(n_ctx))
            .with_embeddings(true) // Enable embedding mode
            .with_n_batch(self.n_ctx);

        let mut ctx = self
            .model
            .new_context(&self._backend, ctx_params)
            .map_err(|e| {
                TemporalAIError::InferenceError(format!("Context creation failed: {:?}", e))
            })?;

        // Create batch
        let mut batch = LlamaBatch::new(self.n_ctx as usize, 1);

        // Add tokens to batch (limit to context size)
        let token_count = tokens.len().min(self.n_ctx as usize);
        for (i, &token) in tokens.iter().take(token_count).enumerate() {
            batch.add(token, i as i32, &[0], false).map_err(|e| {
                TemporalAIError::InferenceError(format!("Batch add failed: {:?}", e))
            })?;
        }

        // Decode batch
        ctx.decode(&mut batch)
            .map_err(|e| TemporalAIError::InferenceError(format!("Decode failed: {:?}", e)))?;

        // Get embeddings
        let embeddings_result = ctx.embeddings_seq_ith(0);
        let embeddings = match embeddings_result {
            Ok(emb) => emb,
            Err(e) => {
                return Err(TemporalAIError::InferenceError(format!(
                    "Failed to get embeddings: {:?}",
                    e
                )));
            }
        };

        // Convert to Vec<f32>
        let embedding_vec: Vec<f32> = embeddings.iter().copied().collect();

        // Verify dimension
        if embedding_vec.len() != EMBEDDING_DIM {
            eprintln!(
                "⚠️  WARNING: Model produced {} dimensions, expected {}",
                embedding_vec.len(),
                EMBEDDING_DIM
            );
            eprintln!("⚠️  This might not be an embedding model");

            // If we got more dimensions, truncate
            // If we got fewer, this is an error
            if embedding_vec.len() < EMBEDDING_DIM {
                return Err(TemporalAIError::DimensionMismatch {
                    expected: EMBEDDING_DIM,
                    actual: embedding_vec.len(),
                });
            }
        }

        // Take only the dimensions we need (in case model produces more)
        let mut embedding: Vec<f32> = embedding_vec.into_iter().take(EMBEDDING_DIM).collect();

        // L2 normalization
        let norm = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        if norm > 0.0 {
            for val in &mut embedding {
                *val /= norm;
            }
        }

        Ok(embedding)
    }

    /// Sequential helper that embeds each text individually.
    ///
    /// llama.cpp currently supports embedding one sequence at a time, so this
    /// method simply iterates through `texts` and calls [`Self::embed`] for
    /// each entry.
    pub fn embed_many(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        texts.iter().map(|text| self.embed(text)).collect()
    }

    /// Deprecated alias for [`Embedder::embed_many`].
    #[deprecated(note = "Use `embed_many` for sequential embeddings")]
    pub fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        self.embed_many(texts)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_embedding_dimension() {
        assert_eq!(EMBEDDING_DIM, 768);
    }
}
