-- migration: create_import_batch_function
-- purpose: create RPC function for transactional CSV batch import
-- affected tables: batches, waste_data, audit_logs
-- considerations: atomic transaction ensuring data consistency

-- =============================================================================
-- 1. create RPC function for batch import
-- =============================================================================

-- Function to import batch data transactionally
-- Parameters:
--   p_user_id: UUID of the authenticated user
--   p_filename: Original filename of the uploaded CSV
--   p_waste_data: Array of waste data records with date, waste_type, location, quantity
-- Returns: JSON object with batch_id, filename, created_at, and record_count
create or replace function import_batch_data(
  p_user_id uuid,
  p_filename text,
  p_waste_data jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_batch_id integer;
  v_batch_created_at timestamp with time zone;
  v_record_count integer;
  v_waste_data_record record;
  v_waste_type_id integer;
  v_location_id integer;
begin
  -- Start transaction
  begin
    -- Insert new batch record
    insert into batches (user_id, filename, status)
    values (p_user_id, p_filename, 'active'::batch_status)
    returning id, created_at into v_batch_id, v_batch_created_at;

    -- Initialize record count
    v_record_count := 0;

    -- Process each waste data record
    for v_waste_data_record in
      select
        (value->>'date')::date as date,
        trim(lower(value->>'waste_type')) as waste_type,
        trim(lower(value->>'location')) as location,
        (value->>'quantity')::integer as quantity
      from jsonb_array_elements(p_waste_data) as value
    loop
      -- Get waste type ID
      select id into v_waste_type_id
      from waste_types
      where lower(name) = v_waste_data_record.waste_type;

      if v_waste_type_id is null then
        raise exception 'Unknown waste type: %', v_waste_data_record.waste_type;
      end if;

      -- Get or create location ID
      select id into v_location_id
      from locations
      where lower(name) = v_waste_data_record.location;

      if v_location_id is null then
        -- Insert new location if it doesn't exist
        insert into locations (name)
        values (v_waste_data_record.location)
        returning id into v_location_id;
      end if;

      -- Insert waste data record
      insert into waste_data (batch_id, waste_type_id, location_id, date, quantity)
      values (v_batch_id, v_waste_type_id, v_location_id, v_waste_data_record.date, v_waste_data_record.quantity);

      -- Increment record count
      v_record_count := v_record_count + 1;
    end loop;

    -- Return success result
    return jsonb_build_object(
      'batch_id', v_batch_id,
      'filename', p_filename,
      'created_at', v_batch_created_at,
      'record_count', v_record_count
    );

  exception
    when others then
      -- Transaction will be rolled back automatically
      raise exception 'Batch import failed: %', sqlerrm;
  end;
end;
$$;

comment on function import_batch_data(uuid, text, jsonb) is
  'Transactionally imports CSV batch data, creating batch record and associated waste data records';

-- =============================================================================
-- 2. create index for performance optimization
-- =============================================================================

-- Add index on locations name for faster lookups during import
create index if not exists idx_locations_name_lower on locations(lower(name));

comment on index idx_locations_name_lower is
  'optimizes location lookups during batch import by waste_type and location name';

-- =============================================================================
-- migration complete
-- =============================================================================
