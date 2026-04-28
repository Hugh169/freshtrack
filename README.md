# FreshTrack

Restaurant inventory and food waste tracking for small independent Australian cafes and restaurants.

## Tech Stack

- **Next.js 14** — App Router, TypeScript
- **Supabase** — PostgreSQL database, Row Level Security, Auth
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — Component library (Radix UI primitives)
- **Recharts** — Waste analytics charts
- **Sonner** — Toast notifications

---

## Setup

### 1. Clone and install

```bash
cd freshtrack
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(seed script only)*

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase credentials
```

### 4. Run the database migrations

In the **Supabase SQL Editor** (Dashboard → SQL Editor), run each migration file in order:

1. Paste and run `supabase/migrations/001_initial_schema.sql`
2. Paste and run `supabase/migrations/002_rls_policies.sql`

Alternatively, if you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and linked:

```bash
supabase db push
```

### 5. (Optional) Enable Google OAuth

1. In Supabase Dashboard → **Authentication → Providers → Google**
2. Enable it and add your Google OAuth credentials
3. Add `http://localhost:3000/auth/callback` to your Google OAuth redirect URIs

### 6. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Seed Data

Populate a demo restaurant with 20 realistic cafe items and 2 weeks of movements/waste:

```bash
npm run seed
```

This creates:
- **Test account:** `demo@freshtrack.app` / `freshtrack123`
- **Restaurant:** The Corner Cafe
- **20 inventory items** across all categories
- **14 days** of deliveries, usage logs, and waste events
- Items intentionally set low on stock and near expiry for demo purposes

---

## Pages

| Route | Description |
|---|---|
| `/login` | Email/password + Google OAuth |
| `/signup` | Register with restaurant name |
| `/dashboard` | Summary metrics + quick actions |
| `/inventory` | Full item list with filtering, sorting, add/edit |
| `/log` | Three-tab log: Delivery, Usage, Waste |
| `/waste` | Date-range waste report with charts + CSV export |
| `/alerts` | Low stock + expiring item alerts with quick-log |
| `/settings` | Restaurant name + notification preferences |

---

## Project Structure

```
freshtrack/
├── app/
│   ├── (auth)/           # Login, signup pages
│   ├── (dashboard)/      # All authenticated app pages
│   └── auth/callback/    # Supabase OAuth callback
├── components/
│   ├── ui/               # shadcn/ui component primitives
│   ├── layout/           # Sidebar, BottomNav, Header
│   ├── inventory/        # InventoryList, ItemForm, StatusBadge, MovementHistory
│   ├── log/              # DeliveryForm, UsageForm, WasteForm
│   ├── waste/            # WasteCharts (recharts)
│   └── dashboard/        # MetricCard
├── lib/
│   ├── supabase/         # Browser + server Supabase clients
│   ├── utils.ts          # cn(), status helpers, date helpers
│   └── format.ts         # Currency, date, quantity formatters
├── types/index.ts        # Shared TypeScript types
├── supabase/migrations/  # SQL migration files
├── scripts/seed.ts       # Demo data seeder
└── middleware.ts         # Auth route protection
```

---

## Key Design Decisions

- **RLS everywhere** — All tables have row-level security; users only ever see their own restaurant's data
- **Mobile-first** — Bottom nav on mobile, sidebar on desktop (lg breakpoint)
- **Waste cost is always red** — Loss should feel real and visceral
- **After logging waste** — Shows large confirmation screen with AUD cost before returning
- **After any log** — Returns to the log page (not dashboard), ready for the next entry
- **Expiry display** — Shows "Today", "Tomorrow", "in X days" on mobile for fast scanning

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed only | Service role key (never expose client-side) |
