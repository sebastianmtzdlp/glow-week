// pro-datos: la nube de las herramientas Pro. Despliega con verify_jwt = false (como pro-pago).
//   datos.lee      {codigo, herramienta}                      → {datos}
//   datos.guarda   {codigo, herramienta, datos, publico?}     → {ok}      (publico: usa datos.clave)
//   datos.publico  {herramienta, clave}                       → {datos}   (solo campos permitidos)
//   reto.crea      {codigo, nombre, inicio, dias, tareas[]}   → {reto}
//   reto.une       {reto, nombre}                             → {socia, token}
//   reto.reporta   {reto, socia, token, dia, hechas, nota?}   → {ok}
//   reto.tablero   {reto, codigo?}                            → {reto, socias[], lider}
//   pedidos.lee    {codigo}                                   → {pedidos[]}  (de la consultora dueña del código)
//   testimonio.envia   {consultora, nombre, texto}            → {ok}   (público, queda pendiente)
//   testimonio.publicos {consultora}                          → {testimonios[]}
//   testimonio.lista   {codigo}                               → {testimonios[]}
//   testimonio.modera  {codigo, id, estado}                   → {ok}
//   reunion.propone {codigo, evento}                          → {ok}
import { cors, db, json, nuevoCodigo } from "../_shared/pro.ts";

const MAX = 300_000; // bytes por herramienta
const PUBLICOS: Record<string, string[]> = { presentacion: ["h1", "h2", "h3"] };
const norm = (s: unknown) => String(s ?? "").trim().toUpperCase().replace(/\s+/g, "");
const slugOk = (s: unknown) => /^[a-z0-9]{1,40}$/.test(String(s ?? ""));
const hoy = () => new Date().toISOString().slice(0, 10);

