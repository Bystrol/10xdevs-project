-- migration: disable_rls_policies
-- purpose: disable all rls policies created in initial_schema
-- affected tables: waste_types, batches, waste_data, audit_logs

-- =============================================================================
-- disable policies for waste_types table
-- =============================================================================

alter table public.waste_types disable row level security;

-- =============================================================================
-- disable policies for batches table
-- =============================================================================

alter table public.batches disable row level security;

-- =============================================================================
-- disable policies for waste_data table
-- =============================================================================

alter table public.waste_data disable row level security;

-- =============================================================================
-- disable policies for audit_logs table
-- =============================================================================

alter table public.audit_logs disable row level security;

-- =============================================================================
-- migration complete
-- =============================================================================
