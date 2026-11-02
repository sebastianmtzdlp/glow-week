/* Herramientas Pro: catálogo (planes, herramientas y paquetes), llamadas a las Edge Functions, código guardado en el teléfono
   y los pedazos Pro que comparten las herramientas (caja Pro, nube). */
window.PRO = (function(){
  // Cambia a true cuando Mercado Pago esté conectado (access token y webhook en Supabase).
  var PAGOS_ABIERTOS = false;
  var BASE = "https://ctutqqstqjdngxdjzckf.supabase.co/functions/v1/";
  var FN = BASE + "pro-pago", FN_DATOS = BASE + "pro-datos";
  var KEY_PUB = "sb_publishable_ltaNA7nnVozoSCOcZIjg";
  var SOPORTE = "525543506136"; // WhatsApp para dudas de compras
  // Precios en MXN: deben ser los mismos que supabase/pro.sql y supabase/pro-herramientas.sql (lo que cobra Mercado Pago sale de la base, no de aquí).
  var P = [
    {s:"plan-anual", t:"Plan anual de 52 semanas", precio:349, tipo:"plan", para:"Para quien quiere el año completo, de 3% a Directora Oro.",
     d:"Diez bloques de semanas, uno por nivel. Cada semana con su meta, qué hacer y cómo medirlo, y la revisión de nivel al cerrar cada bloque."},
    {s:"planes-nivel", t:"Planes por nivel y dirección", precio:249, tipo:"plan", para:"Para quien ya sabe a qué nivel va este mes.",
     d:"Un plan de un mes para 12%, 15%, 18%, 22%, 25% y Directora; planes de 3 meses para consolidar dirección, Bronce y Oro; retos cortos de 3% a 9% y los laterales explicados con números."},
    {s:"plan-compromiso", t:"Tu ritmo y los 32 enfoques", precio:199, tipo:"plan", para:"Para quien quiere ordenar su día a día.",
     d:"Part, Medio o Full Time con sus números por día, semana y mes, y un plan para cada uno de los 32 enfoques semanales de la agenda del equipo."},
    {s:"plan-mentora", t:"Plan de mentora y semana de directora", precio:149, tipo:"plan", para:"Para quien acompaña a una socia o a una líder.",
     d:"El mes de mentoría semana por semana, el plan de 3 meses para formar una líder y la semana tipo de una directora."},
    {s:"plan-equipo", t:"Plan para llevar al equipo", precio:149, tipo:"plan", para:"Para quien quiere que todo el equipo trabaje al mismo ritmo.",
     d:"El ritmo diario, semanal y mensual del equipo, planes de un mes para arrancar socias, recompra, recuperar inactivas, contenido y eventos, y el reto Todas a 3%."}
  ];
  // Herramientas con versión Pro. `ruta` es la herramienta gratis donde se activa lo Pro.
  var T = [
    {s:"lista", t:"Mi lista de 50 · Pro", precio:199, tipo:"ventas", ruta:"/mentorias/herramientas/lista/", para:"Para quien ya tiene su lista y no quiere perderla.",
     d:"Sin límite de personas, recompra que se avisa sola por producto, historial por persona, tus tasas de la semana 8 y tu lista en la nube, en todos tus celulares."},
    {s:"presentacion", t:"Presentación del negocio · Pro", precio:149, tipo:"ventas", ruta:"/mentorias/herramientas/presentacion/", para:"Para quien presenta el negocio cada semana.",
     d:"Tu presentación con tu foto, tu historia y tu link propio; cuántas veces se abrió y los dos mensajes de seguimiento listos."},
    {s:"objeciones", t:"¿Y si me dice que no? · Pro", precio:99, tipo:"ventas", ruta:"/mentorias/herramientas/objeciones/", para:"Para quien se traba cuando le dicen que no.",
     d:"El banco completo: objeciones al negocio, de reactivación y de recompra, con tres tonos por objeción y modo práctica."},
    {s:"rutina", t:"Arma su rutina · Pro", precio:149, tipo:"ventas", ruta:"/mentorias/herramientas/rutina/", para:"Para quien vende skincare completo.",
     d:"Todos los pasos de la rutina, tu tienda en la tarjeta y cada producto apuntado en tu lista con su fecha de recompra."},
    {s:"pedidos", t:"Pedidos y cobros · Pro", precio:199, tipo:"ventas", ruta:"/mentorias/herramientas/pedidos/", para:"Para quien entrega pedidos cada semana.",
     d:"Tu ganancia por pedido y del mes, los pedidos de tu tablero se agregan con un toque, y exportas todo a hoja de cálculo."},
    {s:"equipo", t:"Mapa de mi equipo · Pro", precio:249, tipo:"lider", ruta:"/mentorias/herramientas/equipo/", para:"Para la líder que abre sus números antes de cada 1 a 1.",
     d:"Líneas sin límite, seis meses de historia, comparación por línea, a quién escribirle y tu mapa en la nube."},
    {s:"reto", t:"Reto en equipo", precio:199, tipo:"lider", ruta:"/mentorias/herramientas/reto/", para:"Para la líder que arranca socias cada mes.",
     d:"Crea el reto, tus socias se unen gratis con tu código y reportan con un toque; tú ves el tablero, quién lleva días sin reportar y el cierre con resultados."},
    {s:"reconocimientos", t:"Reconocimientos · Pro", precio:99, tipo:"lider", ruta:"/mentorias/herramientas/reconocimientos/", para:"Para la líder que reconoce todos los días.",
     d:"Con su foto y tu logo, el cuadro de honor del mes que sale del Mapa de mi equipo, rachas e historial."},
    {s:"reunion", t:"Mi reunión · Pro", precio:99, tipo:"lider", ruta:"/mentorias/herramientas/reunion/", para:"Para quien organiza sus propias reuniones.",
     d:"Lista de invitadas con confirmó, vino y compró, resultados de la reunión y proponerla a la cartelera del equipo."},
    {s:"capacitaciones", t:"Capacitaciones listas", precio:249, tipo:"lider", ruta:"/mentorias/herramientas/capacitaciones/", para:"Para la líder que da la capacitación semanal.",
     d:"Doce sesiones de 45 minutos, un trimestre completo: guion, dinámica, tarea de la semana y mensaje para convocar."},
    {s:"contenido", t:"Qué publico hoy · Pro", precio:149, tipo:"contenido", ruta:"/mentorias/herramientas/contenido/", para:"Para quien ya publica y quiere guiones.",
     d:"Noventa guiones completos: reels, historias y carruseles, por ritmo, con productos del catálogo y el plan de cuatro semanas de contenido que trae prospectos."},
    {s:"mi-mes", t:"Mi mes · Pro", precio:99, tipo:"seguimiento", ruta:"/mentorias/herramientas/mi-mes/", para:"Para quien quiere ver cómo va mes contra mes.",
     d:"Historial de meses, tus tasas y la comparación contra el plan Pro que compraste."},
    {s:"inventario", t:"Lo que tengo en casa · Pro", precio:99, tipo:"finanzas", ruta:"/mentorias/herramientas/inventario/", para:"Para quien vende con producto en mano.",
     d:"Sin tope de productos, avisos de lo que se acaba, ganancia de lo vendido e historial."},
    {s:"testimonios", t:"Lo que dicen mis clientas · Pro", precio:99, tipo:"contenido", ruta:"/mentorias/herramientas/testimonios/", para:"Para quien tiene clientas contentas.",
     d:"Un link para que tus clientas te dejen su testimonio. Tú apruebas los que quieras y los copias para tus historias."},
    {s:"en-vivo", t:"Guion de venta en vivo · Pro", precio:99, tipo:"eventos", ruta:"/mentorias/herramientas/en-vivo/", para:"Para quien conduce lives.",
     d:"El generador: eliges productos del catálogo y te arma el guion con orden, minutos, precios y el mensaje para después del live."},
    {s:"equipo-por-tipo", t:"Tu equipo, persona por persona", precio:149, tipo:"lider", ruta:"/mentorias/herramientas/que-quiere/", para:"Para la líder que quiere acompañar a cada quien a su ritmo.",
     d:"El mapa de tu equipo según lo que quiere cada persona (le gusta, va por algo o va por todo), un plan de un mes para cada una, guiones de 1 a 1, mensajes de grupo y cómo notar cuando alguien cambia de ritmo."}
  ];
  // Qué desbloquea Pro en cada herramienta (lo que la caja muestra junto al botón)
  var G = {
    lista:["Sin tope de 50 personas","Recompra por producto: te avisa cuándo le toca a cada clienta","Tus tasas de respuesta, citas y socias","Importar una lista pegada y tu lista en la nube, en todos tus celulares"],
    presentacion:["Tu historia en tu link, que se ve cuando alguien lo abre","Cuántas veces se abrió cada link tuyo"],
    objeciones:["Banco completo de 17 objeciones: negocio, reactivación y recompra","Tres tonos por cada una: cercano, directo y breve","Modo práctica para ensayar"],
    rutina:["Todos los pasos: tónico, contorno de ojos y mascarilla","Tu tienda en la tarjeta","Un toque y la clienta queda en tu lista con fecha de recompra"],
    pedidos:["Sin tope de 15 pedidos","Ganancia del mes y porcentaje sobre lo vendido","Trae los pedidos de tu tablero con un toque","Exportar a hoja de cálculo y respaldo en la nube"],
    equipo:["Líneas sin tope (gratis: 8)","Seis meses de historia y comparación por línea","Todas las que bajaron, con su mensaje de WhatsApp","Tu mapa en la nube"],
    reto:["Crear retos de hasta 60 días para tu equipo","Ver quién lleva días sin reportar","Mandar el tablero al grupo con un toque"],
    reconocimientos:["Foto de la persona y tu logo en la tarjeta","Cuadro de honor del mes, desde tu Mapa de mi equipo","Racha e historial por persona"],
    reunion:["Lista de invitadas: confirmó, vino y compró","Resultados de cada reunión","Proponer tu reunión a la cartelera del equipo"],
    capacitaciones:["Las 12 sesiones de un trimestre, no solo la primera","Guion, dinámica, tarea y mensaje para convocar de cada una"],
    contenido:["90 guiones completos: reels, historias y carruseles","Filtro por tipo y botón de copiar","Para no quedarte en blanco ningún día"],
    "mi-mes":["Seis meses de historia, uno junto a otro","Tus tasas mes a mes","Tu cierre en la nube"],
    inventario:["Sin tope de 20 productos","Aviso de lo que se acaba, con mínimo por producto","Ganancia de lo vendido e historial"],
    testimonios:["Recibir lo que dicen tus clientas en tu link","Aprobar o quitar cada uno","Copiar los que apruebes para tus historias"],
    "en-vivo":["El guion armado con los productos que vas a mostrar","Minutos, precios y cierre de cada producto","Mensaje para después del live"]
  };
  var PAQ = [
    {s:"todo", t:"Los 5 planes", precio:699, tipo:"paquete", para:"Para la líder que va a usarlos con todo su equipo.", incluye:P.map(function(x){ return x.s; })},
    {s:"pack-ventas", t:"Pro de ventas", precio:449, tipo:"paquete", para:"Para la socia que vende cada semana.", incluye:["lista","presentacion","objeciones","rutina","pedidos"]},
    {s:"pack-lider", t:"Pro de líder", precio:599, tipo:"paquete", para:"Para la líder con equipo.", incluye:["equipo","reto","reconocimientos","reunion","capacitaciones"]},
    {s:"todo-pro", t:"Todo Pro", precio:1299, tipo:"paquete", para:"Planes y todas las herramientas, para la directora.", incluye:P.concat(T).map(function(x){ return x.s; })}
  ];
  var TODOS = P.concat(T, PAQ);
  var KEY = "mtb-pro-v1";
  function codigo(v){ if(v !== undefined){ H.guarda(KEY, {codigo:v}); try{ sessionStorage.removeItem("mtb-pro-acc"); }catch(_){ } } return (H.lee(KEY, {}) || {}).codigo || ""; }
  function llamaA(url, body){
    return fetch(url, {method:"POST", headers:{"Content-Type":"application/json", "apikey":KEY_PUB}, body:JSON.stringify(body)})
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ if(!r.ok) throw new Error(j.error || "No se pudo conectar"); return j; }); });
  }
  function llama(body){ return llamaA(FN, body); }
  function datos(body){ body.codigo = body.codigo || codigo(); return llamaA(FN_DATOS, body); }
  function busca(s){ return TODOS.filter(function(x){ return x.s === s; })[0]; }
  function abre(s){ var p = busca(s); if(!p) return []; return p.incluye ? p.incluye : [s]; }

  // ¿Mi código incluye esta herramienta? Se guarda 15 minutos para no llamar en cada página.
  function tiene(slug){
    var c = codigo(); if(!c) return Promise.resolve({ok:false, productos:[]});
    var cache = null; try{ cache = JSON.parse(sessionStorage.getItem("mtb-pro-acc") || "null"); }catch(_){ }
    var ahora = Date.now();
    var p = cache && cache.c === c && ahora - cache.t < 9e5 ? Promise.resolve(cache.j) : llama({accion:"abrir", codigo:c}).then(function(j){ try{ sessionStorage.setItem("mtb-pro-acc", JSON.stringify({c:c, t:ahora, j:j})); }catch(_){ } return j; });
    return p.then(function(j){ var prods = j.productos || []; return {ok: prods.indexOf(slug) >= 0, productos: prods}; }, function(){ return {ok:false, productos:[], error:true}; });
  }
  // Contenido Pro de una herramienta (capítulos de pro_contenido).
  function contenido(slug){ return llama({accion:"abrir", codigo:codigo(), producto:slug}).then(function(j){ return j.capitulos || []; }); }
  // La nube: lo que llena una herramienta, guardado por código.
  function nube(herr){
    return {
      lee: function(){ return datos({accion:"datos.lee", herramienta:herr}).then(function(j){ return j.datos || null; }); },
      guarda: function(d, publico){ return datos({accion:"datos.guarda", herramienta:herr, datos:d, publico:!!publico}); }
    };
  }
  // La caja Pro que comparten las herramientas: si tu código la incluye, avisa; si no, ofrece comprar o escribir el código.
  function caja(el, slug, opts){
    opts = opts || {}; var p = busca(slug); if(!el || !p) return Promise.resolve({ok:false});
    function pintaCerrada(err){
      el.innerHTML = '<div class="pro-caja"><div class="pro-cab"><span class="pro-etq">Pro</span><b>'+H.esc(opts.titulo || p.t.replace(" · Pro",""))+'</b><span class="pro-precio">'+(PAGOS_ABIERTOS ? '$'+H.fmt(p.precio)+' una vez' : 'aún no se vende')+'</span></div>'+
        '<p>'+H.esc(opts.texto || p.d)+'</p>'+
        (G[slug] ? '<p class="pro-g">Con Pro ganas:</p><ul class="pro-gana">'+G[slug].map(function(x){ return '<li>'+H.esc(x)+'</li>'; }).join("")+'</ul>' : '')+
        '<div class="pro-acc"><a class="btn" href="/mentorias/herramientas/pro/#'+p.s+'" data-cuenta="ver-pro">'+(PAGOS_ABIERTOS ? 'Quiero Pro · $'+H.fmt(p.precio) : 'Ver qué trae Pro')+'</a>'+
        '<form class="pro-cod" autocomplete="off"><input type="text" placeholder="SVH-XXXX-XXXX" aria-label="Tu código Pro" spellcheck="false"><button class="btn2" type="submit">Ya tengo código</button></form></div>'+
        (err ? '<p class="nota pro-err">'+H.esc(err)+'</p>' : '')+'<p class="nota">'+(PAGOS_ABIERTOS ? 'Pago único, acceso personal e inmediato.' : 'Todavía no se cobra. Si el equipo te dio un código, escríbelo aquí.')+' <a href="/mentorias/herramientas/terminos/">Términos y condiciones</a></p></div>';
      el.querySelector("form").addEventListener("submit", function(e){
        e.preventDefault(); var c = el.querySelector("input").value.trim().toUpperCase().replace(/\s+/g, "");
        if(!c) return; codigo(c); el.querySelector("button").textContent = "Revisando…";
        tiene(slug).then(function(r){ if(r.ok){ location.reload(); } else { pintaCerrada(r.error ? "No pudimos revisar el código ahorita. Intenta en un momento." : "Ese código no incluye esta herramienta. Puedes agregarla en la página Pro."); } });
      });
    }
    return tiene(slug).then(function(r){
      if(r.ok){ el.innerHTML = '<div class="pro-caja on"><div class="pro-cab"><span class="pro-etq">Pro</span><b>'+H.esc(opts.titulo || p.t.replace(" · Pro",""))+'</b><span class="pro-precio">activo con tu código</span></div>'+(opts.activo ? '<p>'+H.esc(opts.activo)+'</p>' : '')+'<p class="nota"><a href="/mentorias/herramientas/terminos/">Términos y condiciones</a></p></div>'; }
      else pintaCerrada();
      return r;
    });
  }
  return {abiertos:PAGOS_ABIERTOS, productos:P, herramientas:T, paquetes:PAQ, todos:TODOS, todo:PAQ[0], busca:busca, abre:abre, codigo:codigo, llama:llama, datos:datos, tiene:tiene, contenido:contenido, nube:nube, caja:caja, soporte:SOPORTE};
})();
