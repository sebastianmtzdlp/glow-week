/* Ventas por WhatsApp · Tarjetas y catálogo PDF. Usa base.js (H), marca.js (MarcaSVH) y ventas.js (VentasWA). */

(async function(){
  var $ = function(id){ return document.getElementById(id); };
  var LSK = "glow_tarjetas";
  var S = Object.assign({desc: 0, pdfTit: "", pdfSub: "", fmt: "cuadrada", modo: "una", frase: "", conWa: false, sel: [], esp: {}, nom: {}}, H.lee(LSK, {}));
  function save(){ H.guarda(LSK, S); }
  var money = function(n){ var c = Math.round(n * 100) / 100; return "$" + c.toLocaleString("es-MX", c % 1 ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {maximumFractionDigits: 0}); };
  var esc = H.esc;

  /* ---------- Datos: catálogo, fuera del catálogo y tablero (sin inventar precios) ---------- */
  var CAT = {}, FUE = {}, BASE = {}, EQ = [];
  var r = await Promise.all([
    fetch("/_data/catalogo-farmasi.json").then(function(x){ return x.json(); }).catch(function(){ return {}; }),
    fetch("/_data/fuera-de-catalogo.json").then(function(x){ return x.json(); }).catch(function(){ return {}; }),
    fetch("/_data/promos-base.json").then(function(x){ return x.json(); }).catch(function(){ return {}; }),
    H.equipo()
  ]);
  CAT = r[0]; FUE = r[1]; BASE = r[2]; EQ = r[3].slice().sort(function(a, b){ return a.nombre.localeCompare(b.nombre, "es"); });

  var SECTIONS = [["Labios",8],["Ojos",20],["Rostro",38],["Brochas",55],["Fragancias",56],["Hombre",58],["Cuidado personal",62],["Skincare",66],["Masaje",112],["Cabello",114],["Nutriplus",118]];
  var ORDEN = ["Kits","Labios","Ojos","Rostro","Skincare","Fragancias","Cuidado personal","Cabello","Hombre","Brochas","Masaje","Nutriplus","Fuera del catálogo"];
  var pageOf = {};
  (CAT.productos || []).forEach(function(items, i){ (items || []).forEach(function(it){ if(!(it[0] in pageOf)) pageOf[it[0]] = i + 1; }); });
  function secc(code){ var p = pageOf[code], s = ""; if(!p) return ""; SECTIONS.forEach(function(x){ if(p >= x[1]) s = x[0]; }); return s; }
  var KEEP = /^(VFX|FDT|SPF|BB|CC|DD|XL|UV|PRO|II|III|3D|4D)$/;
  function bonito(n){
    n = String(n || "").replace(/^FRM\s+/i, "").replace(/\s+/g, " ").trim();
    if(n === n.toUpperCase() && /[A-Z]/.test(n)){
      n = n.split(" ").map(function(w){ return (KEEP.test(w) || /\d/.test(w) && w.length <= 4) ? w : w.charAt(0) + w.slice(1).toLowerCase(); }).join(" ");
      n = n.replace(/(\d)\s?ML\b/gi, "$1 ml").replace(/(\d)\s?G\b/g, "$1 g");
    }
    return n;
  }
  var ENT = {}; /* códigos que abren directo en el tablero con ?p= */
  var LIST = [], IDX = {};
  function add(o){ if(!o.code || IDX[o.code] || !(o.pub > 0)) return; IDX[o.code] = o; LIST.push(o); }
  var esp = BASE.especial && BASE.especial.productos ? BASE.especial.productos : [];
  esp.concat(BASE.productos || []).forEach(function(p){
    ENT[p.code] = 1;
    var catP = p.cat && ORDEN.indexOf(p.cat) >= 0 ? p.cat : (secc(p.code) || p.cat || "Kits");
    add({code: p.code, name: p.name, shade: p.shade || "", pub: +p.retail || +p.price, cat: catP, img: p.img || ""});
  });
  var P = CAT.precios || {};
  Object.keys(P).forEach(function(c){ var v = P[c]; if(!v[3]) return; add({code: c, name: bonito(v[0]), shade: "", pub: +v[2], cat: secc(c) || "Más", img: ""}); });
  (FUE.grupos || []).forEach(function(g){ if(/tarjeta/i.test(g.titulo)) return; (g.items || []).forEach(function(it){ add({code: it[0], name: bonito(it[1]), shade: "", pub: +it[2], cat: "Fuera del catálogo", img: ""}); }); });
  var AGO = {}; (BASE.agotados || []).forEach(function(c){ AGO[c] = 1; });
  LIST = LIST.filter(function(p){ return !AGO[p.code]; });
  S.sel = S.sel.filter(function(c){ return IDX[c]; });

  /* fotos: la vista usa el CDN; la imagen final necesita una copia que el navegador deje dibujar */
  var CDN = "https://content.mx.farmasi.com/Product/";
  function srcs(p){
    var base = [];
    if(p.img) base.push(p.img.replace("_250", "_400"), p.img);
    ["_400", "_400_1", "_250", "_250_1"].forEach(function(x){ base.push(p.code + x); });
    return base.filter(function(v, i, a){ return a.indexOf(v) === i; }).map(function(x){ return CDN + x + ".webp"; });
  }
  window.__fb = function(el){ var l = JSON.parse(el.dataset.l); var n = +el.dataset.i + 1; if(n < l.length){ el.dataset.i = n; el.src = l[n]; } else { el.outerHTML = '<span class="ini">' + esc(el.dataset.ini) + '</span>'; } };
  function thumb(p){ var l = srcs(p); return '<img loading="lazy" alt="" src="' + l[0] + '" data-i="0" data-ini="' + esc(p.name.charAt(0)) + '" data-l=\'' + JSON.stringify(l) + '\' onerror="__fb(this)">'; }
  var FOTO = {};
  function cargaUna(url, cors){
    return new Promise(function(ok){
      var im = new Image(); if(cors) im.crossOrigin = "anonymous";
      im.onload = function(){ ok(im.naturalWidth ? im : null); }; im.onerror = function(){ ok(null); };
      im.src = url;
    });
  }
  function foto(p){
    if(FOTO[p.code]) return FOTO[p.code];
    var urls = ["/ventas-de-whatsapp/fotos/" + p.code + ".webp", "/ventas-de-whatsapp/fotos/" + p.code + ".png"].concat(srcs(p).slice(0, 3));
    var prox = srcs(p).slice(0, 2).map(function(u){ return "https://wsrv.nl/?url=" + encodeURIComponent(u.replace("https://", "")) + "&output=png"; });
    urls = urls.concat(prox);
    FOTO[p.code] = (async function(){ for(var i = 0; i < urls.length; i++){ var im = await cargaUna(urls[i], i >= 2); if(im) return im; } return null; })();
    return FOTO[p.code];
  }

  /* ---------- Precios de la tienda de la socia (los mismos que ve su clienta en mitienda.beauty/<slug>/) ----------
     Se leen de <slug>/promos.json + promos-base.json igual que el tablero: favoritos, venta especial vigente,
     flash sale vigente y agotados. Si cambia la tienda, cambia aquí solo. */
  var TIE = {}; /* código -> {price, retail} de lo que su tienda vende hoy */
  function enVentana(o, now){ return (!o.desde || now >= new Date(o.desde)) && (!o.hasta || now <= new Date(o.hasta)); }
  function armaTienda(D){
    var now = new Date(), t = {}, ago = {};
    (D.agotados || []).forEach(function(c){ ago[c] = 1; });
    var esp = D.especial && (D.especial.productos || []).length && enVentana(D.especial, now) ? D.especial.productos : [];
    var fav = D.favoritos && D.favoritos.productos ? D.favoritos.productos : [];
    esp.concat(fav, D.productos || []).forEach(function(p){
      if(!p.code || t[p.code] || ago[p.code] || !enVentana(p, now)) return;
      var f = p.flash && enVentana(p.flash, now) ? p.flash : null, pr = +(f ? f.price : p.price);
      if(pr > 0) t[p.code] = {price: pr, retail: +p.retail || pr};
    });
    /* su tienda también vende todo el catálogo a precio de catálogo (salvo "catalogo_completo": false) */
    if(D.catalogo_completo !== false){
      Object.keys(CAT.precios || {}).forEach(function(c){ var v = CAT.precios[c]; if(v[3] && +v[1] > 0 && !t[c] && !ago[c]) t[c] = {price: +v[1], retail: Math.max(+v[2] || 0, +v[1])}; });
      (FUE.grupos || []).forEach(function(g){ if(/tarjeta/i.test(g.titulo)) return; (g.items || []).forEach(function(it){ if(+it[2] > 0 && !t[it[0]] && !ago[it[0]]) t[it[0]] = {price: +it[2], retail: +it[2]}; }); });
    }
    return t;
  }
  var CARGA = {};
  function cargaTienda(slug){
    if(!slug){ TIE = armaTienda(BASE); return Promise.resolve(); }
    if(!CARGA[slug]) CARGA[slug] = fetch("/" + slug + "/promos.json?v=" + Date.now(), {cache: "no-store"}).then(function(x){ return x.json(); }).catch(function(){ return {}; }).then(function(L){
      var B = BASE, D = Object.assign({}, B, L, {venta: Object.assign({}, B.venta, L.venta || {})});
      return armaTienda(D);
    });
    return CARGA[slug].then(function(t){ if(YO && YO.slug === slug) TIE = t; });
  }
  TIE = armaTienda(BASE);

  /* ---------- Quién eres (viene del selector de arriba, ventas.js) ---------- */
  var YO = null, waBonito = VentasWA.waBonito, tiendaDe = VentasWA.tienda, PDF_AUTO = "";
  $("conWa").checked = !!S.conWa;
  $("conWa").onchange = function(){ S.conWa = this.checked; save(); pinta(); };
  function alCambiarYo(c){
    YO = c;
    $("waTxt").textContent = YO ? "WhatsApp " + waBonito(YO.whatsapp) : "";
    /* el título del PDF sigue a la socia mientras no lo hayas cambiado a mano */
    var auto = YO ? "Catálogo de venta de " + (YO.tienda || YO.nombre) : "";
    if(!$("pdfTit").value || $("pdfTit").value === PDF_AUTO){ $("pdfTit").value = S.pdfTit || auto; }
    PDF_AUTO = auto;
    if(typeof pinta === "function") pinta();
    cargaTienda(YO && YO.slug).then(function(){ if(typeof pinta === "function"){ marcaDesc(); pintaGrid(); pintaEleg(); pinta(); } });
  }

  /* ---------- 2. Descuento ---------- */
  var DESC = [0, 10, 15, 20, 25, 30];
  /* Ya no hay paso de descuento: lo de su tienda sale a precio de tienda y lo demás a precio público.
     Para algo distinto, la socia escribe el precio especial de ese producto. */
  S.desc = 0;
  function marcaDesc(){}
  function precioCon(pub, d){ return Math.round(pub * (1 - d / 100)); }

  function precioDe(p){
    var e = S.esp[p.code];
    if(e != null && e !== "" && +e > 0) return {fin: Math.round(+e), pub: p.pub, esp: true};
    var t = TIE[p.code];
    if(t) return {fin: t.price, pub: Math.max(t.retail, t.price), tienda: true}; /* igual que en su tienda: el link lo agrega a ese precio */
    return {fin: precioCon(p.pub, S.desc), pub: p.pub, esp: false};
  }
  function nombreDe(p){ return (S.nom[p.code] || "").trim() || p.name; }

  /* ---------- 3. Productos ---------- */
  var cats = ORDEN.filter(function(c){ return LIST.some(function(p){ return p.cat === c; }); });
  var CATSEL = "", Q = "", LIM = 24;
  $("chips").innerHTML = ['<button type="button" class="chip" data-c="" aria-pressed="true">Todo</button>'].concat(cats.map(function(c){ return '<button type="button" class="chip" data-c="' + esc(c) + '" aria-pressed="false">' + esc(c) + '</button>'; })).join("");
  $("chips").onclick = function(e){ var b = e.target.closest(".chip"); if(!b) return; CATSEL = b.dataset.c; LIM = 24; $("chips").querySelectorAll(".chip").forEach(function(x){ x.setAttribute("aria-pressed", x === b); }); pintaGrid(); };
  var norm = function(s){ return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  $("q").oninput = function(){ Q = norm(this.value.trim()); LIM = 24; pintaGrid(); };
  var check = '<span class="ok" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>';
  function pintaGrid(){
    var l = LIST.filter(function(p){ return (!CATSEL || p.cat === CATSEL) && (!Q || norm(p.name + " " + p.shade + " " + p.code).indexOf(Q) >= 0); });
    $("cuantos").textContent = l.length + (l.length === 1 ? " producto" : " productos");
    $("grid").innerHTML = l.slice(0, LIM).map(function(p){
      var pr = precioDe(p), on = S.sel.indexOf(p.code) >= 0;
      return '<button type="button" class="prod" data-code="' + p.code + '" aria-pressed="' + on + '">' + check + '<span class="im">' + thumb(p) + '</span><b>' + esc(nombreDe(p)) + '</b><span class="pp">' + (pr.fin < pr.pub ? '<s>' + money(pr.pub) + '</s>' : '') + '<span>' + money(pr.fin) + '</span></span></button>';
    }).join("");
    $("mas").hidden = l.length <= LIM;
  }
  $("mas").onclick = function(){ LIM += 24; pintaGrid(); };
  $("grid").onclick = function(e){
    var b = e.target.closest(".prod"); if(!b) return;
    var c = b.dataset.code, i = S.sel.indexOf(c);
    if(i >= 0) S.sel.splice(i, 1); else S.sel.push(c);
    b.setAttribute("aria-pressed", i < 0); save(); pintaEleg(); pinta();
    if(i < 0) H.cuenta("elige-producto");
  };

  /* ---------- 4. Precios de lo elegido ---------- */
  function pintaEleg(){
    var l = S.sel.map(function(c){ return IDX[c]; });
    $("vacio").hidden = l.length > 0;
    $("eleg").innerHTML = l.map(function(p){
      var pr = precioDe(p);
      return '<li data-code="' + p.code + '"><span class="th">' + thumb(p) + '</span>' +
        '<input class="nom" type="text" value="' + esc(nombreDe(p)) + '" aria-label="Nombre en la tarjeta" maxlength="60">' +
        '<button class="quita" type="button" aria-label="Quitar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<div class="precios"><span class="pub">' + (TIE[p.code] && !pr.esp ? "Precio de tu tienda " + money(pr.fin) : "Público " + money(p.pub)) + '</span><label>Especial <input type="number" inputmode="numeric" min="1" step="1" class="esp" placeholder="' + (TIE[p.code] ? TIE[p.code].price : precioCon(p.pub, S.desc)) + '" value="' + (S.esp[p.code] || "") + '" aria-label="Precio especial"></label></div></li>';
    }).join("");
    $("fija").hidden = !l.length;
    $("fijaTxt").textContent = l.length + (l.length === 1 ? " elegido" : " elegidos");
    $("filaModo").hidden = l.length < 2;
  }
  var tm;
  $("eleg").addEventListener("input", function(e){
    var li = e.target.closest("li"); if(!li) return; var c = li.dataset.code;
    if(e.target.classList.contains("esp")){ var v = e.target.value; if(v) S.esp[c] = Math.round(+v); else delete S.esp[c]; }
    if(e.target.classList.contains("nom")){ var t = e.target.value.trim(); if(t && t !== IDX[c].name) S.nom[c] = t; else delete S.nom[c]; }
    save(); clearTimeout(tm); tm = setTimeout(function(){ pinta(); pintaGrid(); }, 250);
  });
  $("eleg").addEventListener("click", function(e){
    var b = e.target.closest(".quita"); if(!b) return; var c = b.closest("li").dataset.code;
    S.sel = S.sel.filter(function(x){ return x !== c; }); save(); pintaEleg(); pintaGrid(); pinta();
  });

  /* ---------- 4. Imagen para el chat ---------- */
  var M = MarcaSVH, K = M.K;
  function marcaOpts(){
    $("fmt").querySelectorAll("button").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.f === S.fmt); });
    $("modo").querySelectorAll("button").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.m === S.modo); });
    $("frase").value = S.frase || "";
    $("pdfSub").value = S.pdfSub || "";
  }
  $("fmt").onclick = function(e){ var b = e.target.closest("button"); if(!b) return; S.fmt = b.dataset.f; save(); marcaOpts(); pinta(); };
  $("modo").onclick = function(e){ var b = e.target.closest("button"); if(!b) return; S.modo = b.dataset.m; save(); marcaOpts(); pinta(); };
  $("frase").oninput = function(){ S.frase = this.value; save(); clearTimeout(tm); tm = setTimeout(pinta, 250); };
  $("pdfTit").oninput = function(){ S.pdfTit = this.value === PDF_AUTO ? "" : this.value; save(); clearTimeout(tm); tm = setTimeout(pintaPDF, 300); };
  $("pdfSub").oninput = function(){ S.pdfSub = this.value; save(); clearTimeout(tm); tm = setTimeout(pintaPDF, 300); };

  /* ?agrega= abre su tienda con el producto ya en el pedido de la clienta (lo lee el tablero) */
  /* con precio especial a mano la liga lo lleva (código:precio) y su tienda lo respeta */
  function codLiga(p){ var r = precioDe(p); return p.code + (r.esp ? ":" + r.fin : ""); }
  function ligaProd(p){ if(!YO) return ""; return "https://mitienda.beauty/" + YO.slug + "/" + (TIE[p.code] ? "?agrega=" + codLiga(p) : ""); }
  function ligaTodos(l){ var c = l.filter(function(p){ return TIE[p.code]; }).map(codLiga); return YO && c.length > 1 ? "https://mitienda.beauty/" + YO.slug + "/?agrega=" + c.join(",") : ""; }
  function ligaTienda(){ return YO ? "https://mitienda.beauty/" + YO.slug + "/" : ""; }
  function ligaCorta(){ return YO ? "mitienda.beauty/" + YO.slug : "mitienda.beauty"; }
  function off(pr){ return pr.fin < pr.pub ? Math.round((1 - pr.fin / pr.pub) * 100) : 0; }

  function cabecera(x, X, Y, s, col){
    var nombre = YO ? tiendaDe(YO) : "Mi tienda";
    M.logo(x, X, Y - s / 2, s, K.accent, "#FFFFFF");
    x.fillStyle = col || K.ink; x.textBaseline = "middle"; x.textAlign = "left";
    M.ajusta(x, nombre, "600 {s}px Outfit", Math.round(s * .66), 1080 - X * 2 - s * 1.3, 22);
    x.fillText(nombre, X + s * 1.25, Y + 2);
  }
  /* banda marina al pie: liga, QR y (si quieres) WhatsApp. Es la misma en todo: no se puede quitar */
  function banda(x, W, H2, alto, url, pad){
    var y0 = H2 - alto; pad = pad || 72;
    x.fillStyle = K.navy; x.fillRect(0, y0, W, alto);
    x.fillStyle = K.accent; x.fillRect(0, y0, W, Math.round(alto * .035));
    var qs = Math.round(alto * .66), qx = W - pad - qs, qy = y0 + (alto - qs) / 2 + alto * .02;
    M.qr(x, url, qx, qy, qs, K.navy, "#FFFFFF", 14);
    x.textAlign = "left"; x.textBaseline = "alphabetic";
    var tx = pad, maxw = qx - pad - 28, base = y0 + alto * .36;
    x.fillStyle = K.pink; x.font = "500 " + Math.round(alto * .105) + "px Outfit"; x.fillText("Pídelo en mi tienda", tx, base);
    x.fillStyle = "#FFFFFF"; M.ajusta(x, ligaCorta(), "600 {s}px 'IBM Plex Mono'", Math.round(alto * .16), maxw, 20); x.fillText(ligaCorta(), tx, base + alto * .22);
    if(S.conWa && YO){ x.fillStyle = "#C9CCE3"; x.font = "500 " + Math.round(alto * .095) + "px 'IBM Plex Mono'"; x.fillText("WhatsApp " + waBonito(YO.whatsapp), tx, base + alto * .4); }
    return {x: 0, y: y0, w: W, h: alto, url: url};
  }
  function precioEnEtiqueta(x, p, cx, cy, w, h, ang){
    var pr = precioDe(p), o = off(pr);
    var t = M.etiqueta(x, cx, cy, w, h, ang, K.accent, "#FFFFFF");
    x.save(); x.translate(cx, cy); x.rotate(ang);
    var left = t.X + t.cut * 1.15, maxw = w / 2 - left - 26;
    x.fillStyle = "#FFFFFF"; x.textAlign = "left"; x.textBaseline = "alphabetic";
    var pt = money(pr.fin);
    M.ajusta(x, pt, "700 {s}px 'IBM Plex Mono'", Math.round(h * .42), maxw, 30);
    x.fillText(pt, left, o ? h * .26 : h * .15);
    if(o){
      x.globalAlpha = .85; x.font = "500 " + Math.round(h * .14) + "px 'IBM Plex Mono'";
      var a = "antes " + money(pr.pub); x.fillText(a, left, -h * .17);
      var aw = x.measureText(a).width, aw0 = x.measureText("antes ").width;
      x.fillRect(left + aw0, -h * .17 - h * .05, aw - aw0, Math.max(2, h * .016));
      x.globalAlpha = 1; x.font = "700 " + Math.round(h * .14) + "px Outfit"; x.textAlign = "right";
      x.fillText("−" + o + "%", w / 2 - 26, -h * .17);
    }
    x.restore();
  }
  function dibujaFoto(x, im, X, Y, w, h, p){
    if(im){
      var k = Math.min(w / im.naturalWidth, h / im.naturalHeight), dw = im.naturalWidth * k, dh = im.naturalHeight * k;
      x.drawImage(im, X + (w - dw) / 2, Y + (h - dh) / 2, dw, dh);
    } else {
      x.fillStyle = K.soft; x.textAlign = "center"; x.textBaseline = "middle";
      x.font = "italic 400 " + Math.round(h * .5) + "px Fraunces"; x.fillText(nombreDe(p).charAt(0), X + w / 2, Y + h / 2);
    }
  }
  function lienzo(W, H2){ var c = document.createElement("canvas"); c.width = W; c.height = H2; var x = c.getContext("2d"); x.fillStyle = K.bg; x.fillRect(0, 0, W, H2); return [c, x]; }
  function agua(x, W, H2){ M.marcaDeAgua(x, W, H2, ligaCorta(), {alpha: .045, size: Math.round(W / 42)}); }

  async function tarjetaUna(p){
    var st = S.fmt === "story", W = 1080, H2 = st ? 1920 : 1350, cx = lienzo(W, H2), c = cx[0], x = cx[1];
    var top = st ? 170 : 96, pie = st ? 330 : 270;
    cabecera(x, 72, top, 56);
    var box = st ? 860 : 600, bx = (W - box) / 2, by = top + (st ? 90 : 60);
    M.rr(x, "#FFFFFF", bx, by, box, box, 44); x.strokeStyle = K.line; x.lineWidth = 3; x.stroke();
    var im = await foto(p); dibujaFoto(x, im, bx + box * .1, by + box * .08, box * .8, box * .8, p);
    var y = by + box + (st ? 190 : 170);
    x.textAlign = "left"; x.textBaseline = "alphabetic";
    if(S.frase){ x.fillStyle = K.accentInk; x.font = "600 26px 'IBM Plex Mono'"; x.fillText(S.frase.toUpperCase(), 72, y); y += st ? 74 : 62; }
    x.fillStyle = K.ink; x.font = "400 " + (st ? 70 : 58) + "px Fraunces";
    var lh = st ? 80 : 66, maxw = W - 144 - (st ? 0 : 0), ls = M.lineas(x, nombreDe(p), maxw, 2);
    ls.forEach(function(l, i){ x.fillText(l, 72, y + i * lh); });
    y += (ls.length - 1) * lh;
    if(p.shade){ x.fillStyle = K.muted; x.font = "400 28px Outfit"; x.fillText(M.lineas(x, p.shade, W - 144, 1)[0], 72, y + 48); }
    agua(x, W, H2 - pie);
    precioEnEtiqueta(x, p, bx + box - (st ? 170 : 130), by + box - 6, st ? 480 : 420, st ? 186 : 164, -7 * Math.PI / 180);
    banda(x, W, H2, pie, ligaProd(p));
    return {canvas: c, nombre: nombreDe(p), foto: !!im};
  }
  /* celda de producto (para "todos juntos" y para el PDF) */
  function celda(x, p, im, X, Y, w, h, sz){
    M.rr(x, "#FFFFFF", X, Y, w, h, sz.r); x.strokeStyle = K.line; x.lineWidth = 2; x.stroke();
    var ph = h - sz.txt;
    dibujaFoto(x, im, X + w * .12, Y + sz.pad, w * .76, ph - sz.pad, p);
    var pr = precioDe(p), o = off(pr);
    if(o){ x.font = "700 " + sz.chip + "px Outfit"; var tt = "−" + o + "%", tw = x.measureText(tt).width; M.rr(x, K.tint, X + sz.pad, Y + sz.pad, tw + sz.chip, sz.chip * 1.7, sz.chip * .85); x.fillStyle = K.accentInk; x.textAlign = "left"; x.textBaseline = "middle"; x.fillText(tt, X + sz.pad + sz.chip / 2, Y + sz.pad + sz.chip * .88); }
    x.textBaseline = "alphabetic"; x.textAlign = "left"; x.fillStyle = K.ink; x.font = "500 " + sz.nom + "px Outfit";
    M.lineas(x, nombreDe(p), w - sz.pad * 2, 2).forEach(function(t, k){ x.fillText(t, X + sz.pad, Y + ph + sz.nom * 1.1 + k * sz.nom * 1.2); });
    var py = Y + h - sz.pad;
    x.fillStyle = K.accentInk; x.font = "700 " + sz.pre + "px 'IBM Plex Mono'"; x.fillText(money(pr.fin), X + sz.pad, py);
    if(o){ var pw = x.measureText(money(pr.fin)).width; x.fillStyle = K.muted; x.font = "500 " + Math.round(sz.pre * .5) + "px 'IBM Plex Mono'"; var s = money(pr.pub), sw = x.measureText(s).width, sx = X + sz.pad + pw + sz.pre * .3; x.fillText(s, sx, py - 3); x.fillRect(sx, py - sz.pre * .2, sw, 2); }
    return {x: X, y: Y, w: w, h: h, url: ligaProd(p)};
  }
  async function tarjetaJunta(l){
    var st = S.fmt === "story", W = 1080, H2 = st ? 1920 : 1350, cx = lienzo(W, H2), c = cx[0], x = cx[1];
    var top = st ? 170 : 96, pie = st ? 330 : 270; cabecera(x, 72, top, 56);
    var y = top + (st ? 90 : 64);
    if(S.frase){ x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillStyle = K.ink; x.font = "400 " + (st ? 62 : 52) + "px Fraunces"; x.fillText(M.lineas(x, S.frase, W - 144, 1)[0], 72, y + 40); y += st ? 84 : 70; }
    var n = l.length, cols = st ? 2 : (n <= 4 ? 2 : 3), rows = Math.ceil(n / cols), gap = 22, cw = (W - 144 - gap * (cols - 1)) / cols;
    var ch = Math.min((H2 - pie - 44 - y - gap * (rows - 1)) / rows, cw * 1.45);
    var fs = await Promise.all(l.map(foto)), sin = false;
    var sz = cols === 3 ? {r: 26, pad: 18, txt: 136, nom: 22, pre: 34, chip: 18} : {r: 30, pad: 22, txt: 156, nom: 26, pre: 42, chip: 20};
    for(var i = 0; i < n; i++){ celda(x, l[i], fs[i], 72 + (i % cols) * (cw + gap), y + Math.floor(i / cols) * (ch + gap), cw, ch, sz); if(!fs[i]) sin = true; }
    agua(x, W, H2 - pie);
    banda(x, W, H2, pie, ligaTienda());
    return {canvas: c, nombre: n + " productos", foto: !sin};
  }

  /* ---------- 5. Catálogo PDF (A4, 1240 × 1754 px por hoja) ---------- */
  var PW = 1240, PH = 1754, PIE = 250;
  function mesAnio(){ var d = new Date(); return d.toLocaleDateString("es-MX", {month: "long", year: "numeric"}).replace(" de ", " "); }
  async function portada(l){
    var cx = lienzo(PW, PH), c = cx[0], x = cx[1], links = [];
    cabecera(x, 96, 130, 64);
    x.textAlign = "left"; x.textBaseline = "alphabetic";
    x.fillStyle = K.accentInk; x.font = "600 26px 'IBM Plex Mono'"; x.fillText(mesAnio().toUpperCase() + (S.desc && !l.some(function(p){ var r = precioDe(p); return r.esp || r.tienda; }) ? "  ·  " + S.desc + "% MENOS QUE EL PRECIO PÚBLICO" : ""), 96, 330);
    var tit = $("pdfTit").value.trim() || PDF_AUTO || "Catálogo de venta";
    x.fillStyle = K.ink; var fsz = 112; x.font = "400 " + fsz + "px Fraunces";
    var ls = M.lineas(x, tit, PW - 192, 4); while(ls.length > 3 && fsz > 70){ fsz -= 8; x.font = "400 " + fsz + "px Fraunces"; ls = M.lineas(x, tit, PW - 192, 4); }
    ls.forEach(function(t, i){ x.fillText(t, 96, 450 + i * fsz * 1.02); });
    var y = 450 + (ls.length - 1) * fsz * 1.02;
    var sub = $("pdfSub").value.trim();
    if(sub){ x.fillStyle = K.muted; x.font = "400 38px Outfit"; M.lineas(x, sub, PW - 192, 2).forEach(function(t, i){ x.fillText(t, 96, y + 90 + i * 50); }); y += 50; }
    /* tres productos en abanico */
    var tres = l.slice(0, 3), fs = await Promise.all(tres.map(foto)), cw = 330, gy = Math.max(y + 170, 900);
    var pos = [[PW / 2 - cw * 1.05, gy + 40, -6], [PW / 2, gy, 0], [PW / 2 + cw * 1.05, gy + 40, 6]];
    if(tres.length === 1) pos = [pos[1]]; if(tres.length === 2) pos = [[PW / 2 - cw * .56, gy + 20, -4], [PW / 2 + cw * .56, gy + 20, 4]];
    tres.forEach(function(p, i){
      var q = pos[i]; x.save(); x.translate(q[0], q[1] + cw / 2); x.rotate(q[2] * Math.PI / 180);
      M.rr(x, "#FFFFFF", -cw / 2, -cw / 2, cw, cw, 32); x.strokeStyle = K.line; x.lineWidth = 3; x.stroke();
      dibujaFoto(x, fs[i], -cw * .4, -cw * .4, cw * .8, cw * .8, p); x.restore();
    });
    agua(x, PW, PH - PIE);
    links.push(banda(x, PW, PH, PIE, ligaTienda(), 96));
    return {canvas: c, links: links};
  }
  async function hojas(l){
    var out = [], por = 6, tot = Math.ceil(l.length / por);
    for(var k = 0; k < tot; k++){
      var cx = lienzo(PW, PH), c = cx[0], x = cx[1], links = [];
      cabecera(x, 96, 110, 48);
      x.textAlign = "right"; x.textBaseline = "middle"; x.fillStyle = K.muted; x.font = "500 22px 'IBM Plex Mono'"; x.fillText((k + 2) + " / " + (tot + 1), PW - 96, 112);
      var grupo = l.slice(k * por, k * por + por), fs = await Promise.all(grupo.map(foto));
      var gap = 28, cols = 2, cw = (PW - 192 - gap) / cols, y0 = 190, ch = (PH - PIE - 50 - y0 - gap * 2) / 3;
      var sz = {r: 30, pad: 26, txt: 170, nom: 28, pre: 46, chip: 22};
      grupo.forEach(function(p, i){ links.push(celda(x, p, fs[i], 96 + (i % 2) * (cw + gap), y0 + Math.floor(i / 2) * (ch + gap), cw, ch, sz)); });
      agua(x, PW, PH - PIE);
      links.push(banda(x, PW, PH, PIE, ligaTienda(), 96));
      out.push({canvas: c, links: links});
    }
    return out;
  }
  var PDFP = null;
  async function armaPDF(){ var l = S.sel.map(function(c){ return IDX[c]; }); return [await portada(l)].concat(await hojas(l)); }
  var genP = 0;
  async function pintaPDF(){
    var my = ++genP, l = S.sel.map(function(c){ return IDX[c]; }), listo = l.length && YO;
    $("pdfDl").disabled = $("pdfSh").disabled = !listo;
    $("pdfNota").textContent = listo ? "Portada y " + Math.ceil(l.length / 6) + (Math.ceil(l.length / 6) === 1 ? " hoja" : " hojas") + " con " + l.length + (l.length === 1 ? " producto" : " productos") + ", 6 por hoja." : "Elige tu nombre y al menos un producto.";
    if(!listo){ $("pdfVista").innerHTML = ""; PDFP = null; return; }
    await M.fuentes();
    var ps = await armaPDF(); if(my !== genP) return;
    PDFP = ps;
    $("pdfVista").innerHTML = "";
    ps.slice(0, 3).forEach(function(p, i){ p.canvas.setAttribute("role", "img"); p.canvas.setAttribute("aria-label", i ? "Hoja " + (i + 1) : "Portada"); $("pdfVista").appendChild(p.canvas); });
  }
  async function blobPDF(){
    if(!PDFP) await pintaPDF();
    var tit = $("pdfTit").value.trim() || PDF_AUTO;
    return M.pdf(PDFP, {title: tit, author: YO ? YO.nombre : "", subject: ligaCorta()});
  }
  function nombrePDF(){ return (YO ? YO.slug + "-" : "") + "catalogo-" + slug(mesAnio()) + ".pdf"; }
  $("pdfDl").onclick = async function(){
    var b = this; b.disabled = true; var t = b.textContent; b.textContent = "Armando…";
    try{ var bl = await blobPDF(); H.descarga(bl, nombrePDF()); H.aviso("PDF descargado"); H.cuenta("pdf"); }
    catch(e){ H.aviso("No se pudo armar el PDF. Revisa tu conexión."); }
    b.disabled = false; b.textContent = t;
  };
  if(navigator.canShare){ try{ if(navigator.canShare({files: [new File(["x"], "x.pdf", {type: "application/pdf"})]})) $("pdfSh").hidden = false; }catch(_){} }
  $("pdfSh").onclick = async function(){
    try{ var bl = await blobPDF(); await navigator.share({files: [new File([bl], nombrePDF(), {type: "application/pdf"})], text: "Mi catálogo: " + ligaTienda()}); H.cuenta("pdf-compartir"); }
    catch(e){ if(e && e.name !== "AbortError") H.aviso("No se pudo compartir"); }
  };

  var OUT = [], gen = 0;
  async function pinta(){
    var my = ++gen;
    var l = S.sel.map(function(c){ return IDX[c]; });
    var listo = l.length && YO;
    $("share").disabled = $("dl").disabled = $("copiaTxt").disabled = !listo;
    $("vistaSub").textContent = !YO ? "Primero elige tu nombre arriba." : !l.length ? "Elige al menos un producto." : "Así se ve antes de mandarla.";
    pintaPDF();
    if(!listo){ $("vistas").innerHTML = ""; $("msg").hidden = true; $("fotoNota").hidden = true; OUT = []; return; }
    await M.fuentes();
    var res = [];
    if(l.length > 1 && S.modo === "junta"){
      for(var k = 0; k < l.length; k += 6) res.push(await tarjetaJunta(l.slice(k, k + 6)));
    } else {
      for(var i = 0; i < l.length; i++) res.push(await tarjetaUna(l[i]));
    }
    if(my !== gen) return;
    OUT = res;
    var v = $("vistas"); v.className = "vistas" + (res.length === 1 ? " una" : ""); v.innerHTML = "";
    res.forEach(function(o){ var f = document.createElement("figure"); o.canvas.setAttribute("role", "img"); o.canvas.setAttribute("aria-label", "Tarjeta: " + o.nombre); f.appendChild(o.canvas); var fc = document.createElement("figcaption"); fc.textContent = o.nombre; f.appendChild(fc); v.appendChild(f); });
    var sin = res.filter(function(o){ return !o.foto; }).length;
    $("fotoNota").hidden = !sin;
    $("fotoNota").textContent = sin ? (sin === 1 ? "Una tarjeta salió sin foto" : sin + " tarjetas salieron sin foto") + ": la foto de ese producto aún no está guardada en el sitio. Sale con la inicial y todo lo demás." : "";
    $("msg").textContent = mensaje(); $("msg").hidden = false;
  }
  function mensaje(){
    var l = S.sel.map(function(c){ return IDX[c]; });
    var t = l.map(function(p){ var pr = precioDe(p); return "• " + nombreDe(p) + ": " + money(pr.fin) + (pr.fin < pr.pub ? " (antes " + money(pr.pub) + ")" : "") + "\n  " + ligaProd(p); }).join("\n");
    var todos = ligaTodos(l), alguno = l.some(function(p){ return TIE[p.code]; });
    var cierre = !YO ? "Te lo aparto por aquí o lo pides directo en mi tienda."
      : todos ? "Para pedir todo de una vez, toca aquí y se agrega solo a tu pedido:\n" + todos + "\n\nO dime por aquí y te lo aparto."
      : alguno ? "Toca el link y se agrega solo a tu pedido. O dime por aquí y te lo aparto."
      : "Te lo aparto por aquí o lo pides directo en mi tienda.";
    return (S.frase ? S.frase + "\n\n" : "") + t + "\n\n" + cierre;
  }
  function slug(s){ return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "tarjeta"; }
  function blob(c){ return new Promise(function(ok){ try{ c.toBlob(function(b){ ok(b); }, "image/png"); }catch(_){ ok(null); } }); }
  async function archivos(){
    var fs = [];
    for(var i = 0; i < OUT.length; i++){ var b = await blob(OUT[i].canvas); if(b) fs.push(new File([b], (YO ? YO.slug + "-" : "") + slug(OUT[i].nombre) + (OUT.length > 1 ? "-" + (i + 1) : "") + ".png", {type: "image/png"})); }
    return fs;
  }
  $("dl").onclick = async function(){
    var fs = await archivos(); if(!fs.length){ H.aviso("No se pudo crear la imagen"); return; }
    fs.forEach(function(f, i){ setTimeout(function(){ H.descarga(f, f.name); }, i * 350); });
    H.aviso(fs.length === 1 ? "Imagen descargada" : fs.length + " imágenes descargadas"); H.cuenta("descargar");
  };
  $("share").onclick = async function(){
    var fs = await archivos(); if(!fs.length){ H.aviso("No se pudo crear la imagen"); return; }
    var txt = mensaje();
    if(navigator.canShare && navigator.canShare({files: fs})){
      try{ await navigator.share({files: fs, text: txt}); H.cuenta("compartir"); }catch(e){ if(e && e.name !== "AbortError") H.aviso("No se pudo compartir"); }
    } else {
      fs.forEach(function(f, i){ setTimeout(function(){ H.descarga(f, f.name); }, i * 350); });
      H.copia(txt, "Imagen descargada y mensaje copiado"); H.cuenta("compartir-descarga");
    }
  };
  $("copiaTxt").onclick = function(){ H.copia(mensaje(), "Mensaje copiado"); H.cuenta("copiar-mensaje"); };

  /* arranque */
  marcaDesc(); marcaOpts(); pintaGrid(); pintaEleg();
  await VentasWA.listo; VentasWA.onYo(alCambiarYo);
})();
