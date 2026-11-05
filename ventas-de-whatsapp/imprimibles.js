/* Ventas por WhatsApp · pestaña "Para imprimir": tarjetas de producto para imprimir y repartir.
   Cada tarjeta lleva el color de su línea, nombre, beneficios tomados de la ficha oficial, la foto
   (o un espacio para pegar una muestra), el QR a la tienda de la socia y sus redes al pie.
   Datos: /_data/tarjetas-imprimibles.json (lo arma scripts/tarjetas_imprimibles.py).
   Usa base.js (H), marca.js (MarcaSVH) y ventas.js (VentasWA). */

(async function(){
  var $ = function(id){ return document.getElementById(id); };
  if(!$("imprimibles")) return;
  var M = window.MarcaSVH, esc = H.esc;
  var LSK = "glow_imprimibles";
  var S = Object.assign({wa: "", ig: "", tt: "", lado: "foto", hoja: "carta", linea: "", sel: null}, H.lee(LSK, {}));
  function save(){ H.guarda(LSK, S); }

  /* ---------- Colores por línea: fondo y acento (el acento sale en viñetas, barra y pastillas del pie) ---------- */
  var LINEAS = {
    "Nutriplus":        {bg: "#5B3A8C", ac: "#F4A9C6", nom: "Nutriplus"},
    "Skincare":         {bg: "#1F5248", ac: "#F2C9A0", nom: "Skincare"},
    "Labios":           {bg: "#8C1D3A", ac: "#FFB3B9", nom: "Labios"},
    "Ojos":             {bg: "#2B3C66", ac: "#F5C76B", nom: "Ojos"},
    "Rostro":           {bg: "#9A4F3B", ac: "#FFD8C2", nom: "Rostro"},
    "Fragancias":       {bg: "#262A4A", ac: "#E7C27D", nom: "Fragancias"},
    "Cuidado personal": {bg: "#4C6A3D", ac: "#F1E2A8", nom: "Cuidado personal"},
    "Cabello":          {bg: "#6A3B26", ac: "#F4C7A1", nom: "Cabello"},
    "Hombre":           {bg: "#24292E", ac: "#9EC3D8", nom: "Hombre"},
    "Masaje":           {bg: "#8A3A16", ac: "#F6CF86", nom: "Masaje"},
    "Brochas":          {bg: "#3A2F4A", ac: "#FFB3B9", nom: "Brochas"},
    "Kits":             {bg: "#7A1E2C", ac: "#F2D07A", nom: "Kits y sets"}
  };
  function col(p){ return LINEAS[p.linea] || LINEAS.Kits; }

  /* ---------- Datos ---------- */
  var D = await fetch("/_data/tarjetas-imprimibles.json?v=" + Date.now(), {cache: "no-store"}).then(function(r){ return r.json(); }).catch(function(){ return {productos: []}; });
  var LIST = (D.productos || []).filter(function(p){ return (p.beneficios || []).length; });
  var IDX = {}; LIST.forEach(function(p){ IDX[p.id] = p; });
  if(!Array.isArray(S.sel)) S.sel = [];
  S.sel = S.sel.filter(function(id){ return IDX[id]; });

  /* ---------- Fotos: copia en el sitio (el navegador deja dibujarla en la tarjeta) ---------- */
  var FOTO = {};
  function carga(url){ return new Promise(function(ok){ var im = new Image(); im.onload = function(){ ok(im.naturalWidth ? im : null); }; im.onerror = function(){ ok(null); }; im.src = url; }); }
  function foto(p){
    var cs = [p.foto || p.codes[0]].concat(p.codes);
    var key = cs.join(",");
    if(!FOTO[key]) FOTO[key] = (async function(){
      for(var i = 0; i < cs.length && i < 6; i++){
        var im = await carga("/ventas-de-whatsapp/fotos/" + cs[i] + ".webp");
        if(im) return recorta(im);
      }
      return null;
    })();
    return FOTO[key];
  }

  /* el color del empaque: el tono con más presencia entre los pixeles con color (sin blancos, grises ni negros).
     De ahí sale el fondo (oscuro, para que el texto blanco se lea) y el acento (claro). */
  function hsl(r, g, b){
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if(d){ s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  }
  function css(h, s, l){ /* hsl -> #hex (mezcla() trabaja con hex) */
    var a = s * Math.min(l, 1 - l), f = function(n){ var k = (n + h / 30) % 12, v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return ("0" + Math.round(v * 255).toString(16)).slice(-2); };
    return "#" + f(0) + f(8) + f(4);
  }
  function colorEmpaque(d, w, h){
    var cub = {}, total = 0, con = 0;
    for(var j = 0; j < h; j += 3) for(var i = 0; i < w; i += 3){
      var k = (j * w + i) * 4, r = d[k], g = d[k + 1], b = d[k + 2];
      if(r > 236 && g > 236 && b > 236) continue;
      total++;
      var c = hsl(r, g, b);
      if(c[1] < .2 || c[2] < .1 || c[2] > .9) continue;
      con++;
      var n = Math.floor(c[0] / 15), u = cub[n] || (cub[n] = {w: 0, h: 0, s: 0, l: 0, hx: 0, hy: 0});
      var wt = c[1];
      u.w += wt; u.s += c[1] * wt; u.l += c[2] * wt;
      u.hx += Math.cos(c[0] * Math.PI / 180) * wt; u.hy += Math.sin(c[0] * Math.PI / 180) * wt;
    }
    if(!total || con / total < .006) return null; /* empaque blanco o neutro: se queda el color de su línea */
    var best = null; Object.keys(cub).forEach(function(n){ if(!best || cub[n].w > best.w) best = cub[n]; });
    var H2 = (Math.atan2(best.hy, best.hx) * 180 / Math.PI + 360) % 360, S2 = best.s / best.w;
    var amarillo = H2 > 40 && H2 < 75;
    return {
      bg: css(H2, Math.min(Math.max(S2, .3), .62), amarillo ? .26 : .3),
      ac: css(H2, Math.min(S2 + .15, .85), .82)
    };
  }

  /* quita el blanco de alrededor de la foto para que el producto llene su espacio */
  function recorta(im){
    try{
      var w = im.naturalWidth, h = im.naturalHeight, c = document.createElement("canvas"); c.width = w; c.height = h;
      var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0);
      var d = x.getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = -1, y1 = -1;
      for(var j = 0; j < h; j += 2) for(var i = 0; i < w; i += 2){
        var k = (j * w + i) * 4;
        if(d[k] < 236 || d[k + 1] < 236 || d[k + 2] < 236){ if(i < x0) x0 = i; if(i > x1) x1 = i; if(j < y0) y0 = j; if(j > y1) y1 = j; }
      }
      if(x1 < 0) return c;
      var m = 6; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w, x1 + m); y1 = Math.min(h, y1 + m);
      var o = document.createElement("canvas"); o.width = x1 - x0; o.height = y1 - y0;
      o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
      o._col = colorEmpaque(d, w, h);
      return o;
    }catch(_){ return im; }
  }

  /* ---------- Iconos del pie (línea de 1.75 en retícula de 24) ---------- */
  var ICO = {
    wa: "M4.5 19.5l1.2-3.6A7.6 7.6 0 1 1 8.4 18.6Z M9.2 8.6c0 3 2.6 5.8 5.8 6.2l1.2-1.4-1.9-1-0.9 0.8c-1-.4-2.1-1.5-2.5-2.5l.8-.9-1-1.9Z",
    ig: "M7.5 3.5h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4Z M12 8.4a3.6 3.6 0 1 0 0 7.2a3.6 3.6 0 1 0 0-7.2Z M17 6.6v.01",
    tt: "M13.5 3.5v11.2a3.3 3.3 0 1 1-3.3-3.3 M13.5 3.5c.4 2.5 2.2 4.2 4.8 4.4"
  };
  function icono(x, k, X, Y, s, color){
    x.save(); x.translate(X, Y); x.scale(s / 24, s / 24);
    x.strokeStyle = color; x.lineWidth = 1.9; x.lineCap = "round"; x.lineJoin = "round";
    ICO[k].split(" M").forEach(function(d, i){ x.stroke(new Path2D((i ? "M" : "") + d)); });
    x.restore();
  }

  /* ---------- Texto con espaciado entre letras (canvas no siempre lo trae) ---------- */
  function track(x, t, X, Y, sp){
    if("letterSpacing" in x){ x.letterSpacing = sp + "px"; x.fillText(t, X, Y); x.letterSpacing = "0px"; return; }
    for(var i = 0; i < t.length; i++){ x.fillText(t[i], X, Y); X += x.measureText(t[i]).width + sp; }
  }
  function anchoTrack(x, t, sp){ return x.measureText(t).width + sp * Math.max(0, t.length - 1); }
  function lineasTrack(x, t, max, sp, n){
    var w = String(t || "").split(/\s+/), out = [], cur = "";
    w.forEach(function(p){ var tt = cur ? cur + " " + p : p; if(anchoTrack(x, tt, sp) <= max || !cur) cur = tt; else { out.push(cur); cur = p; } });
    if(cur) out.push(cur);
    return n ? out.slice(0, n) : out;
  }
  function mezcla(hex, a, con){ /* hex con blanco (con=1) o negro (con=0) */
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255, t = con ? 255 : 0;
    return "rgb(" + Math.round(r + (t - r) * a) + "," + Math.round(g + (t - g) * a) + "," + Math.round(b + (t - b) * a) + ")";
  }

  /* ---------- La tarjeta: 4 × 5.25 pulgadas (10.2 × 13.3 cm). W = 800 px a 200 ppp ---------- */
  var CW = 800, CH = 1050;
  function yo(){ return window.VentasWA && VentasWA.yo(); }
  function liga(p){
    var c = yo(), base = c ? VentasWA.liga(c) : "https://mitienda.beauty/";
    if(!c) return base;
    return base + (p.codes.length > 1 ? "?p=" : "?agrega=") + p.codes[0];
  }
  function redes(){
    var c = yo(), out = [];
    var wa = (S.wa || (c && c.whatsapp) || "").replace(/\D/g, "");
    if(wa) out.push({k: "wa", t: "WhatsApp", v: VentasWA.waBonito(wa)});
    if(S.ig) out.push({k: "ig", t: "Instagram", v: "@" + S.ig.replace(/^@/, "")});
    if(S.tt) out.push({k: "tt", t: "TikTok", v: "@" + S.tt.replace(/^@/, "")});
    return out;
  }

  async function dibuja(x, p, ox, oy){
    var im = await foto(p);
    var c = (im && im._col) || col(p), W = CW, Hh = CH, pad = 46;
    x.save(); x.translate(ox || 0, oy || 0);
    x.beginPath(); x.rect(0, 0, W, Hh); x.clip();
    x.fillStyle = c.bg; x.fillRect(0, 0, W, Hh);

    /* adorno: la etiqueta de mitienda.beauty en línea, grande y tenue, saliendo por la esquina */
    x.save(); x.globalAlpha = .13; x.translate(W - 120, 150); x.rotate(-20 * Math.PI / 180); x.scale(4.2, 4.2); x.translate(-50, -50);
    x.strokeStyle = c.ac; x.lineWidth = .7; x.beginPath(); x.moveTo(16, 44); x.lineTo(44, 24); x.lineTo(80, 24); x.arcTo(86, 24, 86, 30, 6); x.lineTo(86, 70); x.arcTo(86, 76, 80, 76, 6); x.lineTo(22, 76); x.arcTo(16, 76, 16, 70, 6); x.closePath(); x.stroke();
    x.beginPath(); x.arc(30, 46, 4.5, 0, Math.PI * 2); x.stroke();
    x.restore();
    x.save(); x.globalAlpha = .08; x.strokeStyle = c.ac; x.lineWidth = 2;
    for(var k = 0; k < 4; k++){ x.beginPath(); x.arc(-40, Hh - 120, 210 + k * 46, -Math.PI / 2, 0); x.stroke(); }
    x.restore();

    /* pie: tus redes */
    var R = redes(), pieH = R.length ? 92 : 0, pieY = Hh - pad - pieH;
    /* columna izquierda: foto o espacio para la muestra */
    var lx = pad, lw = 250, ly = pad, lh = pieY - (R.length ? 26 : 0) - ly;
    if(S.lado === "muestra"){
      x.save(); x.setLineDash([10, 9]); x.lineWidth = 2.5; x.strokeStyle = mezcla(c.bg, .55, 1);
      M.rr(x, null, lx + 2, ly + 2, lw - 4, lh - 4, 26); x.stroke(); x.restore();
      x.save(); x.translate(lx + lw / 2, ly + lh / 2); x.rotate(-Math.PI / 2);
      x.fillStyle = mezcla(c.bg, .6, 1); x.textAlign = "left"; x.textBaseline = "middle";
      x.font = "600 19px Outfit"; track(x, "PEGA AQUÍ LA MUESTRA", -anchoTrack(x, "PEGA AQUÍ LA MUESTRA", 3.5) / 2, 0, 3.5);
      x.restore();
    } else {
      M.rr(x, "#FFFFFF", lx, ly, lw, lh, 26);
      if(im){
        var nw = im.naturalWidth || im.width, nh2 = im.naturalHeight || im.height;
        var sc = Math.min((lw - 44) / nw, (lh - 60) / nh2), iw = nw * sc, ih = nh2 * sc;
        x.drawImage(im, lx + (lw - iw) / 2, ly + (lh - ih) / 2, iw, ih);
      } else {
        x.fillStyle = mezcla(c.bg, .85, 1); x.textAlign = "center"; x.textBaseline = "middle"; x.font = "400 120px Fraunces";
        x.fillText((p.nombre || "?").charAt(0), lx + lw / 2, ly + lh / 2);
      }
    }

    /* columna derecha */
    var rx = lx + lw + 34, rw = W - pad - rx, y = pad + 4;
    x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillStyle = "#FFFFFF";
    if(p.marca){
      var ms = M.ajusta(x, p.marca, "400 {s}px Fraunces", 64, rw, 34);
      y += ms * .82; x.fillText(p.marca, rx, y); y += 20;
    }
    var nh = 31, sp = 2.6; x.font = "700 31px Outfit";
    var nl = lineasTrack(x, p.nombre.toUpperCase(), rw, sp, 3);
    if(nl.length === 3){ nh = 26; sp = 2; x.font = "700 26px Outfit"; nl = lineasTrack(x, p.nombre.toUpperCase(), rw, sp, 3); }
    nl.forEach(function(l){ y += nh * 1.08; track(x, l, rx, y, sp); });
    y += 18; M.rr(x, c.ac, rx, y, Math.min(rw, 230), 6, 3); y += 6;
    if(p.sub){
      x.font = "600 16px Outfit"; x.fillStyle = mezcla(c.bg, .78, 1);
      lineasTrack(x, p.sub.toUpperCase(), rw, 1.6, 2).forEach(function(l){ y += 23; track(x, l, rx, y, 1.6); });
    }

    /* beneficios: se achican si no caben */
    var qr = 168, qy = pieY - (R.length ? 26 : 0) - qr - 30, tope = qy - 22;
    var bs = (p.beneficios || []).slice(0, 6), fs = 21, filas;
    function arma(){ x.font = "500 " + fs + "px Outfit"; filas = bs.map(function(b){ return M.lineas(x, b, rw - 26, 4); }); return filas.reduce(function(a, f){ return a + f.length * fs * 1.24 + fs * .5; }, 0); }
    var by = y + 40, alto = arma();
    while(by + 34 + alto > tope && fs > 15) { fs -= 1; alto = arma(); }
    while(by + 34 + alto > tope && bs.length > 2){ bs.pop(); alto = arma(); }
    x.fillStyle = "#FFFFFF"; x.font = "800 22px Outfit"; track(x, "BENEFICIOS", rx, by, 2.4); by += 14;
    filas.forEach(function(f){
      by += fs * .5;
      f.forEach(function(l, i){
        by += fs * 1.24;
        if(!i){ x.fillStyle = c.ac; x.beginPath(); x.arc(rx + 6, by - fs * .34, fs * .21, 0, Math.PI * 2); x.fill(); }
        x.fillStyle = "#FFFFFF"; x.font = "500 " + fs + "px Outfit"; x.fillText(l, rx + 24, by);
      });
    });

    /* tonos */
    if(p.tonos > 1){ x.fillStyle = mezcla(c.bg, .78, 1); x.font = "500 15px 'IBM Plex Mono'"; x.fillText(p.tonos + " tonos en tu tienda", rx, qy + qr - 4); }

    /* QR a la tienda */
    var qx = W - pad - qr, url = liga(p);
    M.qr(x, url, qx, qy, qr, "#1D2140", "#FFFFFF", 14);
    x.font = "600 14px Outfit"; var cap = "TIENDA EN LÍNEA", cw = anchoTrack(x, cap, 1.4) + 26;
    M.rr(x, "#1D2140", qx + (qr - cw) / 2, qy + qr + 8, cw, 28, 14);
    x.fillStyle = "#FFFFFF"; track(x, cap, qx + (qr - cw) / 2 + 13, qy + qr + 27, 1.4);

    /* pie */
    var links = [{x: qx, y: qy, w: qr, h: qr, url: url}];
    if(R.length){
      var g = 12, pw = (W - pad * 2 - g * (R.length - 1)) / R.length;
      R.forEach(function(r, i){
        var px = pad + i * (pw + g);
        M.rr(x, mezcla(c.ac, .55, 1), px, pieY, pw, pieH, pieH / 2);
        x.fillStyle = c.bg; x.beginPath(); x.arc(px + 44, pieY + pieH / 2, 27, 0, Math.PI * 2); x.fill();
        icono(x, r.k, px + 44 - 16, pieY + pieH / 2 - 16, 32, "#FFFFFF");
        var tx = px + 84, tw = pw - 96;
        x.fillStyle = mezcla(c.bg, .1, 0); x.font = "600 15px Outfit"; x.fillText(r.t, tx, pieY + pieH / 2 - 6);
        var vs = M.ajusta(x, r.v, "600 {s}px 'IBM Plex Mono'", 21, tw, 12); x.fillText(r.v, tx, pieY + pieH / 2 + vs + 2);
        var u = r.k === "wa" ? "https://wa.me/52" + r.v.replace(/\D/g, "").replace(/^52/, "") : r.k === "ig" ? "https://instagram.com/" + r.v.slice(1) : "https://www.tiktok.com/" + r.v;
        links.push({x: px, y: pieY, w: pw, h: pieH, url: u});
      });
    }
    x.restore();
    return links.map(function(l){ return {x: l.x + (ox || 0), y: l.y + (oy || 0), w: l.w, h: l.h, url: l.url}; });
  }

  /* ---------- Hojas para imprimir ---------- */
  /* carta: 8.5 × 11 in a 200 ppp = 1700 × 2200; 4 tarjetas de 800 × 1050 con margen de 50 y marcas de corte */
  function marcas(x, cols, rows, ox, oy){
    x.strokeStyle = "#9AA0B8"; x.lineWidth = 1.4;
    var xs = [], ys = [];
    for(var i = 0; i <= cols; i++) xs.push(ox + i * CW);
    for(var j = 0; j <= rows; j++) ys.push(oy + j * CH);
    xs.forEach(function(X){ x.beginPath(); x.moveTo(X, 4); x.lineTo(X, oy - 10); x.moveTo(X, oy + rows * CH + 10); x.lineTo(X, 2200 - 4); x.stroke(); });
    ys.forEach(function(Y){ x.beginPath(); x.moveTo(4, Y); x.lineTo(ox - 10, Y); x.moveTo(ox + cols * CW + 10, Y); x.lineTo(1700 - 4, Y); x.stroke(); });
  }
  async function hojas(lista, avance){
    var out = [];
    if(S.hoja === "una"){
      for(var i = 0; i < lista.length; i++){
        var cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
        var lk = await dibuja(cv.getContext("2d"), lista[i], 0, 0);
        out.push({canvas: cv, links: lk, w: 288, h: 378}); avance(i + 1);
      }
      return out;
    }
    for(var a = 0; a < lista.length; a += 4){
      var c2 = document.createElement("canvas"); c2.width = 1700; c2.height = 2200;
      var x = c2.getContext("2d"); x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, 1700, 2200);
      var links = [];
      for(var b = 0; b < 4 && a + b < lista.length; b++){
        links = links.concat(await dibuja(x, lista[a + b], 50 + (b % 2) * CW, 50 + Math.floor(b / 2) * CH));
        avance(a + b + 1);
      }
      marcas(x, 2, 2, 50, 50);
      out.push({canvas: c2, links: links, w: 612, h: 792});
    }
    return out;
  }
  async function pdf(lista, avance){
    var jsPDF = await M.cargaPDF(), pags = await hojas(lista, avance);
    var p0 = pags[0], doc = new jsPDF({orientation: "portrait", unit: "pt", format: [p0.w, p0.h], compress: true});
    var c = yo();
    doc.setProperties({title: "Tarjetas de producto" + (c ? " · " + VentasWA.tienda(c) : ""), creator: "mitienda.beauty"});
    pags.forEach(function(p, i){
      if(i) doc.addPage([p.w, p.h], "portrait");
      var k = p.w / p.canvas.width;
      doc.addImage(p.canvas.toDataURL("image/jpeg", .88), "JPEG", 0, 0, p.w, p.h, undefined, "FAST");
      p.links.forEach(function(l){ doc.link(l.x * k, l.y * k, l.w * k, l.h * k, {url: l.url}); });
    });
    return doc.output("blob");
  }

  /* ---------- Interfaz ---------- */
  var ORD = ["Nutriplus", "Skincare", "Labios", "Ojos", "Rostro", "Fragancias", "Cuidado personal", "Cabello", "Hombre", "Masaje", "Brochas", "Kits"];
  var cuenta = {}; LIST.forEach(function(p){ cuenta[p.linea] = (cuenta[p.linea] || 0) + 1; });
  var lineas = ORD.filter(function(l){ return cuenta[l]; });
  function visibles(){ return LIST.filter(function(p){ return !S.linea || p.linea === S.linea; }); }

  function chips(){
    $("imLineas").innerHTML = ['<button type="button" class="chip" data-l=""' + (S.linea ? "" : ' aria-pressed="true"') + '>Todas · ' + LIST.length + '</button>']
      .concat(lineas.map(function(l){ return '<button type="button" class="chip" data-l="' + esc(l) + '" aria-pressed="' + (S.linea === l) + '"><i style="background:' + LINEAS[l].bg + '"></i>' + esc(LINEAS[l].nom) + ' · ' + cuenta[l] + '</button>'; })).join("");
  }
  function lista(){
    var v = visibles(), sel = {}; S.sel.forEach(function(id){ sel[id] = 1; });
    $("imLista").innerHTML = v.map(function(p){
      return '<label class="im-it"><input type="checkbox" data-id="' + esc(p.id) + '"' + (sel[p.id] ? " checked" : "") + '><span class="im-sw" style="background:' + col(p).bg + '"></span><span class="im-n">' + esc((p.marca ? p.marca + " " : "") + p.nombre) + (p.tonos > 1 ? ' <small>' + p.tonos + ' tonos</small>' : "") + '</span></label>';
    }).join("");
    var n = S.sel.length;
    $("imCuantas").textContent = n ? n + (n === 1 ? " tarjeta elegida" : " tarjetas elegidas") + (S.hoja === "carta" ? " · " + Math.ceil(n / 4) + (Math.ceil(n / 4) === 1 ? " hoja" : " hojas") : "") : "Elige al menos una tarjeta.";
    $("imTodas").textContent = v.every(function(p){ return sel[p.id]; }) && v.length ? "Quitar " + (S.linea ? "esta línea" : "todas") : "Elegir " + (S.linea ? "toda la línea" : "todas");
    $("imPdf").disabled = !n;
  }
  var tVista;
  function vista(){
    clearTimeout(tVista);
    tVista = setTimeout(async function(){
      var p = IDX[S.sel[S.sel.length - 1]] || visibles()[0] || LIST[0]; if(!p) return;
      var cv = $("imVista"); cv.width = CW; cv.height = CH;
      await M.fuentes(); await dibuja(cv.getContext("2d"), p, 0, 0);
      $("imVistaN").textContent = "Muestra: " + (p.marca ? p.marca + " " : "") + p.nombre;
    }, 120);
  }
  function seg(id, key){
    [].forEach.call($(id).querySelectorAll("button"), function(b){
      b.setAttribute("aria-pressed", b.dataset.v === S[key]);
      b.onclick = function(){ S[key] = b.dataset.v; save(); seg(id, key); lista(); vista(); H.cuenta("imprimibles-" + key + "-" + S[key]); };
    });
  }

  $("imLineas").onclick = function(e){ var b = e.target.closest("[data-l]"); if(!b) return; S.linea = b.dataset.l; save(); chips(); lista(); vista(); };
  $("imLista").onchange = function(e){
    var id = e.target.dataset.id; if(!id) return;
    S.sel = S.sel.filter(function(x){ return x !== id; }); if(e.target.checked) S.sel.push(id);
    save(); lista(); vista();
  };
  $("imTodas").onclick = function(){
    var v = visibles(), sel = {}; S.sel.forEach(function(id){ sel[id] = 1; });
    var todas = v.every(function(p){ return sel[p.id]; });
    v.forEach(function(p){ if(todas) delete sel[p.id]; else sel[p.id] = 1; });
    S.sel = LIST.map(function(p){ return p.id; }).filter(function(id){ return sel[id]; });
    save(); lista(); vista();
  };
  ["Wa", "Ig", "Tt"].forEach(function(k){
    var el = $("im" + k), key = k.toLowerCase();
    el.value = S[key] || "";
    el.oninput = function(){ S[key] = el.value.trim(); save(); vista(); };
  });
  seg("imLado", "lado"); seg("imHoja", "hoja");

  $("imPdf").onclick = async function(){
    var b = this, l = S.sel.map(function(id){ return IDX[id]; }).filter(Boolean);
    if(!l.length) return;
    b.disabled = true; var t0 = b.textContent;
    try{
      await M.fuentes();
      var blob = await pdf(l, function(i){ b.textContent = "Armando " + i + " de " + l.length + "…"; });
      var c = yo();
      H.descarga(blob, "tarjetas-" + (c ? c.slug : "producto") + (S.hoja === "una" ? "-imprenta" : "") + ".pdf");
      H.cuenta("imprimibles-pdf", l.length + " tarjetas");
    }catch(err){ console.error(err); H.aviso("No se pudo armar el PDF. Revisa tu conexión e inténtalo otra vez."); }
    b.textContent = t0; b.disabled = false;
  };

  VentasWA.onYo(function(c){
    $("imWa").placeholder = c && c.whatsapp ? VentasWA.waBonito(c.whatsapp) : "10 dígitos";
    $("imAviso").hidden = !!c;
    vista();
  });
  $("imTotal").textContent = LIST.length;
  chips(); lista(); vista();
})();
