// Genera los descargables de /1a1/: hoja-1a1.pdf, checklist-lider.pdf, sus vistas .png y og/1a1.png.
// Uso: node scripts/1a1-pdf.cjs   (necesita red para Google Fonts y Playwright con Chromium)
const { chromium } = require("playwright");
const path = require("path");
const RAIZ = path.join(__dirname, "..");

const FUENTES = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Outfit:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">`;
const BASE = `
*{box-sizing:border-box}
html,body{margin:0;background:#fff;color:#262A4A;font:400 10.5pt/1.4 "Outfit",sans-serif}
@page{size:letter;margin:0}
.pag{width:8.5in;height:11in;padding:.55in .6in;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:baseline;font:300 8pt/1 "Outfit";letter-spacing:.22em;color:#62668A}
.top span:last-child{letter-spacing:0;font:400 8pt/1 "IBM Plex Mono";color:#8A5A2E}
h1{font:400 30pt/1 "Fraunces",serif;letter-spacing:-.02em;margin:14pt 0 4pt}
h1 em{font-style:italic}
.sub{margin:0 0 12pt;color:#62668A;font-size:10pt}
.lin{border-bottom:1px solid #9A9DB5;height:21pt}
.campo{display:flex;gap:8pt;align-items:flex-end}
.campo b{font-weight:500;font-size:9.5pt;white-space:nowrap}
.campo .lin{flex:1}
h2{display:flex;align-items:baseline;gap:8pt;font:600 11.5pt/1.2 "Outfit";margin:0 0 6pt}
h2 .n{font:400 20pt/1 "Fraunces";color:#C8323F;width:16pt}
h2 .n.c{color:#262A4A}
h2 small{font:italic 400 10pt "Fraunces";color:#8A5A2E;margin-left:4pt}
.bloque{border-top:1.5px solid #262A4A;padding-top:8pt;margin-top:14pt}
table{width:100%;border-collapse:collapse;font-size:9.5pt}
th{font-weight:500;color:#62668A;text-align:left;font-size:8.5pt;padding:0 0 3pt}
td{border-bottom:1px solid #D5D8E6;height:21pt;padding:0}
td:first-child{width:52%}
.box{display:inline-block;width:9pt;height:9pt;border:1px solid #262A4A;border-radius:2pt;margin-right:6pt;vertical-align:-1pt}
.chk{list-style:none;margin:0;padding:0;display:grid;gap:6pt;font-size:9.5pt}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:0 22pt}
.par{display:grid;grid-template-columns:1fr 18pt 1fr;align-items:baseline;font-size:9.5pt;padding:3pt 0;border-bottom:1px solid #E6E8F0}
.par i{font:400 8pt "IBM Plex Mono";color:#62668A;font-style:normal;text-align:center}.par span:last-child{text-align:right}
.regla{border-left:2.5px solid #DB414C;padding:2pt 0 2pt 8pt;margin:6pt 0 0;font-size:9pt;font-weight:500}
.pie{margin-top:auto;display:flex;justify-content:space-between;font:400 8pt "IBM Plex Mono";color:#62668A;padding-top:10pt}
`;

