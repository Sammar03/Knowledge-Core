import type {
  ChatMessage,
  ChatResponse,
  DocumentInfo,
  IngestResponse,
} from "../types";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8010/api";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function uploadDocuments(files: File[]): Promise<IngestResponse> {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  return handle(await fetch(`${BASE}/documents`, { method: "POST", body: form }));
}

export async function listDocuments(): Promise<DocumentInfo[]> {
  const data = await handle<{ documents: DocumentInfo[] }>(
    await fetch(`${BASE}/documents`)
  );
  return data.documents;
}

export async function deleteDocument(filename: string): Promise<void> {
  await handle(
    await fetch(`${BASE}/documents/${encodeURIComponent(filename)}`, {
      method: "DELETE",
    })
  );
}

export async function sendChat(
  message: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  const trimmed = history
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content }));
  return handle(
    await fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: trimmed }),
    })
  );
}
