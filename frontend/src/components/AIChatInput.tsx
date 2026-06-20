import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Paperclip, Send } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";

// Domain-flavoured placeholders for the document Q&A use case.
const PLACEHOLDERS = [
  "What is our parental leave policy?",
  "Summarize the onboarding document",
  "How many days of annual leave do I get?",
  "What does the handbook say about remote work?",
  "Who approves expense reimbursements?",
];

interface Props {
  onSend: (message: string) => void;
  onUpload?: (files: File[]) => void;
  disabled?: boolean;
}

const AIChatInput = ({ onSend, onUpload, disabled = false }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Grow the textarea with its content (wraps to new lines), capped then scroll.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  }, [inputValue]);

  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || inputValue) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, inputValue]);

  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!inputValue) setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue]);

  const handleActivate = () => setIsActive(true);

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

  const containerVariants: Variants = {
    collapsed: {
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
    expanded: {
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.16)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
  };

  const placeholderContainerVariants: Variants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };

  const letterVariants: Variants = {
    initial: { opacity: 0, filter: "blur(12px)", y: 10 },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(12px)",
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
  };

  return (
    <div className="w-full px-4 py-4 text-[#0d0d0d]">
      <motion.div
        ref={wrapperRef}
        className="mx-auto w-full max-w-3xl"
        variants={containerVariants}
        animate={isActive || inputValue ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{
          borderRadius: 28,
          background: "#ffffff",
          border: "1px solid #ececec",
        }}
        onClick={handleActivate}
      >
        <div className="flex h-full w-full flex-col items-stretch">
          {/* Input Row */}
          <div className="flex w-full max-w-3xl items-end gap-2 bg-transparent p-3">
            <button
              className="rounded-full p-3 transition hover:bg-[#ececec]"
              title="Attach file"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
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

            {/* Text Input & Placeholder */}
            <div className="relative min-w-0 flex-1 overflow-hidden">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={disabled}
                rows={1}
                className="block max-h-48 w-full resize-none border-0 bg-transparent py-2 text-base font-normal outline-0"
                style={{ position: "relative", zIndex: 1 }}
                onFocus={handleActivate}
              />
              <div className="pointer-events-none absolute left-0 top-0 flex h-full w-full items-center px-3 py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && (
                    <motion.span
                      key={placeholderIndex}
                      className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 select-none text-gray-400"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        zIndex: 0,
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {PLACEHOLDERS[placeholderIndex].split("").map((char, i) => (
                        <motion.span
                          key={i}
                          variants={letterVariants}
                          style={{ display: "inline-block" }}
                        >
                          {char === " " ? " " : char}
                        </motion.span>
                      ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button
              className="flex items-center justify-center gap-1 rounded-full bg-black p-3 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              title="Send"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                submit();
              }}
              disabled={disabled || !inputValue.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export { AIChatInput };
