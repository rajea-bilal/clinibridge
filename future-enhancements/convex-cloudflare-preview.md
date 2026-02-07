# Convex and Cloudflare Workers Preview Environments

This guide outlines the plan for implementing per-branch preview environments for Cloudflare Workers integrated with Convex.

## Important Prerequisites

⚠️ **Before implementing this solution, note the following:**

1. **Convex Preview Deployments** are currently in **beta** and require a **Convex Pro plan** ([source](https://docs.convex.dev/production/hosting/preview-deployments))
2. **Cloudflare Workers** generate preview URLs per deployment version, not automatically per Git branch
3. **Alchemy** is used for deployment in this project (not raw wrangler)
4. **Verify CLI commands** - The exact Convex CLI syntax for preview deployments should be verified by running `bunx convex deploy --help` in your project, as the beta feature may have updated since this document was created

## Problem
Cloudflare Workers supports preview URLs for deployment versions, but managing per-branch environment variables (specifically the `CONVEX_URL`) for standalone Workers requires manual configuration in CI/CD. There is no automatic Git branch → preview environment mapping built into Workers.

## Recommended First Steps

**Before implementing this solution, verify the following:**

1. **Check Convex CLI version and capabilities:**
   ```bash
   cd packages/backend
   bunx convex --version
   bunx convex deploy --help  # Look for preview-related flags
   ```

2. **Confirm Convex plan supports preview deployments:**
   - Log into Convex dashboard
   - Verify you have a Pro plan or trial access to beta features
   - Check documentation for latest preview deployment syntax

3. **Test Alchemy deployment output:**
   ```bash
   cd apps/web
   bun run deploy:web-only
   # Note the output format to understand how to capture the Worker URL
   ```

## Proposed Solution: Manual Workaround

The strategy involves leveraging Cloudflare Workers' version-based preview URLs and managing the Convex deployment process within our CI/CD pipeline.

### 1. Convex Preview Deployments

**Goal**: Create a unique, isolated Convex backend for each feature branch.

1.  **Preview Deploy Key**:
    *   Generate a separate "preview" deploy key in the Convex dashboard.
    *   Store it securely in CI/CD secrets (e.g., `CONVEX_PREVIEW_DEPLOY_KEY`).

2.  **Automated Deployment**:
    *   In the CI/CD pipeline (e.g., GitHub Actions), use the Convex CLI to deploy a preview environment for the branch.
    *   Command (verify exact syntax with Convex documentation for your version):
        ```bash
        cd packages/backend
        # Option 1: Using --preview flag (if supported in your Convex CLI version)
        bunx convex deploy --preview --deploy-key=$CONVEX_PREVIEW_DEPLOY_KEY
        
        # Option 2: Alternative approach using named deployments
        # BRANCH_NAME=$(git branch --show-current | sed 's/[^a-zA-Z0-9-]/-/g')
        # bunx convex deploy --name "preview-${BRANCH_NAME}" --deploy-key=$CONVEX_PREVIEW_DEPLOY_KEY
        ```
    *   **Important**: The exact command syntax depends on your Convex CLI version. Preview deployments are a beta feature that may have changing APIs. Verify the current syntax in the [Convex documentation](https://docs.convex.dev/production/hosting/preview-deployments) before implementing.

3.  **Capture URL**:
    *   Parse the deployment output to extract the `CONVEX_URL`. 
    *   The output will contain something like: `Deployed to: https://xxx.convex.cloud`
    *   Extract both the `.convex.cloud` URL and derive the `.convex.site` URL (replace `.cloud` with `.site`).

### 2. Cloudflare Workers Configuration

**Goal**: Deploy a Worker for the branch that points to the correct Convex preview backend.

1.  **Understanding Cloudflare Workers Preview URLs**:
    *   Unlike Cloudflare Pages, standalone Workers don't automatically create preview URLs per Git branch
    *   Preview URLs in Workers are tied to **deployment versions**, not branches
    *   Format: `https://<VERSION_PREFIX>-<WORKER_NAME>.<SUBDOMAIN>.workers.dev`
    *   To achieve branch-based previews, you must trigger deployments from CI/CD on each push

2.  **Environment Variables (The Manual Part)**:
    *   The CI/CD pipeline must dynamically set environment variables for each preview deployment.
    *   Variables needed:
        *   `VITE_CONVEX_URL` - The Convex backend URL
        *   `VITE_CONVEX_SITE_URL` - The Convex site URL (for auth callbacks)
        *   `SITE_URL` - The Worker's own URL (can be set after deployment or use a placeholder)

### 3. CI/CD Integration Steps

The CI/CD workflow for a Pull Request should:

1.  **Install Dependencies**: 
    ```bash
    bun install
    ```

2.  **Deploy Convex Preview**:
    ```bash
    cd packages/backend
    DEPLOY_OUTPUT=$(bunx convex deploy --preview --deploy-key=$CONVEX_PREVIEW_DEPLOY_KEY 2>&1 | tee /dev/tty)
    
    # Extract URLs from output
    PREVIEW_CONVEX_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE "https://[a-z0-9-]+\.convex\.cloud" | head -1)
    PREVIEW_CONVEX_SITE_URL="${PREVIEW_CONVEX_URL//.convex.cloud/.convex.site}"
    ```

3.  **Build and Deploy Worker with Alchemy**:
    ```bash
    cd ../../apps/web
    
    # Export variables for Alchemy to pick up from process.env
    # These are read by alchemy.run.ts bindings during deployment
    export VITE_CONVEX_URL="$PREVIEW_CONVEX_URL"
    export VITE_CONVEX_SITE_URL="$PREVIEW_CONVEX_SITE_URL"
    
    # Deploy using Alchemy
    # Alchemy reads bindings from alchemy.run.ts which pulls from process.env
    bun run deploy:web-only  # This runs: alchemy deploy
    ```
    
    **How Alchemy handles environment variables:**
    - Alchemy reads the `bindings` configuration in `apps/web/alchemy.run.ts`
    - Those bindings reference `process.env.VITE_CONVEX_URL` etc.
    - The values must be exported in the shell **before** running `alchemy deploy`
    - Alchemy then passes these to the Worker as environment bindings

4.  **Note on Wrangler (if not using Alchemy)**:
    This project uses Alchemy, but if you were using raw wrangler:
    ```bash
    # Wrangler approach (NOT used in this project)
    wrangler deploy --env preview
    ```
    
    With wrangler, environment variables are typically set via:
    - `wrangler.toml` configuration file with `[env.preview]` sections
    - Cloudflare Dashboard for secrets
    - Cloudflare API for programmatic updates

### Key Tools

*   **Convex CLI**: `bunx convex deploy --preview` - Creates isolated preview environments
*   **Wrangler CLI**: For managing Worker deployments and environment variables
*   **Alchemy**: Build tool that wraps wrangler (used in this project via `alchemy.run.ts`)
*   **Cloudflare API**: For programmatic configuration if needed

## Current Project Setup

This project uses:
- **Bun** as the package manager and runtime
- **Alchemy** (`alchemy.run.ts`) for Cloudflare Workers deployment configuration
- **TanStack Start** for the web framework
- The deployment currently binds environment variables in `apps/web/alchemy.run.ts`:

```typescript
bindings: {
  VITE_CONVEX_URL: process.env.VITE_CONVEX_URL || "",
  VITE_CONVEX_SITE_URL: process.env.VITE_CONVEX_SITE_URL || "",
  // ... other bindings
}
```

## Challenges and Considerations

1. **Environment Variable Injection**:
   - Alchemy reads from `process.env` during deployment
   - Need to ensure preview URLs are available as environment variables before running `alchemy deploy`
   - Alternative: Modify `alchemy.run.ts` to accept CLI arguments or read from a config file

2. **Preview URL Management**:
   - Cloudflare generates preview URLs automatically, but they're not known until after deployment
   - This creates a chicken-and-egg problem for `SITE_URL` configuration
   - Solution: Use a placeholder or update Convex environment after Worker deployment

3. **Cleanup**:
   - Preview deployments in Convex should be cleaned up after PR merge/close
   - Consider adding a cleanup step to delete stale preview deployments

4. **Authentication Callbacks**:
   - `SITE_URL` is critical for auth redirects
   - Preview environments need accurate callback URLs
   - May need to update Convex `SITE_URL` environment variable after Worker deployment completes

## Recommended Implementation Approach

### Option A: Sequential Deployment (Simpler)
1. Deploy Convex preview → get URL
2. Export URLs as env vars
3. Deploy Worker with those env vars
4. Optionally update Convex's `SITE_URL` with Worker preview URL

### Option B: Parallel with Post-Update (More Complex)
1. Deploy Convex preview and Worker simultaneously
2. Use placeholder for `SITE_URL` initially
3. Add a post-deployment step to update Convex's `SITE_URL` env var with actual Worker URL

### Recommended: Option A

Most straightforward and mirrors the current production deployment pattern in `apps/web/deploy.sh`.

## Example GitHub Actions Workflow

```yaml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        
      - name: Install dependencies
        run: bun install
        
      - name: Deploy Convex Preview
        id: convex
        working-directory: packages/backend
        env:
          CONVEX_PREVIEW_DEPLOY_KEY: ${{ secrets.CONVEX_PREVIEW_DEPLOY_KEY }}
        run: |
          DEPLOY_OUTPUT=$(bunx convex deploy --preview --deploy-key=$CONVEX_PREVIEW_DEPLOY_KEY 2>&1 | tee /dev/tty)
          CONVEX_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE "https://[a-z0-9-]+\.convex\.cloud" | head -1)
          CONVEX_SITE_URL="${CONVEX_URL//.convex.cloud/.convex.site}"
          echo "convex_url=$CONVEX_URL" >> $GITHUB_OUTPUT
          echo "convex_site_url=$CONVEX_SITE_URL" >> $GITHUB_OUTPUT
          
      - name: Deploy to Cloudflare Workers
        working-directory: apps/web
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          VITE_CONVEX_URL: ${{ steps.convex.outputs.convex_url }}
          VITE_CONVEX_SITE_URL: ${{ steps.convex.outputs.convex_site_url }}
        run: |
          bun run deploy:web-only
          
      - name: Comment PR with Preview URLs
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Preview Deployment Ready! 🚀\n\n**Convex Backend**: ${{ steps.convex.outputs.convex_url }}\n**Worker URL**: (Check Cloudflare dashboard)`
            })
```

## Cleanup Workflow

```yaml
name: Cleanup Preview

on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        
      - name: Delete Convex Preview
        working-directory: packages/backend
        env:
          CONVEX_PREVIEW_DEPLOY_KEY: ${{ secrets.CONVEX_PREVIEW_DEPLOY_KEY }}
        run: |
          # Note: Convex CLI may not have a direct delete command
          # May need to use Convex API or manually clean up old previews periodically
          echo "Preview cleanup - implement based on Convex capabilities"
```

## Important Notes & Caveats

### Convex Preview Deployment Behavior

1. **Beta Feature & Pricing**: 
   - Preview deployments are currently in **beta** and require a **Convex Pro plan**
   - The API and CLI commands may change as the feature evolves
   - Check [Convex documentation](https://docs.convex.dev/production/hosting/preview-deployments) for current status

2. **Deploy Key Scope**: 
   - Preview deploy keys create deployments under a specific Convex project
   - Each preview deployment is isolated but shares the same project namespace
   - Preview deployments may have automatic naming or require explicit names

3. **URL Extraction Reliability**:
   - The grep pattern `https://[a-z0-9-]+\.convex\.cloud` should work for standard deployments
   - Verify the exact output format of `bunx convex deploy` with preview flags before implementing
   - Add error handling if URL extraction fails
   - The deployment output format may vary between Convex CLI versions

4. **Environment Variables in Convex**:
   - Convex deployments have their own environment variables separate from the frontend
   - You'll need to set `SITE_URL` in the Convex preview environment after Worker deployment:
     ```bash
     # Verify the correct flag for targeting preview environment
     bunx convex env set SITE_URL "https://preview-url.workers.dev" --preview
     # OR
     bunx convex env set SITE_URL "https://preview-url.workers.dev" --name "preview-branch-name"
     ```
   - Check Convex CLI documentation for the correct flag syntax

### Alchemy & Cloudflare Workers Behavior

5. **Alchemy Deployment Process**:
   - Alchemy reads `process.env` at deployment time (not build time)
   - Environment variables **must be exported** in the shell before running `alchemy deploy`
   - Alchemy's `bindings` in `alchemy.run.ts` map `process.env` values to Worker environment variables
   - Each deployment creates a new version of the Worker

6. **Cloudflare Workers Preview URLs**:
   - Preview URLs are **per deployment version**, not per Git branch
   - Format: `https://<VERSION_PREFIX>-<WORKER_NAME>.<SUBDOMAIN>.workers.dev`
   - The exact URL depends on your Cloudflare account configuration
   - You'll need to extract the Worker URL from Alchemy/wrangler deployment output
   - Unlike Pages, there's no automatic Git branch → URL mapping

7. **Worker URL Extraction Challenge**:
   - Alchemy may output the Worker URL after deployment
   - You may need to parse the deployment output to capture the URL
   - Alternative: use Cloudflare API to query the latest deployment URL
   - This URL is needed to update Convex's `SITE_URL` environment variable for auth callbacks

### Testing the Implementation

Before fully implementing, test these steps manually:

1. **Test Convex Preview Deployment**:
   ```bash
   cd packages/backend
   bunx convex deploy --preview --deploy-key=YOUR_PREVIEW_KEY
   # Verify the output format and URL structure
   ```

2. **Test URL Extraction**:
   ```bash
   # Run the grep command on actual output to verify it works
   echo "Your deploy output here" | grep -oE "https://[a-z0-9-]+\.convex\.cloud"
   ```

3. **Test Alchemy with Environment Variables**:
   ```bash
   cd apps/web
   export VITE_CONVEX_URL="https://test.convex.cloud"
   export VITE_CONVEX_SITE_URL="https://test.convex.site"
   alchemy deploy
   # Verify the variables are properly injected
   ```

4. **Verify Authentication Flow**:
   - Test that auth redirects work correctly with preview URLs
   - Ensure Better Auth callbacks are configured properly

### Alternative Approaches

#### Named Convex Deployments
If the `--preview` flag doesn't work or isn't available:

```bash
# Use a branch-specific deployment name
BRANCH_NAME=$(git branch --show-current | sed 's/[^a-zA-Z0-9-]/-/g')
bunx convex deploy --name "preview-${BRANCH_NAME}" --deploy-key=$CONVEX_PREVIEW_DEPLOY_KEY
```

This approach may require different Convex configuration but provides explicit control over preview environments with predictable naming.

## Complexity Assessment

**This implementation requires careful orchestration because:**

1. **Manual CI/CD orchestration required** - No automatic branch → preview URL mapping
2. **Two-way URL dependency** - Worker needs Convex URL, Convex needs Worker URL (for auth)
3. **Beta feature** - Convex preview deployments API may change
4. **Environment variable injection** - Must manage `process.env` before Alchemy runs
5. **URL extraction** - Must parse deployment output from both Convex and Alchemy
6. **Cleanup complexity** - No automatic preview deletion; requires manual cleanup workflow

**Estimated implementation effort:** 4-8 hours for initial setup + testing + debugging

**Key success factors:**
- Verify Convex CLI preview commands work with your version
- Test URL extraction patterns with actual deployment outputs
- Ensure auth callbacks work correctly with dynamic preview URLs

## References

*   [Convex Preview Deployments](https://docs.convex.dev/production/hosting/preview-deployments) - **Primary reference, check for updates**
*   [Cloudflare Workers Preview URLs](https://developers.cloudflare.com/workers/configuration/previews/)
*   [Alchemy Documentation](https://alchemy.run/)
*   [Wrangler Environments](https://developers.cloudflare.com/workers/wrangler/environments/)
*   Current production deployment script: `apps/web/deploy.sh`

