# Easy Rent Uganda

Map-based rental and service marketplace for Uganda.

## Tech Stack
- Next.js 16 (App Router, TypeScript)
- Supabase (PostgreSQL, Auth, Storage)
- Mapbox GL JS
- Tailwind CSS

## Setup

### 1. Clone & Install
```bash
npm install
```

### 2. Set Up Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Enable Row Level Security on all tables

### 3. Set Up Mapbox
1. Create account at [mapbox.com](https://mapbox.com)
2. Copy your Default Public Token

### 4. Environment Variables
```bash
cp .env.local.example .env.local
# Fill in your values
```

### 5. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Business Rules
- Properties cost **UGX 50,000** to list (30 days)
- Provider subscriptions cost **UGX 30,000** (30 days)
- Listings auto-expire and must be renewed

## Payment Testing
All payments are simulated. No real money is charged.
The system auto-approves after a 2-second delay.

## Routes
| Route | Description |
|-------|-------------|
| `/` | Homepage with interactive Mapbox map |
| `/properties` | Browse & filter listings |
| `/properties/[id]` | Property detail + WhatsApp contact |
| `/login` | Sign in |
| `/register` | Create account (tenant / landlord / provider) |
| `/dashboard` | User dashboard with stats |
| `/dashboard/add-property` | Multi-step property listing form |
| `/dashboard/properties` | Manage own listings |
| `/dashboard/provider` | Service provider profile & subscription |
| `/api/pay` | Mock mobile money payment endpoint |
