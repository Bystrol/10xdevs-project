-- migration: enable_rls_policies
-- purpose: re-enable row level security on all tables after previous migration disabled them
-- affected tables: waste_types, locations, batches, waste_data, audit_logs
-- note: this migration enables rls but does not create specific policies - policies should be created separately based on security requirements

-- =============================================================================
-- enable row level security for waste_types table
-- =============================================================================

alter table public.waste_types enable row level security;

-- =============================================================================
-- enable row level security for locations table
-- =============================================================================

alter table public.locations enable row level security;

-- =============================================================================
-- enable row level security for batches table
-- =============================================================================

alter table public.batches enable row level security;

-- =============================================================================
-- enable row level security for waste_data table
-- =============================================================================

alter table public.waste_data enable row level security;

-- =============================================================================
-- enable row level security for audit_logs table
-- =============================================================================

alter table public.audit_logs enable row level security;

-- =============================================================================
-- migration complete
-- note: rls policies should be created in subsequent migrations based on specific security requirements
-- =============================================================================
