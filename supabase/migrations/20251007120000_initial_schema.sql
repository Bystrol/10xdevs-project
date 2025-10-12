-- migration: initial_schema
-- purpose: create core schema for wastetrack dashboard
-- affected tables: waste_types, locations, batches, waste_data, audit_logs
-- considerations: includes rls policies, indexes, and initial data seeding

-- =============================================================================
-- 1. create enum types
-- =============================================================================

-- batch status enum for tracking active vs deleted batches
create type batch_status as enum ('active', 'deleted');

-- =============================================================================
-- 2. create tables
-- =============================================================================

-- waste_types: lookup table for standardized waste categories
-- pre-populated with fixed categories: plastic, bio, glass, paper, mixed
create table waste_types (
  id serial primary key,
  name text unique not null,
  created_at timestamp with time zone default now()
);

comment on table waste_types is 'lookup table for standardized waste type categories';
comment on column waste_types.name is 'standardized waste type name (lowercase for consistency)';

-- locations: lookup table for waste collection locations
-- dynamically populated during csv imports
create table locations (
  id serial primary key,
  name text unique not null,
  created_at timestamp with time zone default now()
);

comment on table locations is 'lookup table for waste collection locations, populated dynamically';

-- batches: tracks csv import batches per user
-- each batch represents one csv import operation
create table batches (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  status batch_status default 'active'::batch_status not null,
  created_at timestamp with time zone default now() not null
);

comment on table batches is 'tracks csv import batches, enabling rollback functionality';
comment on column batches.user_id is 'references supabase auth.users for multi-tenant isolation';
comment on column batches.status is 'active batches are visible, deleted batches are soft-deleted';

-- waste_data: core table storing waste collection records
-- each record represents waste collected at a location on a specific date
create table waste_data (
  id serial primary key,
  batch_id integer not null references batches(id) on delete cascade,
  waste_type_id integer not null references waste_types(id) on delete restrict,
  location_id integer not null references locations(id) on delete restrict,
  date date not null check (date <= current_date),
  quantity integer default 1 not null check (quantity > 0),
  created_at timestamp with time zone default now()
);

comment on table waste_data is 'core waste collection data, linked to batches for rollback capability';
comment on column waste_data.batch_id is 'cascade delete ensures batch rollback removes all related data';
comment on column waste_data.waste_type_id is 'restrict delete protects referential integrity';
comment on column waste_data.location_id is 'restrict delete protects referential integrity';
comment on column waste_data.date is 'collection date, constrained to past/present only';
comment on column waste_data.quantity is 'waste quantity, must be positive integer';

-- audit_logs: optional table for tracking user actions (batch imports/deletes)
-- useful for compliance and debugging
create table audit_logs (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  batch_id integer references batches(id) on delete set null,
  timestamp timestamp with time zone default now() not null
);

comment on table audit_logs is 'audit trail for user actions (batch imports, deletions)';
comment on column audit_logs.action is 'action type: batch_import, batch_delete, etc.';

-- =============================================================================
-- 3. create indexes for query optimization
-- =============================================================================

-- batches indexes
create index idx_batches_user_id on batches(user_id);
create index idx_batches_user_created on batches(user_id, created_at desc);

comment on index idx_batches_user_id is 'fast lookup of user batches';
comment on index idx_batches_user_created is 'optimizes chronological batch listing per user';

-- waste_data indexes
create unique index idx_waste_data_unique_entry 
  on waste_data(batch_id, waste_type_id, location_id, date);

create index idx_waste_data_batch_id on waste_data(batch_id);
create index idx_waste_data_date on waste_data(date);
create index idx_waste_data_aggregation on waste_data(date, waste_type_id, location_id);

comment on index idx_waste_data_unique_entry is 'prevents duplicate entries within same batch';
comment on index idx_waste_data_batch_id is 'fast batch data retrieval';
comment on index idx_waste_data_date is 'optimizes date range queries for charts';
comment on index idx_waste_data_aggregation is 'composite index for dashboard aggregations';

-- audit_logs indexes
create index idx_audit_logs_user_id on audit_logs(user_id);
create index idx_audit_logs_timestamp on audit_logs(timestamp desc);

comment on index idx_audit_logs_user_id is 'fast user audit history retrieval';
comment on index idx_audit_logs_timestamp is 'chronological audit log ordering';

-- =============================================================================
-- 4. enable row level security
-- =============================================================================

-- enable rls on all user-data tables
alter table batches enable row level security;
alter table waste_data enable row level security;
alter table audit_logs enable row level security;
alter table waste_types enable row level security;

-- locations are public lookup tables (no rls needed)
-- they can be read by all authenticated users but only modified via migrations/admin

-- =============================================================================
-- 5. create rls policies
-- =============================================================================

-- waste_types policies: authenticated users can read waste types (lookup table)
create policy "authenticated users can select waste types"
  on waste_types for select
  using (auth.role() = 'authenticated');

comment on policy "authenticated users can select waste types" on waste_types is
  'allows authenticated users to read waste type lookup data';

-- batches policies: users can only access their own batches
create policy "users can select own batches"
  on batches for select
  using (auth.uid() = user_id);

create policy "users can insert own batches"
  on batches for insert
  with check (auth.uid() = user_id);

