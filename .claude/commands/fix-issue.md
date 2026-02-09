---
description: Take a GitHub issue number and work through fixing it
argument-hint: issue-number (e.g. 42)
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

Fix GitHub issue #$ARGUMENTS

## Process

1. **Fetch the issue**:
!`gh issue view $ARGUMENTS --json title,body,labels,assignees 2>/dev/null || echo "Could not fetch issue — working from number only"`

2. **Understand the problem**: Read the issue description, identify affected files and behavior

3. **Create a branch**:
!`git checkout -b fix/$ARGUMENTS 2>/dev/null || git checkout fix/$ARGUMENTS`

4. **Investigate**: Search the codebase for relevant code, understand the root cause

5. **Implement the fix**: Make minimal, focused changes

6. **Verify**:
!`bun run check 2>&1 | tail -10`
!`bun run check-types 2>&1 | tail -10`

7. **Summarize**: Report what was changed, why, and what to test manually

## Guidelines

- Make the smallest change that fixes the issue
- Don't refactor unrelated code
- If the fix touches Convex functions, run `bunx convex typecheck` from `packages/backend/`
- If the fix touches UI, describe what to visually verify
- Use the code-review skill checklist before finishing
