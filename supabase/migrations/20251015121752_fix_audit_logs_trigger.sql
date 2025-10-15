-- migration: fix_audit_logs_trigger
-- purpose: fix the audit logs trigger to handle hard deletes properly by adding metadata field
-- affected tables: audit_logs
-- considerations: adds metadata column and updates trigger function to avoid foreign key constraint violations

-- =============================================================================
-- 1. add metadata column to audit_logs
-- =============================================================================

alter table audit_logs add column metadata jsonb;

comment on column audit_logs.metadata is 'additional metadata for audit operations, e.g., deleted batch information';

-- =============================================================================
-- 2. update the trigger function to handle deletes properly
-- =============================================================================

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
    insert into audit_logs (user_id, action, batch_id, metadata)
    values (old.user_id, 'batch_hard_delete', null, jsonb_build_object('deleted_batch_id', old.id, 'filename', old.filename));
    return old;
  end if;

  return new;
end;
$$ language plpgsql security definer;

comment on function log_batch_operation() is
  'automatically creates audit log entries for batch operations, with metadata for hard deletes';

-- =============================================================================
-- migration complete
-- =============================================================================
