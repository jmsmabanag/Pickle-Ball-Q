# Pickleball Open Play Queue

Mobile-friendly Pickleball Open Play Queue built with React, TanStack Start, Vite, Cloudflare Workers, and Supabase.

## Cloudflare Workers deployment

This project is configured for Cloudflare Workers using the Cloudflare Vite plugin.

### Local development

```bash
pnpm install
pnpm dev
```

### Build

```bash
pnpm build
```

### Deploy

```bash
npx wrangler login
pnpm deploy
```

The application uses Supabase for shared queue state and realtime synchronization. The Supabase URL and anon key are client-safe values; database access control must be enforced with Supabase Row Level Security (RLS).

## Cloudflare configuration

- Vite config: `vite.config.ts`
- Worker config: `wrangler.jsonc`
- Build command: `pnpm build`
- Deploy command: `pnpm deploy`

This is a Cloudflare Workers/TanStack Start application, not a static Cloudflare Pages-only deployment.
