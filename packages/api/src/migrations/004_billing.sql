-- 004_billing.sql

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
  payment_method text check (payment_method in ('CASH','ESEWA','KHALTI','CREDIT')),
  pdf_url text,
  bs_date text,                   -- e.g. "२०८१-०३-१५" (Devanagari BS date)
  created_at timestamptz default now()
);

alter table invoices enable row level security;
create policy "tenant_isolation" on invoices
  using (tenant_id = current_setting('app.current_tenant_id')::uuid);

create unique index invoices_number_tenant_idx on invoices(tenant_id, invoice_number);
create index invoices_status_idx on invoices(tenant_id, status);
create index invoices_customer_idx on invoices(customer_id);
create index invoices_order_idx on invoices(order_id);
create index invoices_due_date_idx on invoices(tenant_id, due_date);

-- Sequence table for invoice_number generation (resets each fiscal year)
create table invoice_sequences (
  tenant_id uuid not null references tenants(id),
  fiscal_year_key text not null,  -- e.g. "2081/82"
  last_seq integer not null default 0,
  primary key (tenant_id, fiscal_year_key)
);

-- Atomic sequence increment function for invoices
create or replace function increment_invoice_sequence(
  p_tenant_id uuid,
  p_fiscal_year_key text
) returns integer language plpgsql as $$
declare
  v_seq integer;
begin
  insert into invoice_sequences (tenant_id, fiscal_year_key, last_seq)
  values (p_tenant_id, p_fiscal_year_key, 1)
  on conflict (tenant_id, fiscal_year_key)
  do update set last_seq = invoice_sequences.last_seq + 1
  returning last_seq into v_seq;
  return v_seq;
end;
$$;

-- Atomic sequence increment function for orders (referenced in order.service.ts)
create or replace function increment_order_sequence(
  p_tenant_id uuid,
  p_date_key text
) returns integer language plpgsql as $$
declare
  v_seq integer;
begin
  insert into order_sequences (tenant_id, date_key, last_seq)
  values (p_tenant_id, p_date_key, 1)
  on conflict (tenant_id, date_key)
  do update set last_seq = order_sequences.last_seq + 1
  returning last_seq into v_seq;
  return v_seq;
end;
$$;

-- Note: Create Supabase Storage bucket "invoice-pdfs" (public: false) in Dashboard
