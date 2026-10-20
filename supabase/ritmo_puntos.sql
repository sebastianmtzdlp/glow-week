-- Ritmo de Puntos (mitienda.beauty/herramientas/ritmo-de-puntos/): copia privada de cada registro.
-- Pegar completo en Supabase > SQL Editor > Run.
-- Privado: la página solo puede INSERTAR. Nadie puede leer, cambiar ni borrar con la llave pública
-- (no hay políticas de lectura). Tú lo ves en Supabase > Table Editor, que entra como administrador.

create table if not exists public.ritmo_puntos (
  id           uuid primary key default gen_random_uuid(),
  creado       timestamptz not null default now(),
  dispositivo  uuid not null,                                         -- un id al azar por navegador
  accion       text not null check (accion in ('empezar','registro','borrar','meta','importado','restaurar')),
  nombre       text check (char_length(nombre) <= 80),
  equipo       text check (char_length(equipo) <= 80),
  mes          text not null check (mes ~ '^\d{4}-\d{2}$'),
  dia          int  check (dia between 1 and 31),
  total        int,                                                   -- puntos acumulados del mes al último registro
  meta         int,
  cierre       int  check (cierre between 1 and 31),
  estado       jsonb check (pg_column_size(estado) < 200000)          -- respaldo completo (sin logo)
);
create index if not exists ritmo_puntos_disp on public.ritmo_puntos (dispositivo, creado desc);

alter table public.ritmo_puntos enable row level security;

revoke all on public.ritmo_puntos from anon, authenticated;
grant insert on public.ritmo_puntos to anon, authenticated;

drop policy if exists "ritmo: insertar anonimo" on public.ritmo_puntos;
create policy "ritmo: insertar anonimo"
  on public.ritmo_puntos for insert
  to anon, authenticated
  with check (true);

-- Lo más reciente de cada persona (una fila por navegador). Solo visible en el panel.
create or replace view public.ritmo_puntos_ultimo with (security_invoker = true) as
  select distinct on (dispositivo)
         dispositivo, creado as ultimo_registro, nombre, equipo, mes, total, meta,
         case when meta > 0 then round(100.0 * total / meta) end as avance_pct
    from public.ritmo_puntos
   order by dispositivo, creado desc;
revoke all on public.ritmo_puntos_ultimo from anon, authenticated;
