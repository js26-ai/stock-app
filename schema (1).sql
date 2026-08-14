-- ============================================================
-- تسيير المخزون — Supabase Schema
-- نفذ هاد الكود كامل ف Supabase SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. جدول products
-- ------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  price numeric(12,2) not null default 0,
  quantity integer not null default 0,
  min_qty integer default 5,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. جدول sales
-- ------------------------------------------------------------
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  qty integer not null,
  unit_price numeric(12,2) not null,
  total numeric(12,2) not null,
  date timestamptz default now()
);

create index if not exists idx_sales_date on sales(date);
create index if not exists idx_sales_product on sales(product_id);

-- ------------------------------------------------------------
-- RLS — مفتوحة حاليا (بلا authentification)
-- ------------------------------------------------------------
alter table products enable row level security;
alter table sales enable row level security;

create policy "public read products" on products for select using (true);
create policy "public insert products" on products for insert with check (true);
create policy "public update products" on products for update using (true);
create policy "public delete products" on products for delete using (true);

create policy "public read sales" on sales for select using (true);
create policy "public insert sales" on sales for insert with check (true);
create policy "public update sales" on sales for update using (true);
create policy "public delete sales" on sales for delete using (true);
