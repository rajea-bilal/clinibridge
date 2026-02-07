# Frontend Chat UI Upgrade Plan — prompt-kit

## Goal
Replace the chat UI in `ChatPanel.tsx` and `MessageList.tsx` with prompt-kit components for a polished, professional look — without touching any backend, tool calling, scoring, or trial card logic.

## Components to Install
| Component | Registry URL | Purpose |
|---|---|---|
| prompt-input | `https://prompt-kit.com/c/prompt-input.json` | Auto-resize textarea + submit/stop buttons |
| message | `https://prompt-kit.com/c/message.json` | Chat message bubbles with avatar support |
| chat-container | `https://prompt-kit.com/c/chat-container.json` | Smart auto-scrolling wrapper |
| loader | `https://prompt-kit.com/c/loader.json` | Thinking indicator while waiting for AI |
| markdown | `https://prompt-kit.com/c/markdown.json` | Render markdown in AI responses |
| prompt-suggestion | `https://prompt-kit.com/c/prompt-suggestion.json` | Clickable suggestion pills on welcome screen |
| scroll-button | `https://prompt-kit.com/c/scroll-button.json` | Floating scroll-to-bottom button |

## Files to Modify
- `apps/web/src/components/Chat/ChatPanel.tsx` — replace Input with PromptInput
- `apps/web/src/components/Chat/MessageList.tsx` — replace custom bubbles with Message/Markdown/ChatContainer

## Files NOT to Touch
- `apps/web/src/routes/api/chat.ts` — backend API
- `apps/web/src/components/Chat/TrialCardsFromChat.tsx` — trial cards
- `apps/web/src/components/Trials/*` — trial components
- `apps/web/src/lib/aiPrompts.ts` — system prompt
- `apps/web/src/lib/scoreTrials.ts` — scoring logic
- `apps/web/src/lib/clinicalTrials.ts` — trial search logic
- `apps/web/src/routes/find.tsx` — form search page

## Step-by-Step

### Step 1: Install prompt-kit components
```bash
cd apps/web
bunx shadcn@latest add "https://prompt-kit.com/c/prompt-input.json"
bunx shadcn@latest add "https://prompt-kit.com/c/message.json"
bunx shadcn@latest add "https://prompt-kit.com/c/chat-container.json"
bunx shadcn@latest add "https://prompt-kit.com/c/loader.json"
bunx shadcn@latest add "https://prompt-kit.com/c/markdown.json"
bunx shadcn@latest add "https://prompt-kit.com/c/prompt-suggestion.json"
bunx shadcn@latest add "https://prompt-kit.com/c/scroll-button.json"
```

### Step 2: Replace chat input (ChatPanel.tsx)
- Replace `<Input>` + `<Button>` form with `<PromptInput>` + `<PromptInputTextarea>` + `<PromptInputActions>`
- Wire: `value={input}`, `onValueChange={setInput}`, `onSubmit={handleSubmit}`, `isLoading`
- Show stop button via `<PromptInputAction>` when loading
- Show send button when not loading
- Keep placeholder: "Describe a condition, age, and location..."

### Step 3: Replace message rendering (MessageList.tsx)
- Use `<Message>` + `<MessageAvatar>` + `<MessageContent markdown>` for each message
- User messages: no avatar, right-aligned feel (or minimal avatar)
- Assistant messages: Bot avatar, left-aligned
- Use `<MessageContent markdown>` for text parts — renders markdown with memoization
- Keep the `message.parts` loop and all tool-call handling EXACTLY as-is
- Add `<Loader variant="typing">` when status === "submitted" (waiting for first token)

### Step 4: Wrap in ChatContainer
- Use `<ChatContainerRoot>` + `<ChatContainerContent>` + `<ChatContainerScrollAnchor>`
- Add `<ScrollButton>` for scroll-to-bottom UX
- Remove manual `scrollRef` + `useEffect` auto-scroll logic (ChatContainer handles it)

### Step 5: Make suggestions clickable
- Replace `<span>` suggestions with `<PromptSuggestion onClick={() => sendMessage(suggestion)}>`
- Pass `sendMessage` callback from ChatPanel to MessageList

### Step 6: Dark theme verification
- prompt-kit uses shadcn theming, should inherit dark mode automatically
- Verify contrast on message bubbles
- Ensure input matches dark theme

## Testing Checklist
- [ ] Chat loads with welcome screen and clickable suggestions
- [ ] Typing auto-resizes the input
- [ ] Send button disabled when empty, enabled when text present
- [ ] Stop button appears during streaming
- [ ] User messages render right-aligned
- [ ] Assistant messages render left-aligned with avatar and markdown
- [ ] Loader shows between user message and AI response start
- [ ] Trial cards appear when AI calls searchTrials
- [ ] Match badges (Strong Match / Possible Match) display correctly
- [ ] "Unlikely" trials are filtered out
- [ ] Scroll-to-bottom button works
- [ ] Auto-scroll on new messages, stops when user scrolls up
