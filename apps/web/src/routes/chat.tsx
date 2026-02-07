import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "@/components/Chat/ChatPanel";
import { ArrowLeft, MessageSquare } from "lucide-react";

// @ts-expect-error — route path not in generated tree until `bun run dev` regenerates it
export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function ChatPage() {
  return (
    <div className="dark flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
        <a
          href="/"
          className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </a>
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" />
          <h1 className="font-medium text-sm">CliniBridge Chat</h1>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
}
