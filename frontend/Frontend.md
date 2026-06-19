# frontend.md — Frontend Spec

A clean React SPA for uploading documents and chatting with the knowledge base.

## Stack (current June 2026)
| Purpose          | Choice                          | Notes                                   |
|------------------|----------------------------------|-----------------------------------------|
| Framework        | React 18 + **Vite** + TypeScript | Fast dev server, simple build           |
| Styling          | Tailwind CSS                    | Utility-first, fast to build            |
| HTTP             | native `fetch` (or `axios`)     | Talk to FastAPI at `VITE_API_BASE`      |
| Icons            | `lucide-react`                  | Lightweight                             |
| Markdown render  | `react-markdown`                | Render assistant answers safely         |

Pin to latest stable at scaffold time (`npm create vite@latest`). No backend logic in the
frontend — it only calls the REST API defined in `backend.md`.

## Configuration
`.env` (Vite): `VITE_API_BASE=http://localhost:8000/api`

## Layout
```
frontend/
  src/
    main.tsx
    App.tsx                # layout: sidebar (docs) + main (chat)
    api/client.ts          # typed wrappers for /health, /documents, /chat
    types.ts               # ChatMessage, Source, Document types
    components/
      UploadPanel.tsx      # drag-drop / file picker, upload progress, errors
      DocumentList.tsx     # list indexed docs, delete button, chunk counts
      ChatWindow.tsx       # message list, auto-scroll
      MessageBubble.tsx    # user/assistant bubble; renders markdown
      Sources.tsx          # citation chips under each assistant answer
      ChatInput.tsx        # textarea + send; disabled while streaming/loading
      EmptyState.tsx       # shown when knowledge base is empty
  index.html
  package.json
  .env.example
```

## Core types (`types.ts`)
```ts
export type Role = "user" | "assistant";
export interface ChatMessage { role: Role; content: string; sources?: Source[]; }
export interface Source { filename: string; page: number; snippet: string; score: number; }
export interface DocumentInfo { filename: string; chunks: number; }
```

## API client (`api/client.ts`)
- `getHealth()` → counts for the header/status.
- `uploadDocuments(files: File[])` → POST multipart to `/documents`.
- `listDocuments()` / `deleteDocument(filename)`.
- `sendChat(message, history, topK?)` → POST `/chat`; returns `{ answer, sources, grounded }`.
- Conversation history lives in React state and is sent with each `sendChat` call (backend is
  stateless). Trim to the last ~6 turns before sending.

## UX behavior
- **Upload**: drag-drop or picker; accept `.pdf,.txt,.md`; show per-file progress and any
  errors returned by the backend; refresh the document list on success.
- **Empty state**: if no documents indexed, prompt the user to upload before chatting; the
  chat input can hint that the KB is empty.
- **Chat**: user message appears immediately; show a loading indicator while waiting; render
  the assistant answer as markdown; render **citation chips** (filename p.N) under the answer,
  each expandable to show the snippet.
- **Grounded flag**: if `grounded=false`, render the answer with a subtle "not found in
  documents" styling so users don't mistake it for a sourced answer.
- **Errors**: rate-limit (429) and server errors show a friendly inline message with retry.

## Design notes
- Two-pane layout: left sidebar = upload + document list; right = chat. Collapses to single
  column on mobile.
- Keep it clean and legible; this is an internal tool. Follow the frontend-design skill for
  typography/spacing rather than default-looking output.

## Run
```
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE
npm run dev            # http://localhost:5173
```