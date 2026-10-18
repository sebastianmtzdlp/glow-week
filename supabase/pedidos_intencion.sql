-- Intención de pedido (cuando la clienta toca "Enviar por WhatsApp").
-- Sin nombre, teléfono ni dirección. Pegar completo en Supabase > SQL Editor > Run.

create table if not exists public.pedidos_intencion (
  id           uuid primary key default gen_random_uuid(),
  creado       timestamptz not null default now(),
  consultora   text not null check (consultora ~ '^[a-z0-9]+$'),   -- dueña del tablero (slug)
  referida_por text check (char_length(referida_por) <= 40),        -- "vengo de parte de"
  tipo         text not null check (tipo in ('clienta','afiliada')),
  origen       text not null check (origen in ('tablero','catalogo')),
  items        jsonb not null,                                       -- [{codigo, nombre, cantidad, precio}]
  total        numeric(10,2) not null check (total >= 0),
  envio        text check (envio in ('domicilio','recoger'))
);

alter table public.pedidos_intencion enable row level security;

-- Cualquiera del sitio puede registrar un pedido, pero no leerlo ni cambiarlo
drop policy if exists "intencion: insertar anonimo" on public.pedidos_intencion;
create policy "intencion: insertar anonimo"
  on public.pedidos_intencion for insert
  to anon, authenticated
  with check (true);

-- Lectura: solo sesión iniciada (tú)
drop policy if exists "intencion: leer autenticado" on public.pedidos_intencion;
create policy "intencion: leer autenticado"
  on public.pedidos_intencion for select
  to authenticated
  using (true);
