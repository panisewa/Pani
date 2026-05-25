-- Migration 002: Products + Inventory Ledger
-- Run in Supabase SQL Editor after 001_auth_tenant.sql

-- ─── 1. PRODUCTS ────────────────────────────────────────────────────────────
create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id),
  name_en        text not null,
  name_ne        text not null,
  sku            text,
  category       text check (category in ('JAR_20L','JAR_10L','JAR_5L','CUSTOM')),
  price_b2c      integer not null check (price_b2c >= 0),  -- paisa
  price_b2b      integer not null check (price_b2b >= 0),  -- paisa
  deposit_amount integer not null default 0 check (deposit_amount >= 0),
  reorder_level  integer not null default 10 check (reorder_level >= 0),
  is_active      boolean not null default true,
  image_url      text,
  created_at     timestamptz not null default now()
);

alter table products enable row level security;

create policy "tenant_isolation" on products
  using (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

create unique index if not exists products_tenant_sku_idx
  on products(tenant_id, sku) where sku is not null;
create index if not exists products_tenant_active_idx
  on products(tenant_id, is_active);
create index if not exists products_category_idx on products(category);

-- ─── 2. INVENTORY LEDGER ────────────────────────────────────────────────────
create table if not exists inventory_ledger (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id),
  product_id     uuid not null references products(id),
  type           text not null
                   check (type in ('IN','OUT','ADJUSTMENT','RETURN_EMPTY','TRANSFER')),
  quantity       integer not null,           -- positive = in, negative = out
  balance_before integer not null,
  balance_after  integer not null,
  reference_id   uuid,
  reference_type text                        -- 'order' | 'purchase_order' | 'manual'
                   check (reference_type in ('order','purchase_order','manual')),
  note           text,
  created_by     uuid references users(id),
  created_at     timestamptz not null default now()
);

alter table inventory_ledger enable row level security;

create policy "tenant_isolation" on inventory_ledger
  using (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

create index if not exists ledger_tenant_product_idx
  on inventory_ledger(tenant_id, product_id);
create index if not exists ledger_created_at_idx
  on inventory_ledger(created_at desc);
create index if not exists ledger_type_idx on inventory_ledger(type);

-- ─── 3. PRODUCT IMAGES STORAGE BUCKET ──────────────────────────────────────
-- Run this in Supabase Dashboard > Storage (cannot be done via SQL):
-- 1. Create bucket 'product-images' (public: false)
-- 2. Add policy: authenticated users in same tenant can upload/read their images
--
-- Or via SQL with pg_storage extension (if enabled):
-- insert into storage.buckets (id, name, public)
--   values ('product-images', 'product-images', false)
--   on conflict do nothing;
