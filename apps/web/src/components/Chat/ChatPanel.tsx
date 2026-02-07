import { useChat } from "@ai-sdk/react";
import { MessageList } from "./MessageList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Square } from "lucide-react";
import { useRef, useEffect, useState } from "react";

export function ChatPanel() {
  const { messages, sendMessage, status, stop } = useChat();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>

      {/* Input */}
      <div className="border-t border-border/40 p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe a condition, age, and location..."
            disabled={isLoading}
            className="flex-1"
          />
          {isLoading ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={stop}
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="size-4" />
            </Button>
          )}
        </form>
        <p className="mt-2 text-center text-muted-foreground/60 text-[10px]">
          CliniBridge is an AI assistant — not a substitute for medical advice.
        </p>
      </div>
    </div>
  );
}
