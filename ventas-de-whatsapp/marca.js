/* Marca compartida de "Ventas por WhatsApp": colores Farmasi, la etiqueta de mitienda.beauty,
   QR, marca de agua y PDF. Cualquier página interna puede usarla:
     <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
     <script src="/ventas-de-whatsapp/marca.js"></script>
   y luego MarcaSVH.marcaDeAgua(ctx, W, H, "mitienda.beauty/sel"), MarcaSVH.pdf([...]), etc. */
window.MarcaSVH = (function(){
  var K = {bg: "#FFFFFF", ink: "#262A4A", muted: "#6C7090", line: "#E6E8F0", soft: "#EEF0F8", accent: "#DB414C", accentInk: "#C8323F", tint: "#FDEEF0", navy: "#262A4A", pink: "#FFB3B9"};

  function rr(x, fill, X, Y, w, h, r){
    x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
    if(fill){ x.fillStyle = fill; x.fill(); }
  }
  /* parte un texto en renglones que caben en max; corta con … si pasa de n */
  function lineas(x, t, max, n){
    var w = String(t || "").split(/\s+/), out = [], cur = "";
    w.forEach(function(p){ var tt = cur ? cur + " " + p : p; if(x.measureText(tt).width <= max || !cur) cur = tt; else { out.push(cur); cur = p; } });
    if(cur) out.push(cur);
    if(n && out.length > n){ out = out.slice(0, n); var u = out[n - 1]; while(x.measureText(u + "…").width > max && u.length) u = u.slice(0, -1); out[n - 1] = u.replace(/\s+$/, "") + "…"; }
    return out;
  }
  /* baja el tamaño hasta que el texto quepa; font lleva {s} donde va el tamaño */
  function ajusta(x, t, font, size, max, min){ var s = size; x.font = font.replace("{s}", s); while(x.measureText(t).width > max && s > min){ s -= 2; x.font = font.replace("{s}", s); } return s; }

  function qr(x, url, X, Y, size, fg, bg, r){
    if(!window.qrcode || !url) return;
    var q = qrcode(0, "M"); q.addData(url); q.make();
    var n = q.getModuleCount(), pad = Math.round(size * .08), cell = (size - pad * 2) / n;
    rr(x, bg || "#FFFFFF", X, Y, size, size, r == null ? 16 : r);
    x.fillStyle = fg || K.ink;
    for(var i = 0; i < n; i++) for(var j = 0; j < n; j++) if(q.isDark(i, j)) x.fillRect(X + pad + j * cell, Y + pad + i * cell, Math.ceil(cell), Math.ceil(cell));
  }

  /* la etiqueta del logo de mitienda.beauty, chiquita (s = lado en px) */
  function logo(x, X, Y, s, col, hole){
    x.save(); x.translate(X + s / 2, Y + s / 2); x.rotate(-20 * Math.PI / 180); x.scale(s / 100, s / 100); x.translate(-50, -50);
    x.fillStyle = col || K.accent; x.beginPath(); x.moveTo(16, 44); x.lineTo(44, 24); x.lineTo(80, 24); x.arcTo(86, 24, 86, 30, 6); x.lineTo(86, 70); x.arcTo(86, 76, 80, 76, 6); x.lineTo(22, 76); x.arcTo(16, 76, 16, 70, 6); x.closePath(); x.fill();
    x.fillStyle = hole || "#FFFFFF"; x.beginPath(); x.arc(30, 46, 4.5, 0, Math.PI * 2); x.fill();
    x.restore();
  }
  /* etiqueta grande para el precio, centrada en (cx, cy), girada ang (radianes) */
  function etiqueta(x, cx, cy, w, h, ang, col, hole){
    x.save(); x.translate(cx, cy); x.rotate(ang);
    var X = -w / 2, Y = -h / 2, cut = h * .42, r = 18;
    x.beginPath();
    x.moveTo(X, Y + cut); x.lineTo(X + cut, Y); x.lineTo(X + w - r, Y); x.arcTo(X + w, Y, X + w, Y + r, r);
    x.lineTo(X + w, Y + h - r); x.arcTo(X + w, Y + h, X + w - r, Y + h, r); x.lineTo(X + cut, Y + h); x.lineTo(X, Y + h - cut); x.closePath();
    x.fillStyle = col || K.accent; x.fill();
    x.beginPath(); x.arc(X + cut * .62, 0, h * .065, 0, Math.PI * 2); x.fillStyle = hole || "#FFFFFF"; x.fill();
    x.restore();
    return {X: X, Y: Y, cut: cut};
  }

  /* Marca de agua: la liga de la socia y la etiqueta, en diagonal y muy tenue, por toda la imagen.
     Se pinta encima de todo (también sobre la foto), así que recortar el pie no la quita.
     alpha ~ .05 se nota de cerca y no estorba de lejos. */
  function marcaDeAgua(x, W, H, texto, o){
    o = o || {};
    var a = o.alpha == null ? .055 : o.alpha, col = o.color || K.ink, size = o.size || Math.round(W / 40), ang = (o.angulo == null ? -24 : o.angulo) * Math.PI / 180;
    x.save();
    x.globalAlpha = a; x.fillStyle = col; x.textBaseline = "middle"; x.textAlign = "left";
    x.font = "500 " + size + "px 'IBM Plex Mono', ui-monospace, monospace";
    var t = String(texto || "mitienda.beauty"), tw = x.measureText(t).width, logoS = size * 1.5, paso = tw + logoS + size * 3, alto = size * 5.2;
    x.translate(W / 2, H / 2); x.rotate(ang);
    var R = Math.sqrt(W * W + H * H);
    for(var y = -R / 2, fila = 0; y < R / 2; y += alto, fila++){
      for(var X = -R / 2 - (fila % 2 ? paso / 2 : 0); X < R / 2; X += paso){
        x.save(); x.globalAlpha = a; logo(x, X, y - logoS / 2, logoS, col, "rgba(0,0,0,0)"); x.restore();
        x.fillText(t, X + logoS + size * .4, y);
      }
    }
    x.restore();
  }

  function fuentes(){
    var l = ["400 40px Fraunces", "italic 400 40px Fraunces", "600 30px Outfit", "500 30px Outfit", "700 30px Outfit", "700 30px 'IBM Plex Mono'", "500 30px 'IBM Plex Mono'", "600 30px 'IBM Plex Mono'"];
    return Promise.all(l.map(function(f){ return document.fonts && document.fonts.load ? document.fonts.load(f).catch(function(){}) : null; }));
  }

  /* jsPDF se carga solo cuando se pide un PDF */
  var jsp;
  function cargaPDF(){
    if(window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
    if(jsp) return jsp;
    jsp = new Promise(function(ok, no){
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = function(){ ok(window.jspdf.jsPDF); }; s.onerror = function(){ jsp = null; no(new Error("jsPDF")); };
      document.head.appendChild(s);
    });
    return jsp;
  }
  /* paginas: [{canvas, links:[{x,y,w,h,url}] en px del canvas}]. Todas del mismo tamaño.
     Regresa un Blob PDF. Las páginas van como imagen (con su marca de agua) y los links se pueden tocar. */
  function pdf(paginas, meta){
    return cargaPDF().then(function(jsPDF){
      var c0 = paginas[0].canvas, Wpt = 595.28, Hpt = Wpt * c0.height / c0.width, k = Wpt / c0.width;
      var doc = new jsPDF({orientation: Hpt >= Wpt ? "portrait" : "landscape", unit: "pt", format: [Wpt, Hpt], compress: true});
      if(meta) doc.setProperties({title: meta.title || "", author: meta.author || "", subject: meta.subject || "", creator: "mitienda.beauty"});
      paginas.forEach(function(p, i){
        if(i) doc.addPage([Wpt, Hpt], Hpt >= Wpt ? "portrait" : "landscape");
        doc.addImage(p.canvas.toDataURL("image/jpeg", .9), "JPEG", 0, 0, Wpt, Hpt, undefined, "FAST");
        (p.links || []).forEach(function(l){ if(l.url) doc.link(l.x * k, l.y * k, l.w * k, l.h * k, {url: l.url}); });
      });
      return doc.output("blob");
    });
  }

  return {K: K, rr: rr, lineas: lineas, ajusta: ajusta, qr: qr, logo: logo, etiqueta: etiqueta, marcaDeAgua: marcaDeAgua, fuentes: fuentes, cargaPDF: cargaPDF, pdf: pdf};
})();
