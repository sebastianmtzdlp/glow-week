// Preview de WhatsApp para las páginas de programas/: genera og/programas/<slug>.png (1200x630)
// y escribe las etiquetas Open Graph en cada programas/<slug>/index.html (entre <!--og--> y <!--/og-->).
// Textos en og/programas.json. Uso: node scripts/og-programas.cjs   (mismos requisitos que og.cjs).
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..');
const PW=process.env.PW||'/opt/node-tools/node_modules/playwright', FD=process.env.FONTS||'/tmp/fonts/node_modules/@fontsource/outfit/files';
const {chromium}=require(PW);
const t={bg:'#FAF7F5',ink:'#262A4A',accent:'#DB414C',soft:'#FDEEF0',muted:'#6C7090'};
const P=JSON.parse(fs.readFileSync(R+'/og/programas.json','utf8')).paginas;
const ff=w=>`@font-face{font-family:O;font-weight:${w};src:url('file://${FD}/outfit-latin-${w}-normal.woff2')}`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined)});const pg=await b.newPage({viewport:{width:1200,height:630}});
fs.mkdirSync(R+'/og/programas',{recursive:true});
for(const [slug,x] of Object.entries(P)){
  const f=`${R}/programas/${slug?slug+'/':''}index.html`; if(!fs.existsSync(f)){console.log('falta',f);continue;}
  const img=slug||'escalera', ruta='/programas/'+(slug?slug+'/':'');
  const html=`<style>${ff(400)}${ff(600)}${ff(800)}*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;background:${t.bg};color:${t.ink};font-family:O,sans-serif;position:relative;overflow:hidden}
  .blob{position:absolute;right:-140px;top:-140px;width:560px;height:560px;border-radius:50%;background:${t.accent};opacity:.16}
  .blob2{position:absolute;left:-120px;bottom:-200px;width:420px;height:420px;border-radius:50%;background:${t.accent};opacity:.10}
  .w{position:absolute;inset:0;padding:70px 90px;display:flex;flex-direction:column;justify-content:center}
  .eb{font-size:28px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${t.accent}}
  h1{font-size:112px;line-height:1.02;font-weight:800;margin:16px 0 22px;max-width:980px}
  p{font-size:40px;color:${t.muted};line-height:1.3;max-width:900px}
  .pill{align-self:flex-start;margin-top:36px;padding:14px 30px;border-radius:999px;background:${t.accent};color:#fff;font-size:30px;font-weight:700}
  </style><div class="blob"></div><div class="blob2"></div><div class="w"><div class="eb">${esc(x.eyebrow)}</div><h1>${esc(x.titulo)}</h1><p>${esc(x.desc)}</p><span class="pill">mitienda.beauty${ruta.replace(/\/$/,'')}</span></div>`;
  const tmp=`${R}/og/_tmp.html`;fs.writeFileSync(tmp,html);await pg.goto('file://'+tmp);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(150);
  const png=`${R}/og/programas/${img}.png`;await pg.screenshot({path:png});
  const v=crypto.createHash('md5').update(fs.readFileSync(png)).digest('hex').slice(0,8), u=`https://mitienda.beauty/og/programas/${img}.png?v=${v}`;
  const tags=[`<meta property="og:title" content="${esc(x.titulo)}">`,`<meta property="og:description" content="${esc(x.desc)}">`,
    `<meta property="og:type" content="website">`,`<meta property="og:locale" content="es_MX">`,`<meta property="og:url" content="https://mitienda.beauty${ruta}">`,
    `<meta property="og:image" content="${u}">`,`<meta property="og:image:width" content="1200">`,`<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,`<meta name="twitter:image" content="${u}">`];
  let s=fs.readFileSync(f,'utf8').replace(/\n?<!--og-->[\s\S]*?<!--\/og-->/,'').replace(/\n?<meta (?:property="og:|name="twitter:)[^>]*>/g,'');
  if(!/<meta name="?description"?/.test(s)) tags.unshift(`<meta name="description" content="${esc(x.desc)}">`);
  if(!/<meta name="?viewport/.test(s)){console.log("sin viewport",f);continue;}
  s=s.replace(/(<meta name="?viewport"?[^>]*>)/,`$1\n<!--og-->\n${tags.join('\n')}\n<!--/og-->`);
  fs.writeFileSync(f,s);console.log('og',ruta);}
await b.close();fs.unlinkSync(`${R}/og/_tmp.html`);})();
