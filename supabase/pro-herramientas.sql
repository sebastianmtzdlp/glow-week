-- Herramientas Pro nuevas (mitienda.beauty/mentorias/herramientas/)
-- Corre DESPUÉS de pro.sql. Pegar en Supabase > SQL Editor. Sin políticas para anon:
-- solo las Edge Functions (llave de servicio) leen y escriben aquí.

-- 1) Qué socia es dueña de un código (para pedidos y testimonios). Lo llenas tú al dar el código:
--    update public.pro_accesos set consultora = 'nancy' where codigo = 'SVH-XXXX-XXXX';
alter table public.pro_accesos add column if not exists consultora text check (consultora ~ '^[a-z0-9]+$');

-- 2) La nube: lo que guarda cada herramienta por código (lista, mapa, mi mes, historia...)
create table if not exists public.pro_datos (
  codigo      text not null references public.pro_accesos(codigo) on delete cascade,
  herramienta text not null check (herramienta ~ '^[a-z0-9-]+$'),
  datos       jsonb not null,
  clave       text,                      -- solo si es público: con qué se busca (slug o WhatsApp)
  publico     boolean not null default false,
  actualizado timestamptz not null default now(),
  primary key (codigo, herramienta)
);
create index if not exists pro_datos_publico on public.pro_datos (herramienta, clave) where publico;

-- 3) Reto en equipo
create table if not exists public.pro_retos (
  id        text primary key,                       -- RETO-XXXX, el que se comparte con el equipo
  codigo    text not null references public.pro_accesos(codigo) on delete cascade,  -- la líder
  nombre    text not null check (char_length(nombre) <= 60),
  inicio    date not null,
  dias      integer not null check (dias between 3 and 60),
  tareas    jsonb not null,                         -- ["Escribí a 10 personas", ...] (hasta 5)
  cerrado   boolean not null default false,
  creado    timestamptz not null default now()
);
create table if not exists public.pro_reto_socias (
  id      uuid primary key default gen_random_uuid(),
  reto    text not null references public.pro_retos(id) on delete cascade,
  nombre  text not null check (char_length(nombre) between 1 and 40),
  token   uuid not null default gen_random_uuid(),  -- secreto que guarda la socia en su celular
  creada  timestamptz not null default now()
);
create index if not exists pro_reto_socias_reto on public.pro_reto_socias (reto);
create table if not exists public.pro_reto_reportes (
  socia  uuid not null references public.pro_reto_socias(id) on delete cascade,
  dia    date not null,
  hechas integer not null check (hechas between 0 and 5),
  nota   text check (char_length(nota) <= 140),
  primary key (socia, dia)
);

-- 4) Testimonios que dejan las clientas
create table if not exists public.pro_testimonios (
  id          uuid primary key default gen_random_uuid(),
  consultora  text not null check (consultora ~ '^[a-z0-9]+$'),
  nombre      text not null check (char_length(nombre) between 1 and 40),
  texto       text not null check (char_length(texto) between 10 and 400),
  estado      text not null default 'pendiente',    -- pendiente | aprobado | oculto
  creado      timestamptz not null default now()
);
create index if not exists pro_testimonios_c on public.pro_testimonios (consultora, estado);

-- 5) Reuniones que proponen para la cartelera (las revisas tú)
create table if not exists public.pro_propuestas (
  id      uuid primary key default gen_random_uuid(),
  codigo  text not null references public.pro_accesos(codigo) on delete cascade,
  evento  jsonb not null,
  estado  text not null default 'nueva',            -- nueva | aceptada | descartada
  creada  timestamptz not null default now()
);

alter table public.pro_datos         enable row level security;
alter table public.pro_retos         enable row level security;
alter table public.pro_reto_socias   enable row level security;
alter table public.pro_reto_reportes enable row level security;
alter table public.pro_testimonios   enable row level security;
alter table public.pro_propuestas    enable row level security;

-- Productos nuevos (precios PROPUESTOS en MXN; cámbialos aquí y vuelve a correr)
insert into public.pro_productos (slug, titulo, precio, incluye) values
  ('lista', 'Mi lista de 50 · Pro', 199, array['lista']),
  ('presentacion', 'Presentación del negocio · Pro', 149, array['presentacion']),
  ('objeciones', '¿Y si me dice que no? · Pro', 99, array['objeciones']),
  ('rutina', 'Arma su rutina · Pro', 149, array['rutina']),
  ('pedidos', 'Pedidos y cobros · Pro', 199, array['pedidos']),
  ('equipo', 'Mapa de mi equipo · Pro', 249, array['equipo']),
  ('reto', 'Reto en equipo', 199, array['reto']),
  ('reconocimientos', 'Reconocimientos · Pro', 99, array['reconocimientos']),
  ('reunion', 'Mi reunión · Pro', 99, array['reunion']),
  ('capacitaciones', 'Capacitaciones listas', 249, array['capacitaciones']),
  ('contenido', 'Qué publico hoy · Pro', 149, array['contenido']),
  ('mi-mes', 'Mi mes · Pro', 99, array['mi-mes']),
  ('inventario', 'Lo que tengo en casa · Pro', 99, array['inventario']),
  ('testimonios', 'Lo que dicen mis clientas · Pro', 99, array['testimonios']),
  ('en-vivo', 'Guion de venta en vivo · Pro', 99, array['en-vivo']),
  ('pack-ventas', 'Pro de ventas', 449, array['lista','presentacion','objeciones','rutina','pedidos']),
  ('pack-lider', 'Pro de líder', 599, array['equipo','reto','reconocimientos','reunion','capacitaciones']),
  ('todo-pro', 'Todo Pro', 1299, array['plan-anual','planes-nivel','plan-compromiso','plan-mentora','plan-equipo','lista','presentacion','objeciones','rutina','pedidos','equipo','reto','reconocimientos','reunion','capacitaciones','contenido','mi-mes','inventario','testimonios','en-vivo'])
on conflict (slug) do update set titulo = excluded.titulo, precio = excluded.precio, incluye = excluded.incluye;

-- Para agregar una herramienta nueva a un código que ya compró (ejemplo):
-- update public.pro_accesos set productos = productos || array['reto'] where codigo = 'SVH-XXXX-XXXX';

-- Para ver qué proponen para la cartelera:
-- select creada, evento from public.pro_propuestas where estado = 'nueva' order by creada;
