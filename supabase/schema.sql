-- Audrey Care shop — database schema.
-- Run this once in a NEW Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- Then run seed.sql to load the sample products. Safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Catalogue (public, read-only for the website)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          text primary key,
  kind        text not null,                 -- shampoo, conditioner, shower-gel, body-lotion, bubble-bath, hand-wash, air-freshener
  fragrance   text not null,                 -- strawberry, lavender, apple, ocean-breeze
  name        text not null,
  badge       text,                          -- e.g. 'New', 'Bestseller'
  tagline     text,
  description text,
  how_to_use  text,
  images      text[] not null default '{}',  -- full image URLs; empty = generated artwork
  sort        integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.variants (
  id             text primary key,
  product_id     text not null references public.products(id) on delete cascade,
  label          text not null,              -- e.g. '250 ml'
  price_lkr      integer not null check (price_lkr >= 0),
  compare_at_lkr integer check (compare_at_lkr is null or compare_at_lkr >= 0),
  stock          integer,                    -- null = not tracked; 0 = out of stock
  sort           integer not null default 0,
  active         boolean not null default true
);
create index if not exists variants_product_idx on public.variants(product_id);

-- Public shop settings: shipping_flat_lkr, free_shipping_over_lkr, payments, bank.
create table if not exists public.settings (
  key   text primary key,
  value jsonb not null
);

-- ---------------------------------------------------------------------------
-- Orders (private: only the Edge Functions and you can touch these)
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_no_seq start 1001;

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        text not null unique default ('AC-' || nextval('public.order_no_seq')),
  access_token    text not null default encode(gen_random_bytes(12), 'hex'),
  status          text not null default 'new'
                    check (status in ('new','confirmed','packed','dispatched','delivered','cancelled')),
  payment_method  text not null check (payment_method in ('cod','bank_transfer','card')),
  payment_status  text not null default 'pending'
                    check (payment_status in ('pending','awaiting_slip','slip_uploaded','paid','failed','refunded')),
  customer_name   text not null,
  phone           text not null,             -- normalised, e.g. 0771234567
  email           text,
  address         text not null,
  city            text not null,
  district        text not null,
  postal_code     text,
  notes           text,
  subtotal_lkr    integer not null,
  shipping_lkr    integer not null,
  total_lkr       integer not null,
  payment_slip_path text,                    -- file in the private 'payment-slips' bucket
  payhere_payment_id text,
  courier         text,                      -- fill in when you dispatch
  tracking_no     text,                      -- shown to the customer on their order page
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_phone_idx on public.orders(phone);

