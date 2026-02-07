# Chat UI Visual Overhaul — Adaptation Plan

> **Goal**: Restyle the existing chat UI to match the provided static HTML + Tailwind design. **Zero functionality changes.** All dynamic content (messages, conversations, tool outputs, loading states, etc.) remains untouched. Only styling, layout structure, and static visual elements change.

---

## Scope & Constraints

- **NO** changes to: `useChat`, `chatStorage`, message rendering logic, conversation CRUD, tool output handling, `TrialCardsFromChat`, `Markdown`, `Loader` internals, any business logic.
- **Dynamic content** (conversations list, messages, user/assistant bubbles, tool results, loading indicators, suggestions array) stays rendered exactly as-is — only the wrapping markup/classes change.
- Icons switch from `lucide-react` to `@iconify-icon/react` (solar icon set) across chat components only.
- The existing prompt-kit components (`PromptInput`, `ChatContainer`, `Message`, etc.) may be restyled in-place or bypassed with inline markup in the chat components, whichever is simpler. Their internal logic (auto-scroll, auto-resize, etc.) must be preserved.

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/routes/chat.tsx` | Layout restructure: remove top header bar, full-height sidebar+main split, add ambient glows + grain overlay |
| `apps/web/src/components/Chat/ChatSidebar.tsx` | Complete visual redesign: logo header, "New Session" button, grouped history sections (Recent/Previous), user footer area, active item accent bar, emerald color accents |
| `apps/web/src/components/Chat/ChatPanel.tsx` | Restyle input area: glass morphism container, glow-on-focus, attachment button, rounded-[2rem] shape, disclaimer footer, export button in top-right |
| `apps/web/src/components/Chat/MessageList.tsx` | Restyle empty/welcome state: large icon with glow, greeting headline, subtitle, 2-column suggestion grid cards, fadeIn animation |
| `apps/web/src/index.css` | Add `animate-fade-in` keyframe, `no-scrollbar` utility, ensure `font-bricolage` works (already exists) |

### Files NOT to Modify

- `chatStorage.ts` — no changes
- `TrialCardsFromChat.tsx` — no changes
- `prompt-kit/markdown.tsx` — no changes
- `prompt-kit/loader.tsx` — no changes (internal loader rendering stays)
- `prompt-kit/scroll-button.tsx` — may keep or restyle minimally
- `prompt-kit/chat-container.tsx` — no logic changes (may adjust wrapper classes)

---

## 1. `apps/web/src/routes/chat.tsx` — Layout Restructure

### Current Structure
```
<div> (flex col, h-screen)
  <header> (top bar: sidebar toggle, back, title)
  <div> (flex row)
    <ChatSidebar />
    <ChatPanel />
  </div>
</div>
```

### Target Structure
```
<body-wrapper> (flex row, h-screen, bg-neutral-950, text-neutral-50, overflow-hidden, relative)
  <!-- Grain texture overlay -->
  <div class="bg-grain" />

  <!-- Ambient glow blobs -->
  <div> (top-right emerald glow)
  <div> (bottom-left neutral glow)

  <!-- Sidebar (always visible md+, hidden mobile) -->
  <ChatSidebar />

  <!-- Main content area -->
  <main> (flex-1, flex col, relative)
    <!-- Mobile nav toggle (md:hidden) -->
    <div> (CliniBridge logo + hamburger)

    <!-- Top-right export button (md:flex, absolute) -->
    <header> (hidden md:flex, justify-end, absolute top-0 right-0)

    <!-- Chat content (messages / welcome) -->
    <ChatPanel />
  </main>
</body-wrapper>
```

### Specific Changes

**Root container:**
- Change from `flex h-screen flex-col bg-background text-foreground` → `flex h-screen w-full overflow-hidden bg-neutral-950 text-neutral-50 relative selection:bg-emerald-500/30 selection:text-white`

**Remove** the existing `<header>` (sidebar toggle, back button, "CliniBridge Chat" title). These controls move into the sidebar and mobile nav.

**Add** grain texture overlay div (using the existing `.bg-grain` class from `index.css`).

**Add** two ambient glow divs:
```
fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen
fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-neutral-800/20 rounded-full blur-[100px] pointer-events-none z-0
```

**Add** mobile nav toggle (visible only `md:hidden`):
```
<div class="md:hidden flex items-center justify-between p-5 border-b border-white/10 bg-neutral-900/90 backdrop-blur-md z-20">
  <span class="font-bricolage font-medium text-lg uppercase tracking-tight">CliniBridge</span>
  <button onClick={toggle sidebar}>hamburger icon</button>
