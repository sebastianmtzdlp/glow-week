-- Agenda de publicaciones (Mi Tienda Beauty). Pegar completo en Supabase > SQL Editor > Run.

create table if not exists public.publicaciones (
  id          uuid primary key default gen_random_uuid(),
  consultora  text not null check (consultora ~ '^[a-z0-9]+$'),
  fecha       date not null,
  producto    text not null,
  codigo      text,
  nota        text,
  creado      timestamptz not null default now(),
  autor       uuid default auth.uid()
);

alter table public.publicaciones enable row level security;

-- Lectura: pública (cualquiera con el sitio ve la agenda)
drop policy if exists "agenda: lectura publica" on public.publicaciones;
create policy "agenda: lectura publica"
  on public.publicaciones for select
  to anon, authenticated
  using (true);

-- Escritura: solo usuarios con sesión iniciada
drop policy if exists "agenda: crear autenticado" on public.publicaciones;
create policy "agenda: crear autenticado"
  on public.publicaciones for insert
  to authenticated
  with check (autor = auth.uid());

-- Editar/borrar: solo lo propio
drop policy if exists "agenda: editar propio" on public.publicaciones;
create policy "agenda: editar propio"
  on public.publicaciones for update
  to authenticated
  using (autor = auth.uid()) with check (autor = auth.uid());

drop policy if exists "agenda: borrar propio" on public.publicaciones;
create policy "agenda: borrar propio"
  on public.publicaciones for delete
  to authenticated
  using (autor = auth.uid());
