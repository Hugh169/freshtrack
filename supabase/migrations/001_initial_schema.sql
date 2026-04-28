-- FreshTrack Initial Schema
-- Run this in the Supabase SQL Editor or via `supabase db push`

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- RESTAURANTS
-- ============================================================
create table if not exists restaurants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists restaurants_owner_id_idx on restaurants(owner_id);

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================
create table if not exists inventory_items (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  name              text not null,
  category          text not null,
  unit              text not null,
  current_quantity  numeric(10,3) not null default 0,
  reorder_threshold numeric(10,3) not null default 0,
  cost_per_unit     numeric(10,2) not null default 0,
  expiry_date       date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists inventory_items_restaurant_id_idx on inventory_items(restaurant_id);
create index if not exists inventory_items_expiry_date_idx on inventory_items(expiry_date);

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
create table if not exists stock_movements (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  item_id         uuid not null references inventory_items(id) on delete cascade,
  movement_type   text not null check (movement_type in ('received', 'used', 'wasted', 'adjusted')),
  quantity        numeric(10,3) not null,
  notes           text,
  recorded_at     timestamptz not null default now(),
  created_by      uuid not null references auth.users(id)
);

create index if not exists stock_movements_restaurant_id_idx on stock_movements(restaurant_id);
create index if not exists stock_movements_item_id_idx on stock_movements(item_id);
create index if not exists stock_movements_recorded_at_idx on stock_movements(recorded_at desc);

-- ============================================================
-- WASTE LOGS
-- ============================================================
create table if not exists waste_logs (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  item_id         uuid not null references inventory_items(id) on delete cascade,
  quantity        numeric(10,3) not null,
  reason          text not null check (reason in ('expired', 'spoiled', 'overcooked', 'dropped', 'over_prepared', 'other')),
  estimated_cost  numeric(10,2) not null default 0,
  logged_at       timestamptz not null default now(),
  created_by      uuid not null references auth.users(id)
);

create index if not exists waste_logs_restaurant_id_idx on waste_logs(restaurant_id);
create index if not exists waste_logs_item_id_idx on waste_logs(item_id);
create index if not exists waste_logs_logged_at_idx on waste_logs(logged_at desc);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_inventory_items_updated_at on inventory_items;
create trigger set_inventory_items_updated_at
  before update on inventory_items
  for each row execute function update_updated_at_column();
