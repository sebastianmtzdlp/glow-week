-- Eventos presenciales (mitienda.beauty/eventos). Ya está aplicado en Supabase; este archivo es la referencia.
--
-- eventos: UNA FILA POR EVENTO. Es la fuente del sitio: cada 10 minutos una acción de GitHub
--   (scripts/eventos_supabase.py) copia las filas con publicado = true a _data/eventos.json y
--   regenera las páginas. Para un evento nuevo: Supabase > Table Editor > eventos > Insert row.
--   Lectura pública (es lo mismo que sale en la página); nadie puede escribir con la llave pública.
-- eventos_interesadas: quién escribió a quién y quién la invitó. PRIVADA: la página solo puede
--   insertar; tú la ves y la editas (estado, nombre, teléfono) en el Table Editor.
-- Flyers: Supabase > Storage > eventos > Upload, y pega el link público en "flyer".

create table if not exists public.eventos (
  slug          text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),  -- la dirección: /eventos/<slug>/
  serie         text check (serie ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),          -- p. ej. flowers-to-go (debe existir en "series" de _data/eventos.json)
  edicion       text,
  titulo        text not null,
  tipo          text,
  categoria     text,
  desde         timestamptz not null,
  hasta         timestamptz,
  ciudad        text,                                                   -- solo si es fuera de CDMX
  zona          text,
  lugar         text,
  direccion     text,
  lat           double precision check (lat between -90 and 90),
  lng           double precision check (lng between -180 and 180),
  resumen       text,
  puntos        text[],
  aportacion    jsonb check (aportacion is null or jsonb_typeof(aportacion) = 'array'),  -- [{"etiqueta":"Preventa","precio":"$250"}]
  regalo        text,
  colaboran     text[],
  responsables  text[],                                                 -- slugs de _data/equipo.json: {nancy,viri}
  cupo          int check (cupo > 0),
  flyer         text,
  imagen        text,
  icono         text,
  color         text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  plantilla     text,
  extra         jsonb,                                                  -- otros campos del JSON (apartar, boton…)
  publicado     boolean not null default true,
  creado        timestamptz not null default now()
);

alter table public.eventos enable row level security;
revoke all on public.eventos from anon, authenticated;
grant select on public.eventos to anon, authenticated;
drop policy if exists "eventos: lectura publica" on public.eventos;
create policy "eventos: lectura publica" on public.eventos for select to anon, authenticated using (publicado);

create table if not exists public.eventos_interesadas (
  id           uuid primary key default gen_random_uuid(),
  creado       timestamptz not null default now(),
  evento       text not null references public.eventos(slug) on update cascade on delete cascade,
  responsable  text check (char_length(responsable) <= 40),             -- a quién le escribió
  invito       text check (char_length(invito) <= 40),                  -- quién la invitó (?de= del link)
  origen       text not null default 'manual' check (origen in ('evento','cartelera','calendario','mapa','manual')),
  dispositivo  uuid,                                                    -- un id al azar por navegador
  nombre       text check (char_length(nombre) <= 80),
  telefono     text check (char_length(telefono) <= 30),
  estado       text not null default 'escribio' check (estado in ('escribio','apartado','pagado','asistio','cancelo')),
  nota         text
);
create index if not exists eventos_interesadas_evento on public.eventos_interesadas (evento, creado desc);

alter table public.eventos_interesadas enable row level security;
revoke all on public.eventos_interesadas from anon, authenticated;
grant insert on public.eventos_interesadas to anon, authenticated;
drop policy if exists "interesadas: insertar anonimo" on public.eventos_interesadas;
create policy "interesadas: insertar anonimo" on public.eventos_interesadas for insert to anon, authenticated
  with check (estado = 'escribio' and nombre is null and telefono is null and nota is null and origen <> 'manual');

-- Cupo de cada evento (privado): apartados = apartado + pagado + asistio
create or replace view public.eventos_cupo with (security_invoker = true) as
  select e.slug, e.titulo, e.desde, e.cupo,
         count(i.id) filter (where i.estado = 'escribio')                          as escribieron,
         count(i.id) filter (where i.estado in ('apartado','pagado','asistio'))    as apartados,
         e.cupo - count(i.id) filter (where i.estado in ('apartado','pagado','asistio')) as quedan
    from public.eventos e left join public.eventos_interesadas i on i.evento = e.slug
   group by e.slug order by e.desde;
revoke all on public.eventos_cupo from anon, authenticated;

-- Quién trae a quién (privado)
create or replace view public.eventos_por_invitadora with (security_invoker = true) as
  select evento, coalesce(invito, responsable) as invitadora,
         count(*) as escribieron,
         count(*) filter (where estado in ('apartado','pagado','asistio')) as apartados
    from public.eventos_interesadas group by 1, 2 order by 1, 4 desc, 3 desc;
revoke all on public.eventos_por_invitadora from anon, authenticated;