const HOJA = `<!doctype html><html lang="es-MX"><head><meta charset="utf-8">${FUENTES}<style>${BASE}</style></head><body><div class="pag">
<div class="top"><span>EQUIPO SVH</span><span>mitienda.beauty/1a1</span></div>
<h1>La hoja del <em>1 a 1</em></h1>
<p class="sub">Primero los datos, después la conversación. No cierres sin el 5 y el 6.</p>
<div class="dos"><div class="campo"><b>Líder</b><div class="lin"></div></div><div class="campo"><b>Fecha</b><div class="lin"></div></div></div>

<div class="dos">
<div>
<div class="bloque"><h2><span class="n">1</span>Números del mes</h2>
<table><tr><th></th><th>Objetivo</th><th>Real</th></tr>
${["VP personal","VP de su equipo","Activos","Inactivos","Presentaciones a la semana","Inscripciones","Ventas personales"].map(l=>`<tr><td>${l}</td><td></td><td></td></tr>`).join("")}
</table>
<p class="regla">Si no trae números, no está lista.</p></div>

<div class="bloque"><h2><span class="n">2</span>Actividad diaria</h2>
<ul class="chk">${["¿Está presentando el negocio?","¿Prospecta o solo publica?","¿Tiene agenda semanal?","¿Da seguimiento o manda información y desaparece?"].map(l=>`<li><span class="box"></span>${l}</li>`).join("")}</ul>
<div class="campo" style="margin-top:6pt"><b>Mensajes al día</b><div class="lin"></div></div></div>

<div class="bloque"><h2><span class="n c">3</span>Liderazgo y ejemplo</h2>
<ul class="chk">${["¿Hace lo que quiere que su equipo haga?","¿Está presente en entrenamientos?","¿Está activa en los chats?","¿Reconoce a su gente?"].map(l=>`<li><span class="box"></span>${l}</li>`).join("")}</ul>
<div class="campo" style="margin-top:6pt"><b>¿Qué ejemplo da hoy?</b><div class="lin"></div></div></div>
</div>

<div>
<div class="bloque"><h2><span class="n c">4</span>Bloqueo real<small>no quejas</small></h2>
<p style="margin:0 0 3pt;font-size:8.5pt;color:#62668A">Encierra cuál de los dos es.</p>
${[["Falta de tiempo","Mala organización"],["Miedo a hablar","Falta de claridad"],["Flojera","Falta de visión"],["Mentalidad","No conoce el plan"]].map(([a,b])=>`<div class="par"><span>${a}</span><i>o</i><span>${b}</span></div>`).join("")}
<div class="campo" style="margin-top:6pt"><b>Lo que noté</b><div class="lin"></div></div><div class="lin"></div></div>

<div class="bloque"><h2><span class="n c">5</span>Plan de la semana</h2>
${[1,2,3].map(i=>`<div class="campo"><b>${i}.</b><div class="lin"></div></div>`).join("")}
<div class="dos" style="gap:0 10pt"><div class="campo"><b>Presentaciones</b><div class="lin"></div></div><div class="campo"><b>Mensajes</b><div class="lin"></div></div></div>
<div class="campo"><b>Reporta avances el</b><div class="lin"></div></div>
<p class="regla">Si no hay acción, el 1 a 1 fue pérdida de tiempo.</p></div>

<div class="bloque"><h2><span class="n c">6</span>Compromiso</h2>
<p style="margin:0;font:400 13pt/1.3 'Fraunces'">¿Te comprometes, sí o no?</p>
<p style="margin:5pt 0 0;font-size:10pt"><span class="box"></span>Sí &nbsp;&nbsp;&nbsp; <span class="box"></span>Todavía no</p>
<div class="campo" style="margin-top:8pt"><b>Firma</b><div class="lin"></div></div></div>
</div>
</div>
<div class="pie"><span>Aquí crece quien decide crecer.</span><span>Próximo 1 a 1: ____________</span></div>
</div></body></html>`;

