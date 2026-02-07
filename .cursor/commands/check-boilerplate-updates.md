# Rule: Check Boilerplate Updates

## Goal

To help developers who cloned this boilerplate stay updated with improvements, bug fixes, and new features from the upstream repository. Since most users remove the `.git` folder to start fresh with their own git history, we systematically check recent commits from the upstream and compare against the current codebase.

## Repository Information

- **Upstream Repository:** `git@github.com:code-and-creed/yugen.git` (private, requires SSH access)
- **Tracking File:** `.yugen-updates.json` (in project root)

## Process Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ASK USER: How far back to check?                            │
│     → Last 7 days, Last 30 days, or Custom date                 │
├─────────────────────────────────────────────────────────────────┤
│  2. CLONE upstream repo to /tmp/yugen-upstream (via SSH)        │
├─────────────────────────────────────────────────────────────────┤
│  3. GET COMMITS from selected timeframe                         │
├─────────────────────────────────────────────────────────────────┤
│  4. ANALYZE each commit's changes against local codebase        │
├─────────────────────────────────────────────────────────────────┤
│  5. GENERATE REPORT with categorized changes                    │
├─────────────────────────────────────────────────────────────────┤
│  6. WAIT for user approval before applying anything             │
├─────────────────────────────────────────────────────────────────┤
│  7. APPLY approved changes (cherry-pick to update branch)       │
└─────────────────────────────────────────────────────────────────┘
```

## Step 1: Ask User for Timeframe

**IMPORTANT:** Before doing anything else, ask the user:

> "How far back should I check for updates from the Yugen boilerplate?"
> 
> 1. **Last 7 days** - Recent bug fixes and minor updates
> 2. **Last 30 days** - More comprehensive check
> 3. **Custom** - Specify a date or number of days
>
> Which would you prefer?

**Wait for the user's response before proceeding.**

## Step 2: Clone Upstream Repository

Once you have the timeframe, clone the upstream repo:

```bash
# Remove old clone if exists and clone fresh
cd /tmp && rm -rf yugen-upstream
git clone git@github.com:code-and-creed/yugen.git yugen-upstream
```

**Note:** This uses SSH because the repository is private. The user must have SSH access configured for GitHub.

If SSH clone fails:
- Suggest the user check their SSH key setup: `ssh -T git@github.com`
- Or try HTTPS with credentials: `git clone https://github.com/code-and-creed/yugen.git yugen-upstream`

## Step 3: Get Commits in Timeframe

```bash
cd /tmp/yugen-upstream

# For last 7 days:
git log --since="7 days ago" --oneline --format="%h %s (%ci)"

# For last 30 days:
git log --since="30 days ago" --oneline --format="%h %s (%ci)"

# For custom date:
git log --since="2025-01-01" --oneline --format="%h %s (%ci)"
```

## Step 4: Analyze Changes

For each commit in the timeframe:

### 4.1 Get Changed Files

```bash
git show {commit_sha} --stat --name-only
```

### 4.2 Categorize by Risk Level

#### Safe Updates (Low Risk) ✅
- Documentation changes (`.md` files, comments)
- Configuration improvements (non-breaking)
- Dependency updates (minor/patch versions)
- New utility functions/files
- Bug fixes in isolated areas
- TypeScript type improvements
- Linting/formatting changes (biome, eslint)

#### Medium Risk Updates ⚠️
- Schema changes (Convex schema)
- Authentication/authorization changes
- API route changes
- Major dependency updates
- Build configuration changes
- Environment variable changes

#### High Risk Updates 🔴
- Changes to core business logic
- Changes to files with heavy local modifications
- Major refactoring
- Breaking changes

### 4.3 Compare with Local Files

For each changed file, check if it exists locally and compare:

```bash
# Check if file exists locally
ls -la /path/to/project/{file_path}

# Compare contents (if file exists)
diff /tmp/yugen-upstream/{file_path} /path/to/project/{file_path}
```

## Step 5: Generate Report

Present findings in this format:

```markdown
# Boilerplate Update Check

**Timeframe Checked:** Last {N} days (since {date})
**Upstream Repository:** git@github.com:code-and-creed/yugen.git

## Summary

| Metric | Count |
|--------|-------|
| Total commits found | {count} |
| Files changed | {count} |
| Safe updates | {count} ✅ |
| Medium risk updates | {count} ⚠️ |
| High risk updates | {count} 🔴 |

## Commits Found

| Commit | Date | Description |
|--------|------|-------------|
| `abc123` | 2025-01-15 | Fix TypeScript errors |
| `def456` | 2025-01-14 | Update pricing component |

## Changes by Category

### ✅ Safe Updates (Recommended)

These can likely be applied without conflicts:

- **`packages/backend/convex/auth.ts`** - TypeScript type fixes
- **`apps/web/src/components/landing/features.tsx`** - Biome formatting

### ⚠️ Medium Risk (Review Recommended)

Check if these conflict with your customizations:

- **`packages/backend/convex/schema.ts`** - Schema changes
  - Risk: May conflict with your custom schema additions

### 🔴 High Risk (Manual Review Required)

- **`apps/web/src/routes/dashboard.tsx`** - Major refactoring
  - Risk: You may have customized this file significantly

## Next Steps

1. Review the changes above
2. Tell me which updates to apply:
   - "Apply all safe updates"
   - "Apply commit abc123"
   - "Apply all updates"
   - "Skip this for now"

I'll create a separate branch for the updates so you can review before merging.
```

