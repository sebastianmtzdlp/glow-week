/* La ruta "Entiende el plan y únete": 3 paradas que se recorren en orden.
   Uso: <nav data-ruta="2"></nav> y <script src="/unete/ruta.js" defer></script>
   Si la página llegó con ?de=<slug> (o ?c=), todas las ligas de la ruta lo conservan,
   así quien invitó sigue siendo a quien se le escribe al final. */
(function(){
  var PARADAS = [
    {n: 1, t: "Lo que te pierdes", d: "Lo que pagas de más por no ser socia", u: "/unete/"},
    {n: 2, t: "Entiende el plan", d: "Niveles, bonos y dirección con números", u: "/plan-de-compensacion/"},
    {n: 3, t: "Cómo te inscribes", d: "Lo que cuesta, lo que pide y tus primeros 4 meses", u: "/unete/inscripcion/"}
  ];
  var de = "";
  try{ var q = new URLSearchParams(location.search); de = (q.get("de") || q.get("c") || "").replace(/[^a-z0-9-]/gi, "").toLowerCase(); }catch(_){}
  var suf = de ? "?de=" + de : "";
  var css = ".ruta{margin:20px 0 0}.ruta ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1.5px solid #262A4A}"
    + ".ruta li{position:relative}.ruta a{display:block;padding:10px 8px 10px 0;text-decoration:none;color:#6C7090;font:500 13px/1.25 Outfit,system-ui,sans-serif}"
    + ".ruta .rn{display:block;font:500 12px/1 'IBM Plex Mono',ui-monospace,monospace;margin-bottom:6px;font-variant-numeric:tabular-nums}"
    + ".ruta li.aqui a{color:#262A4A;font-weight:700}.ruta li.aqui::before{content:'';position:absolute;top:-1.5px;left:0;right:8px;height:3px;background:#DB414C}"
    + ".ruta li.aqui .rn{color:#C8323F}.ruta .rd{display:none}"
    + "@media (min-width:640px){.ruta .rd{display:block;font-weight:400;color:#6C7090;margin-top:3px;font-size:13px}}"
    + ".ruta-sig{display:grid;grid-template-columns:1fr auto;gap:4px 16px;align-items:center;margin-top:48px;padding:20px 0;border-top:1.5px solid #262A4A;border-bottom:1px solid #E6E8F0;text-decoration:none;color:#262A4A}"
    + ".ruta-sig small{font:500 12px/1 'IBM Plex Mono',ui-monospace,monospace;color:#C8323F}.ruta-sig b{font:700 20px/1.2 Outfit,system-ui,sans-serif;grid-column:1}"
    + ".ruta-sig span{color:#6C7090;font-size:15px;grid-column:1}.ruta-sig i{grid-row:1/span 3;grid-column:2;font-style:normal;font:500 18px/1 'IBM Plex Mono',monospace;color:#C8323F}"
    + "@media (hover:hover) and (pointer:fine){.ruta a:hover{color:#262A4A}.ruta-sig:hover b{text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  function pinta(){
    document.querySelectorAll("[data-ruta]").forEach(function(el){
      var aqui = +el.getAttribute("data-ruta");
      el.classList.add("ruta");
      el.setAttribute("aria-label", "Entiende el plan y únete, paso " + aqui + " de 3");
      el.innerHTML = "<ol>" + PARADAS.map(function(p){
        return '<li' + (p.n === aqui ? ' class="aqui"' : '') + '><a href="' + p.u + suf + '"' + (p.n === aqui ? ' aria-current="step"' : '') + '><span class="rn">' + p.n + ' de 3</span>' + p.t + '<span class="rd">' + p.d + '</span></a></li>';
      }).join("") + "</ol>";
    });
    /* "Sigue": <a data-ruta-sig="2"></a> pinta la liga a la siguiente parada */
    document.querySelectorAll("[data-ruta-sig]").forEach(function(a){
      var p = PARADAS[+a.getAttribute("data-ruta-sig") - 1]; if(!p) return;
      a.classList.add("ruta-sig"); a.href = p.u + suf;
      a.innerHTML = "<small>Paso " + p.n + " de 3</small><b>" + p.t + "</b><span>" + p.d + "</span><i aria-hidden=\"true\">→</i>";
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", pinta); else pinta();
  window.RUTA = {de: de, suf: suf, paradas: PARADAS};
})();
