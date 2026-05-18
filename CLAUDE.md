# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hebrew RTL e-commerce ordering system for a fish shop ("דגי בקעת אונו"). Built as a Vite SPA with Supabase backend, deployed on Vercel.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + Vite production build (`tsc -b && vite build`)
- `npm run lint` — ESLint
- `npm run preview` — Preview production build
- `npm run dev:email` — Local email test server (Express on separate port)
- `npm run dev:all` — Dev server + email server concurrently

## Architecture

### Tech Stack
- **React 18 + TypeScript + Vite 7** — SPA with React Router v6
- **Tailwind CSS 3.4** — Ocean-themed custom palette (primary `#023859`, secondary `#6FA8BF`, accent `#026873`)
- **Supabase** — PostgreSQL database + image storage
- **Vercel** — Hosting with serverless API functions (`api/` directory)

### Routing & State
All routes defined in `src/App.tsx`. Cart state (`CartItem[]`) lives in App component and is passed via props. No global state library. Admin auth is simple state-based (`isAdmin` boolean) with hardcoded credentials.

### Key Directory Layout
- `src/pages/` — Customer-facing pages (HomePage, FishCatalog, CustomerDetails, OrderSummary)
- `src/pages/admin/` — ~20 admin pages (dashboard, fish/cut management, reports, orders, holidays, coupons)
- `src/components/` — Shared components (Layout, AvailableTimeSelector, AdminBottomNav)
- `src/lib/` — Service layer:
  - `supabase.ts` — Client init + all TypeScript interfaces (FishType, CutType, Order, etc.)
  - `fishConfig.ts` — Fish metadata & price calculations
  - `whatsappService.ts` — GreenAPI WhatsApp integration
  - `pdfService.ts`, `pdfLibService.ts`, `pdfMakeService.ts` — Multiple PDF generation engines
  - `emailService.ts`, `emailServiceReal.ts`, `realEmailService.ts` — Email via EmailJS/Nodemailer
- `api/` — Vercel serverless functions (send-email, send-whatsapp, holiday-scheduler, print-label)

### Database (Supabase)
Main tables: `fish_types`, `cut_types`, `fish_cut_prices`, `orders`, `holidays`, `additional_products`, `coupons`, `availability_slots`, `meal_recommendations`.

### Pricing Model
Fish can be sold by weight (`kg`) or by unit (`units`), controlled by `sale_unit` field on `fish_types`. Some fish support size selection (S/M/L) via `has_sizes`. Cut types have a `default_addition` price modifier, overridable per fish via `fish_cut_prices`.

### Environment Variables
All prefixed with `VITE_` for client-side access: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GREENAPI_INSTANCE_ID`, `VITE_GREENAPI_TOKEN`, `VITE_ADMIN_PHONE`, `VITE_EMAIL_USER`, `VITE_EMAIL_PASS`, `VITE_ADMIN_EMAIL`.

## Conventions

- **Language**: UI text is Hebrew. Code comments are Hebrew. Variable/function names are English.
- **RTL**: Document is set to `dir="rtl"` and `lang="he"` in App.tsx. All layouts must respect RTL.
- **Node version**: 18 (specified in `.nvmrc`)
- **No test framework** is currently configured.
