import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "@/components/Chat/ChatPanel";
import { ChatSidebar } from "@/components/Chat/ChatSidebar";
import {
  listConversations,
  getConversation,
  generateId,
  deleteConversation,
} from "@/lib/chatStorage";
import type { ConversationMeta } from "@/lib/chatStorage";
import { ArrowLeft, MessageSquare, PanelLeft } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

// @ts-expect-error — route path not in generated tree until `bun run dev` regenerates it
export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function ChatPage() {
  const [conversations, setConversations] = useState<ConversationMeta[]>(
    () => listConversations()
  );
  const [activeId, setActiveId] = useState<string>(() => {
    // Resume most recent conversation or start fresh
    const existing = listConversations();
    return existing.length > 0 ? existing[0].id : generateId();
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshConversations = useCallback(() => {
    setConversations(listConversations());
  }, []);

  function handleNewChat() {
    const newId = generateId();
    setActiveId(newId);
    setSidebarOpen(false);
  }

  function handleSelectConversation(id: string) {
    setActiveId(id);
  }

  // Load initial messages for the active conversation
  const activeConv = getConversation(activeId);
  const initialMessages = activeConv?.messages;

  // When active conversation is deleted from sidebar, reset
  function handleRefresh() {
    const updated = listConversations();
    setConversations(updated);
    // If active was deleted, switch to most recent or new
    if (!updated.find((c) => c.id === activeId)) {
      setActiveId(updated.length > 0 ? updated[0].id : generateId());
    }
  }

  return (
    <div className="dark flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-muted-foreground hover:text-foreground"
          title="Toggle sidebar"
        >
          <PanelLeft className="size-4" />
        </Button>
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

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onRefresh={handleRefresh}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Chat panel — key forces remount on conversation switch */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel
            key={activeId}
            conversationId={activeId}
            initialMessages={initialMessages}
            onConversationUpdate={refreshConversations}
          />
        </div>
      </div>
    </div>
  );
}
