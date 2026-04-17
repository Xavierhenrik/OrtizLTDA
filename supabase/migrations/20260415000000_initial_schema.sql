-- Ortiz site: profiles, projects, storage (Supabase PostgreSQL)
-- Aplicar no SQL Editor ou via supabase db push após revisão.

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid (),
  title text not null,
  description text not null,
  category text not null,
  image_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_created_at_idx on public.projects (created_at desc);

-- ---------------------------------------------------------------------------
-- Trigger: perfil ao registrar usuário (is_admin = false; promover admin no Dashboard SQL)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, is_admin)
  values (new.id, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user ();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid () = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid () = id);

drop policy if exists "projects_public_read" on public.projects;
create policy "projects_public_read" on public.projects
  for select using (true);

drop policy if exists "projects_admin_insert" on public.projects;
create policy "projects_admin_insert" on public.projects
  for insert with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid () and p.is_admin = true
    )
  );

drop policy if exists "projects_admin_update" on public.projects;
create policy "projects_admin_update" on public.projects
  for update using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid () and p.is_admin = true
    )
  );

drop policy if exists "projects_admin_delete" on public.projects;
create policy "projects_admin_delete" on public.projects
  for delete using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid () and p.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: bucket público para leitura; escrita só admin (via policies)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "project_images_public_read" on storage.objects;
create policy "project_images_public_read" on storage.objects
  for select using (bucket_id = 'project-images');

drop policy if exists "project_images_admin_insert" on storage.objects;
create policy "project_images_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'project-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid () and p.is_admin = true
    )
  );

drop policy if exists "project_images_admin_update" on storage.objects;
create policy "project_images_admin_update" on storage.objects
  for update using (
    bucket_id = 'project-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid () and p.is_admin = true
    )
  );

drop policy if exists "project_images_admin_delete" on storage.objects;
create policy "project_images_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'project-images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid () and p.is_admin = true
    )
  );
