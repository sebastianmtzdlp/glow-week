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

Raíz: `index.html` (portada), `CNAME` (dominio), `netlify.toml` (respaldo en glow-week.netlify.app).

## Cómo se marca cada cosa en `promos.json`
- **Precio con promo:** `"retail"` = precio base, `"price"` = precio con descuento.
- **Lanzamiento:** `"nuevo": true` → etiqueta "Nuevo" y sección "Nuevos".
- **Flash sale:** `"flash": {"price": 199, "desde": "2026-10-18T10:00:00-06:00", "hasta": "2026-10-18T22:00:00-06:00"}` → precio especial con contador; al terminar regresa solo a su precio normal.
- **Producto por tiempo limitado:** `"desde"` / `"hasta"` en el producto; fuera de esas fechas no aparece.
- **Aviso arriba:** `"aviso": {"texto": "Hoy 2x1 en labiales", "desde": ..., "hasta": ...}`.

## Eventos
Eventos presenciales de todo tipo. `mitienda.beauty/eventos` los lista (ahora, próximos y los que ya pasaron) con un mapa y botones para filtrar por zona. Cada evento tiene su página con cuenta regresiva y botones para apartar, agregar al calendario y compartir por WhatsApp.
- Agregar un evento = agregar un bloque en `_data/eventos.json` (copia uno que ya exista). Obligatorios: `slug`, `titulo`, `tipo`, `desde`, `hasta`. Para que salga en el mapa y en el filtro: `zona` y `mapa` (`[latitud, longitud]`; en Google Maps, clic derecho sobre el lugar).
- Página: por defecto en `/eventos/<slug>/`. Con `"ruta": "flowers-to-go"` sale en `mitienda.beauty/flowers-to-go/` (el script no deja usar una carpeta que ya existe, como la de una consultora).
- Diseño: `"plantilla": "flowers-to-go"` usa `scripts/evento_flowers-to-go.html`; sin plantilla se usa `scripts/evento_plantilla.html`. Para un diseño nuevo, copia una plantilla como `scripts/evento_<nombre>.html`.
- Apartar: `"apartar": {"whatsapp": "52155…", "instagram": "usuario"}` muestra los botones; si va vacío, la página solo dice que se aparta por WhatsApp o DM.
- Al subir el cambio a `main`, la acción **Eventos** genera la página sola. A mano: `python3 scripts/eventos.py`. No edites a mano las páginas generadas. Si borras un evento, borra también su carpeta.
- Fechas con hora de México, p. ej. `"2026-10-31T11:00:00-06:00"`.

## Fuera del catálogo
`_data/fuera-de-catalogo.json` lista los productos de la tienda de Farmasi que no salen en el catálogo impreso (se muestran como el chip "Fuera del catálogo" dentro del catálogo). Se regenera revisando la tienda de Selene (mx.farmasi.com/selenevehe): cada categoría se lee paginada y se compara contra los códigos de `catalogo-farmasi.json`. Se oculta lo agotado.
