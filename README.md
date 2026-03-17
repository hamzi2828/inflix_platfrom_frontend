# Inflix Platform Frontend

Next.js (App Router + TypeScript + Tailwind) for the Platform Owner Console. Talks to **pos-platform-backend** only.

## Setup

1. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to your platform backend (e.g. `http://localhost:5001`).
2. `npm install` then `npm run dev` (default port 3000; use another e.g. 3001 if the POS app runs on 3000).

## Routes

- `/login` – Platform admin sign-in (separate from tenant users).
- `/platform` – Hub (Admin Accounts, Feature Catalog, Plan Catalog, Tenants).
- `/platform/admin-accounts` – CRUD platform admins.
- `/platform/feature-catalog` – Feature registry.
- `/platform/plan-catalog` – Plans (starter, pro, enterprise).
- `/platform/tenants` – Tenant list; add tenant (optional first admin in tenant DB).
- `/platform/tenants/[tenantId]` – Tenant details, subscription, overrides, tenant user management.

Root `/` redirects to `/login`.

# pos_platfrom_frontend