const CHECK = `<!doctype html><html lang="es-MX"><head><meta charset="utf-8">${FUENTES}<style>${BASE}
.grande{font-size:11pt;gap:0}.grande li{padding:3pt 0;border-bottom:1px solid #E6E8F0;display:flex;align-items:center}
.grande li .lin{flex:0 0 1.4in;margin-left:auto;height:14pt}
</style></head><body><div class="pag">
<div class="top"><span>EQUIPO SVH</span><span>mitienda.beauty/1a1</span></div>
<h1>Antes de tu <em>1 a 1</em></h1>
<p class="sub">Tráelo listo. Primero vemos tus datos y luego platicamos de cómo vas.</p>
<div class="dos"><div class="campo"><b>Tu nombre</b><div class="lin"></div></div><div class="campo"><b>Fecha del 1 a 1</b><div class="lin"></div></div></div>

<div class="bloque"><h2><span class="n">1</span>Tus números del mes</h2>
<ul class="chk grande">${["VP del mes, el tuyo","VP del mes de tu equipo","Activos e inactivos","Presentaciones que diste a la semana","Inscripciones","Ventas personales","Tu objetivo del mes contra lo que llevas"].map(l=>`<li><span class="box"></span>${l}<span class="lin"></span></li>`).join("")}</ul>
<p class="regla">Si no traes números, no estás lista. Los números muestran la verdad, no las excusas.</p></div>

<div class="bloque"><h2><span class="n">2</span>Tu semana, con honestidad</h2>
<ul class="chk grande">${["Presenté el negocio esta semana","Mando mensajes todos los días (¿cuántos?)","Prospecté, no solo publiqué","Tengo mi agenda de la semana","Le di seguimiento a quien le mandé información"].map(l=>`<li><span class="box"></span>${l}</li>`).join("")}</ul></div>

<div class="bloque"><h2><span class="n c">3</span>Lo que me está frenando</h2>
<div class="lin"></div><div class="lin"></div></div>

<div class="bloque"><h2><span class="n c">4</span>Lo que quiero lograr este mes</h2>
<div class="lin"></div><div class="lin"></div></div>
<div class="pie"><span>El equipo copia, no obedece.</span><span>mitienda.beauty/1a1</span></div>
</div></body></html>`;

const OG = `<!doctype html><html><head><meta charset="utf-8">${FUENTES}<style>
html,body{margin:0}body{width:1200px;height:630px;background:#fff;color:#262A4A;font-family:Outfit;display:grid;grid-template-columns:1.2fr .8fr;gap:56px;padding:72px 80px;box-sizing:border-box;align-items:center}
.m{font:300 20px/1 Outfit;letter-spacing:.22em;color:#62668A;margin-bottom:28px}
h1{font:400 112px/.92 Fraunces;letter-spacing:-.02em;margin:0}h1 em{font-style:italic}
p{font-size:28px;line-height:1.35;margin:28px 0 0;color:#262A4A}
.o{border:2px solid #E6E8F0;border-radius:24px;padding:28px 30px}
.o b{display:block;font:400 34px/1 Fraunces;padding-bottom:16px;border-bottom:3px solid #262A4A}
.o div{display:flex;gap:16px;padding:14px 0;border-bottom:1.5px solid #E6E8F0;font-size:25px;font-weight:500}
.o div:last-child{border:0}.o span{font:500 21px/1.4 "IBM Plex Mono";color:#62668A;width:22px}.o .d span{color:#C8323F}
</style></head><body><div><div class="m">EQUIPO SVH</div><h1>El 1 a 1 con tus <em>líderes</em></h1><p>Primero los datos, después la conversación. Hoja y checklist gratis.</p></div>
<div class="o"><b>Orden del día</b>${["Números","Actividad diaria","Liderazgo y ejemplo","Bloqueos reales","Plan de acción","Compromiso"].map((t,i)=>`<div class="${i<2?"d":""}"><span>${i+1}</span>${t}</div>`).join("")}</div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [html, nombre] of [[HOJA, "hoja-1a1"], [CHECK, "checklist-lider"]]) {
    await p.setViewportSize({ width: 816, height: 1056 });
    await p.setContent(html, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: path.join(RAIZ, "1a1", nombre + ".pdf"), format: "Letter", printBackground: true });
    await p.screenshot({ path: path.join(process.env.REVISION || require("os").tmpdir(), nombre + "-grande.png") });
    const v = await b.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 0.3 });
    await v.setContent(html, { waitUntil: "networkidle" });
    await v.evaluate(() => document.fonts.ready);
    await v.screenshot({ path: path.join(RAIZ, "1a1", nombre + ".png") });
    await v.close();
  }
  await p.setViewportSize({ width: 1200, height: 630 });
  await p.setContent(OG, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(RAIZ, "og", "1a1.png") });
  await b.close();
})();
