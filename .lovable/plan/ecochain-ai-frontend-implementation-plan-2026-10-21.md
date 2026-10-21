# EcoChain AI — Frontend Implementation Plan

## What is being built

A frontend-only, multi-page enterprise SaaS app "EcoChain AI" per the uploaded brief: AI-powered smart operations & sustainable supply chain management demo. All data is mock data in frontend state, persisted to localStorage. No backend, no database, no authentication.

## Stack notes (platform adaptation)

- React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui + Recharts + lucide-react — all already installed.
- Routing uses TanStack Router (already wired in this project) instead of React Router; the brief's route structure is implemented 1:1.
- Map: brief permits a labelled schematic route visualization without credentials — we build an SVG schematic map (warehouses, stops, route polylines, current vs suggested toggle). No external map API.

## Design system

Update `src/styles.css` tokens (oklch, light + dark) from the brief palette:

- Background #F7F8F6, primary forest green #176B4D, text charcoal #202923, muted slate #69736D, subtle grey borders, amber warning, restrained red critical, green success.
- Load Inter via `<link>` in `src/routes/__root.tsx` (never @import in CSS).
- Minimal UI + Bento grids; glass effects only on floating overlays (command palette, notification popover, drawer).
- Update `__root.tsx` head metadata (real title/description, og tags); each route gets its own `head()`.

## Architecture

```
src/
  data/            mock seed data + deterministic generators (products, warehouses,
                   shipments, alerts, recommendations, activity, forecasts)
  types/           shared TypeScript types
  services/        demoStore (single source of truth): plain TS store with
                   subscribe/getState + actions (stock ops, transfers, shipment
                   status updates, recommendation decisions, route approvals,
                   reset), localStorage persistence, selectors + calculations
                   (inventory metrics, shipment performance, sustainability est.)
  hooks/           useDemoStore, useFilters, useCsvExport
  lib/             csv.ts, format.ts, calc.ts
  components/      AppShell (sidebar + topbar), KpiCard, DataTable, FilterBar,
                   StatusBadge, EmptyState, LoadingSkeleton, ChartCard,
                   CommandSearch (global search), notifications popover,
                   confirm dialogs, ActivityTimeline
  features/
    inventory/  pages + add/edit/update-stock/transfer form dialogs + detail page
    shipments/  pages + status update/delay/deliver/resolution actions + detail page
    routes/     route planner (config panel, schematic map, comparison, approval)
    insights/   recommendation list + detail panel + decision actions + forecasts
    sustainability/  KPIs, charts, baseline vs optimized toggle, CSV export
    reports/    period/category selectors, summaries, print view, CSV export
```

## Routes

- `/` redirects to `/overview`
- `/overview` — KPI bento (active orders, inventory value, on-time rate, delayed shipments with trends), delivery performance + inventory distribution charts, recent shipments, priority alerts, daily briefing, activity list; filters and drill-through links.
- `/inventory` — summary cards, sortable/filterable/paginated table, Add Product / Edit / Update Stock / Transfer Stock dialogs (validated; transfers blocked when exceeding available stock), Export CSV; `/inventory/$productId` detail page (info, stock by warehouse, expiry, movement history, alerts).
- `/shipments` — searchable/filterable table, Export CSV; `/shipments/$shipmentId` detail page (timeline, delay reason, schematic route preview, actions: update status, simulate delay, mark delivered, record resolution note).
- `/route-planner` — origin/destination/stops/vehicle/priority controls, deterministic current-vs-suggested comparison (distance, time, fuel cost, emissions), schematic map, approve + save plan with confirmation.
- `/ai-insights` — 5 recommendation categories, priority/status filters, detail panel (reason, supporting data, impact, action), accept/reject/request-review with recorded history; accepted low-stock/transfer actions update inventory state where safe.
- `/sustainability` — emissions/fuel/waste-risk/avoided KPIs, trend + by-shipment charts, waste-risk breakdown, baseline vs optimized toggle, period/warehouse filters, CSV export, stated assumptions.
- `/reports` — period/warehouse/category selectors, performance summary + trend charts, CSV export, print-friendly view (window.print).
- `/settings` — demo profile, default warehouse, display & notification preferences, data-mode status, Reset Demo Data (with confirmation).

All state changes flow through the demoStore so every page shows consistent values; store persists to localStorage on change (hydration-safe: seeded state renders identically on server and client, stored state loads after mount).

## Quality gates

- No dead controls: every button/link/filter triggers a real action or navigation.
- Validation on all forms (zod + react-hook-form); confirmations on consequential actions (transfer, reset, route approval).
- Loading skeletons (brief simulated refresh), empty states, error states.
- Responsive: desktop persistent collapsible sidebar, mobile drawer navigation, stacked panels, no horizontal overflow; accessible labels/focus states.
- CSV export of currently filtered rows via a shared util.
- Tests (vitest) for business rules: transfer validation, stock status thresholds, on-time rate + sustainability calculations, store persistence/reset.
- Playwright walkthrough of main flows (navigation, transfer, shipment status, recommendation decision) before finishing.
