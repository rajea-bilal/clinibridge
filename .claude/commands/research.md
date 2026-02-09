---
description: Research a topic or library using Context7 docs and Sequential Thinking, output a reference doc
argument-hint: topic-or-library (e.g. "tanstack-start loaders" or "convex actions")
allowed-tools: Bash, Read, Write, Grep, Glob
---

Research and document: $ARGUMENTS

## Process

### Step 1 — Resolve Documentation

Use Context7 to find current docs for the topic:

1. Call `mcp__context7__resolve-library-id` with the library/topic name
2. Call `mcp__context7__get-library-docs` with the resolved ID, focused on `$ARGUMENTS`
3. If multiple libraries are relevant, fetch docs for each

If Context7 is unavailable, fall back to web search and flag output as `[Partially Verified]`.

### Step 2 — Analyze with Sequential Thinking

Use `mcp__sequential-thinking__sequentialthinking` to:

1. Break down the topic into key concepts
2. Identify how it applies to this project's stack (TanStack Start + Convex + React 19)
3. Note any gotchas, breaking changes, or common pitfalls
4. Determine best practices and recommended patterns

### Step 3 — Generate Reference Document

Create a concise reference doc at `docs/research/$TOPIC.md` (kebab-case the topic name):

```markdown
# [Topic] — Quick Reference

> Generated: [date] | Source: Context7 + Sequential Thinking
> Verified against: [library version]

## Overview
[2-3 sentences: what this is and why it matters for CliniBridge]

## Key APIs / Patterns
[Code examples with explanations — use actual project patterns]

## Usage in This Project
[Where/how this applies to CliniBridge specifically]

## Gotchas
[Common mistakes, breaking changes, version-specific issues]

## References
[Doc URLs, relevant source files in this repo]
```

### Step 4 — Summary

Print a brief summary of findings to the conversation. Include:
- What was researched
- Key takeaways (3-5 bullets)
- Where the full reference was saved
- Any unresolved questions
