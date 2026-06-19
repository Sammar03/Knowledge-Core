# Backlog & Known Limitations

Post-MVP work, deferred per `prd.md` §3 (out of scope) and §9 (risks).

## Retrieval quality (primary iteration area)
- Tune `CHUNK_SIZE` / `CHUNK_OVERLAP` / `TOP_K` against real company docs.
- Evaluate the `RELEVANCE_THRESHOLD` (currently 0.30 cosine) — may need per-corpus tuning.
- Consider reranking and hybrid (keyword + vector) retrieval.

## Ingestion
- OCR for scanned PDFs (currently skipped — "no extractable text" error).
- Word / PowerPoint / Excel parsing.
- Better handling of multi-column layouts and tables.

## Product
- Authentication, user accounts, per-user document permissions.
- Cross-session persistent chat history per user.
- Multi-tenancy, audit logs, SSO.

## Ops
- Streaming chat responses.
- Per-call LLM cost/token logging + a spend circuit breaker.
- Background ingestion queue for large uploads.
- Deploy config (Railway for backend, Vercel for frontend).
