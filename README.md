# CF Worker Hono Vue3 Template

A modern full-stack template project that combines Cloudflare Workers, Hono, Vue 3, UnoCSS, and DaisyUI for building powerful web applications with serverless architecture.

## Features

- **Frontend**: Vue 3 with TypeScript, Vite, and modern development tools
- **Backend**: Hono framework running on Cloudflare Workers
- **Styling**: UnoCSS with DaisyUI components for rapid UI development
- **State Management**: Pinia with persistence support
- **Routing**: Vue Router for SPA navigation
- **Database**: Cloudflare D1 database support with migrations
- **Deployment**: Optimized for Cloudflare Workers deployment

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Backend**: Hono
- **Frontend**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **CSS Framework**: UnoCSS + DaisyUI
- **State Management**: Pinia
- **Database**: Cloudflare D1

## Getting Started

### Prerequisites

- Node.js (v20.19.0 or v22.12.0+)
- pnpm package manager
- Cloudflare account with Workers enabled

### Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd cf-worker-hono-vue3-template
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up your Cloudflare D1 database:
   - Create a D1 database in your Cloudflare dashboard
   - Update the `database_id` in `wrangler.jsonc`
   - Run migrations:
     ```bash
     pnpm wrangler d1 migrations apply misc
     ```

### Development

Start the development server:
```bash
pnpm dev
```

### Build and Deploy

1. Build the project:
   ```bash
   pnpm build
   ```

2. Deploy to Cloudflare Workers:
   ```bash
   pnpm deploy
   ```

## Project Structure

```
├── api/                 # Backend API (Hono)
│   ├── index.ts        # API entry point
│   └── migrations/     # Database migrations
├── public/             # Static assets
├── src/                # Frontend source code
│   ├── components/     # Vue components
│   ├── views/          # Page components
│   ├── stores/         # Pinia stores
│   └── styles/         # CSS files
├── types/              # TypeScript type definitions
└── uno.config.ts       # UnoCSS configuration
```

## License

MIT