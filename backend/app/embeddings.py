"""Gemini embeddings via the unified google-genai SDK (NOT legacy google-generativeai)."""
from __future__ import annotations

import time
from typing import Literal

from google import genai
from google.genai import types

from .config import get_settings

TaskType = Literal["RETRIEVAL_DOCUMENT", "RETRIEVAL_QUERY"]

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def _embed_one(text: str, task_type: TaskType, max_retries: int = 3) -> list[float]:
    """Embed a single text. gemini-embedding-2 returns one embedding per request;
    passing a list of strings collapses to a single embedding, so we call per-text."""
    settings = get_settings()
    client = _get_client()
    config = types.EmbedContentConfig(
        task_type=task_type,
        output_dimensionality=settings.embed_dims,
    )
    last_err: Exception | None = None
    for attempt in range(max_retries):
        try:
            resp = client.models.embed_content(
                model=settings.embed_model,
                contents=text,
                config=config,
            )
            return resp.embeddings[0].values
        except Exception as err:  # noqa: BLE001 — retry transient/rate-limit errors
            last_err = err
            if attempt < max_retries - 1:
                time.sleep(2**attempt)  # 1s, 2s, 4s backoff
    raise RuntimeError(f"Embedding request failed after {max_retries} attempts: {last_err}")


def embed_documents(texts: list[str]) -> list[list[float]]:
    return [_embed_one(t, "RETRIEVAL_DOCUMENT") for t in texts]


def embed_query(text: str) -> list[float]:
    return _embed_one(text, "RETRIEVAL_QUERY")
