/* Ayudas compartidas de las herramientas: guardar en el teléfono, avisos, copiar, WhatsApp y conteo. */
window.H = (function(){
  var pref = document.documentElement.dataset.cuenta || "herramientas";
  function lee(k, def){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }catch(_){ return def; } }
  function guarda(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(_){ return false; } }
  var t, toastEl;
  function aviso(txt){
    if(!toastEl){ toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role","status"); document.body.appendChild(toastEl); }
    toastEl.textContent = txt; toastEl.classList.add("on"); clearTimeout(t); t = setTimeout(function(){ toastEl.classList.remove("on"); }, 2200);
  }
  function copia(txt, ok){
    var listo = function(){ aviso(ok || "Copiado"); };
    if(navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(txt).then(listo, function(){ viejo(txt); listo(); }); }
    else { viejo(txt); listo(); }
  }
  function viejo(txt){ var a = document.createElement("textarea"); a.value = txt; a.setAttribute("readonly",""); a.style.position="fixed"; a.style.opacity="0"; document.body.appendChild(a); a.select(); try{ document.execCommand("copy"); }catch(_){} a.remove(); }
  function wa(txt, numero){ return "https://wa.me/" + (numero || "") + "?text=" + encodeURIComponent(txt); }
  function cuenta(path, title){ try{ window.goatcounter.count({path: pref + "/" + path, title: title || path, event: true}); }catch(_){} }
  function fmt(n){ return Math.round(n).toLocaleString("es-MX"); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function iso(d){ d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
  function fecha(s, o){ if(!s) return ""; return new Date(s + "T12:00:00").toLocaleDateString("es-MX", o || {day:"numeric", month:"short"}); }
  function dias(a, b){ return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5); }
  function suma(s, n){ var d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d); }
  function descarga(blob, nombre){ var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 800); }
  function equipo(){ return fetch("/_data/equipo.json").then(function(r){ return r.json(); }).then(function(d){ return d.consultoras || []; }).catch(function(){ return []; }); }
  document.addEventListener("click", function(e){ var a = e.target.closest && e.target.closest("[data-cuenta]"); if(a) cuenta(a.dataset.cuenta, (a.textContent || "").trim()); });
  /* Quién eres y a quién se escribe: un solo lugar para todo el sitio.
     - Tu nombre se elige una vez (en el Centro o en "Mi tienda") y se guarda como glow_who.
     - Una página abierta con ?de=<slug> o ?c=<slug> escribe a esa consultora.
     - Sin nadie elegido, escribe a WA_DEFAULT. */
  var WA_DEFAULT = {slug: "sel", nombre: "Selene", whatsapp: "525541456984"};
  function param(){ try{ var q = new URLSearchParams(location.search); return (q.get("de") || q.get("c") || "").replace(/[^a-z0-9-]/gi, "").toLowerCase(); }catch(_){ return ""; } }
  function miSlug(v){ try{ if(v !== undefined){ if(v) localStorage.setItem("glow_who", v); else localStorage.removeItem("glow_who"); return v; } return localStorage.getItem("glow_who") || ""; }catch(_){ return ""; } }
  /* Promesa con {slug, nombre, whatsapp}: la de la liga, si no tú, si no WA_DEFAULT. */
  function contacto(){
    var s = param() || miSlug();
    return equipo().then(function(lista){
      var c = lista.filter(function(x){ return x.slug === s; })[0];
      return c ? {slug: c.slug, nombre: c.nombre, whatsapp: c.whatsapp} : WA_DEFAULT;
    });
  }
  /* Liga para compartir que lleva tu nombre: https://mitienda.beauty/unete/?de=sel */
  function liga(ruta){ var s = miSlug(); return "https://mitienda.beauty" + ruta + (s ? (ruta.indexOf("?") < 0 ? "?" : "&") + "de=" + s : ""); }
  return {lee: lee, guarda: guarda, aviso: aviso, copia: copia, wa: wa, cuenta: cuenta, fmt: fmt, esc: esc, iso: iso, fecha: fecha, dias: dias, suma: suma, descarga: descarga, equipo: equipo,
          WA_DEFAULT: WA_DEFAULT, miSlug: miSlug, contacto: contacto, liga: liga, param: param};
})();
