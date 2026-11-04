// PDFs e imágenes de logros (stories 1080x1920): la página del mes (una hoja larga, ancho de celular) y un
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
  await p.addStyleTag({ content: '.top a,.dl,.dl-note,.card .cert,.dl-links,.talk,.plan,.band .fine a{display:none!important}body{min-height:0}*{animation:none!important}' });
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
  const sdir = path.join(dir, 'stories');
  if (fs.existsSync(sdir)) {
    const sp = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
    for (const f of fs.readdirSync(sdir).filter(x => x.endsWith('.html'))) {
      await sp.goto(`${base}/logros/${mes}/stories/${f}`, { waitUntil: 'networkidle' });
      await sp.evaluate(() => document.fonts.ready);
      await sp.screenshot({ path: path.join(sdir, f.replace('.html', '.png')) });
      console.log('escrito', `logros/${mes}/stories/${f.replace('.html', '.png')}`);
    }
  }
  const deck = path.join(dir, 'presentacion.html');
  if (fs.existsSync(deck)) {
    const dp = await b.newPage({ viewport: { width: 1280, height: 720 } });
    await dp.goto(`${base}/logros/${mes}/presentacion.html`, { waitUntil: 'networkidle' });
    await dp.evaluate(() => document.fonts.ready);
    await dp.pdf({ path: path.join(dir, `presentacion-${mes}.pdf`), width: '1280px', height: '720px', printBackground: true });
    console.log('escrito', `logros/${mes}/presentacion-${mes}.pdf`);
  }
  if (fs.existsSync(sdir)) {
    const zip = path.join(dir, `stories-${mes}.zip`);
    require('child_process').execFileSync('python3', ['-c',
      'import sys,zipfile,glob,os\nz=zipfile.ZipFile(sys.argv[1],"w",zipfile.ZIP_STORED)\n[z.write(f,os.path.basename(f)) for f in sorted(glob.glob(os.path.join(sys.argv[2],"*.png")))]\nz.close()',
      zip, sdir]);
    console.log('escrito', `logros/${mes}/stories-${mes}.zip`);
  }
  await b.close(); srv.close();
})();