</div>
```

**Add** top-right export button (visible `hidden md:flex`, absolute positioned):
```
<header class="hidden md:flex justify-end items-center p-8 pb-0 z-20 absolute top-0 right-0 w-full pointer-events-none">
  <div class="pointer-events-auto">
    <button> export icon </button>
  </div>
</header>
```

**Sidebar + main** become direct children of root (flex row), no wrapping `<div>`.

---

## 2. `apps/web/src/components/Chat/ChatSidebar.tsx` — Visual Redesign

### Current → Target Mapping

| Current | Target |
|---------|--------|
| `w-72 md:w-64 lg:w-72` | `w-[300px]` |
| `bg-background/95 backdrop-blur-sm` | `bg-neutral-900/30 backdrop-blur-xl` |
| `border-border/40` | `border-white/10` |
| Mobile: slide from left | Same behavior, keep translate-x logic |
| Flat conversation list | Grouped sections: "Recent" / "Previous" |
| No logo | Logo header with icon + "CLINIBRIDGE" text |
| `Plus` button in header | Full-width "New Session" button |
| No user footer | User footer area at bottom |

### Structure

```
<aside> (w-[300px], h-full, flex col, border-r border-white/10, bg-neutral-900/30, backdrop-blur-xl, hidden md:flex)
  
  <!-- Logo Header -->
  <div class="p-6">
    <div class="flex items-center gap-3 mb-8">
      <div> (white circle with health icon)
      <span class="font-bricolage text-lg tracking-tight font-medium uppercase text-white">CliniBridge</span>
    </div>
    
    <!-- New Session Button -->
    <button class="w-full h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 ...">
      <icon> + <span>New Session</span>
    </button>
  </div>

  <!-- Scrollable Conversation List (keep dynamic rendering) -->
  <div class="flex-1 overflow-y-auto no-scrollbar px-4 space-y-8">
    <!-- Group conversations dynamically. Keep the existing map over `conversations`. 
         Style each item per the target design. -->
    
    <!-- Section header: -->
    <div class="px-3 text-[10px] uppercase tracking-[0.2em] text-white/20 font-mono mb-3">Recent</div>
    
    <!-- Active item: -->
    bg-neutral-800/50, border border-emerald-500/20, left emerald accent bar (absolute w-[2px] bg-emerald-500)
    
    <!-- Inactive item: -->
    hover:bg-white/5, text-white/40 hover:text-white/70
  </div>

  <!-- User Footer -->
  <div class="p-5 border-t border-white/10 bg-neutral-900/50">
    <button class="flex items-center gap-3.5 w-full p-2 rounded-xl hover:bg-white/5 ...">
      <div> (user avatar circle)
      <div>
        <div class="text-sm font-medium text-white/80 truncate">Dr. Admin</div>
        <div class="text-[10px] text-white/30 truncate font-light tracking-wide">Local Session</div>
      </div>
      <icon> settings
    </button>
  </div>
</aside>
```

### Dynamic Content Preserved
- `conversations.map(...)` — keep the existing iteration, just restyle each `<button>`/`<li>`
- `activeId === conv.id` — keep the conditional, change the active/inactive classes
- `conv.title` — keep as-is
- `formatTime(conv.updatedAt)` — keep as-is
- `handleDelete` — keep as-is, restyle the delete button
- `onNew`, `onSelect`, `onClose` — keep all callbacks
- Mobile overlay backdrop — keep, restyle if needed

### Conversation Grouping
The static HTML shows "Recent" and "Previous" sections. To implement without changing functionality:
- Conversations already come sorted by `updatedAt` desc
- Group inline: items from last 24h → "Recent", older → "Previous"
- This is purely a rendering concern, not a data/logic change

---

## 3. `apps/web/src/components/Chat/ChatPanel.tsx` — Input Area Redesign

### Current Input
```
<div class="border-t border-border/40 p-4">
  <PromptInput> (rounded-xl, bg-muted/30)
    <PromptInputTextarea />
    <PromptInputActions>
      <Button> Send/Stop </Button>
    </PromptInputActions>
  </PromptInput>
  <p> disclaimer text </p>
