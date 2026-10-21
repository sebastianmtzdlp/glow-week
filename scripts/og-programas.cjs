// Preview de WhatsApp para las páginas de programas/: genera og/programas/<slug>.png (1200x630)
// y escribe las etiquetas Open Graph en cada programas/<slug>/index.html (entre <!--og--> y <!--/og-->).
// Cada imagen usa los colores y tipografías de su propia página (los lee de la página ya cargada, con sus fuentes de Google).
// Textos en og/programas.json. Uso: node scripts/og-programas.cjs   (requiere playwright y red para las fuentes).
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..');
const PW=process.env.PW||'/opt/node-tools/node_modules/playwright';
const {chromium}=require(PW), proxy=process.env.HTTPS_PROXY;
const P=JSON.parse(fs.readFileSync(R+'/og/programas.json','utf8')).paginas;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined),proxy:proxy?{server:proxy}:undefined,args:proxy?['--ignore-certificate-errors']:[]});const pg=await b.newPage({viewport:{width:1200,height:630}});
fs.mkdirSync(R+'/og/programas',{recursive:true});
for(const [slug,x] of Object.entries(P)){
  const f=`${R}/programas/${slug?slug+'/':''}index.html`; if(!fs.existsSync(f)){console.log('falta',f);continue;}
  const img=slug||'escalera', ruta='/programas/'+(slug?slug+'/':'');
  // Estilo de la página: colores ya resueltos, fuente y peso del título, fuente del texto y las hojas de Google Fonts.
  await pg.goto('file://'+f,{waitUntil:'networkidle'});await pg.evaluate(()=>document.fonts.ready);
  const st=await pg.evaluate(()=>{const v=k=>getComputedStyle(document.documentElement).getPropertyValue(k).trim(),b=getComputedStyle(document.body),h=document.querySelector('h1'),hs=h?getComputedStyle(h):b;
    return {bg:b.backgroundColor,ink:b.color,muted:v('--muted')||b.color,accent:v('--accent-text')||v('--accent')||hs.color,accentInk:v('--accent-ink')||b.backgroundColor,
      hFont:hs.fontFamily,hWeight:hs.fontWeight,hStyle:hs.fontStyle,hCase:hs.textTransform,hColor:hs.color,body:v('--body')||b.fontFamily,
      css:[...document.querySelectorAll('link[rel=stylesheet][href*="fonts.googleapis"]')].map(l=>l.href)}});
  const html=`${st.css.map(h=>`<link rel="stylesheet" href="${h}">`).join('')}<style>*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;background:${st.bg};color:${st.ink};font-family:${st.body};position:relative;overflow:hidden}
  .w{position:absolute;inset:0;padding:70px 90px;display:flex;flex-direction:column;justify-content:center;border-left:24px solid ${st.accent}}
  .eb{font-size:28px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${st.accent}}
  h1{font-family:${st.hFont};font-weight:${st.hWeight};font-style:${st.hStyle};text-transform:${st.hCase};color:${st.hColor};font-size:112px;line-height:1.02;margin:16px 0 22px;max-width:1000px}
  p{font-size:40px;color:${st.muted};line-height:1.3;max-width:920px}
  .pill{align-self:flex-start;margin-top:36px;padding:14px 30px;border-radius:999px;background:${st.accent};color:${st.accentInk};font-size:30px;font-weight:700}
  </style><div class="w"><div class="eb">${esc(x.eyebrow)}</div><h1>${esc(x.titulo)}</h1><p>${esc(x.desc)}</p><span class="pill">mitienda.beauty${ruta.replace(/\/$/,'')}</span></div>`;
  const tmp=`${R}/og/_tmp.html`;fs.writeFileSync(tmp,html);await pg.goto('file://'+tmp,{waitUntil:'networkidle'});await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(150);
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
