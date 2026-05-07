# Easy Rent Uganda

A map-based rental and service marketplace for Uganda — connecting landlords, tenants, and service providers across Kampala and beyond.

## Features

- **Interactive Map** — browse property listings pinned on a Mapbox map centered on Kampala
- **Property Listings** — filter by price, category, and location with real-time updates
- **Multi-role Accounts** — tenant, landlord, and service provider roles with separate dashboards
- **Listing Payments** — UGX 50,000 to list a property for 30 days (mobile money simulation)
- **Provider Subscriptions** — UGX 30,000 for a 30-day verified provider profile
- **WhatsApp Contact** — one-tap contact button on every property detail page
- **Auto-expiry** — listings and subscriptions expire automatically after 30 days

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| Map | Mapbox GL JS |
| Styling | Tailwind CSS |
| Hosting | Self-hosted / Vercel-ready |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/Dee2D/rent-eazy.git
cd rent-eazy
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run `supabase/schema.sql`
3. Enable Row Level Security on all tables
4. Copy your **Project URL**, **anon key**, and **service_role key**

### 3. Set up Mapbox

1. Create an account at [mapbox.com](https://mapbox.com)
2. Copy your **Default Public Token**

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Routes

| Route | Description |
|---|---|
| `/` | Homepage with interactive Mapbox map |
| `/properties` | Browse and filter all listings |
| `/properties/[id]` | Property detail page + WhatsApp contact |
| `/login` | Sign in |
| `/register` | Create account (tenant / landlord / provider) |
| `/dashboard` | User dashboard with stats |
| `/dashboard/add-property` | Multi-step property listing form |
| `/dashboard/properties` | Manage your own listings |
| `/dashboard/provider` | Service provider profile and subscription |
| `/api/pay` | Mock mobile money payment endpoint |

## Business Rules

- Listing fee: **UGX 50,000** per property (30-day active period)
- Provider subscription: **UGX 30,000** (30-day active period)
- Listings and subscriptions auto-expire — owners must renew to stay visible

## Payment System

Payments are simulated — no real money is charged. The `/api/pay` endpoint:

1. Accepts `{ userId, amount, type, referenceId }`
2. Creates a `payments` record with `status: pending`
3. Waits 2 seconds (simulates mobile money processing)
4. Updates to `status: completed` and activates the listing or subscription

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Login & register
│   ├── (dashboard)/      # Protected dashboard routes
│   ├── properties/       # Listing browse & detail
│   └── api/pay/          # Payment endpoint
├── components/
│   ├── map/              # Mapbox map + markers
│   ├── property/         # Cards, filters, gallery
│   ├── payment/          # Payment modal
│   ├── ui/               # Shared UI primitives
│   └── layout/           # Navbar & footer
├── lib/supabase/         # All database query helpers
├── hooks/                # useAuth, useProperties, useMap
└── types/                # Shared TypeScript types
```

## License

Private — all rights reserved.
