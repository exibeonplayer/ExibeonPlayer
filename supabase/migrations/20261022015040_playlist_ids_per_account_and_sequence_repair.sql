lock table public.playlists in access exclusive mode;
alter table public.playlists alter column sequential_id drop default;
drop index if exists public.idx_playlists_sequential_id;
drop index if exists public.idx_playlists_user_sequential;

-- One-time repair; stable UUIDs, assignments, media and publication IDs stay intact.
alter table public.playlists disable trigger generate_playlist_slug_trigger;
alter table public.playlists disable trigger update_playlists_updated_at;
with numbered as (
 select id,row_number() over(partition by user_id order by sequential_id nulls last,created_at,id)::integer n
 from public.playlists
)
update public.playlists p set sequential_id=n.n from numbered n
where p.id=n.id and p.sequential_id is distinct from n.n;
alter table public.playlists enable trigger generate_playlist_slug_trigger;
alter table public.playlists enable trigger update_playlists_updated_at;
create unique index idx_playlists_user_sequential on public.playlists(user_id,sequential_id);

create or replace function public.get_next_playlist_sequential_id(p_user_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare result integer;
begin
 -- Serialize inserts for one account, including concurrent browser tabs.
 perform 1 from auth.users where id=p_user_id for update;
 if not found then raise exception 'Conta não encontrada'; end if;
 select coalesce(max(sequential_id),0)+1 into result from public.playlists where user_id=p_user_id;
 return result;
end;
$$;
revoke all on function public.get_next_playlist_sequential_id(uuid) from public,anon,authenticated;

create or replace function public.generate_playlist_sequential_id()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.sequential_id:=public.get_next_playlist_sequential_id(new.user_id);
 return new;
end;
$$;
revoke all on function public.generate_playlist_sequential_id() from public,anon,authenticated;

-- Numeric selectors remain stable after deletions. Retire the old recycling pool.
drop trigger if exists add_available_id_on_playlist_delete_trigger on public.playlists;
delete from public.playlist_available_ids;
