---
description: Enter planning mode for a feature — output a structured task plan
argument-hint: feature-description (e.g. "add user dashboard with saved searches")
allowed-tools: Read, Grep, Glob, Bash
---

Plan the implementation of: $ARGUMENTS

## Process

1. **Understand scope**: Break down the feature request into discrete concerns (UI, data, API, AI)

2. **Explore codebase**: Find related existing code, patterns to follow, and integration points
   - Check routes in `apps/web/src/routes/`
   - Check components in `apps/web/src/components/`
   - Check Convex schema and functions in `packages/backend/convex/`
   - Check lib utilities in `apps/web/src/lib/`

3. **Identify dependencies**: What existing code needs to change? What's new?

4. **Generate the plan**: Output a markdown task plan with this structure:

```markdown
# Plan: [Feature Name]

## Overview
[1-2 sentence description of what this feature does]

## Tasks

### Phase 1: Data Layer
- [ ] Task description — `file/path.ts`
- [ ] Task description — `file/path.ts`

### Phase 2: Backend Logic
- [ ] Task description — `convex/file.ts`

### Phase 3: UI Components
- [ ] Task description — `components/Feature/Component.tsx`

### Phase 4: Integration & Polish
- [ ] Wire up routes
- [ ] Error handling
- [ ] Loading states

## Open Questions
- [Any ambiguities or decisions needed]

## Risks
- [Potential issues or blockers]
```

5. **Save the plan**: Write it to `plan/[feature-name].md`

## Guidelines

- Each task should be independently implementable
- Reference existing patterns (e.g., "follow the Chat/ component structure")
- Flag when Convex schema changes are needed (they require migration)
- Consider mobile responsiveness for all UI tasks
- Note where AI/LLM integration is involved
