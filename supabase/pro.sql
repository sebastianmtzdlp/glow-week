-- Herramientas Pro de pago (mitienda.beauty/mentorias/herramientas/pro/)
-- Pegar en Supabase > SQL Editor. Ninguna tabla tiene políticas para anon:
-- solo las Edge Functions (con la llave de servicio) leen y escriben aquí.
-- El contenido de los planes se carga aparte con pro-contenido.sql (no está en el repo).

create table if not exists public.pro_productos (
  slug        text primary key,
  titulo      text not null,
  precio      numeric(10,2) not null check (precio > 0),
  incluye     text[] not null,          -- productos con contenido que abre (el paquete abre varios)
  activo      boolean not null default true
);

create table if not exists public.pro_compras (
  id            uuid primary key default gen_random_uuid(),
  token         uuid not null default gen_random_uuid(),   -- secreto que solo ve quien pagó (va en la URL de regreso)
  producto      text not null references public.pro_productos(slug),
  email         text not null,
  precio        numeric(10,2) not null,
  estado        text not null default 'pendiente',          -- pendiente | pagada | rechazada | reembolsada
  mp_preferencia text,
  mp_pago       text,
  codigo        text,
  creada        timestamptz not null default now(),
  pagada        timestamptz
);
create index if not exists pro_compras_email on public.pro_compras (lower(email));

create table if not exists public.pro_accesos (
  codigo      text primary key,           -- SVH-XXXX-XXXX
  productos   text[] not null,
  email       text,
  origen      text not null default 'compra',   -- compra | regalo | equipo
  compra      uuid references public.pro_compras(id),
  activo      boolean not null default true,
  usos        integer not null default 0,
  ultimo_uso  timestamptz,
  creado      timestamptz not null default now()
);

create table if not exists public.pro_contenido (
  producto text not null,
  orden    integer not null,
  titulo   text not null,
  html     text not null,
  primary key (producto, orden)
);

alter table public.pro_productos enable row level security;
alter table public.pro_compras   enable row level security;
alter table public.pro_accesos   enable row level security;
alter table public.pro_contenido enable row level security;
-- (sin políticas a propósito: anon y authenticated no ven nada)

-- Precios PROPUESTOS en MXN. Cambia aquí y vuelve a correr este bloque.
insert into public.pro_productos (slug, titulo, precio, incluye) values
  ('plan-anual',      'Plan anual de 52 semanas',              349, array['plan-anual']),
  ('planes-nivel',    'Planes por nivel y dirección',          249, array['planes-nivel']),
  ('plan-compromiso', 'Tu ritmo y los 32 enfoques',            199, array['plan-compromiso']),
  ('plan-mentora',    'Plan de mentora y semana de directora', 149, array['plan-mentora']),
  ('plan-equipo',     'Plan para llevar al equipo',            149, array['plan-equipo']),
  ('todo',            'Todo Pro',                              699, array['plan-anual','planes-nivel','plan-compromiso','plan-mentora','plan-equipo'])
on conflict (slug) do update set titulo = excluded.titulo, precio = excluded.precio, incluye = excluded.incluye;

-- Para regalar acceso a alguien del equipo sin cobrar (cambia el código y los productos):
-- insert into public.pro_accesos (codigo, productos, email, origen)
-- values ('SVH-EQUIPO-0001', array['plan-anual','planes-nivel'], 'correo@ejemplo.com', 'regalo');

-- Para ver ventas:
-- select creada, producto, email, precio, estado, codigo from public.pro_compras order by creada desc;
