import { createFileRoute, Link } from "@tanstack/react-router";
import { ChatPanel } from "@/components/Chat/ChatPanel";
import { ChatSidebar } from "@/components/Chat/ChatSidebar";
import {
  listConversations,
  getConversation,
  generateId,
} from "@/lib/chatStorage";
import type { ConversationMeta } from "@/lib/chatStorage";
import { Icon } from "@iconify/react";
import { useState, useCallback, useEffect, useRef } from "react";
import { z } from "zod";

// @ts-expect-error — route path not in generated tree until `bun run dev` regenerates it
export const Route = createFileRoute("/chat")({
  component: ChatPage,
  validateSearch: z.object({
    c: z.string().optional(),
  }),
});

/** Compute a fallback conversation ID once — never changes across re-renders. */
function getInitialActiveId(searchC?: string): string {
  if (searchC) return searchC;
  const existing = listConversations();
  return existing.length > 0 ? existing[0].id : generateId();
}

function ChatPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  // ── Stable activeId ────────────────────────────────────────────────────
  // Stored in state so it never flickers even if the router momentarily
  // re-evaluates routes and drops search params. The fallback UUID is
  // computed once at mount time and never changes.
  const [activeId, setActiveId] = useState(() => getInitialActiveId(search.c));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationMeta[]>(
    () => listConversations()
  );

  // When search.c changes externally (browser back/forward, sidebar click),
  // sync it into state. Ignore undefined — that's a transient state from
  // route re-evaluation.
  const prevSearchC = useRef(search.c);
  useEffect(() => {
    if (search.c && search.c !== prevSearchC.current) {
      prevSearchC.current = search.c;
      setActiveId(search.c);
    }
  }, [search.c]);

  // Keep URL in sync with activeId — one-way push.
  // `replace: true` prevents polluting browser history.
  useEffect(() => {
    if (search.c !== activeId) {
      navigate({ search: { c: activeId }, replace: true });
    }
    // Only run when activeId changes, not when search changes (avoids loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, navigate]);

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
      const next = updated.length > 0 ? updated[0].id : generateId();
      setActiveId(next);
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
            <Link to="/" className="text-white/30 hover:text-white/50 transition-colors duration-300">
              <Icon icon="solar:arrow-left-linear" width={16} />
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-neutral-950 shrink-0">
                <Icon icon="solar:health-bold-duotone" width={12} />
              </div>
              <span className="font-bricolage font-medium text-sm uppercase tracking-tight text-white/80">
                CliniBridge
              </span>
            </Link>
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
