/* Base compartida de las páginas de la tienda (portada, producto, conóceme).
   Carga datos, aplica el tema, pinta encabezado/pie y maneja el carrito (localStorage glow_cart_<slug>). */
window.T = (function () {
  const seg = location.pathname.split("/").filter(Boolean);
  const slug = seg[0] || "";
  const BASE = document.documentElement.dataset.base || "./";
  const qs = location.search;
  const Q = new URLSearchParams(qs);
  const IMG = "https://content.mx.farmasi.com/Product/";
  const CK = "glow_cart_" + slug;
  const money = n => "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = p => Math.round((1 - p.price / p.retail) * 100);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (path, hash) => BASE + path + qs + (hash || "");
  const gc = (path, title) => { try { window.goatcounter && window.goatcounter.count && window.goatcounter.count({ path, title: title || path, event: true }); } catch (_) {} };
  const getCart = () => { try { return JSON.parse(localStorage.getItem(CK) || "{}") || {}; } catch (_) { return {}; } };
  const setCart = o => { try { localStorage.setItem(CK, JSON.stringify(o)); if (Object.keys(o).length) localStorage.setItem(CK + "_t", String(Date.now())); } catch (_) {} };
  const cartCount = () => Object.values(getCart()).reduce((a, b) => a + (+b || 0), 0);
  const BOUT = ["blancoynegro", "marfil", "rose", "arquitectura", "noir", "marino", "heritage", "naranja"];
  const IG = '<svg class="i" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>';
  const BAG = '<svg class="i" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
  const WAI = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.800 0-1.300.7-1.900.9-2.200.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.5.7 1.200 1.600 2 2.800 2.600.2.1.4.1.5-.1l.7-.9c.2-.2.4-.2.6-.1l1.900.9c.2.1.4.2.5.3.1.2.1.8-.1 1.400z"/></svg>';

  const ready = (async () => {
    let D;
    const r = await fetch(BASE + "promos.json?v=" + Date.now(), { cache: "no-store" });
    D = await r.json();
    if (D.base) {
      const B = await (await fetch(BASE + D.base + "?v=" + Date.now(), { cache: "no-store" })).json();
      D = Object.assign({}, B, D, { venta: Object.assign({}, B.venta, D.venta || {}), meta: Object.assign({}, B.meta, D.meta || {}), membresia: Object.assign({}, B.membresia, D.membresia || {}) });
      if (D.productos === undefined) D.productos = B.productos;
    }
    const now = new Date();
    const inWindow = (d, h) => (!d || now >= new Date(d)) && (!h || now <= new Date(h));
    let MAS = new Set();
    try { const m = await (await fetch(BASE + "../_data/mas-pedidos.json?v=" + Date.now(), { cache: "no-store" })).json(); MAS = new Set(m.codes || []); } catch (_) {}
    const products = D.productos.filter(p => inWindow(p.desde, p.hasta)).map(p => {
      const f = p.flash && inWindow(p.flash.desde, p.flash.hasta) ? p.flash : null;
      return { ...p, price: f ? f.price : p.price, flashEnds: f ? f.hasta : null };
    });
    const temaQ = Q.get("tema");
    const tema = temaQ === null ? (D.tema || "") : (temaQ === "normal" ? "" : temaQ);
    const boutique = BOUT.includes(tema), seasonal = !!tema && !boutique;
    if (tema) document.documentElement.dataset.tema = tema;
    if (boutique) {
      document.documentElement.setAttribute("data-boutique", "");
      const l = document.createElement("link"); l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600&family=Bodoni+Moda:wght@500&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=DM+Serif+Display&family=Jost:wght@400;500&family=Playfair+Display:ital,wght@0,500;1,500&display=swap";
      document.head.appendChild(l);
    }
    const SALE = seasonal ? D.venta.nombre : "Farmasi";
    const maxOff = Math.max(0, ...products.map(pct));
    const me = D.consultora;
    const wa = msg => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(msg)}`;
    const ig = (D.instagram || "").replace(/^@/, "");
    const days = Math.max(0, Math.ceil((new Date(D.venta.termina) - now) / 864e5));
    const T = { D, products, MAS, tema, boutique, seasonal, SALE, maxOff, me, wa, ig, days };
    chrome(T);
    return T;
  })();

  function chrome(T) {
    const { D, me, SALE, days } = T;
    document.title = (document.title || "").replace("{{SALE}}", SALE);
    const nav = [["Inicio", "./"], ["Tienda", "tienda/"], ["Catálogo", "catalogo/"], ["Conóceme", "conoce/"]];
    const here = document.documentElement.dataset.page || "";
    const hdr = document.getElementById("hdr");
    if (hdr) {
      const msg = days > 0 ? `${D.aviso && D.aviso.texto ? D.aviso.texto : "Promociones de temporada"} · termina en ${days} ${days === 1 ? "día" : "días"}` : (D.aviso && D.aviso.texto) || "";
      hdr.innerHTML = `${msg ? `<div class="ann">${esc(msg)}</div>` : ""}
      <header class="hd"><div class="wrap hd-in">
        <a class="logo" href="${link("")}"><span class="l1">${esc(SALE)}</span><span class="l2">${esc(me)}</span></a>
        <nav class="nav" aria-label="Principal">${nav.map(([t, p]) => `<a href="${link(p)}"${here === p.replace("/", "") || (here === "inicio" && p === "./") ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
        <a class="bagbtn" href="${link("tienda/", "#pedido")}" aria-label="Ver mi pedido">${BAG}<b id="bagN"></b></a>
      </div></header>`;
      paintBag();
    }
    const ftr = document.getElementById("ftr");
    if (ftr) {
      ftr.innerHTML = `<footer class="ft"><div class="wrap">
        <div class="ft-top"><div><div class="logo"><span class="l1">${esc(SALE)}</span><span class="l2">${esc(me)}</span></div>
          <p>Consultora independiente Farmasi. Pides aquí y tu pedido me llega por WhatsApp; te confirmo existencias antes de pagar.</p></div>
          <div class="ft-links"><a href="${link("tienda/")}">Tienda</a><a href="${link("catalogo/")}">Catálogo</a><a href="${link("conoce/")}">Conóceme</a><a href="${link("conoce/", "#socia")}">Hazte socia</a>
            <a href="${T.wa("Hola " + me + ", tengo una duda.")}" target="_blank" rel="noopener">WhatsApp</a>${T.ig ? `<a href="https://instagram.com/${esc(T.ig)}" target="_blank" rel="noopener">Instagram</a>` : ""}</div></div>
        <div class="ft-bot">${esc(D.venta.fechas || "")}${D.venta.fechas ? " · " : ""}Precios en MXN. Promociones sujetas a existencias.</div></div></footer>`;
    }
    const fab = document.createElement("a");
    fab.className = "wafab"; fab.target = "_blank"; fab.rel = "noopener"; fab.setAttribute("aria-label", "Escribir por WhatsApp");
    fab.href = T.wa("Hola " + me + ", tengo una duda sobre tu tienda."); fab.innerHTML = WAI;
    fab.addEventListener("click", () => gc("wa-flotante", "WhatsApp flotante"));
    document.body.appendChild(fab);
  }
  function paintBag() { const n = cartCount(), b = document.getElementById("bagN"); if (b) { b.textContent = n || ""; b.hidden = !n; } }

  return { slug, BASE, qs, Q, IMG, money, pct, esc, link, gc, getCart, setCart, cartCount, paintBag, IG, BAG, ready };
})();
