-- Lista de espera de mentorías (mitienda.beauty/mentorias/ y /mentorias/lista/).
-- Pegar completo en Supabase > SQL Editor > Run.
-- La página pública solo puede INSERTAR. Leer y marcar el estado: solo los correos de mentorias_admins
-- (Sel y Pasha), con sesión iniciada por link mágico en /mentorias/lista/.

-- Quién puede ver la lista
create table if not exists public.mentorias_admins (
  email text primary key check (email = lower(email))
);
alter table public.mentorias_admins enable row level security;   -- sin políticas: nadie la lee desde la página
revoke all on public.mentorias_admins from anon, authenticated;

insert into public.mentorias_admins (email) values
  ('selene.vehe@gmail.com'),
  ('sebastianmtzdlp@gmail.com')
on conflict do nothing;

create or replace function public.es_admin_mentorias() returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.mentorias_admins
     where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke execute on function public.es_admin_mentorias() from public, anon;
grant execute on function public.es_admin_mentorias() to authenticated;

-- Los registros
create table if not exists public.mentorias_espera (
  id           uuid primary key default gen_random_uuid(),
  creado       timestamptz not null default now(),
  nombre       text not null check (char_length(nombre) between 1 and 80),
  whatsapp     text not null check (whatsapp ~ '^[0-9]{10,13}$'),               -- solo dígitos, con o sin 52
  correo       text check (correo is null or (char_length(correo) <= 120 and correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  tipo         text not null check (tipo ~ '^[a-z-]{2,30}$'),                   -- id de la opción, o "no-se"
  tema         text check (char_length(tema) <= 1000),
  origen       text check (char_length(origen) <= 200),                         -- de dónde llegó (?ref=, utm)
  estado       text not null default 'nueva' check (estado in ('nueva','contactada','inscrita','descartada')),
  notas        text check (char_length(notas) <= 2000),
  actualizado  timestamptz
);
create index if not exists mentorias_espera_creado on public.mentorias_espera (creado);

alter table public.mentorias_espera enable row level security;

revoke all on public.mentorias_espera from anon, authenticated;
grant insert (nombre, whatsapp, correo, tipo, tema, origen) on public.mentorias_espera to anon, authenticated;
grant select on public.mentorias_espera to authenticated;
grant update (estado, notas, actualizado) on public.mentorias_espera to authenticated;

drop policy if exists "espera: registrarse" on public.mentorias_espera;
create policy "espera: registrarse"
  on public.mentorias_espera for insert
  to anon, authenticated
  with check (estado = 'nueva' and notas is null);

drop policy if exists "espera: ver admins" on public.mentorias_espera;
create policy "espera: ver admins"
  on public.mentorias_espera for select
  to authenticated
  using ((select public.es_admin_mentorias()));

drop policy if exists "espera: marcar admins" on public.mentorias_espera;
create policy "espera: marcar admins"
  on public.mentorias_espera for update
  to authenticated
  using ((select public.es_admin_mentorias()))
  with check ((select public.es_admin_mentorias()));
