# Tree Marketplace

A full-stack tree encyclopedia and e-commerce marketplace for Bangladesh. Buyers browse, search, and purchase trees/varieties from verified sellers; sellers manage listings, orders, and courier integrations; admins moderate the entire platform.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (`artifacts/tree-marketplace`) |
| Backend | Express 5 (`artifacts/api-server`) |
| Database | PostgreSQL + Drizzle ORM (`lib/db`) |
| Auth | Clerk (Replit-managed) |
| Payments | bKash (credentials stored in admin settings) |
| Couriers | Pathao, Steadfast, RedX, Sundarban (mock adapters — real APIs need credentials) |
| Email | Resend (API key stored in admin settings) |
| API Spec | OpenAPI 3.1 (`lib/api-spec/openapi.yaml`) → codegen via Orval |

## Key Services

- **API Server** runs on `PORT` env var (default 8080), path prefix `/api`
- **Frontend** served by Vite dev server, all routes under `/`
- **Clerk proxy** wired at `/clerk` path on the API server

## Roles

| Role | Capabilities |
|------|-------------|
| `buyer` | Browse, search, cart, checkout, orders, wishlist, reviews |
| `seller` | All buyer features + create listings, manage orders, set up couriers |
| `admin` | All seller features + approve/reject listings, manage trees/varieties/categories, settings |

## Database Schema

Tables: `profiles`, `categories`, `trees`, `tree_categories`, `tree_varieties`, `tree_images`, `listings`, `cart_items`, `orders`, `payments`, `reviews`, `wishlist_items`, `variety_requests`, `courier_integrations`, `shipments`, `app_settings`, `pending_payments`

## Environment Variables & Secrets

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — Clerk auth keys
- `VITE_CLERK_PUBLISHABLE_KEY` — Frontend Clerk key
- `SESSION_SECRET` — Cookie session secret
- `COURIER_ENCRYPTION_KEY` — 32-char key for encrypting courier API credentials (optional, defaults to dev key)

## Admin Settings (stored in DB)

Configure these via `/admin/settings` in the app:
- `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD` — bKash merchant credentials
- `BKASH_BASE_URL` — bKash API base URL (sandbox by default)
- `RESEND_API_KEY` — Resend email API key
- `COURIER_ENCRYPTION_KEY` — Encryption key for courier credentials

## Development Commands

```bash
# Push DB schema changes
pnpm --filter @workspace/db run push

# Seed database with sample data (5 trees, 8 categories, 6 varieties)
pnpm --filter @workspace/api-server run seed

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Typecheck API server
pnpm --filter @workspace/api-server run typecheck
```

## Courier Integrations

Each courier adapter is in `artifacts/api-server/src/lib/couriers/`. Current implementations are mocks — to connect real APIs:
- **Pathao**: Follow comments in `pathao.ts` → real API at `api-hermes.pathao.com`
- **Steadfast**: Follow comments in `steadfast.ts` → real API at `portal.steadfast.com.bd`
- **RedX**: Follow comments in `redx.ts`
- **Sundarban**: Follow comments in `sundarban.ts`

## SEO

The homepage (`index.html`) includes Open Graph and Twitter Card meta tags. Update the content to match the production domain and brand.

## User Preferences

- Paid API credentials (bKash, couriers, Resend) entered via admin settings UI — never hardcoded
- Industry-standard quality throughout
- Bangladesh-focused (BDT currency, local courier providers)
