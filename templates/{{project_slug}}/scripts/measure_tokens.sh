#!/usr/bin/env bash
# Approximate token counter for prompt files.
# This script estimates the number of tokens in a prompt file by counting words.
# While this is not an exact token count (tokenisation differs for each model),
# it provides a rough metric to gauge prompt length and complexity.

set -euo pipefail

if [[ "$#" -lt 1 ]]; then
  echo "Usage: $0 <prompt-file>" >&2
  exit 1
fi

PROMPT_FILE="$1"
if [[ ! -f "${PROMPT_FILE}" ]]; then
  echo "Error: prompt file '${PROMPT_FILE}' does not exist." >&2
  exit 1
fi

WORD_COUNT=$(wc -w < "${PROMPT_FILE}")
CHAR_COUNT=$(wc -c < "${PROMPT_FILE}")

echo "[measure_tokens] Approximate word count for ${PROMPT_FILE}: ${WORD_COUNT}"
echo "[measure_tokens] Approximate character count for ${PROMPT_FILE}: ${CHAR_COUNT}"

# TODO: For more accurate token counts, integrate with a tokenizer such as
# tiktoken or the OpenAI API. This is left as an exercise for users who have
# access to those libraries. Using an approximate metric is still useful for
# performance analysis and comparison of different prompts.

exit 0