</div>
```

### Target Input
```
<div class="w-full max-w-[800px] mx-auto px-6 pb-10 pt-6 relative z-20">
  <div class="relative group">
    
    <!-- Glow on focus -->
    <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-white/5 to-teal-500/20 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000" />
    
    <!-- Glass container -->
    <div class="relative bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/5">
      
      <!-- Keep existing PromptInputTextarea (or raw <textarea>) with updated classes -->
      <textarea class="w-full bg-transparent text-white placeholder:text-neutral-500 font-light text-[16px] px-6 py-5 min-h-[68px] max-h-52 resize-none focus:outline-none leading-relaxed" 
        placeholder="How can I support you today?" />
      
      <!-- Bottom action bar -->
      <div class="flex items-center justify-between px-4 pb-4">
        <div class="flex items-center gap-2">
          <!-- Attachment button -->
          <button class="p-2.5 rounded-xl text-neutral-500 hover:text-white hover:bg-white/5">
            <icon> paperclip
          </button>
          <!-- Mic button (mobile only) -->
          <button class="p-2.5 rounded-xl text-neutral-500 hover:text-white hover:bg-white/5 md:hidden">
            <icon> microphone
          </button>
        </div>
        
        <!-- Send button — keep existing onClick={handleSubmit} / onClick={stop} logic -->
        <button class="w-10 h-10 rounded-xl bg-white text-neutral-950 flex items-center justify-center hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 relative overflow-hidden">
          <div class="absolute inset-0 bg-emerald-400 opacity-0 group-hover:opacity-20" />
          <icon> arrow-up (when not loading) / square (when loading)
        </button>
      </div>
    </div>
    
    <!-- Disclaimer footer (retain original text) -->
    <p class="mt-2 text-center text-neutral-500/60 text-[10px]">
      CliniBridge is an AI assistant — not a substitute for medical advice.
    </p>
  </div>
</div>
```

### Implementation Approach
The existing `PromptInput` component wraps a `<Textarea>` and manages auto-resize + keyboard submit. Two options:

**Option A (Preferred):** Keep using `PromptInput`/`PromptInputTextarea` but override classes heavily via `className` props + wrap with the glow/glass containers. The internal auto-resize and Enter-to-submit logic is preserved.

**Option B:** Replace `PromptInput` usage with raw `<textarea>` + manual `onKeyDown` for Enter. Copy the auto-resize logic inline. More control over markup but more code duplication.

Go with **Option A** — wrap the existing components in the new glass container, pass updated classNames.

### Chat Content Area
The message list wrapper also changes:
- Current: `<div class="px-4 py-4">` inside `ChatContainerContent`
- Target: `<div class="max-w-[800px] mx-auto px-6 py-16 md:py-24">`

Keep `ChatContainerRoot` and `ChatContainerContent` (for auto-scroll), just update the className.

---

## 4. `apps/web/src/components/Chat/MessageList.tsx` — Welcome State Redesign

### Current Empty State
```
<div> (flex col, items-center, py-16)
  <div> (circle with Bot icon)
  <p> "Welcome to CliniBridge"
  <p> subtitle
  <div> (flex wrap, suggestion pills)
</div>
```

### Target Empty State
```
<div class="flex flex-col items-center justify-center flex-1 min-h-[55vh] text-center space-y-8 animate-fade-in opacity-0">
  
  <!-- Large icon with glow -->
  <div class="w-20 h-20 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 flex items-center justify-center shadow-2xl shadow-emerald-900/20 ring-1 ring-white/5 relative">
    <div class="absolute inset-0 bg-emerald-500/10 rounded-[2rem] blur-xl" />
    <icon class="relative z-10 text-emerald-100" width="40"> health icon
  </div>
  
  <!-- Greeting (retain original welcome text) -->
  <div class="max-w-xl space-y-4">
    <h1 class="font-bricolage text-4xl md:text-5xl font-medium tracking-tighter text-white">
      Welcome to CliniBridge
    </h1>
    <p class="text-white/50 font-light text-lg leading-relaxed">
      Tell me about a medical condition, and I'll help you find recruiting clinical trials.
    </p>
  </div>
  
  <!-- Suggestion cards (2-col grid) — keep existing suggestions array + onSuggestionClick -->
  <!-- Suggestions: "Find lung cancer trials near Boston", "Type 2 diabetes trials for a 55 year old", "Alzheimer's trials in California" -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg pt-4">
    <button class="text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 group">
      <span class="block text-sm font-medium text-white/90 mb-1">{suggestion text}</span>
    </button>
  </div>
