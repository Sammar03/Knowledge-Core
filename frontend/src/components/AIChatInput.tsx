import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Paperclip, Send } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  onUpload?: (files: File[]) => void;
  disabled?: boolean;
}

const AIChatInput = ({ onSend, onUpload, disabled = false }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState("");

  // Grow the textarea with its content (wraps to new lines), capped then scroll.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  }, [inputValue]);

  const submit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInputValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="w-full px-4 py-4 text-[#0d0d0d]">
      {/* Pill lifts on focus via CSS (focus-within) — no animation lib needed. */}
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-[28px] border border-[#ececec] bg-white p-3 shadow-sm transition-shadow focus-within:shadow-lg">
        <button
          className="rounded-full p-3 transition hover:bg-[#ececec]"
          title="Attach file"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          multiple
          hidden
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            if (files.length) onUpload?.(files);
            e.target.value = "";
          }}
        />
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={1}
          placeholder="Ask anything about your documents…"
          className="block max-h-48 min-w-0 flex-1 resize-none border-0 bg-transparent py-2 text-base outline-0 placeholder:text-gray-400"
        />
        <button
          className="flex items-center justify-center rounded-full bg-black p-3 text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          title="Send"
          type="button"
          onClick={submit}
          disabled={disabled || !inputValue.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export { AIChatInput };
