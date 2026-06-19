import type { Chat } from "./types";

const KEY = "company-rag-chats";

export function loadChats(): Chat[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return []; // corrupt/old data -> start clean
  }
}

export function saveChats(chats: Chat[]): void {
  localStorage.setItem(KEY, JSON.stringify(chats));
}

// ponytail: localStorage holds ~5MB, plenty for a small team's chats.
// Add server-side history + pruning when it overflows or needs multi-device sync.