</div>
```

### Dynamic Content Preserved
- The suggestion click handler `onSuggestionClick` stays
- The suggestion text content stays as-is: "Find lung cancer trials near Boston", "Type 2 diabetes trials for a 55 year old", "Alzheimer's trials in California"
- Welcome heading: "Welcome to CliniBridge" (retain original)
- Welcome subtitle: "Tell me about a medical condition, and I'll help you find recruiting clinical trials." (retain original)

### Message Bubbles
The existing `MessageBubble` component styling should also be updated to match the dark theme:
- User messages: keep right-aligned, update colors to match (e.g., `bg-white/10` or keep `bg-primary`)
- Assistant messages: keep left-aligned, update `bg-muted/40` to something like `bg-white/5`
- These are class-only changes on the existing `<MessageContent>` wrappers

---

## 5. `apps/web/src/index.css` — New Utilities

### Add (if not already present)

```css
/* Chat: fade-in animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

/* Chat: hide scrollbar */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

> Note: `.bg-grain`, `.font-bricolage`, `slideUpFade` keyframe already exist in `index.css`. No need to duplicate.

---

## 6. Icon Migration

### Package
Install `@iconify-icon/react` (or `@iconify/react`) for the solar icon set used in the HTML.

```bash
bun add @iconify-icon/react
```

### Icon Mapping (lucide → solar)

| Current (lucide) | Target (solar) | Usage |
|---|---|---|
| `PanelLeft` | `solar:hamburger-menu-linear` | Mobile nav toggle |
| `ArrowLeft` | *(removed — no back button in new design)* | — |
| `MessageSquare` | `solar:chat-line-linear` | Conversation items |
| `Plus` | `solar:add-circle-linear` | New session button |
| `Trash2` | *(keep or use solar equivalent)* | Delete conversation |
| `X` | *(keep for mobile close)* | Close sidebar |
| `Bot` | `solar:health-bold-duotone` | Welcome state icon |
| `Send` | `solar:arrow-up-linear` | Send button |
| `Square` | *(keep — stop button)* | Stop generation |
| `ChevronDown` | *(keep — scroll button)* | Scroll to bottom |
| — | `solar:paperclip-linear` | **New** attachment button |
| — | `solar:microphone-linear` | **New** mic button (mobile) |
| — | `solar:export-linear` | **New** export button |
| — | `solar:settings-linear` | **New** user footer settings |
| — | `solar:user-linear` | **New** user footer avatar |

---

## 7. Color System Notes

The static HTML uses hardcoded Tailwind colors (`neutral-950`, `emerald-500/20`, `white/10`, etc.) rather than CSS variable tokens (`bg-background`, `text-foreground`).

**Approach:** In the chat components, use the hardcoded neutral/emerald palette directly. This is intentional — the chat page has a distinct visual identity from the rest of the app. The existing CSS variables remain for non-chat pages.

Key colors:
- Background: `bg-neutral-950`
- Text: `text-neutral-50` / `text-white`
- Borders: `border-white/10`, `border-white/20`
- Surfaces: `bg-white/5`, `bg-neutral-900/80`, `bg-neutral-800/50`
- Accent: `emerald-500`, `emerald-400`, `emerald-900/10`
- Muted text: `text-white/40`, `text-white/50`, `text-neutral-500`

---

## 8. Implementation Order

1. **`index.css`** — Add `animate-fade-in` and `no-scrollbar` utilities
2. **Install** `@iconify-icon/react`
3. **`chat.tsx`** — Layout restructure (grain, glows, remove header, add mobile nav)
4. **`ChatSidebar.tsx`** — Full visual redesign
5. **`MessageList.tsx`** — Welcome state redesign
6. **`ChatPanel.tsx`** — Input area redesign + message area max-width
7. **Verify** all dynamic behavior still works: send message, load conversations, switch conversations, delete, mobile sidebar toggle, auto-scroll, tool outputs, loading states

---

## 9. Checklist — What Must Still Work After Changes

- [ ] Sending a message via Enter key and send button
- [ ] Stop generation button
- [ ] Conversation list loads from localStorage
- [ ] Switching conversations remounts ChatPanel
- [ ] New conversation creates fresh ID
- [ ] Delete conversation removes from sidebar
- [ ] Mobile sidebar opens/closes with backdrop
- [ ] Auto-scroll sticks to bottom on new messages
- [ ] Scroll-to-bottom button appears when scrolled up
- [ ] Markdown rendering in assistant messages
- [ ] Tool output (TrialCardsFromChat) renders correctly
- [ ] Loading/typing indicator shows during `status === "submitted"`
- [ ] Suggestion clicks send messages
- [ ] Textarea auto-resizes
- [ ] Enter submits, Shift+Enter adds newline
