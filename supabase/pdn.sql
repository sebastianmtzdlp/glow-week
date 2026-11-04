-- PDN con link de 30 días (/mentorias/herramientas/pdn/ → mitienda.beauty/pdn/?p=<id>)
-- Correr una vez en Supabase > SQL Editor.
--
-- Bucket público "pdn": cada PDN sube <id>.pdf, <id>.json y <id>-01.jpg … <id>-NN.jpg.
-- <id> son 12 letras/números al azar, así que el link no se puede adivinar.
-- Desde el navegador solo se puede SUBIR (no listar, cambiar ni borrar), con tope de 8 MB por archivo
-- y solo PDF, JPG y JSON. La página del link deja de mostrarla a los 30 días.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pdn', 'pdn', true, 8388608, array['application/pdf','image/jpeg','application/json'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pdn: subir" on storage.objects;
create policy "pdn: subir" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'pdn'
    and name ~ '^[A-Za-z0-9]{12}(-[0-9]{2})?\.(pdf|jpg|json)$'
  );

-- Limpieza (opcional, a mano cada mes): Storage > pdn, ordenar por fecha y borrar lo de más de 30 días.
-- Supabase no deja borrar archivos con SQL directo; si crece, se automatiza con una Action y la service key.
