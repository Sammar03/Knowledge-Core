export type Role = "user" | "assistant";

export interface Source {
  id: number;
  filename: string;
  page: number;
  snippet: string;
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
}

export interface IngestResponse {
  indexed: string[]; // filenames successfully indexed
  errors: string[];
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  grounded: boolean;
}
