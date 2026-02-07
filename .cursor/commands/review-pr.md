# Review PR Changes via GitHub CLI

Fetch and review all changes and comments on a GitHub PR.

**Usage**: Tag this command with a PR number: `@review-pr.md #123`

## What This Does

Runs:
```bash
gh pr view <PR_NUMBER> --comments
```

This displays:
- PR title and description
- All commits in the PR
- All inline comments (including CodeRabbit suggestions)
- PR metadata

## Review Workflow

1. **Fetch the PR** - Just reference this command with your PR number
   - Example: `@review-pr.md #123`

2. **Review CodeRabbit inline comments** and note any issues

3. **Understand the context** by checking the feature plan:
   - Feature plan: `@feature-plan.md`
   - Progress file: `@feature-[name]-progress.md`
   - Original spec: Look for references in PR description

4. **Address each comment** by either:
   - Modifying the code
   - Replying with context if it's clarification

5. **Verify changes** and push:
   ```bash
   bun run typecheck
   bun run build
   bunx convex dev --once  # if Convex touched
   ```
   - If failures, iterate until green
   - Once all checks pass, push the changes

6. **Request re-review** on GitHub

## GitHub CLI Tips

- View PR details only: `gh pr view <PR_NUMBER>`
- Open PR in browser: `gh pr view <PR_NUMBER> --web`
- See file changes: `gh pr diff <PR_NUMBER>`
- Add your review: `gh pr review <PR_NUMBER>`
- Add a comment: `gh pr comment <PR_NUMBER> -b "your message"`

