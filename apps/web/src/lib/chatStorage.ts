import type { UIMessage } from "ai";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
}

export type ConversationMeta = Omit<StoredConversation, "messages">;

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "clinibridge-chats";
const MAX_CONVERSATIONS = 50;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readStore(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredConversation[];
  } catch {
    return [];
  }
}

function writeStore(conversations: StoredConversation[]) {
  // Keep capped and sorted by most-recent first
  const trimmed = conversations
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/** Derive a short title from the first user message */
function deriveTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New chat";
  const text = firstUser.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join(" ");
  if (!text) return "New chat";
  return text.length > 60 ? text.slice(0, 57) + "..." : text;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID();
}

/** List all conversations (metadata only, no messages) sorted by most recent */
export function listConversations(): ConversationMeta[] {
  return readStore().map(({ messages: _, ...meta }) => meta);
}

/** Get a single conversation with its full messages */
export function getConversation(id: string): StoredConversation | null {
  return readStore().find((c) => c.id === id) ?? null;
}

/** Save or update a conversation. Auto-derives title from first user message. */
export function saveConversation(id: string, messages: UIMessage[]) {
  const store = readStore();
  const existing = store.find((c) => c.id === id);
  const now = Date.now();

  if (existing) {
    existing.messages = messages;
    existing.updatedAt = now;
    existing.title = deriveTitle(messages);
  } else {
    store.push({
      id,
      title: deriveTitle(messages),
      createdAt: now,
      updatedAt: now,
      messages,
    });
  }

  writeStore(store);
}

/** Delete a conversation */
export function deleteConversation(id: string) {
  writeStore(readStore().filter((c) => c.id !== id));
}

/** Delete all conversations */
export function clearAllConversations() {
  localStorage.removeItem(STORAGE_KEY);
}
