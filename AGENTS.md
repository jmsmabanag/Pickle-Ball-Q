# AGENTS.md

Guide for AI agents and developers working on this codebase.

## Project Overview

**unstckdq** is a mobile-friendly Pickleball Open Play Queue app. Front-desk staff ("admins") register players, the app auto-assigns groups of 4 to open courts, and it rotates players back into the queue when a game finishes. All state lives in the browser (`localStorage`) — there is no backend or database.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 (file-based routing) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Persistence | Browser `localStorage` (no server/database) |
| Language | TypeScript 5 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
├── src
│   ├── components
│   │   ├── AddPlayerForm.tsx   # Admin-only player registration input
│   │   ├── AdminPinModal.tsx   # PIN entry dialog to enable Admin mode
│   │   ├── CourtCard.tsx       # Renders one court: roster, game timer, Finish Game
│   │   ├── ErrorToast.tsx      # Bottom toast for validation errors (e.g. duplicate name)
│   │   ├── Header.tsx          # Logo, Queue/Leaderboard tabs, Admin toggle, Undo
│   │   ├── Logo.tsx            # unstckdq wordmark + generated SVG mark
│   │   ├── QueueList.tsx       # "Next Up" waiting list with per-player countdown
│   │   └── WaitTimer.tsx       # 19-minute countdown timer component
│   ├── lib
│   │   ├── queueEngine.ts      # Pure functions: add/remove player, auto-assign courts, finish game, add/remove court
│   │   ├── store.tsx           # React context: app state, undo history, admin gating, localStorage sync
│   │   ├── storage.ts          # localStorage load/save + default state + id generation
│   │   ├── types.ts            # Player / Court / AppState types, WAIT_TIME_MS constant
│   │   └── useNow.ts           # Interval hook that drives live timers
│   ├── routes
│   │   ├── __root.tsx          # HTML shell, StoreProvider, Header, ErrorToast
│   │   ├── index.tsx           # Queue tab: stats, courts grid, next-up list, admin panel
│   │   └── leaderboard.tsx     # Leaderboard tab: players ranked by games played
│   └── styles.css
├── netlify.toml
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Core Concepts

### State shape (`src/lib/types.ts`)
- `Player`: `id`, `name`, `status` (`queue` | `playing` | `unavailable`), `gamesPlayed`, `queueSince` (epoch ms, drives the wait timer).
- `Court`: `id`, `name`, `playerIds` (0 or 4 entries), `startedAt`.
- `AppState`: `players`, `courts`, `adminMode`, `adminPin`, `brand`.

### Queue engine (`src/lib/queueEngine.ts`)
Pure, side-effect-free functions that take the current `AppState` and return the next one. `autoAssignCourts` is the core rule: any empty court is filled with the 4 longest-waiting queued players. It runs after every player add, court add/remove, and finished game, which is what implements automatic rotation.

### Store (`src/lib/store.tsx`)
A single React context wraps the queue engine, handles:
- Hydrating from and persisting to `localStorage` (key `unstckdq:state:v1`).
- A capped in-memory undo stack (last 25 mutations) — not persisted, so it resets on reload.
- Admin gating: every mutating action (`registerPlayer`, `removeRegisteredPlayer`, `setPlayerUnavailable`, `finishCourtGame`, `addNewCourt`, `removeExistingCourt`, `undo`) checks `adminMode` first and surfaces an error toast if it's off. This is what enforces "admin off → can't finish games or add players."
- `enableAdmin(pin)` checks against `adminPin` (default `1234`, stored in the persisted state so it can be changed later if a settings UI is added).

### Wait timer
Each queued player's countdown is derived, not stored: `WAIT_TIME_MS (19 min) - (now - queueSince)`. `useNow()` re-renders consumers every second. Once a game finishes, players' `queueSince` resets to the finish time.

## Conventions

- Components are PascalCase, hooks/utilities camelCase, routes kebab/lowercase (TanStack Router file-based routing).
- Business logic stays in `src/lib` as plain functions; components only call into `useStore()` and render.
- No comments explaining *what* code does — only non-obvious *why* (e.g. the stale-closure note pattern in `store.tsx`'s `undo`).
- Strict TypeScript, `noUnusedLocals`/`noUnusedParameters` enabled — keep exports actually used.

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
```
