# CLAUDE.md — Panisewa (पानीसेवा) SaaS Project
# READ THIS ENTIRE FILE BEFORE WRITING ANY CODE
# Updated: 2026-05-17 | Database: Supabase (PostgreSQL)

## ════════════════════════════════════════════
## PROJECT OVERVIEW
## ════════════════════════════════════════════

**Panisewa** (पानीसेवा) is a multi-tenant SaaS platform for water jar/bottle
delivery businesses — targeting Nepal first (NRS currency, Nepali/English UI).

### Core Business: Water Jar Bottling + B2B + B2C
1. Bottling/Factory ops — jar fill tracking, batch QC, empties returns
2. B2B sales — corporate/restaurant clients, credit terms, bulk invoicing
3. B2C sales — home delivery, subscription plans, customer portal
4. Driver dispatch — route assignment, delivery confirmation
5. Billing — VAT 13%, Nepali fiscal year (BS), IRD-compliant receipts
6. Inventory — raw materials, finished goods, empties tracking

### Build Order (STRICT — do not skip ahead)
1. ⬜ Backend API (Supabase + Express) — ALL modules first
2. ⬜ Admin Dashboard (Next.js) — internal tool
3. ⬜ Customer Portal — public facing
4. ⬜ Driver Mobile App (Expo React Native) — Android

---

## ════════════════════════════════════════════
## ARCHITECTURE
## ════════════════════════════════════════════

```
panisewa/
├── packages/
│   ├── api/          → Node.js 20 + Express + TypeScript + Supabase
│   ├── client/       → Next.js 14 + TypeScript (admin + customer portal)
│   └── shared/       → Zod schemas, types, constants, i18n
├── apps/
│   └── driver-mobile/  → React Native Expo (Phase 7, build last)
├── _waterzilla_reference/  → Original fork files (read only, for patterns)
├── infra/            → Docker Compose for local Redis
├── CLAUDE.md
└── pnpm-workspace.yaml
```

---

## ════════════════════════════════════════════
## DATABASE — SUPABASE (PostgreSQL)
## ════════════════════════════════════════════

### Why Supabase
- Row Level Security (RLS) enforces multi-tenancy AT THE DATABASE LEVEL
- Built-in Auth handles password hashing, sessions, refresh tokens
- Realtime subscriptions for order status + driver updates
- Storage for delivery photos and invoice PDFs
- PostgreSQL is better than MongoDB for billing/reporting queries
- Generated TypeScript types from schema = type safety end-to-end

### Supabase Client Setup
```typescript
// packages/api/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase.types'

// Service role — server only, NEVER expose to client, bypasses RLS
export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Anon client — use when RLS should be enforced
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
```

### Generate TypeScript types (run after every migration)
```bash
npx supabase gen types typescript \
  --project-id $SUPABASE_PROJECT_ID \
  --schema public \
  > packages/api/src/types/supabase.types.ts
```

### Multi-tenancy via Row Level Security
```sql
-- Every table has a tenant_id column.
-- RLS policy automatically filters rows to the current tenant.

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON orders
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Helper SQL function (create once in Supabase SQL editor):
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
END;
$$;
```

### How to use tenant context in API
```typescript
// tenant.middleware.ts — runs after auth.middleware on all /tenant routes
export const tenantMiddleware = async (req, res, next) => {
  const { tenantId } = req.user
  await supabase.rpc('set_tenant_context', { p_tenant_id: tenantId })
  next()
}

// In any service — no manual WHERE tenant_id needed, RLS handles it:
const { data, error } = await supabase.from('orders').select('*')
// Returns ONLY current tenant's orders automatically
```

---

## ════════════════════════════════════════════
## DATABASE SCHEMA (implement in this order)
## ════════════════════════════════════════════