async function acceso(codigo: unknown, herr: string) {
  const { data } = await db.from("pro_accesos").select("*").eq("codigo", norm(codigo)).eq("activo", true).maybeSingle();
  if (!data || !data.productos.includes(herr)) return null;
  return data as { codigo: string; productos: string[]; consultora: string | null };
}
function idReto() { return "RETO-" + nuevoCodigo().slice(4, 8) + nuevoCodigo().slice(4, 6); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "Solo POST" }, 405);
  let b: Record<string, any>;
  try { b = await req.json(); } catch { return json(req, { error: "JSON inválido" }, 400); }
  const no = (m = "Tu código no incluye esta herramienta") => json(req, { error: m }, 403);

  try {
    switch (b.accion) {
      case "datos.lee": {
        const h = String(b.herramienta ?? "");
        if (!/^[a-z0-9-]+$/.test(h) || !(await acceso(b.codigo, h))) return no();
        const { data } = await db.from("pro_datos").select("datos").eq("codigo", norm(b.codigo)).eq("herramienta", h).maybeSingle();
        return json(req, { datos: data?.datos ?? null });
      }
      case "datos.guarda": {
        const h = String(b.herramienta ?? "");
        if (!/^[a-z0-9-]+$/.test(h) || !(await acceso(b.codigo, h))) return no();
        const txt = JSON.stringify(b.datos ?? null);
        if (txt.length > MAX) return json(req, { error: "Es demasiado grande para la nube" }, 413);
        const publico = !!b.publico && h in PUBLICOS;
        const clave = publico ? String(b.datos?.clave ?? "").slice(0, 40) : null;
        if (publico && !/^[a-z0-9]{1,40}$/.test(clave!)) return json(req, { error: "Falta tu nombre en la lista" }, 400);
        if (publico) { // una clave solo la puede tener un código
          const { data: otra } = await db.from("pro_datos").select("codigo").eq("herramienta", h).eq("clave", clave).eq("publico", true).neq("codigo", norm(b.codigo)).maybeSingle();
          if (otra) return json(req, { error: "Ese nombre ya lo usa otro código. Escríbenos por WhatsApp." }, 409);
        }
        const { error } = await db.from("pro_datos").upsert({ codigo: norm(b.codigo), herramienta: h, datos: b.datos, publico, clave, actualizado: new Date().toISOString() });
        if (error) throw error;
        return json(req, { ok: true });
      }
      case "datos.publico": {
        const h = String(b.herramienta ?? "");
        const campos = PUBLICOS[h];
        if (!campos) return json(req, { datos: null });
        const { data } = await db.from("pro_datos").select("datos").eq("herramienta", h).eq("clave", String(b.clave ?? "")).eq("publico", true).maybeSingle();
        if (!data) return json(req, { datos: null });
        const out: Record<string, unknown> = {};
        for (const c of campos) if (typeof data.datos?.[c] === "string") out[c] = data.datos[c].slice(0, 400);
        return json(req, { datos: out });
      }

      case "reto.crea": {
        const a = await acceso(b.codigo, "reto"); if (!a) return no();
        const tareas = (Array.isArray(b.tareas) ? b.tareas : []).map((t: unknown) => String(t).trim().slice(0, 80)).filter(Boolean).slice(0, 5);
        const dias = Math.min(60, Math.max(3, Number(b.dias) || 14));
        const nombre = String(b.nombre ?? "").trim().slice(0, 60);
        if (!nombre || !tareas.length || !/^\d{4}-\d{2}-\d{2}$/.test(String(b.inicio))) return json(req, { error: "Faltan el nombre, el inicio o las tareas" }, 400);
        const { count } = await db.from("pro_retos").select("id", { count: "exact", head: true }).eq("codigo", a.codigo).eq("cerrado", false);
        if ((count ?? 0) >= 3) return json(req, { error: "Ya tienes 3 retos abiertos. Cierra uno primero." }, 409);
        for (let i = 0; i < 5; i++) {
          const id = idReto();
          const { error } = await db.from("pro_retos").insert({ id, codigo: a.codigo, nombre, inicio: b.inicio, dias, tareas });
          if (!error) return json(req, { reto: id });
        }
        throw new Error("No se pudo crear el reto");
      }
      case "reto.une": {
        const { data: r } = await db.from("pro_retos").select("id, cerrado").eq("id", norm(b.reto)).maybeSingle();
        if (!r || r.cerrado) return json(req, { error: "Ese reto no existe o ya cerró" }, 404);
        const nombre = String(b.nombre ?? "").trim().slice(0, 40);
        if (!nombre) return json(req, { error: "Escribe tu nombre" }, 400);
        const { count } = await db.from("pro_reto_socias").select("id", { count: "exact", head: true }).eq("reto", r.id);
        if ((count ?? 0) >= 80) return json(req, { error: "El reto ya está lleno" }, 409);
        const { data, error } = await db.from("pro_reto_socias").insert({ reto: r.id, nombre }).select("id, token").single();
        if (error) throw error;
        return json(req, { socia: data.id, token: data.token });
      }
      case "reto.reporta": {
        const { data: s } = await db.from("pro_reto_socias").select("id, reto").eq("id", b.socia).eq("token", b.token).maybeSingle();
        if (!s) return json(req, { error: "No te encontramos en el reto" }, 404);
        const { data: r } = await db.from("pro_retos").select("inicio, dias, cerrado, tareas").eq("id", s.reto).single();
        const dia = String(b.dia ?? "");
        const fin = new Date(r!.inicio + "T12:00:00"); fin.setDate(fin.getDate() + r!.dias - 1);
        if (r!.cerrado || !/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia < r!.inicio || dia > fin.toISOString().slice(0, 10) || dia > hoy()) return json(req, { error: "Ese día no cuenta en el reto" }, 400);
        const hechas = Math.min(r!.tareas.length, Math.max(0, Number(b.hechas) || 0));
        const { error } = await db.from("pro_reto_reportes").upsert({ socia: s.id, dia, hechas, nota: b.nota ? String(b.nota).slice(0, 140) : null });
        if (error) throw error;
        return json(req, { ok: true });
      }
      case "reto.tablero": {
        const { data: r } = await db.from("pro_retos").select("*").eq("id", norm(b.reto)).maybeSingle();
        if (!r) return json(req, { error: "Ese reto no existe" }, 404);
        const lider = !!b.codigo && norm(b.codigo) === r.codigo;
        const { data: socias } = await db.from("pro_reto_socias").select("id, nombre, creada").eq("reto", r.id).order("creada");
        const ids = (socias ?? []).map((s) => s.id);
        const { data: reps } = ids.length ? await db.from("pro_reto_reportes").select("socia, dia, hechas, nota").in("socia", ids) : { data: [] };
        const out = (socias ?? []).map((s) => {
          const mias = (reps ?? []).filter((x) => x.socia === s.id);
          const dias = new Set(mias.filter((x) => x.hechas > 0).map((x) => x.dia));
          return {
            id: lider ? s.id : undefined, nombre: s.nombre,
            tareas: mias.reduce((a, x) => a + x.hechas, 0), dias: dias.size,
            ultimo: mias.map((x) => x.dia).sort().pop() ?? null,
            reportes: mias.map((x) => ({ dia: x.dia, hechas: x.hechas })),
          };
        });
        return json(req, { reto: { id: r.id, nombre: r.nombre, inicio: r.inicio, dias: r.dias, tareas: r.tareas, cerrado: r.cerrado }, socias: out, lider });
      }
      case "reto.cierra": {
        const a = await acceso(b.codigo, "reto"); if (!a) return no();
        await db.from("pro_retos").update({ cerrado: true }).eq("id", norm(b.reto)).eq("codigo", a.codigo);
        return json(req, { ok: true });
      }
      case "reto.mios": {
        const a = await acceso(b.codigo, "reto"); if (!a) return no();
        const { data } = await db.from("pro_retos").select("id, nombre, inicio, dias, cerrado").eq("codigo", a.codigo).order("creado", { ascending: false }).limit(10);
        return json(req, { retos: data ?? [] });
      }

      case "pedidos.lee": {
        const a = await acceso(b.codigo, "pedidos"); if (!a) return no();
        if (!a.consultora) return json(req, { error: "Tu código aún no está ligado a tu tablero. Escríbenos por WhatsApp.", sinTablero: true }, 409);
        const desde = new Date(Date.now() - 90 * 864e5).toISOString();
        const { data } = await db.from("pedidos_intencion").select("id, creado, cliente, tipo, items, total, envio").eq("consultora", a.consultora).gte("creado", desde).order("creado", { ascending: false }).limit(200);
        return json(req, { pedidos: data ?? [], consultora: a.consultora });
      }

      case "testimonio.envia": {
        if (!slugOk(b.consultora)) return json(req, { error: "Link inválido" }, 400);
        const nombre = String(b.nombre ?? "").trim().slice(0, 40), texto = String(b.texto ?? "").trim();
        if (b.web) return json(req, { ok: true }); // trampa para bots
        if (!nombre || texto.length < 10 || texto.length > 400) return json(req, { error: "Cuéntanos un poco más (entre 10 y 400 letras)" }, 400);
        const { data: dueña } = await db.from("pro_accesos").select("productos").eq("consultora", b.consultora).eq("activo", true);
        if (!(dueña ?? []).some((x) => x.productos.includes("testimonios"))) return json(req, { error: "Esta socia todavía no recibe testimonios por aquí" }, 404);
        const { count } = await db.from("pro_testimonios").select("id", { count: "exact", head: true }).eq("consultora", b.consultora).eq("estado", "pendiente");
        if ((count ?? 0) >= 40) return json(req, { error: "Ahorita no podemos recibir más. Intenta en unos días." }, 429);
        const { error } = await db.from("pro_testimonios").insert({ consultora: b.consultora, nombre, texto });
        if (error) throw error;
        return json(req, { ok: true });
      }
      case "testimonio.publicos": {
        if (!slugOk(b.consultora)) return json(req, { testimonios: [] });
        // solo se muestran si la dueña tiene Pro activo
        const { data: dueña } = await db.from("pro_accesos").select("productos").eq("consultora", b.consultora).eq("activo", true);
        if (!(dueña ?? []).some((x) => x.productos.includes("testimonios"))) return json(req, { testimonios: [] });
        const { data } = await db.from("pro_testimonios").select("nombre, texto, creado").eq("consultora", b.consultora).eq("estado", "aprobado").order("creado", { ascending: false }).limit(12);
        return json(req, { testimonios: data ?? [] });
      }
      case "testimonio.lista": {
        const a = await acceso(b.codigo, "testimonios"); if (!a) return no();
        if (!a.consultora) return json(req, { error: "Tu código aún no está ligado a tu tablero.", sinTablero: true }, 409);
        const { data } = await db.from("pro_testimonios").select("id, nombre, texto, estado, creado").eq("consultora", a.consultora).neq("estado", "oculto").order("creado", { ascending: false }).limit(100);
        return json(req, { testimonios: data ?? [], consultora: a.consultora });
      }
      case "testimonio.modera": {
        const a = await acceso(b.codigo, "testimonios"); if (!a || !a.consultora) return no();
        if (!["aprobado", "oculto", "pendiente"].includes(b.estado)) return json(req, { error: "Estado inválido" }, 400);
        await db.from("pro_testimonios").update({ estado: b.estado }).eq("id", b.id).eq("consultora", a.consultora);
        return json(req, { ok: true });
      }

      case "reunion.propone": {
        const a = await acceso(b.codigo, "reunion"); if (!a) return no();
        const txt = JSON.stringify(b.evento ?? null);
        if (txt.length > 4000) return json(req, { error: "Muy largo" }, 413);
        const { count } = await db.from("pro_propuestas").select("id", { count: "exact", head: true }).eq("codigo", a.codigo).eq("estado", "nueva");
        if ((count ?? 0) >= 5) return json(req, { error: "Ya tienes 5 propuestas esperando" }, 409);
        await db.from("pro_propuestas").insert({ codigo: a.codigo, evento: b.evento });
        return json(req, { ok: true });
      }
    }
    return json(req, { error: "Acción desconocida" }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { error: "Algo falló de nuestro lado. Intenta de nuevo en un momento." }, 500);
  }
});
