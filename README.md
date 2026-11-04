# mitienda.beauty · Tableros de ventas Farmasi

Un tablero por consultora, cada una en su carpeta. Se publica solo (GitHub Pages en mitienda.beauty; Netlify en glow-week.netlify.app como respaldo) cada vez que cambia este repositorio.

- `mitienda.beauty` — portada del equipo: lista de consultoras.
- `mitienda.beauty/<slug>` — tablero de cada una (`/sel`, `/nancy`, `/silvia`, `/elda`, `/pao`, …). Cada tablero tiene su `catalogo/`.

## Dónde se cambia cada cosa
- `_data/promos-base.json` — **lo compartido**: productos, precios, flash sales, aviso, fechas, meta, regalo, membresía y tema. Un cambio aquí sale en todos los tableros.
- `_data/equipo.json` — la lista del equipo (nombre, WhatsApp, Instagram, quién es líder). Agregar una consultora = agregar una línea y correr `python3 build.py`.
- `<slug>/promos.json` — datos de esa consultora (nombre, WhatsApp, Instagram, referidas). Puede sobreescribir cualquier campo compartido, p. ej. `"tema": "normal"`.
- `_template/` — el diseño del tablero y del catálogo. `build.py` lo copia a cada carpeta; nunca edites el `index.html` de una carpeta directamente.
- `_data/catalogo-farmasi.json` — precios del catálogo; `_data/catalogo.json` — precios base.
- `og/programas.json` — título y frase del preview de WhatsApp de cada página en `programas/`. Después de editarlo corre `node scripts/og-programas.cjs`: rehace las imágenes en `og/programas/` (con los colores y letras de cada curso, leídos de su página) y las etiquetas de cada página.

Raíz: `index.html` (portada), `CNAME` (dominio), `netlify.toml` (respaldo en glow-week.netlify.app).

## Cómo se marca cada cosa en `promos.json`
- **Precio con promo:** `"retail"` = precio base, `"price"` = precio con descuento.
- **Lanzamiento:** `"nuevo": true` → etiqueta "Nuevo" y sección "Nuevos".
- **Flash sale:** `"flash": {"price": 199, "desde": "2026-10-18T10:00:00-06:00", "hasta": "2026-10-18T22:00:00-06:00"}` → precio especial con contador; al terminar regresa solo a su precio normal.
- **Producto por tiempo limitado:** `"desde"` / `"hasta"` en el producto; fuera de esas fechas no aparece.
- **Aviso arriba:** `"aviso": {"texto": "Hoy 2x1 en labiales", "desde": ..., "hasta": ...}`.

## Eventos
Eventos presenciales de todo tipo. `mitienda.beauty/eventos` los lista (ahora, próximos y los que ya pasaron) con un mapa y botones para filtrar por zona. Cada evento tiene su página con cuenta regresiva y botones para apartar, agregar al calendario y compartir por WhatsApp.
- Todo sale de `_data/eventos.json`. Agregar un evento = agregar un bloque en `eventos` (copia uno que ya exista). Obligatorios: `slug`, `titulo`, `tipo`, `desde`, `hasta`. Para que salga en el mapa y en el filtro: `zona` y `mapa` (`[latitud, longitud]`; en Google Maps, clic derecho sobre el lugar).
- **Series con ediciones** (p. ej. Flowers to Go): la serie va en `series` y cada edición lleva `"serie": "flowers-to-go"` y su `edicion`. La serie tiene su página con todas las ediciones en `/eventos/flowers-to-go/` y cada edición la suya en `/eventos/flowers-to-go/<slug>/` (p. ej. `/altar/`). Un evento suelto sale en `/eventos/<slug>/`.
- La portada de `/eventos` pone arriba el próximo evento, luego carruseles (Esta semana, Más adelante), el mapa, las series y los que ya pasaron. Se filtra con los íconos de `categoria` (Flores, Maquillaje, Reuniones, Skincare, Lanzamientos, Capacitación; otra palabra usa un ícono de estrella) y con `zona`. `imagen` (link a una foto) se usa de fondo en el destacado y las tarjetas; sin foto se usa `color`.
- Cada edición se distingue con sus colores: `color` (letras y botones) y `flor` (el color del ramo).
- Diseño: `plantilla` (en la serie o en el evento) usa `scripts/evento_<plantilla>.html` y `scripts/serie_<plantilla>.html`; sin plantilla se usan `evento_plantilla.html` y `serie_plantilla.html`.
- Apartar: `"apartar": {"whatsapp": "52155…", "instagram": "usuario"}` muestra los botones; si va vacío, la página solo dice que se aparta por WhatsApp o DM.
- Al subir el cambio a `main`, la acción **Eventos** genera las páginas sola (y borra las de eventos que ya no están). A mano: `python3 scripts/eventos.py`. No edites a mano las páginas generadas.
- Fechas con hora de México, p. ej. `"2026-10-31T11:00:00-06:00"`.

## Precios al día
Las tiendas, los catálogos y /ventas-de-whatsapp/ leen los precios de `_data/` al abrir la página (no hace falta `build.py`).
- **Farmasi no deja que GitHub lea su tienda** (responde 403 a servidores), así que no se pueden bajar solos. Se actualizan en un paso: pega en el proyecto el texto de la tienda de Farmasi (o una lista código y precio) y pide "Actualiza los precios". Por dentro corre `python3 scripts/precios.py actualiza <archivo>`: reconoce cada producto por código o por nombre, actualiza `catalogo-farmasi.json`, `fuera-de-catalogo.json` y `catalogo.json`, y deja el resumen (subieron, bajaron, promos, nuevos) en `precios-cambios.md`. Las promos del equipo en `promos-base.json` no se tocan solas: el resumen dice cuáles revisar.
- La acción **Precios** (lunes y jueves, y cada vez que cambian esos archivos) corre `python3 scripts/precios.py revisa`: si los precios tienen más de 14 días o algún archivo no cuadra con otro, abre el aviso "Revisar precios de las tiendas" en Issues asignado a Pasha (llega por correo). Cuando todo cuadra, lo cierra sola.

## Fuera del catálogo
`_data/fuera-de-catalogo.json` lista los productos de la tienda de Farmasi que no salen en el catálogo impreso (se muestran como el chip "Fuera del catálogo" dentro del catálogo). Se regenera revisando la tienda de Selene (mx.farmasi.com/selenevehe): cada categoría se lee paginada y se compara contra los códigos de `catalogo-farmasi.json`. Se oculta lo agotado.
