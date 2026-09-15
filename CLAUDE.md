# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hebrew RTL online ordering site for a fish shop ("דגי בקעת אונו"). A Vite React SPA with a Supabase backend, deployed on Vercel. Customers order on mobile. The shop staff use a large admin area under `/admin`.

## Commands

- `npm run dev`: Vite dev server
- `npm run build`: type check and production build (`tsc -b && vite build`). This is the only automated check; there is no test framework.
- `npm run lint`: ESLint
- `npm run preview`: preview the production build
- `npm run dev:email` / `npm run dev:all`: local Express email server (`dev-email-server.js`), alone or alongside Vite

Node 18 (`.nvmrc`). The `api/` functions don't run under `vite dev`. Test them with `vercel dev` or on a deploy.

## Architecture

### Routing, state, auth
- All routes are in `src/App.tsx`. Customer pages load eagerly. Admin pages are `lazy()` imports, each guarded inline with `isAdmin ? <Page/> : <AdminLogin/>`. A new admin page needs both the lazy import and a guarded route.
- No state library. The cart (`CartItem[]`, type exported from `App.tsx`) lives in `App` state, is persisted to localStorage key `cart` with a 24h TTL, and is passed down as props.
- Checkout hands data between pages through localStorage. `CustomerDetails` saves a form draft (`customerDetailsDraft`), then writes `orderData` and navigates to `OrderSummary`. `OrderSummary` reads `orderData`, inserts into `orders`, decrements inventory (`available_kg` / `available_units`), sends WhatsApp notifications, and then clears all three keys.
- Admin auth is client-side only: credentials come from `VITE_ADMIN_USER` / `VITE_ADMIN_PASS` (bundled into the client), and a localStorage `isAdmin` flag keeps you logged in. It is not real security.
- `/catalog-review` is a public page without the Layout, used by the owner to review the catalog. It writes to `catalog_feedback`, which is shown in `/admin/catalog-feedback`.
- The kitchen weighing screen is `src/pages/KitchenDisplay.tsx`, routed at `/admin/kitchen`. `src/pages/admin/AdminKitchenWeighing.tsx` is an older, unrouted duplicate.
- Shop contact details (phone, WhatsApp, address, hours) live only in `src/lib/shopInfo.ts`. An empty value hides the element that uses it, so don't hardcode contact details anywhere else.

### Pricing
- Unit and weight logic is split between DB fields on `fish_types` (`sale_unit`, `average_weight_kg`, `sold_by_customer_weight`, `has_sizes`) and **hardcoded fish-name lists** in `src/lib/fishConfig.ts`: by-weight fish, average weights, and S/M/L sizes. Renaming a fish in the DB can silently change how it's priced.
- A cut's price addition is the per-fish `price_addition` from the `fish_available_cuts` join, falling back to `cut_types.default_addition` (see `FishCatalog.tsx`).

### Data (Supabase)
- `src/lib/supabase.ts` holds the client and the shared TypeScript interfaces. Many pages also declare their own local interfaces.
- Tables in use: `orders`, `holidays`, `fish_types`, `additional_products`, `availability_slots`, `cut_types`, `fish_available_cuts`, `coupons`, `meal_recommendations`, `catalog_feedback`, `cut_meal_tags`, `fish_cut_prices`, plus the `fish_popularity` view/table.
- Images are in the Storage bucket `fish-images`.
- `schema.sql` is out of date: it lacks `catalog_feedback` and `fish_popularity`. Check the live DB through the Supabase MCP server configured in `.mcp.json`.
- Root `*.cjs` scripts are one-off image upload/migration utilities, not part of the app.

### Notifications and serverless (`api/`)
- `whatsappService.ts` sends through GreenAPI, either directly from the browser (`VITE_GREENAPI_*`) or through `api/send-whatsapp.js` (server `GREENAPI_INSTANCE_ID` / `GREENAPI_TOKEN`).
- Email goes through `api/send-email.js` (Nodemailer + Gmail). The server reads `VITE_EMAIL_USER` / `VITE_EMAIL_PASS`. There are three overlapping client email modules (`emailService.ts`, `emailServiceReal.ts`, `realEmailService.ts`); check which one a caller imports before changing any of them.
- `api/holiday-scheduler.js` is a Vercel cron (daily 09:00 UTC, `vercel.json`). It uses *different* env names: `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL`.
- `api/_middleware.js` is not Vercel middleware. It's a helper (`validateRequest`) that functions import for CORS (`CORS_ORIGIN`) and in-memory rate limiting.
- `api/print-label.js` uses the `PRINTER_TYPE` and `PRINTER_IP` env vars.
- PDFs and reports: `src/lib/pdfLibService.ts` (pdf-lib), plus jsPDF in some admin reports. Charts use both recharts and chart.js.

`.env.example` lists all env vars.

## Conventions

- UI text and code comments are in Hebrew; identifiers are in English.
- The document is `dir="rtl"` `lang="he"`. Layouts must work in RTL and on mobile first.
- Tailwind with a custom ocean palette in `tailwind.config.js` and component classes in `src/index.css` (`btn-primary`, `card-glass`, `input-field`, and others). Prefer those over new ad hoc styles.
- `memory-bank/` holds early planning notes. Parts are stale (for example, it describes a Context API that isn't used), so trust the code.
