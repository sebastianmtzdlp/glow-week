// Miniaturas reales de cada herramienta para el Centro de la socia.
// Lee las filas de mentorias/herramientas/index.html (href + data-cuenta), abre cada página
// en un celular de 390 px y guarda la parte de arriba en mentorias/herramientas/vistas/<cuenta>.png.
// Uso: python3 -m http.server 8765 (en la raíz) y luego: node scripts/vistas-herramientas.cjs
// Después: python3 scripts/vistas-herramientas.py  (las pasa a .webp de 240 px)
const fs = require('fs');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765';
const html = fs.readFileSync('mentorias/herramientas/index.html', 'utf8');
const filas = [...html.matchAll(/<a class="fila" href="([^"]+)" data-cuenta="([^"]+)"/g)].map(m => [m[1], m[2]]);
const extra = [...html.matchAll(/<h3><a href="([^"]+)" data-cuenta="([^"]+)"/g)].map(m => [m[1], m[2]]);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 700 }, deviceScaleFactor: 1 });
  for (const [href, cuenta] of filas.concat(extra)) {
    const p = await ctx.newPage();
    await p.route(/goatcounter|gc\.zgo/, r => r.abort());
    await p.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('mentorias-1a1-ok', '1'); } catch (_) {} });
    await p.goto(BASE + href, { waitUntil: 'networkidle' }).catch(() => {});
    await p.evaluate(() => document.fonts && document.fonts.ready);
    // sin animaciones de entrada: todo en su estado final
    await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important} .bar-fixed{display:none!important}' });
    await p.waitForTimeout(400);
    await p.screenshot({ path: `mentorias/herramientas/vistas/${cuenta}.png`, clip: { x: 0, y: 40, width: 390, height: 600 } });
    console.log('ok', cuenta, href);
    await p.close();
  }
  await b.close();
})();
