import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { MessageList } from "./MessageList";
import { Button } from "@/components/ui/button";
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
import { Send, Square } from "lucide-react";
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

  const persist = useCallback(() => {
    if (messages.length > 0) {
      saveConversation(conversationId, messages);
      onConversationUpdate?.();
    }
  }, [conversationId, messages, onConversationUpdate]);

  useEffect(() => {
    // Save when new messages arrive (length changes) or streaming finishes
    if (messages.length !== prevLengthRef.current) {
      prevLengthRef.current = messages.length;
      persist();
    }
  }, [messages.length, persist]);

  // Also persist when streaming completes (captures final tool output state)
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      persist();
    }
  }, [status, messages.length, persist]);

  function handleSubmit() {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  function handleSuggestionClick(suggestion: string) {
    sendMessage({ text: suggestion });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages with smart auto-scroll */}
      <ChatContainerRoot className="flex-1">
        <ChatContainerContent className="px-4 py-4">
          <MessageList
            messages={messages}
            status={status}
            onSuggestionClick={handleSuggestionClick}
          />
        </ChatContainerContent>
        <ChatContainerScrollAnchor />

        {/* Scroll to bottom button */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <ScrollButton />
        </div>
      </ChatContainerRoot>

      {/* Input */}
      <div className="border-t border-border/40 p-4">
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className="bg-muted/30"
        >
          <PromptInputTextarea
            placeholder="Describe a condition, age, and location..."
          />
          <PromptInputActions className="justify-end">
            {isLoading ? (
              <PromptInputAction tooltip="Stop generating">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={stop}
                >
                  <Square className="size-3.5" />
                </Button>
              </PromptInputAction>
            ) : (
              <PromptInputAction tooltip="Send message">
                <Button
                  type="button"
                  size="icon"
                  className="size-8 rounded-full"
                  disabled={!input.trim()}
                  onClick={handleSubmit}
                >
                  <Send className="size-3.5" />
                </Button>
              </PromptInputAction>
            )}
          </PromptInputActions>
        </PromptInput>
        <p className="mt-2 text-center text-muted-foreground/60 text-[10px]">
          CliniBridge is an AI assistant — not a substitute for medical advice.
        </p>
      </div>
    </div>
  );
}
