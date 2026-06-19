export type Role = "user" | "assistant";

export interface Source {
  id: number;
  filename: string;
  page: number;
  snippet: string;
  score: number;
}

export interface ChatMessage {
  role: Role;
  content: string;
  sources?: Source[];
  grounded?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface DocumentInfo {
  filename: string;
  chunks: number;
}

export interface IndexedDocument {
  filename: string;
  pages: number;
  chunks: number;
}

export interface IngestResponse {
  indexed: IndexedDocument[];
  errors: string[];
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  grounded: boolean;
}
