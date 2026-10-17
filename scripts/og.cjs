// Genera og/<slug>.png (1200x630) con los colores del tema vigente de cada consultora.
// Uso: node scripts/og.cjs   (requiere playwright + fuentes Outfit; ver README). Re-correr si cambia un tema.
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..');
const PW=process.env.PW||'/opt/node-tools/node_modules/playwright', FD=process.env.FONTS||'/tmp/fonts/node_modules/@fontsource/outfit/files';
const {chromium}=require(PW);
const T={normal:{bg:'#FAF7F5',ink:'#262A4A',accent:'#DB414C',soft:'#FDEEF0',muted:'#6C7090'},
 noche:{bg:'#17121F',ink:'#F6EFE6',accent:'#FF7A1A',soft:'#2C2238',muted:'#B9AFC4'},
 calabaza:{bg:'#FFF5EA',ink:'#2A1E3A',accent:'#E8621A',soft:'#FCE8D2',muted:'#75677F'},
 bruja:{bg:'#FFF1F3',ink:'#1C1A22',accent:'#FF5A68',soft:'#FCE3E8',muted:'#6E6068'},
 pocima:{bg:'#0F1D17',ink:'#EAF4E4',accent:'#8BE04E',soft:'#1D3328',muted:'#A6BBA8'},
 editorial:{bg:'#F7EDE6',ink:'#3A1F2B',accent:'#B3375A',soft:'#F1C9C3',muted:'#7A5A66'}};
const eq=JSON.parse(fs.readFileSync(R+'/_data/equipo.json','utf8')), base=JSON.parse(fs.readFileSync(R+'/_data/promos-base.json','utf8'));
const temaVigente=(own,B)=>{const now=Date.now();let cal=null;(B.temas||[]).filter(e=>new Date(e.desde+'T00:00:00-06:00').getTime()<=now).sort((a,b)=>a.desde<b.desde?-1:1).forEach(e=>cal=e);if(cal&&cal.forzar)return cal.tema;if(own!==undefined)return own;return cal?cal.tema:(B.tema||'');};
const ff=w=>`@font-face{font-family:O;font-weight:${w};src:url('file://${FD}/outfit-latin-${w}-normal.woff2')}`;
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined)});const pg=await b.newPage({viewport:{width:1200,height:630}});
for(const c of [...eq.consultoras,{slug:'equipo',nombre:'Team',_team:1}]){
  let pr={};try{pr=JSON.parse(fs.readFileSync(`${R}/${c.slug}/promos.json`,'utf8'))}catch(_){}
  const tn=c._team?'normal':temaVigente(pr.tema,base); const t=T[tn]||T.normal;
  const foto=fs.existsSync(`${R}/fotos/${c.slug}.jpg`)?`file://${R}/fotos/${c.slug}.jpg`:'';
  const ini=c._team?'♡':c.nombre[0];
  const html=`<style>${ff(400)}${ff(600)}${ff(800)}*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;background:${t.bg};color:${t.ink};font-family:O,sans-serif;position:relative;overflow:hidden}
  .blob{position:absolute;right:-140px;top:-140px;width:560px;height:560px;border-radius:50%;background:${t.accent};opacity:.16}
  .blob2{position:absolute;left:-120px;bottom:-200px;width:420px;height:420px;border-radius:50%;background:${t.accent};opacity:.10}
  .w{position:absolute;inset:0;padding:70px 80px;display:flex;align-items:center;gap:60px}
  .ph{flex:none;width:300px;height:300px;border-radius:50%;border:8px solid ${t.accent};background:${t.soft} center/cover;display:grid;place-items:center;font-size:150px;font-weight:800;color:${t.accent}}
  .eb{font-size:26px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${t.accent}}
  h1{font-size:92px;line-height:1.02;font-weight:800;margin:14px 0 18px}
  p{font-size:36px;color:${t.muted};line-height:1.3;max-width:620px}
  .pill{display:inline-block;margin-top:30px;padding:14px 30px;border-radius:999px;background:${t.accent};color:${/^#(0|1)/.test(t.bg)?t.bg:'#fff'};font-size:30px;font-weight:700}
  </style><div class="blob"></div><div class="blob2"></div><div class="w"><div class="ph" style="${foto?`background-image:url('${foto}')`:''}">${foto?'':ini}</div>
  <div><div class="eb">Farmasi</div><h1>${c._team?'Tu tienda<br>de maquillaje':'Farmasi con '+c.nombre}</h1><p>Maquillaje con hasta 50% de descuento. ${c._team?'Elige a tu consultora, arma tu pedido y mándalo por WhatsApp.':'Arma tu pedido y mándalo por WhatsApp.'}</p><span class="pill">mitienda.beauty${c._team?'':'/'+c.slug}</span></div></div>`;
  const tmp=`${R}/og/_tmp.html`;fs.writeFileSync(tmp,html);await pg.goto('file://'+tmp);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(150);
  await pg.screenshot({path:`${R}/og/${c.slug}.png`});console.log('og',c.slug,tn||'normal');}
await b.close();fs.unlinkSync(`${R}/og/_tmp.html`);})();
