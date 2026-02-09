import { useChat } from "@ai-sdk/react";
import { Icon } from "@iconify/react";
import type { UIMessage } from "ai";
import { ArrowUp, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/prompt-kit/chat-container";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import { saveConversation } from "@/lib/chatStorage";
import { MessageList } from "./MessageList";

interface ChatPanelProps {
  conversationId: string;
  initialMessages?: UIMessage[];
  /** Called after first user message so parent can refresh sidebar */
  onConversationUpdate?: () => void;
}

export function ChatPanel({
  conversationId,
  initialMessages,
  onConversationUpdate,
}: ChatPanelProps) {
  const { messages, sendMessage, status, stop } = useChat({
    id: conversationId,
    initialMessages,
  });

  const [input, setInput] = useState("");
  const isLoading = status === "streaming" || status === "submitted";

  // ── Persist to localStorage on message changes ──────────────────────────
  // All persistence uses refs so callbacks never go stale. This prevents the
  // cascading recreation problem where `persist` depended on `messages`,
  // causing `schedulePersist` to rebuild every streaming token.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const onConversationUpdateRef = useRef(onConversationUpdate);
  onConversationUpdateRef.current = onConversationUpdate;

  const prevLengthRef = useRef(messages.length);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always reads from refs — no stale closures, stable identity.
  const persistNow = useCallback(() => {
    const msgs = messagesRef.current;
    if (msgs.length > 0) {
      saveConversation(conversationId, msgs);
      onConversationUpdateRef.current?.();
    }
  }, [conversationId]);

  const schedulePersist = useCallback(
    (delayMs = 300) => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
      persistTimeoutRef.current = setTimeout(() => {
        persistNow();
        persistTimeoutRef.current = null;
      }, delayMs);
    },
    [persistNow]
  );

  // Save IMMEDIATELY when a new message is added (count changes).
  // This is the critical path — debouncing here is what loses data.
  useEffect(() => {
    if (messages.length !== prevLengthRef.current) {
      prevLengthRef.current = messages.length;
      persistNow(); // immediate — not debounced
    }
  }, [messages.length, persistNow]);

  // Save when streaming finishes (captures final streamed content).
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      persistNow(); // immediate — streaming just ended, save the final state
    }
  }, [status, messages.length, persistNow]);

  // Debounced save during active streaming so we don't lose partial content.
  useEffect(() => {
    if (status === "streaming") {
      schedulePersist(500);
    }
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [status, messages, schedulePersist]);

  // Save on unmount (handles "New Session" / conversation switch).
  useEffect(() => {
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
      const msgs = messagesRef.current;
      if (msgs.length > 0) {
        saveConversation(conversationId, msgs);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Save on full page refresh / tab close / tab switch.
  // React cleanup doesn't run on hard navigations.
  useEffect(() => {
    const save = () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
      const msgs = messagesRef.current;
      if (msgs.length > 0) {
        saveConversation(conversationId, msgs);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("beforeunload", save);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", save);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [conversationId]);

  function handleSubmit() {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  function handleSuggestionClick(suggestion: string) {
    sendMessage({ text: suggestion });
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* ── Atmospheric depth layers (decorative only) ── */}

      {/* Top-center radial emerald mesh — very faint */}
      <div className="pointer-events-none absolute top-0 left-1/2 z-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-900/[0.03] via-transparent to-transparent blur-[100px]" />

      {/* Center vignette — darkens edges subtly for depth */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(2,2,2,0.4) 100%)",
        }}
      />

      {/* Subtle geometric grid pattern — barely visible */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Diagonal light streak — cinematic atmosphere */}
      <div className="pointer-events-none absolute top-0 right-[20%] z-0 h-[40%] w-[1px] origin-top rotate-[15deg] bg-gradient-to-b from-emerald-500/[0.06] via-white/[0.02] to-transparent" />

      {/* Messages with smart auto-scroll */}
      <ChatContainerRoot className="relative z-10 flex-1 pb-44">
        <ChatContainerContent className="mx-auto flex w-full max-w-[800px] flex-col gap-12 px-6 py-16 md:py-20">
          <MessageList
            messages={messages}
            onSuggestionClick={handleSuggestionClick}
            status={status}
          />
        </ChatContainerContent>
        <ChatContainerScrollAnchor />

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <ScrollButton />
        </div>
      </ChatContainerRoot>

      {/* Input — fixed to bottom, above atmosphere */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="pointer-events-none h-10 bg-gradient-to-t from-neutral-950 to-transparent" />

        <div className="bg-neutral-950 px-6 pt-1 pb-5">
          <div className="mx-auto w-full max-w-[800px]">
            <div className="group relative">
              {/* Understated emerald glow — invisible by default, barely visible on focus */}
              <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-r from-emerald-500/[0.05] via-transparent to-teal-500/[0.05] opacity-0 blur-2xl transition-opacity duration-1000 group-focus-within:opacity-100" />

              {/* Glass container */}
              <PromptInput
                className="relative overflow-hidden rounded-[1.25rem] border-white/[0.05] bg-neutral-900/40 backdrop-blur-2xl transition-all duration-500 focus-within:border-white/[0.08]"
                isLoading={isLoading}
                onSubmit={handleSubmit}
                onValueChange={setInput}
                value={input}
              >
                <PromptInputTextarea
                  className="max-h-48 min-h-[52px] w-full resize-none border-none bg-transparent px-6 py-4 font-light text-[15px] text-white leading-relaxed shadow-none placeholder:text-neutral-600 focus:outline-none focus-visible:ring-0"
                  placeholder="Describe a condition, age, and location..."
                />
                <PromptInputActions className="justify-between px-5 pb-4">
                  <div className="flex items-center gap-1">
                    <button
                      aria-label="Upload"
                      className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-white/[0.03] hover:text-white/60"
                      type="button"
                    >
                      <Icon icon="solar:paperclip-linear" width={18} />
                    </button>
                    <button
                      aria-label="Voice"
                      className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-white/[0.03] hover:text-white/60 md:hidden"
                      type="button"
                    >
                      <Icon icon="solar:microphone-linear" width={18} />
                    </button>
                  </div>

                  {isLoading ? (
                    <PromptInputAction tooltip="Stop generating">
                      <button
                        className="flex size-9 items-center justify-center rounded-xl bg-white/90 text-neutral-950 transition-all duration-200 hover:bg-white"
                        onClick={stop}
                        type="button"
                      >
                        <Square className="size-3" />
                      </button>
                    </PromptInputAction>
                  ) : (
                    <PromptInputAction tooltip="Send message">
                      <button
                        className="flex size-9 items-center justify-center rounded-xl bg-white/90 text-neutral-950 transition-all duration-200 hover:bg-white disabled:opacity-15 disabled:hover:bg-white/90"
                        disabled={!input.trim()}
                        onClick={handleSubmit}
                        type="button"
                      >
                        <ArrowUp className="size-4" strokeWidth={2} />
                      </button>
                    </PromptInputAction>
                  )}
                </PromptInputActions>
              </PromptInput>

              {/* Disclaimer with emerald dot accent */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="h-[1px] w-4 bg-gradient-to-r from-transparent to-emerald-500/20" />
                <p className="text-[10px] text-neutral-600 tracking-wide">
                  CliniBridge is an AI assistant — not a substitute for medical
                  advice.
                </p>
                <span className="h-[1px] w-4 bg-gradient-to-l from-transparent to-emerald-500/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
