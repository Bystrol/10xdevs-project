-- migration: create_waste_data_summary_function
-- purpose: create RPC function for waste data aggregation and add performance indexes
-- affected tables: waste_data, batches, waste_types, locations
-- considerations: optimized for dashboard aggregation queries with proper indexing

-- =============================================================================
-- 1. add performance indexes for waste data summary queries
-- =============================================================================

-- Add indexes on foreign keys for faster joins
create index if not exists idx_waste_data_waste_type_id on waste_data(waste_type_id);
create index if not exists idx_waste_data_location_id on waste_data(location_id);

comment on index idx_waste_data_waste_type_id is
  'optimizes joins with waste_types table during aggregations';
comment on index idx_waste_data_location_id is
  'optimizes joins with locations table during aggregations';

-- Add composite index for month-based aggregations
create index if not exists idx_waste_data_month_aggregation
  on waste_data(extract(year from date), extract(month from date), waste_type_id, location_id);

comment on index idx_waste_data_month_aggregation is
  'composite index for monthly aggregations by waste type and location';

-- =============================================================================
-- 2. create RPC function for waste data summary aggregation
-- =============================================================================

-- Function to get aggregated waste data summary for dashboard
-- Parameters:
--   p_user_id: UUID of the authenticated user (for RLS filtering)
--   p_group_by: Grouping dimension ('month', 'type', 'location')
--   p_start_date: Optional start date filter (YYYY-MM-DD)
--   p_end_date: Optional end date filter (YYYY-MM-DD)
--   p_waste_type_ids: Optional array of waste type IDs to filter by
--   p_location_ids: Optional array of location IDs to filter by
-- Returns: JSON array of aggregated summary items
create or replace function get_waste_summary(
  p_user_id uuid,
  p_group_by text,
  p_start_date date default null,
  p_end_date date default null,
  p_waste_type_ids integer[] default null,
  p_location_ids integer[] default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb;
  v_query text;
begin
  -- Validate group_by parameter
  if p_group_by not in ('month', 'type', 'location') then
    raise exception 'Invalid group_by parameter. Must be one of: month, type, location';
  end if;

  -- Build the base query with common filters
  v_query := '
    select jsonb_agg(
      jsonb_build_object(''label'', grouped_data.label, ''value'', grouped_data.value)
    )
    from (
      select
        case
          when $1 = ''month'' then
            to_char(date_trunc(''month'', wd.date), ''YYYY-MM'')
          when $1 = ''type'' then
            wt.name
          when $1 = ''location'' then
            l.name
        end as label,
        sum(wd.quantity) as value
      from waste_data wd
      join batches b on wd.batch_id = b.id
      join waste_types wt on wd.waste_type_id = wt.id
      join locations l on wd.location_id = l.id
      where b.status = ''active''
        and b.user_id = $2';

  -- Add date filters if provided
  if p_start_date is not null then
    v_query := v_query || ' and wd.date >= $3';
  end if;

  if p_end_date is not null then
    v_query := v_query || ' and wd.date <= $4';
  end if;

  -- Add waste type filter if provided
  if p_waste_type_ids is not null and array_length(p_waste_type_ids, 1) > 0 then
    v_query := v_query || ' and wd.waste_type_id = any($5)';
  end if;

  -- Add location filter if provided
  if p_location_ids is not null and array_length(p_location_ids, 1) > 0 then
    v_query := v_query || ' and wd.location_id = any($6)';
  end if;

  -- Close the inner query and add grouping
  v_query := v_query || '
      group by
        case
          when $1 = ''month'' then
            to_char(date_trunc(''month'', wd.date), ''YYYY-MM'')
          when $1 = ''type'' then
            wt.name
          when $1 = ''location'' then
            l.name
        end';

  -- Add ordering based on group_by type
  if p_group_by = 'month' then
    v_query := v_query || '
      order by min(wd.date)';
  else
    v_query := v_query || '
      order by sum(wd.quantity) desc';
  end if;

  -- Close the subquery
  v_query := v_query || '
    ) as grouped_data';

  -- Execute the dynamic query and return results
  execute v_query
  into v_result
  using p_group_by, p_user_id, p_start_date, p_end_date, p_waste_type_ids, p_location_ids;

  -- Return as JSON array
  return v_result;

exception
  when others then
    raise exception 'Failed to get waste data summary: %', sqlerrm;
end;
$$;

comment on function get_waste_summary(uuid, text, date, date, integer[], integer[]) is
  'Aggregates waste data for dashboard visualizations with flexible grouping and filtering';

-- =============================================================================
-- migration complete
-- =============================================================================
