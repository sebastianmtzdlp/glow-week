# Cobrar las Herramientas Pro con Mercado Pago

## La recomendación

**Mercado Pago Checkout Pro**, con dos Edge Functions de Supabase que ya están escritas en el PR:

1. La socia elige un plan en mitienda.beauty/mentorias/herramientas/pro/, escribe su correo y toca **Pagar con Mercado Pago**.
2. `pro-pago` crea la compra en Supabase y la preferencia de pago en Mercado Pago con el precio que está en la base (no el de la página), y la manda a pagar.
3. Paga con tarjeta, saldo de Mercado Pago o efectivo en tiendas.
4. Mercado Pago avisa a `pro-webhook`. La función revisa la firma, consulta el pago directo en Mercado Pago y, si está aprobado y el monto cuadra, crea un **código** (SVH-XXXX-XXXX).
5. La socia regresa a /pro/gracias/ y ve su código. Con él abre sus planes en cualquier celular en /pro/ver/.

El texto de los planes **no está en el repositorio** (es público). Vive en Supabase, en una tabla que solo leen las funciones, y solo se entrega a quien tiene un código activo.

**Por qué Mercado Pago:** es lo que más usa la gente en México, acepta OXXO y saldo de Mercado Pago además de tarjeta, y no tiene costo mensual. Stripe también funcionaría (ver costos), pero tu equipo ya conoce Mercado Pago.

**Plan B sin programar nada:** un *link de pago* por plan desde la app de Mercado Pago, y tú mandas el código a mano. Los códigos se crean en Supabase con una línea (viene en `supabase/pro.sql`). Sirve para empezar hoy, pero cada venta depende de que tú contestes.

## Costos

| | Comisión por venta | Mensualidad |
|---|---|---|
| Mercado Pago, dinero al instante | 3.49% + $4 + IVA | No |
| Mercado Pago, dinero a 30 días | 2.95% + $4 + IVA | No |
| Stripe, tarjeta | 3.6% + $3 + IVA | No |
| Stripe, OXXO | 4% + $3 + IVA | No |
| Supabase (plan gratis) | $0 hasta 500,000 llamadas al mes | No |

Ejemplo con Mercado Pago al instante: en una venta de $349 la comisión es de unos $18.80 (con IVA) y te quedan unos $330. En $699, unos $33.10 y te quedan unos $666.

Fuentes: Mercado Pago no dejó leer su página de costos desde aquí. Las cifras salen de Shopify (julio de 2026) y calcforlife (agosto de 2026), que coinciden. Revísalas en tu cuenta en **Tu negocio > Costos**. Stripe: stripe.com/mx/pricing.

Ojo con el SAT: estos cobros son ingresos. Pregúntale a tu contador cómo facturarlos.

## Lo que tienes que hacer tú

1. **Cuenta de Mercado Pago de vendedor** (la tuya o la de quien va a recibir el dinero).
2. **Crear la aplicación:** en mercadopago.com.mx/developers/panel, entra a **Tus integraciones**, toca **Crear aplicación**, elige *Pagos online* y luego *Checkout Pro*.
3. **Access token de producción:** en la aplicación, ve a **Credenciales de producción** y copia el *Access Token* (empieza con `APP_USR-`). **No lo pegues en el chat.**
4. **Webhook:** en la aplicación, ve a **Webhooks > Configurar notificaciones**:
   - URL de producción: `https://ctutqqstqjdngxdjzckf.supabase.co/functions/v1/pro-webhook`
   - Evento: **Pagos**
   - Guarda y copia la **clave secreta** que te muestra.
5. **Guardar las dos llaves en Supabase:** en el proyecto "Mi Tienda Beauty", ve a **Edge Functions > Secrets** y agrega:
   - `MP_ACCESS_TOKEN` = el access token
   - `MP_WEBHOOK_SECRET` = la clave secreta del webhook
6. **Crear las tablas:** en **SQL Editor** pega y corre `supabase/pro.sql` del PR. Luego pega y corre `pro-contenido.sql` (el texto de los planes; está en los archivos del proyecto, no en este repo).
7. **Precios:** confirma o cambia los propuestos: plan anual $349, planes por nivel $249, tu ritmo y 32 enfoques $199, mentora $149, equipo $149, todo $699.
8. **WhatsApp de soporte:** la página usa el de Sebas (55 4350 6136) para dudas de compras. Dime si va otro.

Cuando esté eso, yo despliego las dos funciones, hacemos una compra real de prueba (la puedes reembolsar desde Mercado Pago, y el código se apaga solo) y abro los pagos en la página.
