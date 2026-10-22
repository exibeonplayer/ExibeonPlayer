-- Public signup cannot supply app_metadata. Only the server's Admin API can
-- insert this marker, after checking the caller against platform_roles.
create or replace function exibeon_private.require_master_provisioning()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.platform_roles r
    where r.role = 'admin'
      and r.user_id::text = new.raw_app_meta_data->>'exb_provisioned_by'
  ) then
    raise exception 'Novas contas devem ser criadas pela Master em Licenças'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function exibeon_private.require_master_provisioning() from public, anon, authenticated;
create trigger exb_require_master_provisioning
before insert on auth.users
for each row execute function exibeon_private.require_master_provisioning();
