// Vistas de WhatsApp (1200x630) de /mentorias/herramientas/ y sus herramientas: og/mentorias-herramientas.png y og/h-*.png
// Uso: node scripts/og-herramientas.cjs [nombre ...]   (necesita red para Google Fonts; sin nombres hace todas)
const { chromium } = require("playwright");
const path = require("path");
const RAIZ = path.resolve(__dirname, "..");
const FUENTES = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400&family=Outfit:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap">`;
const CSS = `html,body{margin:0}body{width:1200px;height:630px;background:#fff;color:#262A4A;font-family:Outfit;display:grid;grid-template-columns:1.15fr .85fr;gap:56px;padding:72px 80px;box-sizing:border-box;align-items:center}
body.navy{background:#1B1F3B;color:#F4F1EC}
.m{font:300 20px/1 Outfit;letter-spacing:.22em;color:#62668A;margin-bottom:28px}.navy .m{color:#9EA2C2}
h1{font:400 104px/.94 Fraunces;letter-spacing:-.02em;margin:0}h1 em{font-style:italic}.navy h1 em{color:#F2B8BC}
p{font-size:28px;line-height:1.35;margin:28px 0 0}
.o{border:2px solid #E6E8F0;border-radius:24px;padding:26px 30px}.navy .o{border-color:rgba(255,255,255,.18)}
.o b{display:block;font:400 32px/1 Fraunces;padding-bottom:14px;border-bottom:3px solid currentColor}
.o div{display:flex;justify-content:space-between;gap:16px;padding:13px 0;border-bottom:1.5px solid #E6E8F0;font-size:24px;font-weight:500}.navy .o div{border-color:rgba(255,255,255,.14)}
.o div:last-child{border:0}.o span{font:500 21px/1.4 "IBM Plex Mono";color:#62668A}.navy .o span{color:#B9BCD8}.o .a span,.o .a{color:#C8323F}
.big{font:700 150px/.9 "IBM Plex Mono";letter-spacing:-.04em}.big small{font:400 40px "IBM Plex Mono";color:#62668A;letter-spacing:0}`;
const lista = (t, filas) => `<div class="o"><b>${t}</b>${filas.map(([a, b, c]) => `<div class="${c || ""}">${a}<span>${b}</span></div>`).join("")}</div>`;
const OG = {
  "mentorias-herramientas": ["Herramientas <em>gratis</em>", "Tu nivel, tus mensajes, tu hoja del día, tu primer reto y tu bienvenida.",
    lista("Contenido", [["Bienvenida", "checklist"], ["Mis primeros 200", "reto"], ["Mensajes", "copiar"], ["La hoja del día", "imprimible"], ["¿En qué nivel voy?", "calculadora"]])],
  "h-nivel": ["¿En qué nivel <em>voy?</em>", "Tus puntos del mes, tu nivel y lo que te falta para el siguiente.",
    lista("Los niveles", [["9%", "600"], ["12%", "900", "a"], ["15%", "1,400"], ["18%", "2,200"], ["22%", "3,600"]])],
  "h-mensajes": ["Mensajes para <em>copiar</em>", "Pones su nombre y lo que admiras de ella, y se arma solo.",
    lista("Momentos", [["Contactar", "4"], ["Seguimiento", "4"], ["Agendar", "4"], ["Cerrar", "3"], ["Clientas", "3"]])],
  "h-hoja": ["La hoja <em>del día</em>", "El método de 10 actividades, para llenar en el celular o imprimir.",
    lista("Part Time", [["Contactar", "10"], ["Presentar", "1"], ["Crear contenido", "1"], ["Seguimiento", "10 min"], ["Marcador", "al cierre"]])],
  "h-200": ["Mis primeros <em>200</em>", "200 puntos en 14 días, rumbo a 3%. Con marcador.", `<div class="big">200<small> / 14 días</small></div>`],
  "h-bienvenida": ["Bienvenida, <em>socia</em>", "Tu lista del primer día, la primera semana y los primeros meses.",
    lista("Para empezar", [["Kit de inicio", "$499"], ["Puntos al mes", "75"], ["Cada punto", "$25"], ["Bienvenida", "50·60·70·80"]])],
  "h-presentacion": ["La presentación <em>del negocio</em>", "Seis pantallas para presentarlo en una llamada, con tu nombre y tu link.", lista("Las pantallas", [["Por qué ahora", "1"], ["Cómo funciona", "2"], ["Qué se gana", "3"], ["Tu primer paso", "4"]])],
  "h-reconocimientos": ["Reconocimientos", "Una tarjeta para felicitar a tu equipo, lista para WhatsApp e Historias.", lista("Estilos", [["Coral", "tarjeta"], ["Noche", "tarjeta"], ["Papel", "tarjeta"]])],
  "h-contenido": ["Qué publico <em>hoy</em>", "Una idea para hoy y el calendario del mes, según tu ritmo.", `<div class="big">30<small> ideas</small></div>`],
  "h-objeciones": ["¿Y si me dice <em>que no?</em>", "Qué contestar y con qué pregunta sigues.", `<div class="big">12<small> respuestas</small></div>`],
  "h-lista": ["Mi lista <em>de 50</em>", "A quién le toca hoy, con su etapa, su siguiente paso y su fecha.", `<div class="big">50<small> personas</small></div>`],
  "h-equipo": ["Mapa de <em>mi equipo</em>", "Tus líneas, tu nivel y tus laterales del mes.", lista("Tu mes", [["Puntos de grupo", "mes"], ["Laterales", "mes"], ["Directoras", "línea"]])],
  "h-mi-mes": ["Mi <em>mes</em>", "El cierre del mes en una hoja: números, reto y aprendizaje.", lista("El cierre", [["Contactadas", "mes"], ["Presentaciones", "mes"], ["Socias", "mes"], ["Mi reto", "sí o no"]])],
  "h-reto": ["Reto <em>en equipo</em>", "Un reto, un tablero y todas reportando con un toque.", `<div class="big">14<small> días</small></div>`],
  "h-pedidos": ["Pedidos <em>y cobros</em>", "Qué pedidos tienes, quién ya pagó y qué falta por entregar.", lista("Estado", [["Vendido", "mes"], ["Cobrado", "mes"], ["Te deben", "a cobrar", "a"]])],
  "h-rutina": ["Arma <em>su rutina</em>", "La rutina de piel de tu clienta con precios, lista para mandar.", lista("Rutina", [["Mañana", "3 pasos"], ["Noche", "3 pasos"], ["Total", "tarjeta"]])],
  "h-reunion": ["Mi <em>reunión</em>", "Invitación, guion de 45 minutos y seguimiento a las 48 horas.", `<div class="big">45<small> min</small></div>`],
  "h-en-vivo": ["Venta <em>en vivo</em>", "Un live de 60 minutos con su guion minuto a minuto.", `<div class="big">60<small> min</small></div>`],
  "h-capacitaciones": ["Capacitaciones <em>listas</em>", "45 minutos con guion, dinámica y tarea de la semana.", `<div class="big">12<small> sesiones</small></div>`],
  "h-inventario": ["Lo que tengo <em>en casa</em>", "Cuánto producto tienes, cuánto vale y qué te falta pedir.", lista("Tu casa", [["Piezas", "total"], ["Valen", "precio público"], ["Por pedir", "aviso", "a"]])],
  "h-testimonios": ["Lo que dicen <em>mis clientas</em>", "Un link para que te dejen su testimonio.", `<div class="big">2<small> líneas</small></div>`],
  "h-pro": ["Herramientas <em>Pro</em>", "Los planes completos, semana por semana: de 3% a Directora Oro.",
    lista("Los planes", [["Plan anual de 52 semanas", "$349"], ["Planes por nivel", "$249"], ["Tu ritmo y 32 enfoques", "$199"], ["Todo Pro", "$699", "a"]]), "navy"],
  // /unete/ (página para quien todavía no es socia)
  "unete": ["Lo que pagas <em>de más</em>", "Pon lo que gastas al mes en belleza y ve cuánto se te va por no ser socia.",
    lista("Si gastas $800 al mes", [["Como clienta", "$800"], ["Como socia", "$480"], ["Pagas de más", "$320", "a"], ["Inscripción", "$499 una vez"]])],
  "h-que-quiere": ["¿Qué quiere <em>cada quien?</em>", "Le gusta, va por algo o va por todo. Acompaña a cada una a su ritmo.",
    `<div class="o"><b>De cada 100</b><div style="display:grid;grid-template-columns:repeat(20,1fr);gap:6px;border:0;padding:20px 0 14px">${Array.from({length:100},(_, i)=>{const c=i%20, r=Math.floor(i/20), k=c*5+r; return `<i style="display:block;aspect-ratio:1;border-radius:50%;background:${k<80?"#E9A1A8":k<95?"#DB414C":"#1B1F3B"}"></i>`;}).join("")}</div>${[["Le gusta","80"],["Va por algo","15"],["Va por todo","5"]].map(([a,b])=>`<div>${a}<span>${b}</span></div>`).join("")}</div>`],
};
const SOLO = process.argv.slice(2); // node scripts/og-herramientas.cjs unete  → solo esa
(async () => {
  const b = await chromium.launch(process.env.HTTPS_PROXY ? {proxy:{server:process.env.HTTPS_PROXY},args:["--ignore-certificate-errors"]} : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [n, [h, sub, der, cls]] of Object.entries(OG)) {
    if (SOLO.length && !SOLO.includes(n)) continue;
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8">${FUENTES}<style>${CSS}</style></head><body class="${cls || ""}"><div><div class="m">EQUIPO SVH</div><h1>${h}</h1><p>${sub}</p></div>${der}</body></html>`, { waitUntil: "networkidle" });
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(RAIZ, "og", n + ".png") });
    console.log("og/" + n + ".png");
  }
  await b.close();
})();
