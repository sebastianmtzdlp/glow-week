# Glow Week · Tablero de ventas de Selene

Tablero de productos Farmasi con pedido por WhatsApp. Se publica solo en Netlify cada vez que cambia este repositorio.

## Archivos
- `index.html` — diseño y funcionamiento del tablero. Casi nunca hay que tocarlo.
- `promos.json` — **todo lo que cambia**: productos, precios, flash sales, lanzamientos, aviso, fechas, meta y regalo.
- `catalogo.json` — precios base (precio público). Los descuentos se calculan contra estos precios.
- `netlify.toml` — configuración de Netlify.

## Cómo se marca cada cosa en `promos.json`
- **Precio con promo:** `"retail"` = precio base, `"price"` = precio con descuento.
- **Lanzamiento:** `"nuevo": true` → etiqueta "Nuevo" y sección "Nuevos".
- **Flash sale:** `"flash": {"price": 199, "desde": "2026-10-18T10:00:00-06:00", "hasta": "2026-10-18T22:00:00-06:00"}` → precio especial con contador; al terminar regresa solo a su precio normal.
- **Producto por tiempo limitado:** `"desde"` / `"hasta"` en el producto; fuera de esas fechas no aparece.
- **Aviso arriba:** `"aviso": {"texto": "Hoy 2x1 en labiales", "desde": ..., "hasta": ...}`.