## Step 6: Wait for User Approval

**CRITICAL:** Do NOT apply any changes until the user explicitly approves.

Valid user responses:
- "Apply all safe updates"
- "Apply all updates" 
- "Apply commit {sha}"
- "Apply commits {sha1}, {sha2}, ..."
- "Skip" / "Don't apply anything"

## Step 7: Apply Approved Changes

Once the user approves:

### 7.1 Add Upstream Remote (if not exists)

```bash
cd /path/to/project
git remote add upstream git@github.com:code-and-creed/yugen.git 2>/dev/null || echo "Remote already exists"
git fetch upstream
```

### 7.2 Create Update Branch

```bash
git checkout -b update/boilerplate-updates-YYYY-MM-DD
```

### 7.3 Cherry-pick Commits

```bash
# For specific commits:
git cherry-pick {commit_sha}

# For multiple commits (oldest first):
git cherry-pick {oldest_sha}..{newest_sha}
```

### 7.4 Handle Conflicts

If cherry-pick has conflicts:
1. Show the user which files conflict
2. Offer to resolve or skip that commit
3. Use `git cherry-pick --abort` if needed

### 7.5 Update Tracking File

After successful apply, update `.yugen-updates.json`:

```json
{
  "lastCheckedDate": "2025-01-15T12:00:00Z",
  "lastMigrationDate": "2025-01-15T12:00:00Z",
  "appliedCommits": [
    {
      "sha": "abc123...",
      "message": "Fix TypeScript errors",
      "appliedAt": "2025-01-15T12:00:00Z"
    }
  ]
}
```

### 7.6 Let User Review and Merge

```markdown
## ✅ Updates Applied!

**Branch:** `update/boilerplate-updates-2025-01-15`
**Commits applied:** {count}

### Next Steps

1. **Test the changes:**
   ```bash
   bun install
   bun run typecheck
   bun run dev
   ```

2. **If everything works, merge to main:**
   ```bash
   git checkout main
   git merge update/boilerplate-updates-2025-01-15
   ```

3. **Or discard if issues:**
   ```bash
   git checkout main
   git branch -D update/boilerplate-updates-2025-01-15
   ```
```

## Tracking File Structure

The `.yugen-updates.json` file tracks applied updates:

```json
{
  "lastCheckedDate": "2025-01-25T00:00:00Z",
  "lastMigrationDate": "2025-01-20T00:00:00Z",
  "appliedCommits": [
    {
      "sha": "a424e47d947bc88e0fdef9ec8aa46a337acda76d",
      "message": "fix: resolve TypeScript errors in Convex backend",
      "appliedAt": "2025-01-20T00:00:00Z"
    }
  ]
}
```

## Important Rules

1. **ALWAYS ask for timeframe first** - Don't assume how far back to check
2. **ALWAYS wait for user approval** - Never apply changes automatically
3. **ALWAYS use SSH** for cloning (private repo)
4. **ALWAYS create a separate branch** - Never apply directly to main
5. **ALWAYS let user merge** - Don't merge automatically
6. **DO categorize changes** by risk level
7. **DO show specific file paths** and descriptions
8. **DO update tracking file** after successful applies

## Error Handling

| Error | Solution |
|-------|----------|
| SSH clone fails | Check SSH key setup: `ssh -T git@github.com` |
| No commits found | Repo is up to date, or try a longer timeframe |
| Cherry-pick conflicts | Show conflicts, offer to skip or resolve |
| Tracking file missing | Create new one after first successful apply |

## Example Conversation Flow

**Agent:** "How far back should I check for updates from the Yugen boilerplate?
1. Last 7 days
2. Last 30 days  
3. Custom date

Which would you prefer?"

**User:** "Last 7 days"

**Agent:** *clones repo, analyzes commits, generates report*

"Found 3 commits in the last 7 days..."
*shows report*
"Which updates would you like me to apply?"

**User:** "Apply all of them"

**Agent:** *creates branch, cherry-picks commits*

"Done! I've applied the updates to branch `update/boilerplate-updates-2025-01-15`. 
Test the changes and merge to main when ready."

**User:** "Merge it to main"

**Agent:** *merges branch, cleans up*

"✅ Merged and cleaned up!"
