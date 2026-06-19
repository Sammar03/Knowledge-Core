# CLAUDE.md

Context for Claude Code working on this repository.

## What this is
A **Company Document RAG Assistant** (MVP). Employees upload company documents (PDF + text)
into a central vector store and chat with it to get grounded, **cited** answers with
**conversation history**. See `prd.md` for full product requirements.

## Architecture (option B: separate frontend + backend)
```
React/Vite frontend  ──REST──▶  FastAPI backend  ──▶  Neon Postgres + pgvector
                                       │
                                       ├──▶ Gemini  (embeddings: gemini-embedding-2)
                                       └──▶ Groq    (generation: llama-3.3-70b-versatile)
```
- Frontend and backend are **separate apps** in `/frontend` and `/backend`.
- Backend is **stateless**: the frontend sends recent conversation turns with each chat request.
- Vectors are stored in Neon Postgres via pgvector, so the index is persistent across redeploys.

## Repository layout
```
/backend     FastAPI app — ingestion, retrieval, generation. See backend.md.
/frontend    React + Vite + TS UI — upload, chat, citations. See frontend.md.
/docs        Reference docs.
prd.md       Product requirements.
backend.md   Backend spec, stack, pinned versions, API contract.
frontend.md  Frontend spec, stack, components, API client.
```

## CRITICAL: use current, non-deprecated libraries (verified June 2026)
Code generators frequently emit outdated packages. Do NOT do that here.
- ✅ Use **`google-genai`** (the new unified SDK, v2.8.0). ❌ Do NOT use the legacy
  `google-generativeai` package — it is deprecated for new features.
- ✅ Embeddings model: **`gemini-embedding-2`** (GA, multimodal, 3072-dim default; we use
  768 dims for speed). ❌ Not `text-embedding-004` / `embedding-001` (older).
- ✅ Groq generation model: **`llama-3.3-70b-versatile`** (alt: `openai/gpt-oss-120b`).
  ❌ Avoid deprecated Groq models (e.g. older llama-4-maverick, gemma2-9b-it).
- ✅ **`psycopg`** v3 (Postgres) + **`pgvector`** extension on Neon, **`fastapi`** + **`uvicorn`**, **`pypdf`** for PDF text.
- Pin exact versions per `backend.md`. If unsure a model/lib is current, check provider
  docs before coding — do not guess.

## Conventions
- Python 3.11+. Type hints everywhere. `ruff` for lint/format.
- Secrets via `.env` (`GEMINI_API_KEY`, `GROQ_API_KEY`). Never commit keys. Provide `.env.example`.
- Backend returns structured JSON; errors as `{ "detail": "..." }` with proper HTTP codes.
- Keep the grounding prompt strict: answer only from retrieved context; otherwise say so.
- Citations are first-class: every chat response includes the source chunks used.

## Build order (follow this)
1. Backend ingestion pipeline (upload → parse → chunk → embed → store) + `/health`.
2. Backend retrieval + generation (`/chat`) with citations and history.
3. Frontend: upload view, document list, chat view with citations.
4. Wire end-to-end; test with real messy PDFs; tune chunk size / top-k.

## Definition of done (MVP)
Upload several PDFs, ask multi-turn questions, get grounded answers with correct
citations, and get "not in the documents" when appropriate. See `prd.md` §8.