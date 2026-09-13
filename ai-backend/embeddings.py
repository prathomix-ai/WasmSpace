"""
MasmSpace RAG -- Embedding Service
Generates dense vector embeddings using Hugging Face Inference API
with the sentence-transformers/all-mpnet-base-v2 model (768 dims).

Falls back gracefully to all-MiniLM-L6-v2 (384 dims) if configured.
NOTE: if you switch models you MUST re-create the canvas_embeddings table
      with vector(384) and re-embed all existing sessions.
"""

from __future__ import annotations

import os
import logging
from typing import Any

import httpx

logger = logging.getLogger("masmspace-ai.embeddings")

# Default: all-mpnet-base-v2 gives best quality at 768 dims
# all-MiniLM-L6-v2 is 2x faster at 384 dims (change SQL vector() size too)
EMBEDDING_MODEL: str = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/all-mpnet-base-v2",
)
EMBEDDING_DIMS: int = int(os.getenv("EMBEDDING_DIMS", "768"))

HF_TOKEN: str = os.getenv("HF_TOKEN", "")
HF_EMBEDDING_URL: str = (
    f"https://api-inference.huggingface.co/pipeline/feature-extraction/{EMBEDDING_MODEL}"
)

_TIMEOUT = 30


async def embed_text(text: str) -> list[float]:
    """
    Generate a single normalised embedding vector for the given text.
    Returns a list of floats with length == EMBEDDING_DIMS.
    """
    if not HF_TOKEN:
        raise RuntimeError("HF_TOKEN is not set -- cannot generate embeddings.")

    if not text.strip():
        raise ValueError("Cannot embed empty text.")

    # Truncate to ~512 tokens (rough word-count heuristic)
    words = text.split()
    if len(words) > 400:
        text = " ".join(words[:400])
        logger.warning(
            "Text truncated to 400 words for embedding (was %d words)", len(words)
        )

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "inputs": text,
        "options": {"wait_for_model": True},
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(HF_EMBEDDING_URL, json=payload, headers=headers)

    if resp.status_code == 503:
        raise RuntimeError(
            "Embedding model is loading. Retry in 20 seconds."
        )
    if resp.status_code != 200:
        raise RuntimeError(
            f"HF embedding API error {resp.status_code}: {resp.text[:300]}"
        )

    raw = resp.json()

    # HF feature-extraction returns:
    #   list[float]              for single string input
    #   list[list[float]]        for batched input
    #   list[list[list[float]]]  for token-level models (need mean-pool)
    vector = _normalise_hf_output(raw)

    if len(vector) != EMBEDDING_DIMS:
        raise RuntimeError(
            f"Expected {EMBEDDING_DIMS}-dim vector, got {len(vector)}. "
            f"Check EMBEDDING_MODEL and EMBEDDING_DIMS env vars."
        )

    return vector


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed multiple texts in a single API call (more efficient).
    All texts are truncated and normalised the same way.
    """
    if not texts:
        return []

    truncated = []
    for t in texts:
        words = t.split()
        truncated.append(" ".join(words[:400]) if len(words) > 400 else t)

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "inputs": truncated,
        "options": {"wait_for_model": True},
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(HF_EMBEDDING_URL, json=payload, headers=headers)

    if resp.status_code != 200:
        raise RuntimeError(
            f"HF batch embedding error {resp.status_code}: {resp.text[:300]}"
        )

    raw = resp.json()
    if isinstance(raw[0], float):
        # Single-item batch returned flat
        return [_normalise_hf_output(raw)]
    return [_normalise_hf_output(row) for row in raw]


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _normalise_hf_output(raw: Any) -> list[float]:
    """
    Flatten HF feature-extraction output to a single 1-D list of floats.
    Handles sentence-transformers (already pooled) and token-level models.
    """
    if not raw:
        raise ValueError("HF returned empty embedding")

    # Already flat: [float, float, ...]
    if isinstance(raw[0], float):
        return raw

    # Nested one level: [[float, ...]]  -- single sentence, list-wrapped
    if isinstance(raw[0], list) and isinstance(raw[0][0], float):
        # Single sentence output with one pooled vector
        if len(raw) == 1:
            return raw[0]
        # Token-level: mean-pool across tokens
        dims = len(raw[0])
        pooled = [sum(raw[t][d] for t in range(len(raw))) / len(raw) for d in range(dims)]
        return pooled

    # Deeply nested: [[[float, ...]]] -- token-level, single sentence
    if isinstance(raw[0], list) and isinstance(raw[0][0], list):
        token_vecs = raw[0]
        dims = len(token_vecs[0])
        pooled = [
            sum(token_vecs[t][d] for t in range(len(token_vecs))) / len(token_vecs)
            for d in range(dims)
        ]
        return pooled

    raise ValueError(f"Unrecognised HF embedding output shape: {type(raw[0])}")
