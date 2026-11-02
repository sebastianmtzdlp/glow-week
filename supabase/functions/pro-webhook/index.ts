// pro-webhook: Mercado Pago avisa aquí cada vez que cambia un pago.
// Se valida la firma (x-signature) con MP_WEBHOOK_SECRET y luego se consulta el pago
// directo en la API de Mercado Pago: nunca se confía en lo que viene en el aviso.
import { confirmaPago } from "../_shared/pro.ts";

async function firmaValida(req: Request, dataId: string) {
  const secreto = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secreto) return true; // sin secreto todavía: igual se verifica el pago en la API
  const sig = req.headers.get("x-signature") ?? "";
  const rid = req.headers.get("x-request-id") ?? "";
  const partes = Object.fromEntries(sig.split(",").map((p) => p.trim().split("=", 2)));
  if (!partes.ts || !partes.v1) return false;
  const manifiesto = `id:${dataId.toLowerCase()};request-id:${rid};ts:${partes.ts};`;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const f = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(manifiesto));
  const hex = Array.from(new Uint8Array(f), (x) => x.toString(16).padStart(2, "0")).join("");
  return hex === partes.v1;
}

Deno.serve(async (req) => {
  const u = new URL(req.url);
  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { /* algunos avisos llegan sin cuerpo */ }
  const tipo = u.searchParams.get("type") ?? u.searchParams.get("topic") ?? body.type ?? body.topic;
  const id = String(u.searchParams.get("data.id") ?? u.searchParams.get("id") ?? body?.data?.id ?? "");
  if (tipo !== "payment" || !/^\d+$/.test(id)) return new Response("ignorado", { status: 200 });
  if (!(await firmaValida(req, id))) return new Response("firma inválida", { status: 401 });
  try {
    await confirmaPago(id);
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 }); // Mercado Pago reintenta
  }
  return new Response("ok", { status: 200 });
});
