import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "@/components/Chat/ChatPanel";
import { ChatSidebar } from "@/components/Chat/ChatSidebar";
import {
  listConversations,
  getConversation,
  generateId,
} from "@/lib/chatStorage";
import type { ConversationMeta } from "@/lib/chatStorage";
import { Icon } from "@iconify/react";
import { useState, useCallback, useEffect } from "react";

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

  // Refresh sidebar whenever activeId changes — runs AFTER the old
  // ChatPanel's cleanup effect has saved to localStorage
  useEffect(() => {
    refreshConversations();
  }, [activeId, refreshConversations]);

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
    <div
      className="dark flex h-screen w-full overflow-hidden bg-neutral-950 text-neutral-50 relative selection:bg-emerald-500/30 selection:text-white antialiased"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Grain texture overlay */}
      <div className="bg-grain" />

      {/* Ambient glows — barely perceptible */}
      <div className="fixed top-[-25%] right-[-15%] w-[900px] h-[900px] bg-emerald-900/[0.04] rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="fixed bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-neutral-800/[0.06] rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onRefresh={handleRefresh}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col relative h-full bg-transparent">
        {/* Mobile nav toggle */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/[0.05] bg-neutral-950/80 backdrop-blur-2xl z-20">
          <div className="flex items-center gap-2.5">
            <a href="/" className="text-white/30 hover:text-white/50 transition-colors duration-300">
              <Icon icon="solar:arrow-left-linear" width={16} />
            </a>
            <a href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-neutral-950 shrink-0">
                <Icon icon="solar:health-bold-duotone" width={12} />
              </div>
              <span className="font-bricolage font-medium text-sm uppercase tracking-tight text-white/80">
                CliniBridge
              </span>
            </a>
          </div>
          <button
            type="button"
            className="text-white/40 hover:text-white/60 transition-colors duration-300 p-1"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Icon icon="solar:hamburger-menu-linear" width={20} />
          </button>
        </div>

        {/* Top-right export button (desktop) */}
        <header className="hidden md:flex justify-end items-center p-6 pb-0 z-20 absolute top-0 right-0 w-full pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4">
            <button
              type="button"
              className="text-white/20 hover:text-white/50 transition-colors duration-300 p-2 rounded-lg hover:bg-white/[0.03]"
              title="Export"
            >
              <Icon icon="solar:export-linear" width={18} />
            </button>
          </div>
        </header>

        {/* Chat panel — key forces remount on conversation switch */}
        <ChatPanel
          key={activeId}
          conversationId={activeId}
          initialMessages={initialMessages}
          onConversationUpdate={refreshConversations}
        />
      </main>
    </div>
  );
}
