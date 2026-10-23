# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack serverless template combining Cloudflare Workers, Hono, and Vue 3. The frontend is a Vue 3 SPA built with Vite, and the backend is a Hono API running on Cloudflare Workers with D1 database support.

## Common Commands

```bash
# Development
pnpm dev              # Start Vite dev server
pnpm preview          # Build and preview with Wrangler

# Build & Type Checking
pnpm build            # Type-check and build frontend
pnpm build-only       # Build without type-checking
pnpm type-check       # Run Vue TypeScript compiler check

# Deployment & Database
pnpm deploy           # Build and deploy to Cloudflare Workers
pnpm cf-typegen       # Generate Cloudflare Worker types
pnpm wrangler d1 migrations apply misc     # Apply D1 database migrations
```

## Architecture

### Monorepo Structure
The project uses pnpm workspaces with a catalog system (`pnpm-workspace.yaml`) for dependency management. Dependencies are organized into catalogs: `build`, `dev`, `frontend`, and `types`.

### TypeScript Configuration
Uses project references with three separate configs:
- `tsconfig.app.json` - Frontend Vue app code
- `tsconfig.worker.json` - Cloudflare Worker/Hono backend code
- `tsconfig.node.json` - Vite/build tooling code

### Frontend (Vue 3 SPA)
- **Entry point**: `src/main.ts`
- **Router**: Vue Router with views in `src/views/`
- **State**: Pinia with persistence plugin (stores in `src/store/`)
- **Styling**: UnoCSS with DaisyUI preset configured in `unocss.config.ts`
- **Auto-imports**: Vue, Vue Router, and VueUse composables are auto-imported via `unplugin-auto-import`
- **Components**: Auto-imported from `src/components/` via `unplugin-vue-components`
- **Icons**: Use `unplugin-icons` with any iconify set (e.g., `i-mdi-home`)

### Backend (Hono/Cloudflare Workers)
- **Entry point**: `api/index.ts`
- **Type**: `Env` interface defines D1 database binding (`MISC_DB`)
- **CORS**: Configured for `/api/*` routes
- **Database**: Cloudflare D1 with migrations in `api/migrations/`
- **Error handling**: Centralized error handler and 404 handling

### Asset Serving
The `wrangler.jsonc` configuration uses `not_found_handling: "single-page-application"` to serve the SPA, with `run_worker_first` for `/api/*` routes to ensure API requests are handled by the Worker.

## Key Dependencies

- **Frontend**: Vue 3, Vue Router, Pinia with persistence, VueUse, DaisyUI, UnoCSS
- **Backend**: Hono framework
- **Build**: Vite with Cloudflare plugin, TypeScript with vue-tsc
- **Package Manager**: pnpm with workspace catalog

## D1 Database Setup

1. Create a D1 database in Cloudflare dashboard
2. Update `database_id` and `preview_database_id` in `wrangler.jsonc`
3. Place SQL migrations in `api/migrations/`
4. Apply migrations: `pnpm wrangler d1 migrations apply misc`

## Node.js Version

Requires Node.js v20.19.0 or v22.12.0+ (specified in `package.json` engines).