```sql
-- Run these in Supabase SQL Editor or as migration files

-- 1. TENANTS
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  status text not null default 'trial'
    check (status in ('trial','active','suspended')),
  plan text not null default 'starter'
    check (plan in ('starter','growth','enterprise')),
  settings jsonb default '{}',
  -- settings keys: vatRegistered, panNumber, fiscalYear,
  --   defaultLanguage, timezone, address, phone
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. USERS (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id),
  role text not null
    check (role in ('SUPER_ADMIN','TENANT_ADMIN','MANAGER','DRIVER','CUSTOMER')),
  first_name text,
  last_name text,
  phone text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. PRODUCTS
create table products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name_en text not null,
  name_ne text not null,
  sku text,
  category text check (category in ('JAR_20L','JAR_10L','JAR_5L','CUSTOM')),
  price_b2c integer not null,    -- paisa (NPR × 100)
  price_b2b integer not null,    -- paisa
  deposit_amount integer default 0,
  reorder_level integer default 10,
  is_active boolean default true,
  image_url text,
  created_at timestamptz default now()
);
alter table products enable row level security;
create policy "tenant_isolation" on products
  using (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 4. INVENTORY LEDGER (double-entry style)
create table inventory_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  product_id uuid not null references products(id),
  type text not null
    check (type in ('IN','OUT','ADJUSTMENT','RETURN_EMPTY','TRANSFER')),
  quantity integer not null,
  balance_before integer not null,
  balance_after integer not null,
  reference_id uuid,
  reference_type text,  -- 'order' | 'purchase_order' | 'manual'
  note text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);
alter table inventory_ledger enable row level security;
create policy "tenant_isolation" on inventory_ledger
  using (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 5. CUSTOMERS
create table customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  user_id uuid references users(id),
  type text not null default 'B2C' check (type in ('B2C','B2B')),
  name text not null,
  phone text,
  email text,
  address jsonb,
  credit_limit integer default 0,   -- paisa, B2B only
  credit_terms text,                -- 'net30' | 'net60' | 'net90'
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table customers enable row level security;
create policy "tenant_isolation" on customers
  using (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 6. ORDERS
create table orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_number text not null,
  customer_id uuid not null references customers(id),
  type text not null check (type in ('B2C','B2B')),
  status text not null default 'DRAFT' check (
    status in ('DRAFT','CONFIRMED','ASSIGNED','OUT_FOR_DELIVERY',
               'DELIVERED','FAILED','CANCELLED')
  ),
  assigned_driver_id uuid references users(id),
  scheduled_date date,
  delivery_address jsonb,
  payment_method text
    check (payment_method in ('CASH','ESEWA','KHALTI','CREDIT')),
  payment_status text default 'PENDING'
    check (payment_status in ('PENDING','PARTIAL','PAID')),
  subtotal integer not null default 0,
  vat_amount integer not null default 0,
  total integer not null default 0,
  empties_collected integer default 0,
  delivery_photo_url text,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table orders enable row level security;
create policy "tenant_isolation" on orders
  using (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 7. ORDER ITEMS
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  tenant_id uuid not null references tenants(id),
  product_id uuid not null references products(id),
  quantity integer not null,
  unit_price integer not null,     -- paisa at time of order
  deposit_amount integer default 0,
  subtotal integer not null
);
alter table order_items enable row level security;
create policy "tenant_isolation" on order_items
  using (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 8. INVOICES
create table invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  invoice_number text not null,   -- INV-2081/82-000001
  order_id uuid references orders(id),
  customer_id uuid not null references customers(id),
  status text not null default 'DRAFT'
    check (status in ('DRAFT','SENT','PAID','OVERDUE','CANCELLED')),
  subtotal integer not null,
  vat_rate integer default 1300,  -- basis points: 13.00% = 1300
  vat_amount integer not null,
  total integer not null,
  due_date date,
  paid_at timestamptz,
  pdf_url text,
  bs_date text,                   -- e.g. "२०८१-०३-१५"
  created_at timestamptz default now()
);
alter table invoices enable row level security;
create policy "tenant_isolation" on invoices
  using (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## ════════════════════════════════════════════
## CRITICAL RULES — ALWAYS FOLLOW
## ════════════════════════════════════════════

### RULE 1 — MULTI-TENANCY VIA RLS
```typescript
// ✅ Set tenant context in middleware, then query freely
await supabase.rpc('set_tenant_context', { p_tenant_id: tenantId })
const { data } = await supabase.from('orders').select('*')  // RLS filters automatically

// ❌ Never rely on manual WHERE as the only guard
const { data } = await supabase.from('orders')
  .select('*').eq('tenant_id', tenantId)  // RLS should be primary guard
```

### RULE 2 — MONEY IS INTEGERS (PAISA)
```typescript
// NPR 15.00 = 1500 paisa in database
const price: number = 1500

// Display helper (packages/shared/src/utils/money.ts):
export const formatPaisa = (paisa: number) => `रू ${(paisa / 100).toFixed(2)}`

