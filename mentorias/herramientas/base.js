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
  document.addEventListener("click", function(e){ var a = e.target.closest && e.target.closest("[data-cuenta]"); if(a) cuenta(a.dataset.cuenta, (a.textContent || "").trim()); });
  return {lee: lee, guarda: guarda, aviso: aviso, copia: copia, wa: wa, cuenta: cuenta, fmt: fmt, esc: esc};
})();
