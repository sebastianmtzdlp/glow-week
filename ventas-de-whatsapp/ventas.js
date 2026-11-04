/* Página de Ventas por WhatsApp: quién eres (compartido por todas las pestañas) y pestañas.
   window.VentasWA.yo()      -> {slug, nombre, tienda, whatsapp, genero} o null
   window.VentasWA.onYo(fn)  -> llama fn(yo) ahora y cada vez que cambia
   window.VentasWA.tienda(c) -> nombre de su tienda ("Pao's Beauty Lounge" o "Farmasi con Sebas")
   window.VentasWA.liga(c)   -> "https://mitienda.beauty/<slug>/"
   window.VentasWA.waBonito("525543506136") -> "55 4350 6136"
   window.VentasWA.listo     -> promesa que se cumple cuando ya cargó el equipo */
window.VentasWA = (function(){
  var $ = function(id){ return document.getElementById(id); };
  var EQ = [], YO = null, subs = [];
  function tienda(c){ return c ? (c.tienda || ("Farmasi con " + c.nombre)) : ""; }
  function liga(c){ return c ? "https://mitienda.beauty/" + c.slug + "/" : "https://mitienda.beauty/"; }
  function waBonito(n){ n = String(n || "").replace(/^52/, ""); return n.length === 10 ? n.slice(0, 2) + " " + n.slice(2, 6) + " " + n.slice(6) : n; }
  function aviso(){ subs.forEach(function(f){ try{ f(YO); }catch(e){ console.error(e); } }); }
  function elige(s){
    YO = EQ.filter(function(x){ return x.slug === s; })[0] || null;
    $("who").value = YO ? YO.slug : ""; $("ligaMia").hidden = !YO;
    if(YO){ H.miSlug(YO.slug); $("ligaTxt").textContent = "mitienda.beauty/" + YO.slug; }
    aviso();
  }
  /* pestañas: #tarjetas, #inauguracion */
  function tabs(){
    var bs = [].slice.call(document.querySelectorAll('[role=tab][data-t]'));
    function show(t){ bs.forEach(function(b){ var on = b.dataset.t === t; b.setAttribute("aria-pressed", on); b.setAttribute("aria-selected", on); var p = $("t-" + b.dataset.t); if(p) p.hidden = !on; }); }
    bs.forEach(function(b){ b.onclick = function(){ show(b.dataset.t); history.replaceState(null, "", "#" + b.dataset.t); H.cuenta("tab-" + b.dataset.t); }; });
    var cont = document.querySelector('.tabs'); if(cont) cont.hidden = bs.filter(function(x){ return !x.hidden; }).length < 2;
    var h = location.hash.slice(1), b = bs.filter(function(x){ return x.dataset.t === h && !x.hidden; })[0];
    if(b) show(h);
  }
  var listo = H.equipo().then(function(l){
    EQ = l.slice().sort(function(a, b){ return a.nombre.localeCompare(b.nombre, "es"); });
    $("who").innerHTML = '<option value="">Elige tu nombre</option>' + EQ.map(function(c){ return '<option value="' + c.slug + '">' + H.esc(c.nombre) + '</option>'; }).join("");
    $("who").onchange = function(e){ elige(e.target.value); H.cuenta("elige-nombre"); };
    elige(H.param() || H.miSlug());
    return EQ;
  });
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", tabs); else tabs();
  window.addEventListener("load", tabs); /* por si otra pestaña se destapa después */
  return {
    yo: function(){ return YO; },
    onYo: function(f){ subs.push(f); if(EQ.length) f(YO); },
    equipo: function(){ return EQ; },
    tienda: tienda, liga: liga, waBonito: waBonito, listo: listo
  };
})();
