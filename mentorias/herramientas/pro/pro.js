/* Herramientas Pro: catálogo, llamada a la Edge Function y código guardado en el teléfono. */
window.PRO = (function(){
  // Cambia a true cuando Mercado Pago esté conectado (access token y webhook en Supabase).
  var PAGOS_ABIERTOS = false;
  var FN = "https://ctutqqstqjdngxdjzckf.supabase.co/functions/v1/pro-pago";
  var KEY_PUB = "sb_publishable_ltaNA7nnVozoSCOcZIjg";
  var SOPORTE = "525543506136"; // WhatsApp para dudas de compras
  // Precios en MXN: deben ser los mismos que supabase/pro.sql (los que cobra Mercado Pago salen de la base, no de aquí).
  var P = [
    {s:"plan-anual", t:"Plan anual de 52 semanas", precio:349, para:"Para quien quiere el año completo, de 3% a Directora Oro.",
     d:"Diez bloques de semanas, uno por nivel. Cada semana con su meta, qué hacer y cómo medirlo, y la revisión de nivel al cerrar cada bloque."},
    {s:"planes-nivel", t:"Planes por nivel y dirección", precio:249, para:"Para quien ya sabe a qué nivel va este mes.",
     d:"Un plan de un mes para 12%, 15%, 18%, 22%, 25% y Directora; planes de 3 meses para consolidar dirección, Bronce y Oro; retos cortos de 3% a 9% y los laterales explicados con números."},
    {s:"plan-compromiso", t:"Tu ritmo y los 32 enfoques", precio:199, para:"Para quien quiere ordenar su día a día.",
     d:"Part, Medio o Full Time con sus números por día, semana y mes, y un plan para cada uno de los 32 enfoques semanales de la agenda del equipo."},
    {s:"plan-mentora", t:"Plan de mentora y semana de directora", precio:149, para:"Para quien acompaña a una socia o a una líder.",
     d:"El mes de mentoría semana por semana, el plan de 3 meses para formar una líder y la semana tipo de una directora."},
    {s:"plan-equipo", t:"Plan para llevar al equipo", precio:149, para:"Para quien quiere que todo el equipo trabaje al mismo ritmo.",
     d:"El ritmo diario, semanal y mensual del equipo, planes de un mes para arrancar socias, recompra, recuperar inactivas, contenido y eventos, y el reto Todas a 3%."}
  ];
  var TODO = {s:"todo", t:"Todo Pro", precio:699, incluye:P.map(function(x){ return x.s; })};
  var KEY = "mtb-pro-v1";
  function codigo(v){ if(v !== undefined){ H.guarda(KEY, {codigo:v}); } return (H.lee(KEY, {}) || {}).codigo || ""; }
  function llama(body){
    return fetch(FN, {method:"POST", headers:{"Content-Type":"application/json", "apikey":KEY_PUB}, body:JSON.stringify(body)})
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ if(!r.ok) throw new Error(j.error || "No se pudo conectar"); return j; }); });
  }
  function busca(s){ return s === "todo" ? TODO : P.filter(function(x){ return x.s === s; })[0]; }
  return {abiertos:PAGOS_ABIERTOS, productos:P, todo:TODO, busca:busca, codigo:codigo, llama:llama, soporte:SOPORTE};
})();
