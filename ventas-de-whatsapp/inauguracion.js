/* Pestaña "Venta de inauguración" de /ventas-de-whatsapp/.
   Guía en 5 pasos para llenar un grupo de WhatsApp y abrir la venta, con los datos de la socia elegida arriba
   (VentasWA.yo()) y un PDF que sale con su nombre, su tienda, su QR y una marca de agua tenue en cada hoja.
   Usa, si existen, MarcaSVH (marca.js) para la marca de agua, el QR y el PDF; si no, lo hace solo con jsPDF y qrcode-generator. */
(function(){
  "use strict";
  var raiz = document.getElementById("inauguracion");
  if(!raiz) return;

  var META = 50;
  var SITIO = "mitienda.beauty";
  var yo = null;
  var st = {fecha: "", enlace: "", personas: 0, version: "invita"};

  /* ---------- utilidades ---------- */
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function clave(){ return "mtb-inauguracion-v1-" + (yo ? yo.slug : "anon"); }
  function lee(){ try{ var v = JSON.parse(localStorage.getItem(clave()) || "null"); if(v) st = Object.assign({fecha:"", enlace:"", personas:0, version:"invita"}, v); else st = {fecha:"", enlace:"", personas:0, version:"invita"}; }catch(_){ } }
  function guarda(){ try{ localStorage.setItem(clave(), JSON.stringify(st)); }catch(_){ } }
  function aviso(t){ if(window.H && H.aviso) H.aviso(t); }
  function copia(t, ok){ if(window.H && H.copia) return H.copia(t, ok); try{ navigator.clipboard.writeText(t); }catch(_){ } }
  function cuenta(p){ if(window.H && H.cuenta) H.cuenta("inauguracion-" + p); }
  function hoyISO(){ var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
  function dif(a, b){ return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5); }
  function suma(s, n){ var d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return d; }
  function larga(d){ return d.toLocaleDateString("es-MX", {weekday:"long", day:"numeric", month:"long"}).replace(",", ""); }
  function corta(d){ return d.toLocaleDateString("es-MX", {weekday:"short", day:"numeric", month:"short"}).replace(/\./g, "").replace(" de ", " "); }
  function may(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function tiendaNombre(){ if(!yo) return "tu tienda"; return yo.tienda || ("Farmasi con " + yo.nombre); }
  function tiendaUrl(){ return yo ? SITIO + "/" + yo.slug : SITIO + "/tu-nombre"; }
  function enlaceOk(s){ return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/.test(s || ""); }

  /* "El jueves 12 de noviembre" / "Mañana" / "Hoy". Sin fecha → hueco para llenar. */
  function cuando(){
    if(!st.fecha) return null;
    var n = dif(hoyISO(), st.fecha);
    if(n === 0) return "hoy";
    if(n === 1) return "mañana";
    return "el " + larga(new Date(st.fecha + "T12:00:00"));
  }

  /* ---------- textos (con huecos marcados) ---------- */
  var H_FECHA = "[fecha de tu venta]", H_ENLACE = "[enlace de tu grupo]";
  function partes(){
    var c = cuando(), e = enlaceOk(st.enlace) ? st.enlace.trim() : null;
    return {c: c, e: e};
  }
  /* Cada mensaje es una lista de trozos: texto fijo o {v: valor | null, h: hueco}. */
  function mensajes(){
    var p = partes();
    var C = function(cap){ return {v: p.c ? (cap ? may(p.c) : p.c) : null, h: H_FECHA}; };
    var E = {v: p.e, h: H_ENLACE};
    return {
      invita: ["¡Hola! ", C(true), " abro mi venta de inauguración por WhatsApp. Va a haber precios especiales y promociones que solo verán quienes estén en el grupo.\n\nSi te interesa, entra aquí:\n", E,
               "\n\nSolo yo escribo en el grupo, así que no te va a llenar el teléfono de mensajes. Y si no es para ti, no pasa nada.\n\nMientras, aquí está mi tienda: " + tiendaUrl()],
      estado: ["Abro mi venta de inauguración ", C(false), ". Precios especiales solo dentro del grupo de WhatsApp.\n\nEntra aquí: ", E],
      abre:   ["Gracias por estar aquí. Hoy abro la venta de inauguración de " + tiendaNombre() + ": voy a ir publicando los productos con su precio especial.\n\nPara pedir, escríbeme por privado" + (yo ? " (wa.me/" + yo.whatsapp + ")" : "") + " o arma tu pedido en " + tiendaUrl() + "."]
    };
  }
  function plano(m){ return m.map(function(t){ return typeof t === "string" ? t : (t.v || t.h); }).join(""); }
  function html(m){ return m.map(function(t){ return typeof t === "string" ? esc(t) : (t.v ? '<span class="lleno">' + esc(t.v) + "</span>" : "<mark>" + esc(t.h) + "</mark>"); }).join(""); }
  function faltan(m){ return m.filter(function(t){ return typeof t !== "string" && !t.v; }).length; }

  function nombreGrupo(){ return "Venta de inauguración · " + tiendaNombre(); }
  function descripcion(){ return "Aquí aviso mis ventas especiales y promociones. Solo yo escribo; para pedir, escríbeme por privado. Mi tienda: " + tiendaUrl(); }

  function semana(){
    return [
      {d: -5, t: "Crea el grupo: nombre, foto, descripción y permisos."},
      {d: -4, t: "Manda la invitación uno a uno a tus contactos más cercanos."},
      {d: -3, t: "Publica el enlace en tus estados y redes."},
      {d: -1, t: "Recordatorio en estados: mañana abres."},
      {d:  0, t: "Abres: mensaje de bienvenida y tus tarjetas de producto."},
      {d:  1, t: "Das las gracias y avisas que cada mes habrá venta ahí."}
    ];
  }
  function etiquetaDia(d){
    if(st.fecha) return may(corta(suma(st.fecha, d)));
    return d === 0 ? "Día de venta" : (d < 0 ? d + " días" : "+" + d + " día").replace("-1 días", "-1 día");
  }

  /* ---------- iconos (línea 1.75) ---------- */
  var ICO_BAJA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>';

  /* ---------- pantalla ---------- */
  function pinta(){
    var m = mensajes();
    var sinYo = !yo;
    raiz.innerHTML =
    '<div class="inau">' +
      '<div class="in-arriba">' +
        '<header class="in-portada">' +
          '<p class="in-sobre">Venta de inauguración</p>' +
          '<h2>Llena tu grupo y abre tu venta</h2>' +
          '<p>Un grupo de WhatsApp donde solo tú escribes, con gente que entró porque quiso. Lo armas una vez y ahí haces tu venta de cada mes.</p>' +
        '</header>' +
        '<section class="in-meta" aria-labelledby="in-meta-t">' +
          '<div class="in-meta-top"><h3 id="in-meta-t">Tu primera meta</h3><span class="in-cifra in-num"><span id="in-lleva">' + st.personas + '</span><small> de ' + META + ' personas</small></span></div>' +
          '<div class="in-barra' + (st.personas >= META ? " ok" : "") + '" role="progressbar" aria-valuemin="0" aria-valuemax="' + META + '" aria-valuenow="' + st.personas + '" aria-label="Personas en tu grupo"><i id="in-relleno"></i></div>' +
          '<div class="in-meta-pie"><p id="in-falta">' + textoFalta() + '</p>' +
            '<div class="in-paso-btns"><button type="button" class="in-mas" data-d="-1" aria-label="Una menos">−</button>' +
            '<label class="sr" for="in-personas" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Personas en el grupo</label>' +
            '<input id="in-personas" type="number" inputmode="numeric" min="0" max="2000" value="' + st.personas + '">' +
            '<button type="button" class="in-mas" data-d="1" aria-label="Una más">+</button></div></div>' +
        '</section>' +
      '</div>' +
      (sinYo ? '<p class="in-sin">Elige arriba quién eres y la guía se acomoda con tu tienda, tu link y tu nombre en el PDF.</p>' : "") +
      '<div class="in-cuerpo">' +
        '<ol class="in-pasos">' +
          paso("01", "Crea tu grupo", "10 minutos",
            '<p>Ponle un nombre que diga qué es y de quién es. Puedes usar este:</p>' +
            copiable("Nombre del grupo", nombreGrupo(), "nombre") +
            '<ul class="in-lista">' +
              '<li>De foto, la tuya o una de tus productos. Que se vea que eres tú.</li>' +
              '<li>En la descripción deja claro cómo funciona y tu link:</li>' +
            '</ul>' +
            copiable("Descripción", descripcion(), "descripcion") +
            '<p>En <span class="in-ruta">Configuración del grupo</span> (puede variar según tu teléfono):</p>' +
            '<ul class="in-lista">' +
              '<li>Apaga <b>Enviar mensajes nuevos</b> para los miembros. Así solo tú escribes y el grupo no se llena de “gracias”.</li>' +
              '<li>Deja encendido <b>Agregar a otros miembros</b> o <b>Invitar mediante enlace</b>, para que quien entre pueda pasarlo.</li>' +
            '</ul>') +
          paso("02", "Copia el enlace del grupo", "2 minutos",
            '<ol class="in-lista">' +
              '<li>Abre el grupo y toca su nombre, arriba.</li>' +
              '<li>Baja hasta <b>Invitar al grupo mediante enlace</b>.</li>' +
              '<li>Toca <b>Copiar enlace</b>.</li>' +
            '</ol>' +
            '<p class="in-ojo"><b>Pégalo en <a href="#in-enlace" class="in-ir-enlace">Enlace de tu grupo</a></b>. Se acomoda solo en tus mensajes y en tu PDF.</p>') +
          paso("03", "Manda la invitación", "Lo que tardes en escribirle a cada quien",
            '<p>Avisa qué día abres y deja que cada quien entre por su cuenta. Elige el mensaje:</p>' +
            '<div class="in-seg" role="group" aria-label="Mensaje">' +
              '<button type="button" data-v="invita" aria-pressed="' + (st.version === "invita") + '">Por chat</button>' +
              '<button type="button" data-v="estado" aria-pressed="' + (st.version === "estado") + '">Para estados</button>' +
            '</div>' +
            '<div class="in-burbuja" id="in-msj">' + html(m[st.version] || m.invita) + '</div>' +
            '<div class="in-msj-btns">' +
              '<button type="button" class="in-btn2" id="in-copiar">Copiar mensaje</button>' +
              '<a class="in-btn2" id="in-wa" href="#" target="_blank" rel="noopener">Mandar por WhatsApp</a>' +
              '<span class="in-num" id="in-huecos" style="font-size:13px;color:var(--in-accent-ink)"></span>' +
            '</div>') +
          paso("04", "Comparte sin obligar a nadie", "Del día −4 al día −1",
            '<ul class="in-lista">' +
              '<li><b>No agregues a nadie a la fuerza.</b> Si varias personas reportan el grupo, WhatsApp puede limitar tu número.</li>' +
              '<li>Primero uno a uno, con el mensaje por chat: a quien ya te compró y a quien te ha preguntado.</li>' +
              '<li>Después en tus estados y redes, con el mensaje corto.</li>' +
              '<li>Pide a quien ya entró que lo comparta con quien le pueda gustar.</li>' +
            '</ul>') +
          paso("05", "Abre tu venta en el grupo", "El día de la venta",
            '<p>Empieza con un mensaje de bienvenida y luego publica tus productos uno por uno, con las tarjetas de la pestaña <a href="#tarjetas" class="in-ir-tarjetas">Tarjetas</a>.</p>' +
            copiable("Mensaje para abrir", plano(m.abre), "abre") +
            '<p>Después no borres el grupo: ahí haces tu venta especial de cada mes.</p>' +
            '<h4 style="margin:22px 0 0;font:600 16px/1.3 var(--in-body)">Tu semana' + (st.fecha ? "" : ' <span style="font-weight:400;color:var(--in-muted)">(pon tu fecha y salen los días)</span>') + '</h4>' +
            '<ul class="in-semana">' + semana().map(function(s){
              var hoy = st.fecha && dif(hoyISO(), st.fecha) === -s.d;
              return '<li class="' + (hoy ? "hoy" : "") + (s.d === 0 ? " dia0" : "") + '"><span class="d">' + esc(etiquetaDia(s.d)) + (hoy ? " · hoy" : "") + '</span><span>' + esc(s.t) + "</span></li>";
            }).join("") + "</ul>") +
        '</ol>' +
        '<aside class="in-lado">' +
          '<section class="in-datos" aria-labelledby="in-datos-t">' +
            '<h3 id="in-datos-t">Datos de tu venta</h3>' +
            '<p>Se guardan en este dispositivo.</p>' +
            '<div class="in-campo"><label for="in-fecha">Fecha de tu venta</label><input id="in-fecha" type="date" value="' + esc(st.fecha) + '" min="' + hoyISO() + '"></div>' +
            '<div class="in-campo"><label for="in-enlace">Enlace de tu grupo</label><input id="in-enlace" type="url" inputmode="url" autocomplete="off" placeholder="https://chat.whatsapp.com/…" value="' + esc(st.enlace) + '"><small id="in-enlace-ayuda">' + ayudaEnlace() + '</small></div>' +
          '</section>' +
          '<section class="in-baja" aria-labelledby="in-baja-t">' +
            '<div><h3 id="in-baja-t">Tu guía en PDF</h3><p>' + (sinYo ? "Elige arriba quién eres para descargarla." : "Sale con tu nombre, tu tienda y tu QR, lista para imprimir o mandar.") + '</p></div>' +
            '<button type="button" class="in-btn" id="in-pdf"' + (sinYo ? " disabled" : "") + '>' + ICO_BAJA + 'Descargar PDF</button>' +
          '</section>' +
        '</aside>' +
      '</div>' +
      '<p class="in-firma">Guía de ' + esc(yo ? yo.nombre : "tu equipo") + " · " + esc(tiendaUrl()) + '</p>' +
    '</div>';
    liga();
    actualizaMsj();
    barra(false);
  }
  function paso(n, t, tiempo, cuerpo){ return '<li class="in-paso"><span class="in-n">' + n + '</span><div><h3>' + t + '</h3><span class="in-tiempo">' + tiempo + '</span>' + cuerpo + "</div></li>"; }
  function copiable(etq, txt, id){ return '<div class="in-copiable"><div class="in-copiable-cab"><span>' + etq + '</span><button type="button" class="in-btn2 in-mini" data-copia="' + id + '">Copiar</button></div><p class="in-copiable-txt">' + esc(txt) + "</p></div>"; }
  function textoFalta(){
    var f = META - st.personas;
    if(st.personas <= 0) return "Ve sumando cada vez que alguien entra.";
    if(f > 0) return "Te faltan " + f + ". Llevas " + Math.round(st.personas / META * 100) + "% de la meta.";
    return "Meta cumplida: " + st.personas + " personas en tu grupo.";
  }
  function ayudaEnlace(){
    if(!st.enlace) return "Lo copias en el paso 2.";
    return enlaceOk(st.enlace) ? "Listo, ya está en tus mensajes." : "Debe empezar con https://chat.whatsapp.com/";
  }

  function barra(anima){
    var r = document.getElementById("in-relleno"); if(!r) return;
    var p = Math.max(0, Math.min(1, st.personas / META));
    if(!anima){ r.style.transition = "none"; r.style.transform = "scaleX(" + p + ")"; r.offsetWidth; r.style.transition = ""; }
    else r.style.transform = "scaleX(" + p + ")";
    r.parentNode.classList.toggle("ok", st.personas >= META);
    r.parentNode.setAttribute("aria-valuenow", st.personas);
    document.getElementById("in-lleva").textContent = st.personas;
    document.getElementById("in-falta").textContent = textoFalta();
  }
  function actualizaMsj(){
    var m = mensajes(), cur = m[st.version] || m.invita;
    document.getElementById("in-msj").innerHTML = html(cur);
    document.getElementById("in-wa").href = "https://wa.me/?text=" + encodeURIComponent(plano(cur));
    var f = faltan(cur);
    document.getElementById("in-huecos").textContent = f ? "Faltan " + f + " dato" + (f > 1 ? "s" : "") : "";
  }

  function liga(){
    var el = raiz.querySelector(".inau");
    el.addEventListener("click", function(e){
      var b = e.target.closest("button, a"); if(!b) return;
      if(b.dataset.d){ st.personas = Math.max(0, (st.personas | 0) + (+b.dataset.d)); document.getElementById("in-personas").value = st.personas; guarda(); barra(true); return; }
      if(b.dataset.v){ st.version = b.dataset.v; guarda(); el.querySelectorAll(".in-seg button").forEach(function(x){ x.setAttribute("aria-pressed", x === b); }); actualizaMsj(); return; }
      if(b.dataset.copia){ var m = mensajes(); var t = {nombre: nombreGrupo(), descripcion: descripcion(), abre: plano(m.abre)}[b.dataset.copia]; copia(t, "Copiado"); cuenta("copia-" + b.dataset.copia); return; }
      if(b.id === "in-copiar"){ copia(plano(mensajes()[st.version]), "Mensaje copiado"); cuenta("copia-" + st.version); return; }
      if(b.id === "in-wa"){ cuenta("wa-" + st.version); return; }
      if(b.id === "in-pdf"){ descargaPDF(b); return; }
      if(b.classList.contains("in-ir-enlace")){ e.preventDefault(); var f = document.getElementById("in-enlace"); f.scrollIntoView({block: "center", behavior: "smooth"}); setTimeout(function(){ f.focus({preventScroll: true}); }, 350); return; }
      if(b.classList.contains("in-ir-tarjetas")){ var t2 = document.getElementById("b-tarjetas"); if(t2){ e.preventDefault(); t2.click(); window.scrollTo({top: 0, behavior: "smooth"}); } }
    });
    document.getElementById("in-personas").addEventListener("input", function(){ st.personas = Math.max(0, Math.min(2000, parseInt(this.value, 10) || 0)); guarda(); barra(true); });
    document.getElementById("in-fecha").addEventListener("change", function(){ st.fecha = this.value; guarda(); pintaConservando("in-fecha"); });
    document.getElementById("in-enlace").addEventListener("input", function(){
      st.enlace = this.value.trim(); guarda();
      var a = document.getElementById("in-enlace-ayuda"); a.textContent = ayudaEnlace(); a.className = st.enlace && !enlaceOk(st.enlace) ? "mal" : "";
      actualizaMsj();
    });
  }
  /* Repinta (la semana cambia con la fecha) sin perder el foco ni el scroll. */
  function pintaConservando(id){ var y = window.scrollY; pinta(); window.scrollTo(0, y); var el = document.getElementById(id); if(el) try{ el.focus({preventScroll: true}); }catch(_){ } }

  /* ---------- PDF ---------- */
  var K = {ink:"#262A4A", muted:"#62668A", line:"#E6E8F0", soft:"#EEF0F8", accent:"#DB414C", accentInk:"#C8323F", tint:"#FDEEF0", good:"#1B8A5A"};
  var PW = 612, PH = 792, M = 48, ESC = 3.5; // carta en puntos; ESC = píxeles por punto
  var F = {body:'"Outfit", system-ui, sans-serif', mono:'"IBM Plex Mono", ui-monospace, monospace'};

  function carga(src){ return new Promise(function(ok, no){ var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function libs(){
    var p = [];
    if(!(window.jspdf && window.jspdf.jsPDF)) p.push(carga("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"));
    if(!window.qrcode) p.push(carga("https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"));
    var f = document.fonts ? Promise.all(["400 12px Outfit","600 12px Outfit","700 12px Outfit","400 12px 'IBM Plex Mono'","500 12px 'IBM Plex Mono'"].map(function(x){ return document.fonts.load(x); })) : Promise.resolve();
    return Promise.all(p.concat([f]));
  }

  function hoja(){
    var c = document.createElement("canvas"); c.width = PW * ESC; c.height = PH * ESC;
    var x = c.getContext("2d"); x.scale(ESC, ESC); x.fillStyle = "#fff"; x.fillRect(0, 0, PW, PH); x.textBaseline = "alphabetic";
    return {c: c, x: x, links: []};
  }
  function fuente(x, peso, tam, mono){ x.font = peso + " " + tam + "px " + (mono ? F.mono : F.body); }
  function parte(x, txt, ancho){
    var out = [];
    String(txt).split("\n").forEach(function(par){
      if(par === ""){ out.push(""); return; }
      var pal = par.split(" "), l = "";
      pal.forEach(function(w){ var t = l ? l + " " + w : w; if(x.measureText(t).width > ancho && l){ out.push(l); l = w; } else l = t; });
      out.push(l);
    });
    return out;
  }
  function redondo(x, a, b, w, h, r){ x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

  /* Marca de agua: el nombre y el link de la socia en diagonal, muy tenue, sobre toda la hoja. */
  function marcaAgua(h){
    var txt = yo.nombre + " · " + tiendaUrl();
    if(window.MarcaSVH && typeof MarcaSVH.marcaDeAgua === "function"){ try{ h.x.save(); MarcaSVH.marcaDeAgua(h.x, PW, PH, txt, {size: 8.5, alpha: .045}); h.x.restore(); return; }catch(_){ h.x.restore(); } }
    var x = h.x; x.save(); x.globalAlpha = .035; x.fillStyle = K.ink; fuente(x, 500, 11, true);
    x.translate(PW / 2, PH / 2); x.rotate(-Math.PI / 6);
    var w = x.measureText(txt).width + 70;
    for(var r = -8; r <= 8; r++) for(var k = -4; k <= 4; k++) x.fillText(txt, k * w + (r % 2) * w / 2 - w / 2, r * 78);
    x.restore();
  }
  function qrEn(x, texto, a, b, lado){
    var q = qrcode(0, "M"); q.addData(texto); q.make();
    var n = q.getModuleCount(), m = lado / n; x.fillStyle = K.ink;
    for(var r = 0; r < n; r++) for(var c = 0; c < n; c++) if(q.isDark(r, c)) x.fillRect(a + c * m, b + r * m, m + .02, m + .02);
  }

  function armaPDF(){
    var hojas = [], h, y;
    var ancho = PW - M * 2, col = 40, anchoTxt = ancho - col;
    var pieAlto = 46, abajo = PH - M - pieAlto;

    function nueva(){
      h = hoja(); hojas.push(h); marcaAgua(h);
      y = M;
      if(hojas.length > 1){
        fuente(h.x, 500, 8.5, true); h.x.fillStyle = K.muted;
        h.x.fillText("VENTA DE INAUGURACIÓN · " + tiendaNombre().toUpperCase(), M, y + 6); y += 30;
      }
    }
    function cabe(alto){ if(y + alto > abajo) nueva(); }
    /* Las líneas en blanco entre párrafos ocupan media línea. */
    function lineas(txt, peso, tam, alto, color, x0, w){ fuente(h.x, peso, tam); var ls = parte(h.x, txt, w); h.x.fillStyle = color; ls.forEach(function(l){ if(l === ""){ y += alto / 2; return; } h.x.fillText(l, x0, y + tam); y += alto; }); return ls.length; }
    function medida(txt, peso, tam, alto, w){ fuente(h.x, peso, tam); return parte(h.x, txt, w).reduce(function(a, l){ return a + (l === "" ? alto / 2 : alto); }, 0); }

    nueva();
    /* Portada: banda suave con título y de quién es la guía */
    var x = h.x;
    fuente(x, 700, 23.5); var lt = parte(x, "Tu venta de inauguración por WhatsApp", ancho - 44).length;
    fuente(x, 400, 11); var ls = parte(x, "Llena un grupo donde solo tú escribes y abre ahí tu venta. Lo armas una vez y lo usas cada mes.", ancho - 44).length;
    var altoCab = 42 + lt * 28 + 4 + ls * 15 + 16;
    x.fillStyle = K.soft; redondo(x, M, y, ancho, altoCab, 14); x.fill();
    fuente(x, 400, 9); x.fillStyle = K.muted; x.save(); if("letterSpacing" in x) x.letterSpacing = "2.4px"; x.fillText("MI EQUIPO", M + 22, y + 30); x.restore();
    fuente(x, 500, 9, true); x.fillStyle = K.accentInk; var etq = "GUÍA PARA " + yo.nombre.toUpperCase(); x.fillText(etq, PW - M - 22 - x.measureText(etq).width, y + 30);
    var y0 = y; y += 42;
    lineas("Tu venta de inauguración por WhatsApp", 700, 23.5, 28, K.ink, M + 22, ancho - 44);
    y += 4; lineas("Llena un grupo donde solo tú escribes y abre ahí tu venta. Lo armas una vez y lo usas cada mes.", 400, 11, 15, K.ink, M + 22, ancho - 44);
    y = y0 + altoCab + 16;

    /* Datos de la venta */
    fuente(x, 400, 10.5); x.fillStyle = K.muted;
    var datos = [["Tienda", tiendaNombre()], ["Tu link", tiendaUrl()], ["Fecha", st.fecha ? may(larga(new Date(st.fecha + "T12:00:00"))) : "________________________"], ["Meta", META + " personas dentro del grupo"]];
    var cw = ancho / 4;
    datos.forEach(function(d, i){
      var a = M + i * cw;
      fuente(x, 500, 8, true); x.fillStyle = K.muted; x.fillText(d[0].toUpperCase(), a, y + 8);
      fuente(x, 600, 10.5); x.fillStyle = K.ink; parte(x, d[1], cw - 12).slice(0, 2).forEach(function(l, j){ x.fillText(l, a, y + 24 + j * 14); });
      if(i === 1){ h.links.push({x: a, y: y + 12, w: x.measureText(d[1]).width, h: 16, url: "https://" + tiendaUrl()}); }
    });
    y += 42;
    x.fillStyle = K.line; x.fillRect(M, y, ancho, 1); y += 18;

    var m = mensajes();
    var P = [
      {n:"01", t:"Crea tu grupo", s:"10 minutos", b:[
        ["p", "Nombre del grupo: " + nombreGrupo()],
        ["li", "De foto, la tuya o una de tus productos."],
        ["li", "Descripción: " + descripcion()],
        ["li", "En Configuración del grupo apaga “Enviar mensajes nuevos” para los miembros: solo tú escribes."],
        ["li", "Deja encendido “Agregar a otros miembros” o “Invitar mediante enlace”."]]},
      {n:"02", t:"Copia el enlace del grupo", s:"2 minutos", b:[
        ["li", "Abre el grupo y toca su nombre, arriba."],
        ["li", "Baja hasta “Invitar al grupo mediante enlace” y toca “Copiar enlace”."],
        ["p", st.enlace && enlaceOk(st.enlace) ? "Tu enlace: " + st.enlace : "Tu enlace: _____________________________________________"]]},
      {n:"03", t:"Manda la invitación", s:"Uno a uno, sin prisa", b:[
        ["p", "Avisa qué día abres y deja que cada quien entre por su cuenta:"],
        ["msj", plano(m.invita)]]},
      {n:"04", t:"Comparte sin obligar a nadie", s:"Del día −4 al día −1", b:[
        ["li", "No agregues a nadie a la fuerza. Si varias personas reportan el grupo, WhatsApp puede limitar tu número."],
        ["li", "Primero uno a uno: a quien ya te compró y a quien te ha preguntado."],
        ["li", "Después en tus estados y redes. Pide a quien ya entró que lo comparta."]]},
      {n:"05", t:"Abre tu venta en el grupo", s:"El día de la venta", b:[
        ["p", "Empieza con este mensaje y luego publica tus productos uno por uno, con tus tarjetas:"],
        ["msj", plano(m.abre)],
        ["p", "No borres el grupo: ahí haces tu venta especial de cada mes."]]}
    ];

    var T = 10.5, L = 14.5;
    function altoBloque(b){
      if(b[0] === "p") return medida(b[1], 400, T, L, anchoTxt) + 4;
      if(b[0] === "li") return medida(b[1], 400, T, L, anchoTxt - 14) + 3;
      return medida(b[1], 400, 10, 13.8, anchoTxt - 24) + 20 + 8;
    }
    P.forEach(function(p){
      /* el paso completo va junto en una hoja: nada de títulos huérfanos */
      cabe(40 + p.b.reduce(function(a, b){ return a + altoBloque(b); }, 0));
      var x = h.x;
      fuente(x, 500, 12, true); x.fillStyle = K.accentInk; x.fillText(p.n, M, y + 15);
      fuente(x, 700, 15.5); x.fillStyle = K.ink; x.fillText(p.t, M + col, y + 15);
      fuente(x, 400, 9, true); x.fillStyle = K.muted; x.fillText(p.s, M + col, y + 30);
      y += 40;
      p.b.forEach(function(b){
        if(b[0] === "p"){ lineas(b[1], 400, T, L, K.ink, M + col, anchoTxt); y += 4; }
        else if(b[0] === "li"){ h.x.fillStyle = K.accent; h.x.beginPath(); h.x.arc(M + col + 3, y + 7.2, 2.2, 0, 7); h.x.fill(); lineas(b[1], 400, T, L, K.ink, M + col + 14, anchoTxt - 14); y += 3; }
        else if(b[0] === "msj"){
          var pad = 12, wm = anchoTxt - pad * 2, alto = medida(b[1], 400, 10, 13.8, wm) + 20;
          h.x.fillStyle = K.soft; redondo(h.x, M + col, y, anchoTxt, alto, 10); h.x.fill();
          var yy = y; y += pad - 3; lineas(b[1], 400, 10, 13.8, K.ink, M + col + pad, wm); y = yy + alto + 8;
        }
      });
      y += 10;
    });

    /* Tu semana */
    var filas = semana(), altoSem = 34 + filas.length * 22;
    cabe(altoSem + 10);
    x = h.x;
    fuente(x, 700, 15.5); x.fillStyle = K.ink; x.fillText("Tu semana", M, y + 15); y += 30;
    filas.forEach(function(s, i){
      if(i) { x.fillStyle = K.line; x.fillRect(M, y, ancho, .8); }
      fuente(x, 500, 9.5, true); x.fillStyle = s.d === 0 ? K.accentInk : K.muted; x.fillText(etiquetaDia(s.d), M, y + 15);
      fuente(x, s.d === 0 ? 600 : 400, 10.5); x.fillStyle = K.ink; x.fillText(s.t, M + 120, y + 15);
      y += 22;
    });
    y += 22;

    /* Meta: 50 círculos para ir tachando a mano */
    var r = 7.5, paso = 20.5, filasC = 5, porFila = 10, altoMeta = 28 + (filasC - 1) * paso + r + 24;
    cabe(altoMeta);
    x = h.x;
    x.fillStyle = K.ink; redondo(x, M, y, ancho, altoMeta, 14); x.fill();
    fuente(x, 500, 8.5, true); x.fillStyle = "#F2B8BC"; x.fillText("TU PRIMERA META", M + 22, y + 26);
    fuente(x, 700, 19); x.fillStyle = "#fff"; x.fillText(META + " personas dentro del grupo", M + 22, y + 48);
    fuente(x, 400, 10); x.fillStyle = "#C9CBE0";
    parte(x, "Tacha un círculo cada vez que alguien entra.", 170).forEach(function(l, j){ x.fillText(l, M + 22, y + 72 + j * 14); });
    var cx0 = M + ancho - 22 - (porFila - 1) * paso - r, cy0 = y + 28;
    x.strokeStyle = "#fff"; x.lineWidth = 1.1;
    for(var i = 0; i < META; i++){
      var cx = cx0 + (i % porFila) * paso, cy = cy0 + Math.floor(i / porFila) * paso;
      x.beginPath(); x.arc(cx, cy, r, 0, 7);
      if(i < st.personas){ x.fillStyle = K.accent; x.fill(); } else { x.globalAlpha = .55; x.stroke(); x.globalAlpha = 1; }
    }
    y += altoMeta + 10;

    /* Pie en cada hoja: QR, link y de quién es */
    hojas.forEach(function(hh, i){
      var x = hh.x, py = PH - M - 34;
      x.fillStyle = K.line; x.fillRect(M, py - 10, ancho, .8);
      qrEn(x, "https://" + tiendaUrl(), M, py, 34);
      fuente(x, 600, 10.5); x.fillStyle = K.ink; x.fillText(tiendaNombre(), M + 46, py + 14);
      fuente(x, 400, 9.5, true); x.fillStyle = K.accentInk; x.fillText(tiendaUrl(), M + 46, py + 28);
      var wl = x.measureText(tiendaUrl()).width;
      hh.links.push({x: M, y: py, w: 46 + wl, h: 34, url: "https://" + tiendaUrl()});
      fuente(x, 400, 8.5, true); x.fillStyle = K.muted;
      var der = "Guía de " + yo.nombre + " · " + (i + 1) + "/" + hojas.length;
      x.fillText(der, PW - M - x.measureText(der).width, py + 28);
    });
    return hojas;
  }

  function aPDF(hojas){
    var archivo = "venta-de-inauguracion-" + yo.slug + ".pdf";
    var meta = {title: "Tu venta de inauguración por WhatsApp · " + tiendaNombre(), author: yo.nombre, subject: "Guía de " + yo.nombre + " · " + tiendaUrl(), creator: SITIO};
    var doc = new window.jspdf.jsPDF({unit: "pt", format: "letter", compress: true});
    hojas.forEach(function(hh, i){
      if(i) doc.addPage("letter", "portrait");
      doc.addImage(hh.c.toDataURL("image/jpeg", .9), "JPEG", 0, 0, PW, PH, undefined, "FAST");
      hh.links.forEach(function(l){ doc.link(l.x, l.y, l.w, l.h, {url: l.url}); });
    });
    doc.setProperties(meta);
    return {doc: doc, archivo: archivo};
  }

  /* Con MarcaSVH.pdf (la misma de Tarjetas) si está; si no, jsPDF directo. Regresa un Blob. */
  function blobPDF(hojas){
    if(window.MarcaSVH && typeof MarcaSVH.pdf === "function"){
      return MarcaSVH.pdf(hojas.map(function(hh){ return {canvas: hh.c, links: hh.links.map(function(l){ return {x: l.x * ESC, y: l.y * ESC, w: l.w * ESC, h: l.h * ESC, url: l.url}; })}; }),
        {title: "Tu venta de inauguración por WhatsApp · " + tiendaNombre(), author: yo.nombre, subject: "Guía de " + yo.nombre + " · " + tiendaUrl()});
    }
    return Promise.resolve(aPDF(hojas).doc.output("blob"));
  }
  function descargaPDF(btn){
    if(!yo) return;
    var txt = btn.innerHTML; btn.disabled = true; btn.lastChild.textContent = "Armando…";
    libs().then(function(){ return blobPDF(armaPDF()); }).then(function(blob){
      var archivo = "venta-de-inauguracion-" + yo.slug + ".pdf";
      if(window.H && H.descarga) H.descarga(blob, archivo); else { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = archivo; a.click(); }
      cuenta("pdf"); aviso("Listo: tu guía se descargó");
    }).catch(function(){ aviso("No se pudo armar el PDF. Revisa tu conexión e intenta de nuevo."); })
      .then(function(){ btn.disabled = false; btn.innerHTML = txt; });
  }
  /* Para revisar el PDF sin descargar (capturas). */
  window.InauguracionPDF = function(){ return libs().then(function(){ return armaPDF().map(function(h){ return h.c; }); }); };

  /* La pestaña se abre con #inauguracion, que también es el id de este contenedor: sin esto el navegador
     brinca hasta aquí y esconde el selector "Soy". */
  if(location.hash === "#inauguracion"){ if("scrollRestoration" in history) history.scrollRestoration = "manual"; window.addEventListener("load", function(){ window.scrollTo(0, 0); }); window.scrollTo(0, 0); }

  /* ---------- arranque: socia elegida arriba ---------- */
  function ponYo(s){ yo = s && s.slug ? s : null; lee(); pinta(); }
  if(window.VentasWA && typeof VentasWA.yo === "function"){
    ponYo(VentasWA.yo());
    if(typeof VentasWA.onYo === "function") VentasWA.onYo(ponYo);
  } else if(window.H && H.miSlug && H.equipo){
    ponYo(null);
    var s = H.param() || H.miSlug();
    if(s) H.equipo().then(function(l){ var c = l.filter(function(x){ return x.slug === s; })[0]; if(c) ponYo(c); });
  } else ponYo(null);
})();
