import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { MessageList } from "./MessageList";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/prompt-kit/prompt-input";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "@/components/prompt-kit/chat-container";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import { Icon } from "@iconify/react";
import { ArrowUp, Square } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { saveConversation } from "@/lib/chatStorage";

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
  const prevLengthRef = useRef(messages.length);

  // Keep a ref to latest messages so the unmount cleanup can access them
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const persist = useCallback(() => {
    if (messages.length > 0) {
      console.debug("[ChatPanel] persisting", conversationId, messages.length, "messages");
      saveConversation(conversationId, messages);
      onConversationUpdate?.();
    }
  }, [conversationId, messages, onConversationUpdate]);

  // Save whenever message count changes
  useEffect(() => {
    if (messages.length !== prevLengthRef.current) {
      prevLengthRef.current = messages.length;
      persist();
    }
  }, [messages.length, persist]);

  // Save when streaming finishes
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      persist();
    }
  }, [status, messages.length, persist]);

  // Save on unmount (handles "New Session" / conversation switch)
  useEffect(() => {
    const id = conversationId;
    return () => {
      const msgs = messagesRef.current;
      if (msgs.length > 0) {
        console.debug("[ChatPanel] unmount save", id, msgs.length, "messages");
        saveConversation(id, msgs);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="flex h-full flex-col relative">
      {/* ── Atmospheric depth layers (decorative only) ── */}

      {/* Top-center radial emerald mesh — very faint */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-900/[0.03] via-transparent to-transparent rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Center vignette — darkens edges subtly for depth */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(2,2,2,0.4) 100%)' }} />

      {/* Subtle geometric grid pattern — barely visible */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

      {/* Diagonal light streak — cinematic atmosphere */}
      <div className="absolute top-0 right-[20%] w-[1px] h-[40%] bg-gradient-to-b from-emerald-500/[0.06] via-white/[0.02] to-transparent pointer-events-none z-0 rotate-[15deg] origin-top" />

      {/* Messages with smart auto-scroll */}
      <ChatContainerRoot className="flex-1 pb-44 relative z-10">
        <ChatContainerContent className="w-full max-w-[800px] mx-auto px-6 py-16 md:py-20 flex flex-col gap-12">
          <MessageList
            messages={messages}
            status={status}
            onSuggestionClick={handleSuggestionClick}
          />
        </ChatContainerContent>
        <ChatContainerScrollAnchor />

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <ScrollButton />
        </div>
      </ChatContainerRoot>

      {/* Input — fixed to bottom, above atmosphere */}
      <div className="absolute bottom-0 inset-x-0 z-20">
        <div className="h-10 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />

        <div className="bg-neutral-950 px-6 pb-5 pt-1">
          <div className="w-full max-w-[800px] mx-auto">
            <div className="relative group">
              {/* Understated emerald glow — invisible by default, barely visible on focus */}
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/[0.05] via-transparent to-teal-500/[0.05] rounded-[2rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />

              {/* Glass container */}
              <PromptInput
                value={input}
                onValueChange={setInput}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                className="relative bg-neutral-900/40 backdrop-blur-2xl border-white/[0.05] rounded-[1.25rem] overflow-hidden transition-all duration-500 focus-within:border-white/[0.08]"
              >
                <PromptInputTextarea
                  placeholder="Describe a condition, age, and location..."
                  className="w-full bg-transparent text-white placeholder:text-neutral-600 font-light text-[15px] px-6 py-4 min-h-[52px] max-h-48 resize-none focus:outline-none leading-relaxed border-none shadow-none focus-visible:ring-0"
                />
                <PromptInputActions className="justify-between px-5 pb-4">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="p-2 rounded-lg text-neutral-600 hover:text-white/60 hover:bg-white/[0.03] transition-colors"
                      aria-label="Upload"
                    >
                      <Icon icon="solar:paperclip-linear" width={18} />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-lg text-neutral-600 hover:text-white/60 hover:bg-white/[0.03] transition-colors md:hidden"
                      aria-label="Voice"
                    >
                      <Icon icon="solar:microphone-linear" width={18} />
                    </button>
                  </div>

                  {isLoading ? (
                    <PromptInputAction tooltip="Stop generating">
                      <button
                        type="button"
                        className="size-9 rounded-xl bg-white/90 text-neutral-950 flex items-center justify-center hover:bg-white transition-all duration-200"
                        onClick={stop}
                      >
                        <Square className="size-3" />
                      </button>
                    </PromptInputAction>
                  ) : (
                    <PromptInputAction tooltip="Send message">
                      <button
                        type="button"
                        className="size-9 rounded-xl bg-white/90 text-neutral-950 flex items-center justify-center hover:bg-white transition-all duration-200 disabled:opacity-15 disabled:hover:bg-white/90"
                        disabled={!input.trim()}
                        onClick={handleSubmit}
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
                <p className="text-neutral-600 text-[10px] tracking-wide">
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
