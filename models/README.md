# AI Models Directory

This directory stores large language model files used by the Temporal AI Guidance Fabric.

## Required Model

**embedding-gemma-300M-Q4_K_M.gguf** (~180MB)

- Source: https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF
- Direct download: https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embedding-gemma-300M-Q4_K_M.gguf
- Purpose: Generate 768-dimensional embeddings for semantic pattern search
- Quantization: Q4_K_M (4-bit quantized, medium quality)

## Download Instructions

### Option 1: Manual Download

```bash
cd models
wget https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embedding-gemma-300M-Q4_K_M.gguf
```

### Option 2: Using curl

```bash
cd models
curl -L -o embedding-gemma-300M-Q4_K_M.gguf https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embedding-gemma-300M-Q4_K_M.gguf
```

### Option 3: Automated Script (coming soon)

```bash
just download-embedding-model
```

## Git Handling

**Important**: Model files are excluded from Git via `.gitignore` due to their size.

Each developer must download the model locally. The model is:

- Not committed to the repository
- Downloaded once per machine
- Shared across all projects in this workspace

## Verification

After downloading, verify the file:

```bash
ls -lh models/embedding-gemma-300M-Q4_K_M.gguf
# Should show ~180MB
```

## Alternative Storage Options

For team distribution, consider:

1. **Git LFS** (if you have LFS quota)
2. **Internal artifact server** (company S3/GCS bucket)
3. **Shared network drive** (for co-located teams)
4. **Each developer downloads** (current approach - simple, no infrastructure)
