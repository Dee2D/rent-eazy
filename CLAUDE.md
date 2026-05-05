# CLAUDE.md — Easy Rent Uganda
# Agent Configuration & Project Rules

## 🧠 Project Identity
You are building **Easy Rent Uganda** — a production-ready, map-based rental and
service marketplace for Uganda. This is a real commercial product targeting Ugandan
landlords, tenants, and service providers.

## 🔒 Non-Negotiable Rules
- **NEVER hardcode data** — all content comes from Supabase queries
- **NEVER use Redux** — React hooks only (useState, useEffect, useContext, useSWR)
- **ALWAYS handle loading and error states** in every component
- **ALWAYS use TypeScript** — no `any` types without a comment explaining why
- **ALWAYS write mobile-first CSS** — test at 375px width first
- Use **reusable components** in `/src/components/` — never repeat UI logic
- Keep API logic in `/src/lib/` — never call Supabase directly from pages
- All Supabase interactions go through typed helper functions

## 📁 Enforced Folder Structure
```
easy-rent-uganda/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── dashboard/properties/
│   │   │   ├── dashboard/add-property/
│   │   │   └── dashboard/provider/
│   │   ├── properties/
│   │   │   ├── page.tsx        # listing view
│   │   │   └── [id]/page.tsx   # detail view
│   │   ├── api/
│   │   │   └── pay/route.ts    # payment API
│   │   ├── layout.tsx
│   │   └── page.tsx            # homepage with map
│   ├── components/
│   │   ├── map/
│   │   │   ├── MapView.tsx
│   │   │   ├── PropertyMarker.tsx
│   │   │   └── ProviderMarker.tsx
│   │   ├── property/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyFilters.tsx
│   │   │   └── PropertyImageGallery.tsx
│   │   ├── payment/
│   │   │   └── PaymentModal.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # browser Supabase client
│   │   │   ├── server.ts       # server Supabase client
│   │   │   ├── properties.ts   # all property queries
│   │   │   ├── providers.ts    # all provider queries
│   │   │   └── payments.ts     # payment helpers
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProperties.ts
│   │   └── useMap.ts
│   └── types/
│       └── index.ts            # ALL TypeScript types
├── supabase/
│   └── schema.sql              # Complete DB schema
├── .env.local.example
└── README.md
```

## 🎨 Design System
- **Primary color**: `#F97316` (Orange 500 — energy, warmth, Uganda)
- **Secondary**: `#1C1917` (Stone 900 — grounded, premium)
- **Accent**: `#FED7AA` (Orange 100 — soft backgrounds)
- **Success**: `#22C55E`
- **Error**: `#EF4444`
- Font: Use `Geist` (Next.js default) — it's clean and modern
- All buttons use `rounded-xl`, cards use `rounded-2xl`
- Shadows: `shadow-sm` for cards, `shadow-lg` for modals

## 🗺️ Map Rules
- Mapbox token comes from `NEXT_PUBLIC_MAPBOX_TOKEN` env var
- Default map center: **Kampala, Uganda** `[32.5899, 0.3476]`
- Default zoom: `12`
- Property markers: Orange (#F97316)
- Provider markers: Blue (#3B82F6)
- Map popups must show: title, price (formatted as UGX), "View Details" link

## 💰 Price Formatting
Always format UGX prices like: `UGX 450,000/mo` — use this helper:
```ts
export function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString('en-UG')}`;
}
```

## 🔐 Auth Rules
- Use Supabase Auth (email/password only)
- Protect all `/dashboard/*` routes via middleware
- After login, redirect to `/dashboard`
- Store user role in `profiles` table, not JWT claims

## 💳 Payment Mock Rules
The `/api/pay` route must:
1. Accept `{ userId, amount, type: 'listing' | 'subscription', referenceId }`
2. Insert a `payments` record with `status: 'pending'`
3. Wait 2000ms (simulates mobile money processing)
4. Update payment to `status: 'completed'`
5. If `type === 'listing'`: set `properties.is_active = true`, `expires_at = now() + 30 days`
6. If `type === 'subscription'`: set `subscriptions.is_active = true`, `end_date = now() + 30 days`
7. Return `{ success: true, paymentId }`

## 📱 WhatsApp Integration
```ts
const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I saw your listing on Easy Rent Uganda')}`;
```

## ⚠️ Common Mistakes to Avoid
- Do NOT use `useRouter` from `next/navigation` in Server Components
- Do NOT fetch data in Client Components when Server Components can do it
- Do NOT forget to add `"use client"` to components that use hooks or browser APIs
- Do NOT use Mapbox in a Server Component — always `dynamic(() => import(...), { ssr: false })`
- Do NOT expose Supabase service role key on the client — only use it in API routes
