-- Buzón de sugerencias (mitienda.beauty/dudas/#sugiere).
-- Pegar completo en Supabase > SQL Editor > Run.
-- La página pública solo puede INSERTAR. Leer: desde el panel de Supabase (Table Editor), o con sesión de
-- Sel o Pasha (mentorias_admins, ya creada en mentorias_espera.sql).
-- La sugerencia también llega por WhatsApp; esta tabla es la copia para no perder ninguna.

create table if not exists public.sugerencias (
  id      uuid primary key default gen_random_uuid(),
  creado  timestamptz not null default now(),
  tipo    text not null check (tipo in ('nueva','mejora','falla','duda')),
  texto   text not null check (char_length(texto) between 3 and 1200),
  nombre  text check (nombre is null or char_length(nombre) <= 80),
  pagina  text check (pagina is null or char_length(pagina) <= 200),
  desde   text check (desde is null or char_length(desde) <= 200),        -- página de la que llegó (referrer)
  estado  text not null default 'nueva' check (estado in ('nueva','vista','hecha','descartada'))
);
create index if not exists sugerencias_creado on public.sugerencias (creado);

alter table public.sugerencias enable row level security;

revoke all on public.sugerencias from anon, authenticated;
grant insert (tipo, texto, nombre, pagina, desde) on public.sugerencias to anon, authenticated;
grant select, update (estado) on public.sugerencias to authenticated;

drop policy if exists "sugerencias: mandar" on public.sugerencias;
create policy "sugerencias: mandar"
  on public.sugerencias for insert
  to anon, authenticated
  with check (estado = 'nueva');

drop policy if exists "sugerencias: ver admins" on public.sugerencias;
create policy "sugerencias: ver admins"
  on public.sugerencias for select
  to authenticated
  using ((select public.es_admin_mentorias()));

drop policy if exists "sugerencias: marcar admins" on public.sugerencias;
create policy "sugerencias: marcar admins"
  on public.sugerencias for update
  to authenticated
  using ((select public.es_admin_mentorias()))
  with check ((select public.es_admin_mentorias()));
