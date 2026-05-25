-- Migration 001: Auth + Tenant + Users
-- Run in Supabase SQL Editor

-- ─── 1. TENANTS ─────────────────────────────────────────────────────────────
create table if not exists tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  logo_url   text,
  status     text not null default 'trial'
               check (status in ('trial','active','suspended')),
  plan       text not null default 'starter'
               check (plan in ('starter','growth','enterprise')),
  settings   jsonb not null default '{}',
  -- settings keys: vatRegistered (bool), panNumber (text), fiscalYear (text),
  --   defaultLanguage ('en'|'ne'), timezone (text), address (jsonb), phone (text)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at current automatically
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at
  before update on tenants
  for each row execute function set_updated_at();

-- ─── 2. USERS (extends auth.users) ─────────────────────────────────────────
create table if not exists users (
  id         uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid references tenants(id),
  role       text not null
               check (role in ('SUPER_ADMIN','TENANT_ADMIN','MANAGER','DRIVER','CUSTOMER')),
  first_name text,
  last_name  text,
  phone      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS on users: each user only sees their own tenant's users
alter table users enable row level security;

create policy "tenant_isolation" on users
  using (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    or role = 'SUPER_ADMIN'
  );

-- ─── 3. SET_TENANT_CONTEXT helper ───────────────────────────────────────────
create or replace function set_tenant_context(p_tenant_id uuid)
returns void language plpgsql as $$
begin
  perform set_config('app.current_tenant_id', p_tenant_id::text, true);
end;
$$;

-- ─── 4. INDEXES ─────────────────────────────────────────────────────────────
create index if not exists users_tenant_id_idx on users(tenant_id);
create index if not exists users_role_idx on users(role);
create index if not exists tenants_slug_idx on tenants(slug);
create index if not exists tenants_status_idx on tenants(status);
