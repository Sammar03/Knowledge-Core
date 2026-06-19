import { Plus, MessageSquare, Trash2 } from "lucide-react";
import type { Chat } from "../types";

interface Props {
  chats: Chat[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function ChatList({ chats, currentId, onSelect, onNew, onDelete }: Props) {
  return (
    <div>
      <button
        onClick={onNew}
        className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium text-ink-black transition hover:bg-fog"
      >
        <Plus className="h-4 w-4" />
        New chat
      </button>
      <ul className="mt-1 flex flex-col gap-0.5">
        {chats.map((c) => (
          <li
            key={c.id}
            className={`group flex items-center gap-2 rounded-[10px] px-3 py-2 ${
              c.id === currentId ? "bg-fog" : "hover:bg-fog"
            }`}
          >
            <MessageSquare className="h-4 w-4 shrink-0 text-ash" />
            <button
              onClick={() => onSelect(c.id)}
              className="min-w-0 flex-1 truncate text-left text-sm text-ink-black"
              title={c.title}
            >
              {c.title}
            </button>
            <button
              onClick={() => onDelete(c.id)}
              className="shrink-0 rounded p-1 text-ash opacity-0 transition hover:text-red-500 group-hover:opacity-100"
              aria-label={`Delete chat: ${c.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