create table if not exists public.order_items (
  id             bigint generated always as identity primary key,
  order_id       uuid not null references public.orders(id) on delete cascade,
  variant_id     text,
  name           text not null,
  variant_label  text not null,
  unit_price_lkr integer not null,
  qty            integer not null check (qty > 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- Bulk enquiries, contact messages and newsletter sign-ups.
create table if not exists public.form_submissions (
  id         bigint generated always as identity primary key,
  type       text not null check (type in ('bulk','contact','newsletter')),
  data       jsonb not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row level security: the website (anon key) may only read the catalogue.
-- ---------------------------------------------------------------------------
alter table public.products          enable row level security;
alter table public.variants          enable row level security;
alter table public.settings          enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.form_submissions  enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated using (active);
drop policy if exists "Public can read active variants" on public.variants;
create policy "Public can read active variants" on public.variants for select to anon, authenticated using (active);
drop policy if exists "Public can read settings" on public.settings;
create policy "Public can read settings" on public.settings for select to anon, authenticated using (true);
-- orders, order_items and form_submissions: no policies = no access for the website.

-- ---------------------------------------------------------------------------
-- Functions the order page calls
-- ---------------------------------------------------------------------------

-- Look up an order. p_secret is either the private link token (full details) or the
-- customer's mobile number (status, items and totals only — no address).
create or replace function public.get_order(p_order_no text, p_secret text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  is_full boolean := false;
  digits text;
  items jsonb;
begin
  select * into o from public.orders where order_no = upper(trim(p_order_no));
  if not found then return null; end if;

  if p_secret is not null and o.access_token = p_secret then
    is_full := true;
  else
    digits := regexp_replace(coalesce(p_secret, ''), '\D', '', 'g');
    if length(digits) <> 10 or digits <> regexp_replace(o.phone, '\D', '', 'g') then return null; end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'name', i.name, 'variant_label', i.variant_label, 'qty', i.qty, 'unit_price_lkr', i.unit_price_lkr) order by i.id), '[]'::jsonb)
    into items from public.order_items i where i.order_id = o.id;

  return jsonb_build_object(
    'order_no', o.order_no, 'status', o.status, 'payment_method', o.payment_method, 'payment_status', o.payment_status,
    'subtotal_lkr', o.subtotal_lkr, 'shipping_lkr', o.shipping_lkr, 'total_lkr', o.total_lkr,
    'created_at', o.created_at, 'courier', o.courier, 'tracking_no', o.tracking_no, 'items', items,
    'full', is_full,
    'customer_name', case when is_full then o.customer_name end,
    'phone',         case when is_full then o.phone end,
    'address',       case when is_full then o.address || ', ' || o.city || ', ' || o.district end
  );
end $$;

-- Record an uploaded bank-transfer slip against the order (needs the private token).
create or replace function public.attach_payment_slip(p_order_no text, p_token text, p_path text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.orders
     set payment_slip_path = p_path,
         payment_status = case when payment_status in ('pending','awaiting_slip','slip_uploaded') then 'slip_uploaded' else payment_status end,
         updated_at = now()
   where order_no = upper(trim(p_order_no))
     and access_token = p_token
     and payment_method = 'bank_transfer'
     and p_path like order_no || '/%';
  return found;
end $$;

-- Used by the place-order Edge Function only.
create or replace function public.decrement_stock(p_variant text, p_qty integer)
returns void
language sql security definer set search_path = public as $$
  update public.variants set stock = greatest(stock - p_qty, 0) where id = p_variant and stock is not null;
$$;

revoke all on function public.get_order(text, text) from public;
revoke all on function public.attach_payment_slip(text, text, text) from public;
revoke all on function public.decrement_stock(text, integer) from public;
grant execute on function public.get_order(text, text) to anon, authenticated;
grant execute on function public.attach_payment_slip(text, text, text) to anon, authenticated;
grant execute on function public.decrement_stock(text, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Private bucket for bank-transfer slips: the website can upload but never read.
-- You view slips in Dashboard → Storage → payment-slips.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-slips', 'payment-slips', false, 5242880,
        array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do nothing;

drop policy if exists "Anyone can upload payment slips" on storage.objects;
create policy "Anyone can upload payment slips" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'payment-slips');


-- ---------------------------------------------------------------------------
-- Admin dashboard (admin.html): who may edit, plus editable site content
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  id         uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Admins can see themselves" on public.admins;
create policy "Admins can see themselves" on public.admins for select to authenticated using (id = auth.uid());

-- Texts, logo, photos and contact details shown on the website: one row per editable item.
create table if not exists public.site_content (
  key        text primary key,          -- e.g. 'hero1.title', 'img.banner', 'contact.phone'
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "Admins write site content" on public.site_content;
create policy "Admins write site content" on public.site_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A private note you can keep on each order (never shown to the customer).
alter table public.orders add column if not exists admin_note text;

-- Admins can manage everything the website only reads (products, prices, settings) and see all orders.
do $$
declare t text;
begin
  foreach t in array array['products','variants','settings','orders','order_items','form_submissions'] loop
    execute format('drop policy if exists "Admins manage %1$s" on public.%1$I', t);
    execute format('create policy "Admins manage %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Public bucket for logo, site photos and product photos (only admins can upload).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

drop policy if exists "Admins upload site images" on storage.objects;
create policy "Admins upload site images" on storage.objects for insert to authenticated with check (bucket_id = 'site-images' and public.is_admin());
drop policy if exists "Admins update site images" on storage.objects;
create policy "Admins update site images" on storage.objects for update to authenticated using (bucket_id = 'site-images' and public.is_admin());
drop policy if exists "Admins delete site images" on storage.objects;
create policy "Admins delete site images" on storage.objects for delete to authenticated using (bucket_id = 'site-images' and public.is_admin());
-- Admins can open bank-transfer slips.
drop policy if exists "Admins read payment slips" on storage.objects;
create policy "Admins read payment slips" on storage.objects for select to authenticated using (bucket_id = 'payment-slips' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Default settings (edit any time in Dashboard → Table editor → settings)
-- ---------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('shipping_flat_lkr',      '450'),
  ('free_shipping_over_lkr', '10000'),
  ('payments',               '{"cod": true, "bank": true, "card": true}'),
  ('bank',                   '{"bank": "", "account_name": "", "account_no": "", "branch": ""}')
on conflict (key) do nothing;
