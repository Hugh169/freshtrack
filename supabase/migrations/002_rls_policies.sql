-- FreshTrack Row Level Security Policies
-- Run AFTER 001_initial_schema.sql

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
alter table restaurants      enable row level security;
alter table inventory_items  enable row level security;
alter table stock_movements  enable row level security;
alter table waste_logs       enable row level security;

-- ============================================================
-- RESTAURANTS
-- ============================================================
drop policy if exists "restaurants_select" on restaurants;
create policy "restaurants_select" on restaurants
  for select using (owner_id = auth.uid());

drop policy if exists "restaurants_insert" on restaurants;
create policy "restaurants_insert" on restaurants
  for insert with check (owner_id = auth.uid());

drop policy if exists "restaurants_update" on restaurants;
create policy "restaurants_update" on restaurants
  for update using (owner_id = auth.uid());

drop policy if exists "restaurants_delete" on restaurants;
create policy "restaurants_delete" on restaurants
  for delete using (owner_id = auth.uid());

-- ============================================================
-- INVENTORY ITEMS
-- Helper: user's restaurant IDs
-- ============================================================
drop policy if exists "inventory_items_select" on inventory_items;
create policy "inventory_items_select" on inventory_items
  for select using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

drop policy if exists "inventory_items_insert" on inventory_items;
create policy "inventory_items_insert" on inventory_items
  for insert with check (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

drop policy if exists "inventory_items_update" on inventory_items;
create policy "inventory_items_update" on inventory_items
  for update using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

drop policy if exists "inventory_items_delete" on inventory_items;
create policy "inventory_items_delete" on inventory_items
  for delete using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
drop policy if exists "stock_movements_select" on stock_movements;
create policy "stock_movements_select" on stock_movements
  for select using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

drop policy if exists "stock_movements_insert" on stock_movements;
create policy "stock_movements_insert" on stock_movements
  for insert with check (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
    and created_by = auth.uid()
  );

drop policy if exists "stock_movements_update" on stock_movements;
create policy "stock_movements_update" on stock_movements
  for update using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

-- ============================================================
-- WASTE LOGS
-- ============================================================
drop policy if exists "waste_logs_select" on waste_logs;
create policy "waste_logs_select" on waste_logs
  for select using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

drop policy if exists "waste_logs_insert" on waste_logs;
create policy "waste_logs_insert" on waste_logs
  for insert with check (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
    and created_by = auth.uid()
  );

drop policy if exists "waste_logs_update" on waste_logs;
create policy "waste_logs_update" on waste_logs
  for update using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );

drop policy if exists "waste_logs_delete" on waste_logs;
create policy "waste_logs_delete" on waste_logs
  for delete using (
    restaurant_id in (
      select id from restaurants where owner_id = auth.uid()
    )
  );
