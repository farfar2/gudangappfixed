# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GudangApp is a warehouse management system (WMS) for Indonesian SME/FMCG warehouses, replacing spreadsheet-based stock tracking with a role-enforced digital system. React + TypeScript + Vite frontend, Supabase (PostgreSQL) backend. UI strings and most in-app content are in Indonesian.

## Commands

```bash
bun install       # or npm install — install dependencies
bun run dev        # start dev server on port 3000 (0.0.0.0)
bun run build       # production build via vite
bun run preview     # preview the production build
bun run lint        # tsc --noEmit — this is the project's only lint/typecheck step
```

There is no test suite and no ESLint config in this repo — `lint` only runs the TypeScript compiler in `--noEmit` mode. Treat a clean `bun run lint` as the correctness bar for changes.

## Environment / local setup

Requires a `.env` file (not present in repo) with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
Without these, `isSupabaseConfigured` (`src/lib/supabase.ts`) is `false` and the app runs entirely on local seed data / localStorage (see "Dual-mode data layer" below) — this is expected and is how the app runs out of the box for demos.

Database schema lives in `supabase/schema.sql` (base tables + RLS) and `supabase/schema_additions.sql` (adds the `superadmin` role and the `categories` table — run this second, in the Supabase SQL editor, after the base schema).

## Architecture

### Dual-mode data layer (the key thing to understand)

Every data-mutating function in `src/context/InventoryContext.tsx` (e.g. `addSKU`, `recordScanIn`, `recordScanOut`, `createPO`, `receivePO`) follows the same pattern:

1. If `isSupabaseConfigured && supabase`, perform the real Supabase read/write (insert/update/upsert) and bail out with an error if it fails.
2. Always also update local React state (`setSkus`, `setStocks`, `setMovements`, ...) as the source of truth for rendering.
3. If Supabase isn't configured, the function silently falls back to only updating local state, seeded from `src/lib/seedData.ts`.

`src/context/AuthContext.tsx` mirrors this: it tries real Supabase auth (`signInWithPassword`, session listener), and falls back to a hardcoded demo credential map (superadmin/admin/staff) persisted to `localStorage` under `gudangapp_auth_v2`. On first load with no session and no saved local auth, it auto-logs in as the demo admin.

When changing any mutation, update **both** paths — the Supabase call and the local-state fallback — or the feature will silently break in one of the two modes.

### Role-based access control (RBAC), enforced twice

Roles are `superadmin` > `admin` > `staff` (`UserRole` in `src/types/database.ts`).

- **Database level (source of truth):** RLS policies in `supabase/schema.sql` / `schema_additions.sql`, keyed off `public.get_user_role()` reading `profiles.role`. This is what actually stops a staff user from writing to `skus`, `categories`, etc., regardless of what the client sends.
- **UI level (convenience only):** `AuthContext` exposes `isAdmin` / `isSuperAdmin` / `isStaff` booleans; `Sidebar.tsx` filters nav items by an optional `roles` array on each `NavItem`; individual views/components gate actions using these flags.

When adding a feature restricted to admin/superadmin, mirror the restriction in the RLS policy (SQL) and in the UI gating — don't rely on one alone.

### App shell and routing

There is no router library. `src/App.tsx`'s `MainApp` holds `activeTab: ActiveTab` in `useState` and switches over it to render the matching view from `src/views/`. `ActiveTab` and the nav structure (including per-item role gating) are defined together in `src/components/layout/Sidebar.tsx`. To add a new page: add the tab id to `ActiveTab`, add it to `Sidebar`'s `navGroups`, add a `case` in `MainApp.renderView`, and add a title to `PAGE_TITLES`.

Two React contexts wrap the whole app (`src/App.tsx`): `AuthProvider` (outer) then `InventoryProvider` (inner, depends on `useAuth()`).

### Inventory domain logic

`InventoryContext` computes derived inventory health in a `useMemo` (`inventoryItems`), not in the database:
- `ads` (average daily sales) = `total_sales_10m / 300`
- `dos` (days of supply) = `stock_gudang_a / ads`
- `status`: `critical` if `dos < 7`, `low` if `dos < 14`, else `ok` (or `none` if no sales)
- `safety_stock` = `ads * 14`; `restock_need`/`restock_qty` derive from safety stock vs. buffer warehouse stock

There are two fixed warehouses: Gudang A (`primary`, id `...0001`) and Gudang B (`buffer`, id `...0002`), looked up by `type` with those UUIDs as fallback constants (`GUDANG_A_ID`/`GUDANG_B_ID`). Stock movements (`stock_movements`) are append-only by design (no UPDATE/DELETE RLS policy) — always add a new movement row rather than mutating history.

### Supabase Realtime

`InventoryContext` also subscribes to Postgres changes on `stock`, `stock_movements`, and `skus` via `supabase.channel(...).on('postgres_changes', ...)` and merges them into local state, so multiple clients stay in sync when Supabase is configured. This only runs when `isSupabaseConfigured && user`.

### Path alias

`@/*` maps to the repo root (both `tsconfig.json` and `vite.config.ts`), not to `src/`.
