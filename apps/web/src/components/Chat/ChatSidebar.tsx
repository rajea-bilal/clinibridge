import type { ConversationMeta } from "@/lib/chatStorage";
import { deleteConversation, clearAllConversations } from "@/lib/chatStorage";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface ChatSidebarProps {
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRefresh: () => void;
  open: boolean;
  onClose: () => void;
}

const DAY_MS = 86_400_000;

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRefresh,
  open,
  onClose,
}: ChatSidebarProps) {
  const [showSettings, setShowSettings] = useState(false);

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteConversation(id);
    onRefresh();
  }

  function handleClearAll() {
    clearAllConversations();
    onRefresh();
    setShowSettings(false);
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

  // Group conversations: last 24h = "Recent", older = "Previous"
  const now = Date.now();
  const recent = conversations.filter((c) => now - c.updatedAt < DAY_MS);
  const previous = conversations.filter((c) => now - c.updatedAt >= DAY_MS);

  function renderItem(conv: ConversationMeta) {
    const isActive = activeId === conv.id;
    return (
      <li key={conv.id}>
        <button
          type="button"
          onClick={() => {
            onSelect(conv.id);
            onClose();
          }}
          className={cn(
            "w-full text-left px-3 py-2.5 rounded-lg text-[13px] flex items-center gap-2.5 group transition-all duration-300 relative overflow-hidden",
            isActive
              ? "bg-white/[0.04] text-white/90"
              : "hover:bg-white/[0.03] text-white/35 hover:text-white/60"
          )}
        >
          {/* Subtle emerald accent bar — only on active */}
          {isActive && (
            <div className="absolute inset-y-1.5 left-0 w-[1.5px] rounded-full bg-gradient-to-b from-emerald-400/60 via-emerald-500/40 to-emerald-400/10" />
          )}
          <Icon
            icon="solar:chat-line-linear"
            width={14}
            className={cn(
              "shrink-0 transition-all duration-300",
              isActive
                ? "text-emerald-400/70"
                : "text-white/20 group-hover:text-white/40"
            )}
          />
          <div className="min-w-0 flex-1">
            <span className="truncate block font-light">
              {conv.title}
            </span>
            <span className="block mt-0.5 text-[10px] font-mono text-white/20">
              {formatTime(conv.updatedAt)}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => handleDelete(e, conv.id)}
            className="shrink-0 rounded p-0.5 opacity-0 transition-all duration-200 text-white/20 hover:text-red-400/70 group-hover:opacity-100"
            title="Delete conversation"
          >
            <Trash2 className="size-3" />
          </button>
        </button>
      </li>
    );
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
          "sidebar-glow-border h-full flex flex-col bg-neutral-950/60 backdrop-blur-2xl relative z-40 transition-all duration-300 ease-out",
          // Mobile: overlay drawer
          "fixed inset-y-0 left-0 w-[280px] md:relative md:inset-auto",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop: always visible
          "md:flex"
        )}
      >
        {/* Logo Header */}
        <div className="p-5 pb-4">
          <a
            href="/"
            className="flex items-center gap-2.5 mb-5 group/logo hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-neutral-950 shrink-0">
              <Icon icon="solar:health-bold-duotone" width={15} />
            </div>
            <span className="font-bricolage text-[15px] tracking-tight font-medium uppercase text-white/90">
              CliniBridge
            </span>
          </a>

          {/* Back to home */}
          <a
            href="/"
            className="flex items-center gap-2 text-white/25 hover:text-white/50 transition-colors text-[11px] font-mono tracking-wide mb-4"
          >
            <Icon icon="solar:arrow-left-linear" width={12} />
            <span>Back to home</span>
          </a>

          {/* New Session Button */}
          <button
            type="button"
            onClick={onNew}
            className="w-full group h-10 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-emerald-500/15 transition-all duration-500 flex items-center justify-center gap-2 relative overflow-hidden"
          >
            <Icon
              icon="solar:add-circle-linear"
              width={16}
              className="text-white/30 group-hover:text-emerald-400/70 transition-colors duration-500"
            />
            <span className="text-[13px] font-light text-white/50 group-hover:text-white/70 transition-colors duration-500">
              New Session
            </span>
          </button>
        </div>

        {/* Subtle divider */}
        <div className="mx-5 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Scrollable conversation list */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-4 space-y-6">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 px-4 py-12 text-center">
              <Icon
                icon="solar:chat-line-linear"
                width={18}
                className="text-white/15"
              />
              <p className="text-[11px] text-white/20 font-mono tracking-wide">No conversations yet</p>
            </div>
          ) : (
            <>
              {recent.length > 0 && (
                <div>
                  <div className="px-3 text-[9px] uppercase tracking-[0.25em] text-white/15 font-mono mb-2">
                    Recent
                  </div>
                  <ul className="space-y-0.5">{recent.map(renderItem)}</ul>
                </div>
              )}
              {previous.length > 0 && (
                <div>
                  <div className="px-3 text-[9px] uppercase tracking-[0.25em] text-white/15 font-mono mb-2">
                    Previous
                  </div>
                  <ul className="space-y-0.5">{previous.map(renderItem)}</ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 relative">
          {/* Top divider — emerald gradient */}
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

          <div className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/[0.03] transition-colors duration-300">
            <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30">
              <Icon icon="solar:user-linear" width={14} />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-[13px] font-light text-white/60 truncate">
                Guest User
              </div>
              <div className="text-[9px] text-white/20 truncate font-mono tracking-[0.15em] uppercase">
                Local Session
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-white/15 hover:text-white/40 transition-colors duration-300 p-1 rounded-lg hover:bg-white/[0.03]"
              title="Settings"
            >
              <Icon icon="solar:settings-linear" width={16} />
            </button>
          </div>

          {/* Settings dropdown */}
          {showSettings && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-neutral-900/95 backdrop-blur-2xl border border-white/[0.06] rounded-lg p-1.5 shadow-2xl shadow-black/40">
              <button
                type="button"
                onClick={handleClearAll}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-red-400/70 hover:bg-red-500/[0.06] transition-colors duration-300"
              >
                <Icon icon="solar:trash-bin-2-linear" width={14} />
                <span>Clear all conversations</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-white/35 hover:bg-white/[0.03] transition-colors duration-300 mt-0.5"
              >
                <Icon icon="solar:close-circle-linear" width={14} />
                <span>Close</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
