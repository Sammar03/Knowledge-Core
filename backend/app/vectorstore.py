"""Postgres + pgvector vector store (Neon). Public API matches the old Chroma wrapper.

We pass embeddings as pgvector text literals (`[1,2,3]::vector`) so we need no
numpy / pgvector-python adapter — just psycopg.
"""
from __future__ import annotations

from dataclasses import dataclass

import psycopg

from .config import get_settings
from .ingest import Chunk

TABLE = "company_docs"

_initialized = False


@dataclass
class Retrieved:
    text: str
    filename: str
    page: int
    score: float


def _vec(v: list[float]) -> str:
    """Format an embedding as a pgvector literal: [0.1,0.2,...]."""
    return "[" + ",".join(repr(float(x)) for x in v) + "]"


def _connect() -> psycopg.Connection:
    settings = get_settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg.connect(settings.database_url)


def _ensure_init() -> None:
    """Create the pgvector extension, table and indexes once per process."""
    global _initialized
    if _initialized:
        return
    dims = get_settings().embed_dims
    with _connect() as conn:
        conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.execute(
            f"""CREATE TABLE IF NOT EXISTS {TABLE} (
                id text PRIMARY KEY,
                filename text NOT NULL,
                page int NOT NULL,
                chunk_index int NOT NULL,
                content text NOT NULL,
                embedding vector({dims}) NOT NULL
            )"""
        )
        conn.execute(f"CREATE INDEX IF NOT EXISTS {TABLE}_filename_idx ON {TABLE} (filename)")
        conn.execute(
            f"CREATE INDEX IF NOT EXISTS {TABLE}_embedding_idx ON {TABLE} "
            "USING hnsw (embedding vector_cosine_ops)"
        )
    _initialized = True


def add_chunks(chunks: list[Chunk], embeddings: list[list[float]]) -> None:
    if not chunks:
        return
    _ensure_init()
    rows = [
        (f"{c.filename}::{c.chunk_index}", c.filename, c.page, c.chunk_index, c.text, _vec(e))
        for c, e in zip(chunks, embeddings)
    ]
    with _connect() as conn, conn.cursor() as cur:
        cur.executemany(
            f"INSERT INTO {TABLE} (id, filename, page, chunk_index, content, embedding) "
            "VALUES (%s, %s, %s, %s, %s, %s::vector) "
            "ON CONFLICT (id) DO UPDATE SET filename = EXCLUDED.filename, "
            "page = EXCLUDED.page, chunk_index = EXCLUDED.chunk_index, "
            "content = EXCLUDED.content, embedding = EXCLUDED.embedding",
            rows,
        )


def query(embedding: list[float], top_k: int) -> list[Retrieved]:
    _ensure_init()
    lit = _vec(embedding)
    with _connect() as conn:
        rows = conn.execute(
            f"SELECT content, filename, page, 1 - (embedding <=> %s::vector) AS similarity "
            f"FROM {TABLE} ORDER BY embedding <=> %s::vector LIMIT %s",
            (lit, lit, top_k),
        ).fetchall()
    return [
        Retrieved(text=r[0], filename=r[1], page=int(r[2]), score=round(float(r[3]), 4))
        for r in rows
    ]


def list_documents() -> list[str]:
    """Return distinct filenames, sorted."""
    _ensure_init()
    with _connect() as conn:
        rows = conn.execute(
            f"SELECT DISTINCT filename FROM {TABLE} ORDER BY filename"
        ).fetchall()
    return [r[0] for r in rows]


def delete_document(filename: str) -> int:
    _ensure_init()
    with _connect() as conn:
        cur = conn.execute(f"DELETE FROM {TABLE} WHERE filename = %s", (filename,))
        return cur.rowcount
