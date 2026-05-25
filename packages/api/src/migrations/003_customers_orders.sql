-- 003_customers_orders.sql

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
  credit_terms text check (credit_terms in ('net30','net60','net90')),
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table customers enable row level security;
create policy "tenant_isolation" on customers
  using (tenant_id = current_setting('app.current_tenant_id')::uuid);

create index customers_tenant_id_idx on customers(tenant_id);
create index customers_phone_idx on customers(tenant_id, phone);
create index customers_name_idx on customers(tenant_id, name);

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
  payment_method text check (payment_method in ('CASH','ESEWA','KHALTI','CREDIT')),
  payment_status text default 'PENDING' check (payment_status in ('PENDING','PARTIAL','PAID')),
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

create unique index orders_number_tenant_idx on orders(tenant_id, order_number);
create index orders_status_idx on orders(tenant_id, status);
create index orders_customer_idx on orders(customer_id);
create index orders_driver_idx on orders(assigned_driver_id);
create index orders_date_idx on orders(tenant_id, scheduled_date);

create trigger set_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- 7. ORDER ITEMS
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  tenant_id uuid not null references tenants(id),
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  unit_price integer not null,     -- paisa at time of order
  deposit_amount integer default 0,
  subtotal integer not null
);

alter table order_items enable row level security;
create policy "tenant_isolation" on order_items
  using (tenant_id = current_setting('app.current_tenant_id')::uuid);

create index order_items_order_idx on order_items(order_id);
create index order_items_product_idx on order_items(product_id);

-- Sequence table for order_number generation
create table order_sequences (
  tenant_id uuid not null references tenants(id),
  date_key text not null,          -- YYYYMMDD
  last_seq integer not null default 0,
  primary key (tenant_id, date_key)
);
