// Lógica compartida de las herramientas Pro: base de datos, Mercado Pago y códigos de acceso.
// Variables (Supabase > Edge Functions > Secrets):
//   MP_ACCESS_TOKEN     access token de producción de Mercado Pago (APP_USR-...)  ← lo pone Pasha
//   MP_WEBHOOK_SECRET   clave secreta de las notificaciones (Webhooks) de Mercado Pago ← lo pone Pasha
//   SITIO               opcional, por defecto https://mitienda.beauty
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya vienen puestas en cada Edge Function.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

export const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
export const SITIO = Deno.env.get("SITIO") ?? "https://mitienda.beauty";
const MP = "https://api.mercadopago.com";

export function token() {
  const t = Deno.env.get("MP_ACCESS_TOKEN");
  if (!t) throw new Error("Falta MP_ACCESS_TOKEN");
  return t;
}

export async function mp(path: string, init: RequestInit = {}) {
  const r = await fetch(MP + path, {
    ...init,
    headers: { "Authorization": `Bearer ${token()}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I
export function nuevoCodigo() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  const s = Array.from(b, (x) => LETRAS[x % LETRAS.length]).join("");
  return `SVH-${s.slice(0, 4)}-${s.slice(4)}`;
}

/** Revisa un pago en Mercado Pago y, si está aprobado y cuadra con la compra, entrega el código. */
export async function confirmaPago(pagoId: string) {
  const pago = await mp(`/v1/payments/${encodeURIComponent(pagoId)}`);
  const compraId = pago.external_reference as string | undefined;
  if (!compraId) return null;
  const { data: compra } = await db.from("pro_compras").select("*").eq("id", compraId).maybeSingle();
  if (!compra) return null;
  if (pago.status !== "approved") {
    if (["rejected", "cancelled"].includes(pago.status) && compra.estado === "pendiente") {
      await db.from("pro_compras").update({ estado: "rechazada", mp_pago: String(pago.id) }).eq("id", compra.id);
    }
    if (pago.status === "refunded" || pago.status === "charged_back") {
      await db.from("pro_compras").update({ estado: "reembolsada" }).eq("id", compra.id);
      if (compra.codigo) await db.from("pro_accesos").update({ activo: false }).eq("codigo", compra.codigo);
    }
    return compra;
  }
  if (Number(pago.transaction_amount) + 0.01 < Number(compra.precio) || pago.currency_id !== "MXN") return compra;
  if (compra.estado === "pagada" && compra.codigo) return compra;

  const { data: prod } = await db.from("pro_productos").select("incluye").eq("slug", compra.producto).single();
  let codigo = compra.codigo as string | null;
  for (let i = 0; !codigo && i < 5; i++) {
    const c = nuevoCodigo();
    const { error } = await db.from("pro_accesos").insert({
      codigo: c, productos: prod!.incluye, email: compra.email, origen: "compra", compra: compra.id,
    });
    if (!error) codigo = c;
  }
  const { data: lista } = await db.from("pro_compras")
    .update({ estado: "pagada", mp_pago: String(pago.id), codigo, pagada: new Date().toISOString() })
    .eq("id", compra.id).select("*").single();
  return lista;
}

export function cors(req: Request) {
  const o = req.headers.get("origin") ?? "";
  const ok = o === SITIO || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
  return {
    "Access-Control-Allow-Origin": ok ? o : SITIO,
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
export function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
}
