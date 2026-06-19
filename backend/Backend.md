# backend.md — Backend Spec

FastAPI service implementing the RAG pipeline. Stateless; persists vectors to disk.

## Stack (pinned, verified current June 2026)
| Purpose            | Package / Model                         | Version / ID                |
|--------------------|------------------------------------------|-----------------------------|
| Web framework      | `fastapi`                                | `>=0.115,<1.0`              |
| ASGI server        | `uvicorn[standard]`                      | `>=0.34`                    |
| Data validation    | `pydantic`                               | `>=2.7`                     |
| Gemini SDK         | `google-genai`                           | `==2.8.0` (NOT legacy `google-generativeai`) |
| Groq SDK           | `groq`                                   | latest (`>=0.20`)          |
| Vector store       | `psycopg[binary]` + Neon Postgres/pgvector | `>=3.1`                   |
| PDF parsing        | `pypdf`                                   | `>=5.0`                     |
| Env management     | `python-dotenv`                          | `>=1.0`                     |
| File uploads       | `python-multipart`                       | `>=0.0.9`                   |

### Models
- **Embeddings**: `gemini-embedding-2` via `google-genai`. Request `output_dimensionality=768`
  (smaller = faster/cheaper, fine for MVP). Use `task_type="RETRIEVAL_DOCUMENT"` when embedding
  chunks and `task_type="RETRIEVAL_QUERY"` when embedding the user query.
- **Generation**: Groq `llama-3.3-70b-versatile` (fallback `openai/gpt-oss-120b`).

## Project layout
```
backend/
  app/
    main.py            # FastAPI app, CORS, routers
    config.py          # env vars, settings (pydantic-settings)
    models.py          # pydantic request/response schemas
    ingest.py          # parse + chunk
    embeddings.py      # Gemini embedding wrapper (batch, dims=768, task_type)
    vectorstore.py     # Neon Postgres + pgvector wrapper
    generate.py        # Groq chat wrapper + grounding prompt builder
    routers/
      documents.py     # upload, list, delete
      chat.py          # chat endpoint
  Dockerfile
  requirements.txt
  .env.example
```

## Configuration (`.env`)
```
GEMINI_API_KEY=...
GROQ_API_KEY=...
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
EMBED_MODEL=gemini-embedding-2
EMBED_DIMS=768
GEN_MODEL=llama-3.3-70b-versatile
CHUNK_SIZE=1000
CHUNK_OVERLAP=150
TOP_K=5
```

## Pipeline details
### Ingestion (`ingest.py`)
- PDFs: `pypdf` — extract text **per page**, keep page numbers.
- Text/markdown: read directly (single logical page = 1).
- Chunking: ~`CHUNK_SIZE` chars with `CHUNK_OVERLAP` overlap, split on paragraph/sentence
  boundaries where possible. Each chunk carries metadata: `{filename, page, chunk_index}`.

### Embeddings (`embeddings.py`)
- Wrap `google-genai` client. Batch chunks per request where supported.
- Document chunks → `task_type=RETRIEVAL_DOCUMENT`; queries → `task_type=RETRIEVAL_QUERY`.
- `output_dimensionality` from `EMBED_DIMS`. Handle rate limits with simple retry/backoff.

### Vector store (`vectorstore.py`)
- Neon Postgres + `pgvector` via `psycopg` (connection per operation; `DATABASE_URL`).
- One table `company_docs(id, filename, page, chunk_index, content, embedding vector(768))`;
  `vector` extension, the table and an HNSW cosine index are auto-created on first use.
- Embeddings are passed as pgvector literals (`[...]::vector`); cosine similarity via `<=>`.
  Support delete-by-filename.

### Generation (`generate.py`)
- Retrieve top-k chunks for the query embedding.
- Build messages: a strict **system prompt** (answer only from context; cite sources; if not
  present, say "I couldn't find that in the documents"), the recent conversation turns, and a
  user message containing the question + the retrieved context block (each chunk tagged with
  its filename + page).
- Call Groq; return the answer plus the list of source chunks actually provided.

## API contract
All JSON. Base path `/api`.

### `GET /api/health`
→ `{ "status": "ok" }` (lightweight liveness probe; no DB scan)

### `POST /api/documents` (multipart)
- form field `files`: one or more PDF/txt/md files.
→ `{ "indexed": [{ "filename": str, "pages": int, "chunks": int }], "errors": [...] }`

### `GET /api/documents`
→ `{ "documents": [{ "filename": str, "chunks": int }] }`

### `DELETE /api/documents/{filename}`
→ `{ "deleted": str, "removed_chunks": int }`

### `POST /api/chat`
Request:
```json
{
  "message": "What is the parental leave policy?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "top_k": 5
}
```
Response:
```json
{
  "answer": "…",
  "sources": [
    { "filename": "handbook.pdf", "page": 12, "snippet": "…", "score": 0.83 }
  ],
  "grounded": true
}
```
- `history` is optional; backend uses the last N turns (e.g. 6) to stay within limits.
- `grounded=false` when no sufficiently relevant chunks were found.

## Error handling
- 400 for unsupported file types / empty upload.
- 413 for oversized files (set a sane limit, e.g. 25 MB).
- 429 passthrough on provider rate limits with a clear message.
- 500 with `{ "detail": "..." }`; never leak API keys or stack traces to the client.

## CORS
Allow the frontend dev origin (`http://localhost:5173`) and configurable production origin.

## Run
```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in keys
uvicorn app.main:app --reload --port 8000
```