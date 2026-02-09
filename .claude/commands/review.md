---
description: Review staged or recent code changes for quality, bugs, and project conventions
allowed-tools: Bash, Read, Grep, Glob
---

Review the current code changes for quality, bugs, security, and adherence to project patterns.

## Context

!`git diff --cached --stat`
!`git diff --cached`

If nothing is staged, review the last commit:
!`git diff HEAD~1 --stat`

## Instructions

Use the code-review skill checklist. For each changed file:

1. Check type safety (no `any`, proper null handling)
2. Verify Convex patterns (validators, no side effects in mutations)
3. Check React 19 patterns (no forwardRef, proper hooks)
4. Look for security issues (no leaked secrets, XSS vectors)
5. Verify AI integration patterns (no eligibility claims, structured output)
6. Check project conventions (bun, path aliases, component structure)

Run verification:
!`bun run check 2>&1 | tail -20`
!`bun run check-types 2>&1 | tail -20`

## Output Format

Organize findings by severity:
- **Critical** — Must fix before merge (bugs, security, data loss)
- **Warning** — Should fix (type safety, missing error handling)
- **Suggestion** — Consider improving (readability, performance)

End with a one-line verdict: APPROVE, REQUEST CHANGES, or NEEDS DISCUSSION.
