# Yugen Project Rules

## Project Structure

This is a monorepo with the following structure:

- **`apps/web/`** - Frontend application

- **`packages/backend/`** - Convex backend


## Available Scripts

- `bun run dev` - Start all apps in development mode
- `bun run dev:web` - Start only the web app
- `bun run deploy` - Deploy the web app to Cloudflare
- `bun run deploy:web-only` - Deploy only the web app to Cloudflare
- `bun run destroy` - Destroy the web app from Cloudflare

## Authentication

Authentication is enabled in this project with BetterAuth.