// ❌ NEVER use floating point for money
```

### RULE 3 — TYPE SAFETY
- Zero `any` types — use `unknown` + type narrowing
- Use generated Supabase types for all DB operations
- All request bodies validated with Zod from packages/shared
- Standard envelope: `{ success: boolean, data: T, meta?, error? }`

### RULE 4 — AppError CLASS
```typescript
throw new AppError('ORDER_NOT_FOUND', 404, { orderId })
// Never return raw Supabase/PostgreSQL errors to client
```

### RULE 5 — BACKGROUND JOBS VIA BULLMQ
- Notifications (email/SMS/WhatsApp) → always BullMQ queue
- Invoice PDF generation → BullMQ job
- Low stock check → BullMQ scheduled (every hour)
- Never make HTTP request wait for any of the above

### RULE 6 — BILINGUAL
- No hardcoded strings in components or API messages
- Product names: name_en + name_ne columns in DB
- UI strings: packages/shared/src/i18n/en.ts + ne.ts

---

## ════════════════════════════════════════════
## FILE STRUCTURE
## ════════════════════════════════════════════

```
packages/api/src/
  modules/
    auth/
    tenant/
    product/
    inventory/
    customer/
    order/
    invoice/
    driver/
    payment/
    notification/
  middleware/
    auth.middleware.ts
    tenant.middleware.ts
    role.middleware.ts
    error.middleware.ts
    rate-limit.middleware.ts
  lib/
    supabase.ts
    redis.ts
    bullmq/
      queues.ts
      workers/
  types/
    supabase.types.ts    ← generated
    express.d.ts         ← extend Request with req.user
  app.ts
  server.ts

packages/shared/src/
  schemas/               ← Zod (used by api + client + mobile)
  types/
    enums.ts             ← OrderStatus, UserRole, PaymentMethod
    api.types.ts         ← Response envelope, pagination
  constants/
    index.ts             ← VAT_RATE, PLAN_LIMITS, NEPAL_PHONE_REGEX
  i18n/
    en.ts
    ne.ts
  utils/
    money.ts             ← formatPaisa, parsePaisa
    date.ts              ← BS/AD conversion (bikram-sambat package)
```

---

## ════════════════════════════════════════════
## ENVIRONMENT VARIABLES (packages/api/.env)
## ════════════════════════════════════════════

```env
NODE_ENV=development
PORT=8080
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # NEVER expose to client
SUPABASE_PROJECT_ID=            # for CLI type generation

# Queue
REDIS_URL=                      # Upstash Redis

# Notifications
RESEND_API_KEY=                 # Email
SPARROW_SMS_TOKEN=              # Nepal SMS (NTC/Ncell)
WATI_API_KEY=                   # WhatsApp
WATI_API_ENDPOINT=

# Payments
ESEWA_MERCHANT_CODE=
ESEWA_SECRET_KEY=
KHALTI_SECRET_KEY=
KHALTI_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

SENTRY_DSN=
```

---

## ════════════════════════════════════════════
## NEPAL-SPECIFIC REQUIREMENTS
## ════════════════════════════════════════════

- Fiscal year: Shrawan 1 → Ashadh end; invoice numbers reset yearly
- Invoice number format: `INV-2081/82-000001`
- VAT: 13% (1300 basis points), only for vat-registered tenants
- BS/AD: store AD in DB, display BS in UI using `bikram-sambat` package
- Phone regex: `/^(97|98)\d{8}$/`
- Payment priority: Cash > eSewa > Khalti > Credit (B2B)

---

## ════════════════════════════════════════════
## PHASE STATUS
## ════════════════════════════════════════════

Phase 0: ✅ Complete      — Monorepo + Supabase scaffold + shared package
Phase 1: ✅ Complete      — Auth + Tenant + Users (backend)
Phase 2: ✅ Complete      — Products + Inventory (backend)
Phase 3: ⬜ Not Started   — Customers + Orders (backend)
Phase 4: ✅ Complete      — Billing + Nepal Payments (backend)
Phase 5: ⬜ Not Started   — Admin Dashboard (Next.js)
Phase 6: ⬜ Not Started   — Customer Portal
Phase 7: ⬜ Not Started   — Driver Mobile App (Expo)

## ════════════════════════════════════════════
## DESIGN SYSTEM LOCK
## ════════════════════════════════════════════

Before building ANY UI component or page, you MUST:
1. Read design-system/panisewa/MASTER.md (this is the source of truth)
2. Check if design-system/panisewa/pages/{page-name}.md exists for page-specific overrides
3. Use ONLY the colors, fonts, spacing, and effects defined there
4. Run the pre-delivery checklist before marking a page done
5. All components must be mobile-responsive (375px minimum)
6. All text must support both English and Nepali via next-intl

### Quick reference — Panisewa Design Tokens
- **Primary:** `#1D4ED8` (blue-700) | **Accent/CTA:** `#EA580C` (orange-600)
- **Background:** `#F1F5F9` (slate-100) | **Surface:** `#FFFFFF`
- **Text:** `#0F172A` (slate-900) | **Muted:** `#475569` (slate-600)
- **Fonts:** Inter (UI) + JetBrains Mono (numbers/IDs) + Noto Sans Devanagari + Mukta (Nepali)
- **Forbidden:** purple/pink/gradients, glassmorphism, decorative animations, Fira Code for Devanagari

---

# Update manually as phases complete (✅ = done)