-- Carpeta pública para flyers de eventos nuevos
insert into storage.buckets (id, name, public) values ('eventos', 'eventos', true) on conflict (id) do nothing;

-- Los eventos que ya estaban en la página (Starlight Ride con el flyer nuevo y boleto de $650)
insert into public.eventos (slug,serie,edicion,titulo,tipo,categoria,desde,hasta,ciudad,zona,lugar,direccion,lat,lng,resumen,puntos,aportacion,regalo,colaboran,responsables,flyer,imagen,icono,color,plantilla,extra) values
('altar','flowers-to-go','Altar','Flowers to Go · Edición Altar','Taller','Flores','2026-10-31T11:00:00-06:00','2026-10-31T13:00:00-06:00',null,'Benito Juárez','Col. Nápoles',null,19.3937,-99.177,'Una mañana de pan, cafecito y un ramo para tu altar.',null,'[{"etiqueta": "Preventa", "precio": "$250"}, {"etiqueta": "Previo al evento", "precio": "$300"}]'::jsonb,'Los primeros 10 lugares se llevan un regalo sorpresa de Farmasi.',array['Verbalia Floral','Teresita Flowers','Nutriplus','Cima Vision']::text[],array['viri','sel']::text[],'/eventos/fotos/altar-flyer.jpg','/eventos/fotos/altar.jpg','/eventos/fotos/altar-ramo.png','#A6461F',null,'{"apartar": {"whatsapp": "", "instagram": ""}}'::jsonb),
('holiday-glam',null,null,'Holiday Glam','Self-makeup experience','Maquillaje','2026-11-14T10:00:00-06:00','2026-11-14T12:00:00-06:00',null,'Miguel Hidalgo','Nalé Spa','Kelvin 8, Local 2, Anzures, CP 11590. A una cuadra de Liverpool Polanco.',19.4317,-99.1803,'El maquillaje perfecto para tus posadas, fiestas y momentos especiales.',array['Masterclass con maquillista profesional','Práctica guiada','Incluye kit con paleta de sombras y gloss','Cupo limitado']::text[],'[{"etiqueta": "Por persona", "precio": "$899"}]'::jsonb,null,array['Nalé Relax & Beauty']::text[],array['nancy']::text[],'/eventos/fotos/holiday-glam.jpg',null,null,'#8E2C3E',null,'{"apartar": {"whatsapp": "", "instagram": ""}}'::jsonb),
('neon-night-party',null,null,'Neon Night Party','Fiesta','Pilates','2026-11-19T18:30:00-06:00','2026-11-19T22:30:00-06:00',null,'Álvaro Obregón','Umaah Haus','Fernando M. Villalpando 98, Guadalupe Inn.',19.3612,-99.1851,'Mat pilates, beauty, música, experiencias exclusivas, regalos y muchas sorpresas.',array['Dresscode: colores neón','Cupo limitado','Usuarias de Wellhub y TotalPass: manda DM para tu precio especial']::text[],'[{"etiqueta": "Precio regular", "precio": "$500"}]'::jsonb,null,array['La Mat Party','Catarsis']::text[],array['nancy']::text[],'/eventos/fotos/neon-night-party.jpg',null,null,'#C2185B',null,'{"apartar": {"whatsapp": "", "instagram": ""}}'::jsonb),
('starlight-ride',null,null,'Starlight Ride','Rodada de spinning','Fitness','2026-12-05T17:00:00-06:00',null,null,'Cuauhtémoc','Helipuerto Reforma',null,19.427,-99.1677,'Spinning al atardecer en un helipuerto, con la ciudad abajo.',array['Boletos a la venta']::text[],'[{"etiqueta": "Boleto", "precio": "$650"}]'::jsonb,null,null,array['nancy']::text[],'/eventos/fotos/starlight-ride-2.jpg',null,null,'#8A2846',null,'{"apartar": {"whatsapp": "", "instagram": ""}}'::jsonb),
('master-class-tendencias-2027',null,null,'Master Class Tendencias 2027','Master class de maquillaje','Maquillaje','2026-10-25T11:00:00-06:00',null,'Tizayuca','Tizayuca, Hidalgo','Tizayuca Centro',null,19.8378,-98.9817,'Las tendencias de maquillaje para 2027 con la maquillista Lizeth Montes de Oca. Ve los resultados profesionales de Farmasi, llévate producto o afíliate.',array['Master class con Lizeth Montes de Oca, makeup artist','Tendencias de maquillaje 2027','Prueba y compra producto Farmasi','Información para afiliarte']::text[],'[{"etiqueta": "Costo", "precio": "$100"}]'::jsonb,null,array['Lizeth Montes de Oca']::text[],array['danny']::text[],'/eventos/fotos/master-class-tendencias-2027.jpg',null,null,'#8C7560',null,'{"apartar": {"whatsapp": "", "instagram": ""}}'::jsonb)
on conflict (slug) do nothing;
