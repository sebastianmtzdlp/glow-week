// PDFs de logros: la página del mes (una hoja larga, ancho de celular) y un
// certificado por persona. Corre después de scripts/logros.py:
//   node scripts/logros-pdf.cjs octubre-2026
// Necesita Playwright con Chromium y red para Google Fonts.
const { chromium } = require(process.env.PW || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const mes = process.argv[2];
if (!mes) { console.error('Uso: node scripts/logros-pdf.cjs <mes-año>'); process.exit(1); }
const dir = path.join(ROOT, 'logros', mes);

const srv = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.end(fs.readFileSync(f));
}).listen(0);

(async () => {
  const port = srv.address().port, base = `http://localhost:${port}`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  await p.goto(`${base}/logros/${mes}/`, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '.top a,.dl,.dl-note,.card .cert,.band .fine a{display:none!important}body{min-height:0}*{animation:none!important}' });
  await p.evaluate(() => document.fonts.ready);
  const h = await p.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  await p.pdf({ path: path.join(dir, `logros-${mes}.pdf`), width: '420px', height: `${h + 2}px`, printBackground: true, pageRanges: '1' });
  console.log('escrito', `logros/${mes}/logros-${mes}.pdf`);

  const cdir = path.join(dir, 'certificados');
  for (const f of fs.readdirSync(cdir).filter(x => x.endsWith('.html'))) {
    await p.setViewportSize({ width: 540, height: 675 });
    await p.goto(`${base}/logros/${mes}/certificados/${f}`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: path.join(cdir, f.replace('.html', '.pdf')), width: '540px', height: '675px', printBackground: true, pageRanges: '1' });
    console.log('escrito', `logros/${mes}/certificados/${f.replace('.html', '.pdf')}`);
  }
  await b.close(); srv.close();
})();
