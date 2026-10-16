# mitienda.beauty · Tableros de ventas Farmasi

Un tablero por consultora, cada una en su carpeta. Se publica solo (GitHub Pages en mitienda.beauty; Netlify en glow-week.netlify.app como respaldo) cada vez que cambia este repositorio.

- `mitienda.beauty/sel` — Selene
- (próximas: `/silvia`, `/elda`)

## Archivos de cada carpeta
- `index.html` — diseño y funcionamiento del tablero. Casi nunca hay que tocarlo.
- `promos.json` — **todo lo que cambia**: datos de la consultora, productos, precios, flash sales, aviso, meta, regalo, membresía, referidas y tema.
- `catalogo/` — catálogo completo con precios y carrito (`catalogo-farmasi.json` son sus precios).
- `catalogo.json` — precios base (precio público).

Raíz: `CNAME` (dominio), `netlify.toml` (respaldo), `index.html` (manda a `/sel`).

## Cómo se marca cada cosa en `promos.json`
- **Precio con promo:** `"retail"` = precio base, `"price"` = precio con descuento.
- **Lanzamiento:** `"nuevo": true` → etiqueta "Nuevo" y sección "Nuevos".
- **Flash sale:** `"flash": {"price": 199, "desde": "2026-10-18T10:00:00-06:00", "hasta": "2026-10-18T22:00:00-06:00"}` → precio especial con contador; al terminar regresa solo a su precio normal.
- **Producto por tiempo limitado:** `"desde"` / `"hasta"` en el producto; fuera de esas fechas no aparece.
- **Aviso arriba:** `"aviso": {"texto": "Hoy 2x1 en labiales", "desde": ..., "hasta": ...}`.
