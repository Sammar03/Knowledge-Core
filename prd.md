# PRD — Company Document RAG Assistant (MVP)

## 1. Problem
Companies accumulate too many documents and not enough context. Employees can't find
answers buried across scattered files. This MVP lets employees upload company documents
into a central store and **chat** with that store to get grounded, cited answers.

## 2. Goal (MVP)
Deliver a working end-to-end Retrieval-Augmented Generation (RAG) system in 1–2 days:
**upload → parse → chunk → embed → store → retrieve → answer with citations**, with a
proper separate frontend and backend, using only free AI APIs (Gemini + Groq).

## 3. Scope

### In scope (MVP)
- Upload **PDF and plain-text (.txt, .md)** documents.
- Parse, chunk, embed, and persist documents in a vector store.
- Chat interface: ask a question, get an answer grounded in stored documents.
- **Source citations** in every answer (filename + page/chunk reference).
- **Conversation history** within a session (multi-turn, context-aware follow-ups).
- List and delete uploaded documents.

### Out of scope (post-MVP)
- Word/PowerPoint/Excel parsing, OCR for scanned PDFs.
- Authentication, user accounts, per-user document permissions.
- Cross-session persistent chat history per user.
- Production-scale infra (current target: tens–hundreds of docs, small team).
- Multi-tenancy, audit logs, SSO.

## 4. Users
- **Employee**: uploads documents, asks questions, reads cited answers.
- (Single shared knowledge base for the MVP — everyone sees everything.)

## 5. Core user stories
1. As an employee, I can upload one or more PDFs/text files and see them get indexed.
2. As an employee, I can ask a natural-language question and get an answer drawn only
   from the uploaded documents.
3. As an employee, I can see which document(s) and page(s) an answer came from.
4. As an employee, I can ask follow-up questions that build on the conversation.
5. As an employee, I can see the list of indexed documents and remove one.

## 6. Functional requirements
- **Ingestion**: accept file upload via API; extract text (per page for PDFs); split into
  overlapping chunks; embed each chunk; store vector + metadata (filename, page, chunk index).
- **Retrieval**: embed the user query; return top-k most similar chunks (default k=5).
- **Generation**: build a prompt from retrieved chunks + recent conversation turns; call
  the LLM; return answer + structured list of sources.
- **Grounding**: the system prompt instructs the model to answer ONLY from provided
  context and to say when the answer isn't in the documents (reduce hallucination).
- **Citations**: each answer returns the source chunks used (filename + page).
- **History**: frontend maintains conversation; backend accepts recent turns per request
  (stateless backend for the MVP).

## 7. Non-functional requirements
- **Free APIs only**: Gemini (embeddings + optional generation), Groq (generation).
- **Latest, non-deprecated libraries** (see backend.md for pinned versions).
- Chat response target: < ~5s for typical queries (Groq is fast; embedding is the main cost).
- Clear error states (upload failure, rate-limit, empty knowledge base).
- Secrets via environment variables; never commit API keys.

## 8. Success criteria (MVP demo)
- Upload 3–5 real company PDFs without errors.
- Ask 10 questions; answers are grounded and cite correct sources for the majority.
- Follow-up questions correctly use prior context.
- "Not in the documents" is returned when the answer genuinely isn't present.

## 9. Key risks
- **Retrieval quality** is the make-or-break variable and cannot be fully de-risked in 2
  days. Mitigate with sensible chunking + overlap, top-k tuning, and a strict grounding
  prompt. This is the primary post-MVP iteration area.
- **Free-tier rate limits** (Gemini + Groq) — fine for demo, will throttle real rollout.
- **Messy PDFs** (multi-column, tables, scans) degrade extraction; OCR is out of scope.

## 10. Tech stack (summary; details in backend.md / frontend.md)
- Backend: Python, **FastAPI**, **google-genai** (Gemini `gemini-embedding-2`),
  **groq** (`llama-3.3-70b-versatile`), **Neon Postgres + pgvector** (persistent vector store),
  **pypdf** for parsing.
- Frontend: **React + Vite + TypeScript**, Tailwind, talking to the FastAPI backend over REST.