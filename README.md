# CliniBridge

AI-powered clinical trial matching platform that connects rare disease patients with relevant research studies through conversational AI and intelligent filtering.

## Features

- **AI Chat Interface** — Natural language clinical trial search powered by GPT-4o-mini
- **Form-Based Search** — Traditional search with condition, age, location, medications
- **Intelligent Scoring** — AI-powered trial matching with eligibility analysis
- **Real-time Data** — Direct integration with ClinicalTrials.gov v2 API
- **Conversation History** — Persistent chat sessions with localStorage
- **Modern UI** — Dark cinematic theme with emerald accents and glass morphism
- **About Page** — Mission, solution timeline, and roadmap

## Tech Stack

- **Frontend:** TanStack Start (React Router), Tailwind CSS 4, TypeScript
- **AI:** Vercel AI SDK, OpenAI GPT-4o-mini
- **Backend:** Convex (serverless database)
- **Deployment:** Cloudflare Workers (via Alchemy)
- **Package Manager:** Bun

## Project Structure

```
clinibridge/
├── apps/
│   └── web/                    # Main application
│       ├── src/
│       │   ├── components/
│       │   │   ├── Chat/       # Chat interface components
│       │   │   ├── Form/       # Search form components
│       │   │   ├── Trials/     # Trial cards and lists
│       │   │   ├── landing/    # Landing page sections
│       │   │   └── prompt-kit/ # Chat UI library
│       │   ├── lib/
│       │   │   ├── clinicalTrials.ts  # ClinicalTrials.gov API client
│       │   │   ├── scoreTrials.ts     # AI scoring logic
│       │   │   ├── chatStorage.ts     # Conversation persistence
│       │   │   ├── aiPrompts.ts       # System prompts
│       │   │   └── zodSchemas.ts      # Validation schemas
│       │   └── routes/
│       │       ├── index.tsx          # Landing page
│       │       ├── chat.tsx           # AI chat interface
│       │       ├── find.tsx           # Form search
│       │       ├── about.tsx          # About page
│       │       └── api/
│       │           ├── chat.ts        # Chat API route
│       │           └── search.ts      # Search API route
│       └── deploy.sh            # Production deployment script
└── packages/
    └── backend/                 # Convex backend
        └── convex/
            ├── schema.ts        # Database schema
            ├── searchTrials.ts  # Trial search actions
            └── sessions.ts      # Chat session storage
```

## Routes

- `/` — Landing page with hero, featured trials, and CTAs
- `/chat` — Conversational AI clinical trial search
- `/find` — Form-based search with filters
- `/about` — Mission, solution, and roadmap
- `/results/:id` — Saved search results (Convex-backed)

## Setup

### Prerequisites

- Bun 1.2.16+
- Convex account (free tier)
- OpenAI API key
- Cloudflare account (for deployment)

### Installation

```bash
bun install
```

### Environment Variables

Create `apps/web/.env.local`:
```bash
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CONVEX_SITE_URL=https://your-project.convex.site
SITE_URL=http://localhost:3002
```

Create `.env.convex.dev`:
```bash
SITE_URL=http://localhost:3002
```

**Important:** The app requires `OPENAI_API_KEY` for both the frontend API routes and Convex backend. Set it in:
1. Cloudflare Workers dashboard (for production)
2. `apps/web/.env` (for deployment script)
3. Convex dashboard or via `bunx convex env set OPENAI_API_KEY "sk-..." --prod`

### Development

**Terminal 1 — Main dev server:**
```bash
bun run dev
```
App runs at `http://localhost:3002`

**Terminal 2 — Cloudflare Workers dev server:**
```bash
cd apps/web
bun alchemy dev
```
Workers dev server runs at `http://localhost:3001`

## Deployment

### First-time setup

```bash
# Login to Cloudflare
cd apps/web
bun alchemy login

# Configure Convex production
cd ../../packages/backend
bunx convex deploy --yes

# Set environment variables
bunx convex env set OPENAI_API_KEY "sk-your-key" --prod
bunx convex env set SITE_URL "https://your-domain.com" --prod
```

### Deploy to production

```bash
bun run deploy
```

This script:
- Cleans and reinstalls dependencies
- Deploys Convex backend
- Deploys frontend to Cloudflare Workers
- Auto-configures production URLs
- Updates environment variables

### Post-deployment

Add `OPENAI_API_KEY` to Cloudflare Dashboard:
1. Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Settings → Variables and Secrets
4. Add `OPENAI_API_KEY` as a secret

## Key Components

### AI Chat (`/chat`)
- Conversational interface powered by Vercel AI SDK
- Tool-based architecture with `searchTrials` function
- AI scoring and eligibility analysis
- Persistent conversation history
- Markdown rendering with syntax highlighting

### Form Search (`/find`)
- Validated form with condition, age, location, medications
- Server-side search via `/api/search` route
- Same AI scoring as chat interface
- Filtered and sorted results

### Trial Scoring
Both paths use the same AI scoring pipeline:
1. Fetch raw trials from ClinicalTrials.gov
2. Score against patient profile (age, condition, medications)
3. Assign match labels: Strong, Possible, Unlikely
4. Filter out "Unlikely" matches
5. Sort by score, cap at 4 results

### Landing Page
- Cinematic hero with glassmorphism CTAs
- Featured trials grid with filter pills
- Emerald/dark aesthetic
- Grain overlay and ambient glows

## API Integration

**ClinicalTrials.gov v2 API:**
- Endpoint: `https://clinicaltrials.gov/api/v2/studies`
- Query format: OR-joined condition synonyms
- Filters: `filter.overallStatus=RECRUITING`
- Location: `query.locn` for geographic filtering
- Returns: 10 most relevant recruiting trials

**AI Scoring:**
- Model: `gpt-4o-mini`
- Structured output via Zod schemas
- Scores trials 0–100 based on eligibility
- Extracts match reasons and labels

## Scripts

```bash
bun run dev              # Start all services (TurboRepo)
bun run deploy           # Deploy to production
bun run build            # Build all apps
bun run check            # Lint with Biome
bun run check-types      # TypeScript type checking
```

## License

This project is built on the Yugen boilerplate. See [LICENSE](./LICENSE) for details.