create policy "users can update own batches"
  on batches for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own batches"
  on batches for delete
  using (auth.uid() = user_id);

comment on policy "users can select own batches" on batches is 
  'isolates batch visibility to owning user only';
comment on policy "users can insert own batches" on batches is 
  'ensures users can only create batches for themselves';
comment on policy "users can update own batches" on batches is 
  'allows users to update batch status (soft delete)';
comment on policy "users can delete own batches" on batches is 
  'enables hard delete of batches (cascade deletes waste_data)';

-- waste_data policies: users can only access waste data through their own batches
create policy "users can select own waste data"
  on waste_data for select
  using (
    exists (
      select 1 from batches 
      where batches.id = waste_data.batch_id 
      and auth.uid() = batches.user_id
    )
  );

create policy "users can insert own waste data"
  on waste_data for insert
  with check (
    exists (
      select 1 from batches 
      where batches.id = waste_data.batch_id 
      and auth.uid() = batches.user_id
    )
  );

create policy "users can update own waste data"
  on waste_data for update
  using (
    exists (
      select 1 from batches 
      where batches.id = waste_data.batch_id 
      and auth.uid() = batches.user_id
    )
  )
  with check (
    exists (
      select 1 from batches 
      where batches.id = waste_data.batch_id 
      and auth.uid() = batches.user_id
    )
  );

create policy "users can delete own waste data"
  on waste_data for delete
  using (
    exists (
      select 1 from batches 
      where batches.id = waste_data.batch_id 
      and auth.uid() = batches.user_id
    )
  );

comment on policy "users can select own waste data" on waste_data is 
  'enforces data isolation via batch ownership check';
comment on policy "users can insert own waste data" on waste_data is 
  'prevents inserting data into other users batches';
comment on policy "users can update own waste data" on waste_data is 
  'allows updates only to data in owned batches';
comment on policy "users can delete own waste data" on waste_data is 
  'restricts deletion to data in owned batches';

-- audit_logs policies: users can only access their own audit logs
create policy "users can select own audit logs"
  on audit_logs for select
  using (auth.uid() = user_id);

create policy "users can insert own audit logs"
  on audit_logs for insert
  with check (auth.uid() = user_id);

comment on policy "users can select own audit logs" on audit_logs is 
  'users can view their own audit history';
comment on policy "users can insert own audit logs" on audit_logs is 
  'allows audit log creation for user actions';

-- =============================================================================
-- 6. create database functions and triggers
-- =============================================================================

-- function to automatically log batch operations
create or replace function log_batch_operation()
returns trigger as $$
begin
  -- log batch creation
  if (tg_op = 'INSERT') then
    insert into audit_logs (user_id, action, batch_id)
    values (new.user_id, 'batch_import', new.id);
    return new;
  
  -- log batch soft deletion (status change to 'deleted')
  elsif (tg_op = 'UPDATE' and old.status != new.status and new.status = 'deleted') then
    insert into audit_logs (user_id, action, batch_id)
    values (new.user_id, 'batch_delete', new.id);
    return new;
  
  -- log batch hard deletion
  elsif (tg_op = 'DELETE') then
    insert into audit_logs (user_id, action, batch_id)
    values (old.user_id, 'batch_hard_delete', old.id);
    return old;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

comment on function log_batch_operation() is 
  'automatically creates audit log entries for batch operations';

-- trigger for batch audit logging
create trigger trigger_log_batch_operation
  after insert or update or delete on batches
  for each row
  execute function log_batch_operation();

comment on trigger trigger_log_batch_operation on batches is 
  'captures batch lifecycle events in audit_logs';

-- =============================================================================
-- 7. seed initial data
-- =============================================================================

-- pre-populate waste_types with standardized categories
insert into waste_types (name) values
  ('plastic'),
  ('bio'),
  ('glass'),
  ('paper'),
  ('mixed');

comment on table waste_types is 
  'pre-populated with 5 standard waste types: plastic, bio, glass, paper, mixed';

-- =============================================================================
-- 8. create helpful views for dashboard queries
-- =============================================================================

-- view for monthly waste totals aggregation
create or replace view monthly_waste_totals as
select 
  extract(year from date)::integer as year,
  extract(month from date)::integer as month,
  wt.name as waste_type,
  l.name as location,
  sum(wd.quantity) as total_quantity,
  count(*) as record_count
from waste_data wd
join waste_types wt on wd.waste_type_id = wt.id
join locations l on wd.location_id = l.id
join batches b on wd.batch_id = b.id
where b.status = 'active'
group by 
  extract(year from date),
  extract(month from date),
  wt.name,
  l.name;

comment on view monthly_waste_totals is 
  'pre-aggregated monthly totals for dashboard performance, filters active batches only';

-- view for active batch summary
create or replace view active_batches_summary as
select 
  b.id as batch_id,
  b.user_id,
  b.filename,
  b.created_at,
  count(wd.id) as record_count,
  min(wd.date) as earliest_date,
  max(wd.date) as latest_date
from batches b
left join waste_data wd on b.id = wd.batch_id
where b.status = 'active'
group by b.id, b.user_id, b.filename, b.created_at;

comment on view active_batches_summary is 
  'summary of active batches with record counts and date ranges';

-- =============================================================================
-- migration complete
-- =============================================================================

