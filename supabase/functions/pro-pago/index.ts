// pro-pago: lo llama la página. Tres acciones:
//   crear  {producto, email}            → crea la compra y la preferencia de Checkout Pro, regresa {url}
//   estado {compra, token, pago?}       → si ya se pagó regresa {codigo, productos}
//   abrir  {codigo, producto?}          → valida el código; con producto regresa sus capítulos
import { confirmaPago, cors, db, json, mp, SITIO } from "../_shared/pro.ts";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "Solo POST" }, 405);
  let b: Record<string, string>;
  try { b = await req.json(); } catch { return json(req, { error: "JSON inválido" }, 400); }

  try {
    if (b.accion === "crear") {
      const email = String(b.email ?? "").trim().toLowerCase();
      if (!EMAIL.test(email)) return json(req, { error: "Revisa tu correo" }, 400);
      const { data: prod } = await db.from("pro_productos").select("*").eq("slug", b.producto).eq("activo", true).maybeSingle();
      if (!prod) return json(req, { error: "Ese plan no existe" }, 404);
      const { data: compra, error } = await db.from("pro_compras")
        .insert({ producto: prod.slug, email, precio: prod.precio }).select("id, token").single();
      if (error) throw error;
      const regreso = `${SITIO}/mentorias/herramientas/pro/gracias/?compra=${compra.id}&t=${compra.token}`;
      const pref = await mp("/checkout/preferences", {
        method: "POST",
        headers: { "X-Idempotency-Key": compra.id },
        body: JSON.stringify({
          items: [{ id: prod.slug, title: `${prod.titulo} · Herramientas Pro`, quantity: 1, unit_price: Number(prod.precio), currency_id: "MXN", category_id: "learnings" }],
          payer: { email },
          external_reference: compra.id,
          notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/pro-webhook`,
          back_urls: { success: regreso, pending: regreso, failure: `${SITIO}/mentorias/herramientas/pro/?pago=no#${prod.slug}` },
          auto_return: "approved",
          statement_descriptor: "MITIENDA BEAUTY",
          metadata: { compra: compra.id },
        }),
      });
      await db.from("pro_compras").update({ mp_preferencia: pref.id }).eq("id", compra.id);
      return json(req, { url: pref.init_point });
    }

    if (b.accion === "estado") {
      let { data: compra } = await db.from("pro_compras").select("*").eq("id", b.compra).eq("token", b.token).maybeSingle();
      if (!compra) return json(req, { error: "No encontramos esa compra" }, 404);
      if (compra.estado !== "pagada" && b.pago && /^\d+$/.test(String(b.pago))) {
        const c = await confirmaPago(String(b.pago));
        if (c && c.id === compra.id) compra = c;
      }
      if (compra.estado !== "pagada") return json(req, { estado: compra.estado });
      const { data: acc } = await db.from("pro_accesos").select("productos").eq("codigo", compra.codigo).single();
      return json(req, { estado: "pagada", codigo: compra.codigo, productos: acc?.productos ?? [] });
    }

    if (b.accion === "abrir") {
      const codigo = String(b.codigo ?? "").trim().toUpperCase().replace(/\s+/g, "");
      const { data: acc } = await db.from("pro_accesos").select("*").eq("codigo", codigo).eq("activo", true).maybeSingle();
      if (!acc) return json(req, { error: "Ese código no existe o ya no está activo" }, 404);
      const out: Record<string, unknown> = { productos: acc.productos };
      if (b.producto) {
        if (!acc.productos.includes(b.producto)) return json(req, { error: "Tu código no incluye ese plan", productos: acc.productos }, 403);
        const { data: caps } = await db.from("pro_contenido").select("orden, titulo, html").eq("producto", b.producto).order("orden");
        out.capitulos = caps ?? [];
        await db.from("pro_accesos").update({ usos: acc.usos + 1, ultimo_uso: new Date().toISOString() }).eq("codigo", codigo);
      }
      return json(req, out);
    }
    return json(req, { error: "Acción desconocida" }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { error: "Algo falló de nuestro lado. Intenta de nuevo en un momento." }, 500);
  }
});
