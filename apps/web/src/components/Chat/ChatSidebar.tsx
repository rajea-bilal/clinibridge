import { Button } from "@/components/ui/button";
import type { ConversationMeta } from "@/lib/chatStorage";
import { deleteConversation } from "@/lib/chatStorage";
import { cn } from "@/lib/utils";
import { Plus, MessageSquare, Trash2, X } from "lucide-react";

interface ChatSidebarProps {
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRefresh: () => void;
  open: boolean;
  onClose: () => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRefresh,
  open,
  onClose,
}: ChatSidebarProps) {
  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteConversation(id);
    onRefresh();
  }

  function formatTime(ts: number) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "flex flex-col border-r border-border/40 bg-background/95 backdrop-blur-sm transition-all duration-200 z-40",
          // Mobile: overlay drawer
          "fixed inset-y-0 left-0 w-72 md:relative md:inset-auto",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:w-64 lg:w-72"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border/40 px-3 py-3">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Conversations
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onNew}
              className="text-muted-foreground hover:text-foreground"
              title="New chat"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground md:hidden"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Conversation list */}
        <nav className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <MessageSquare className="size-5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground/60">
                No conversations yet
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(conv.id);
                      onClose();
                    }}
                    className={cn(
                      "group flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                      activeId === conv.id
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0 opacity-50" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-snug">
                        {conv.title}
                      </p>
                      <p className="mt-0.5 text-[10px] opacity-50">
                        {formatTime(conv.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="mt-0.5 shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      title="Delete conversation"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
    </>
  );
}
