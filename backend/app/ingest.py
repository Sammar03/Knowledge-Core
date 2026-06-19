"""Parse uploaded files into per-page text, then split into overlapping chunks."""
from __future__ import annotations

import io
from dataclasses import dataclass

from pypdf import PdfReader

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md"}


@dataclass
class Chunk:
    text: str
    filename: str
    page: int
    chunk_index: int


def _extract_pages(filename: str, data: bytes) -> list[tuple[int, str]]:
    """Return [(page_number, text)]. Text/markdown collapse to a single page."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        pages: list[tuple[int, str]] = []
        for i, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                pages.append((i, text))
        return pages
    if lower.endswith((".txt", ".md")):
        text = data.decode("utf-8", errors="replace").strip()
        return [(1, text)] if text else []
    raise ValueError(f"Unsupported file type: {filename}")


def _split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Greedy paragraph-aware splitter targeting ~chunk_size chars with overlap."""
    if len(text) <= chunk_size:
        return [text]

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        if current and len(current) + len(para) + 2 > chunk_size:
            chunks.append(current)
            # carry overlap from the tail of the previous chunk
            current = (current[-overlap:] + "\n\n" + para) if overlap else para
        else:
            current = f"{current}\n\n{para}" if current else para

    if current:
        chunks.append(current)

    # Hard-split any paragraph that alone exceeds chunk_size.
    final: list[str] = []
    for c in chunks:
        if len(c) <= chunk_size:
            final.append(c)
            continue
        start = 0
        while start < len(c):
            final.append(c[start : start + chunk_size])
            start += chunk_size - overlap if chunk_size > overlap else chunk_size
    return final


def parse_and_chunk(
    filename: str, data: bytes, chunk_size: int, overlap: int
) -> tuple[list[Chunk], int]:
    """Parse a file and return (chunks, page_count)."""
    pages = _extract_pages(filename, data)
    chunks: list[Chunk] = []
    idx = 0
    for page_no, page_text in pages:
        for piece in _split_text(page_text, chunk_size, overlap):
            piece = piece.strip()
            if not piece:
                continue
            chunks.append(Chunk(text=piece, filename=filename, page=page_no, chunk_index=idx))
            idx += 1
    return chunks, len(pages)
