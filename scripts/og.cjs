// Genera og/<slug>.png (1200x630) con los colores del tema vigente de cada consultora.
// Uso: node scripts/og.cjs   (requiere playwright y red para Google Fonts). Re-correr si cambia un tema.
// Diseño: logo Boutique, la etiqueta cuelga con el nombre de la consultora.
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..');
const PW=process.env.PW||'/opt/node-tools/node_modules/playwright';
const {chromium}=require(PW);
const T={normal:{bg:'#FAF7F5',ink:'#262A4A',accent:'#DB414C',soft:'#FDEEF0',muted:'#6C7090'},
 noche:{bg:'#17121F',ink:'#F6EFE6',accent:'#FF7A1A',soft:'#2C2238',muted:'#B9AFC4'},
 calabaza:{bg:'#FFF5EA',ink:'#2A1E3A',accent:'#E8621A',soft:'#FCE8D2',muted:'#75677F'},
 bruja:{bg:'#FFF1F3',ink:'#1C1A22',accent:'#FF5A68',soft:'#FCE3E8',muted:'#6E6068'},
 pocima:{bg:'#0F1D17',ink:'#EAF4E4',accent:'#8BE04E',soft:'#1D3328',muted:'#A6BBA8'},
 editorial:{bg:'#F7EDE6',ink:'#3A1F2B',accent:'#B3375A',soft:'#F1C9C3',muted:'#7A5A66'}};
const TX=JSON.parse(fs.readFileSync(R+'/og/textos.json','utf8'));
const eq=JSON.parse(fs.readFileSync(R+'/_data/equipo.json','utf8')), base=JSON.parse(fs.readFileSync(R+'/_data/promos-base.json','utf8'));
const temaVigente=(own,B)=>{const now=Date.now();let cal=null;(B.temas||[]).filter(e=>new Date(e.desde+'T00:00:00-06:00').getTime()<=now).sort((a,b)=>a.desde<b.desde?-1:1).forEach(e=>cal=e);if(cal&&cal.forzar)return cal.tema;if(own!==undefined)return own;return cal?cal.tema:(B.tema||'');};
const LAB='M14 50L50 22H150a7 7 0 0 1 7 7V71a7 7 0 0 1-7 7H21a7 7 0 0 1-7-7z';
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const oscuro=t=>/^#(0|1)/.test(t.bg);
// Etiqueta colgante (logo Boutique): cuelga del borde de arriba con el nombre de la consultora (o "mi" en la portada)
const tag=(t,txt)=>{const fs=Math.min(34,100/(Math.max(3,txt.length)*0.5));return `<svg class="tag" width="410" height="547" viewBox="0 0 150 200" aria-hidden="true">
  <path d="M66 0C66 28 70 52 72 62" fill="none" stroke="${t.ink}" stroke-width="1.2"/>
  <g transform="translate(75 128) rotate(100) translate(-85.5 -50)"><path d="${LAB}" fill="${t.accent}"/><circle cx="36" cy="48" r="5" fill="${t.bg}"/>
  <text x="100" y="${50+fs*0.34}" text-anchor="middle" font-family="Fraunces" font-style="italic" font-weight="500" font-size="${fs}" fill="${oscuro(t)?t.bg:'#fff'}">${esc(txt)}</text></g></svg>`;};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined)});const pg=await b.newPage({viewport:{width:1200,height:630}});
for(const c of [...eq.consultoras,{slug:'equipo',nombre:'Team',_team:1}]){
  let pr={};try{pr=JSON.parse(fs.readFileSync(`${R}/${c.slug}/promos.json`,'utf8'))}catch(_){}
  const tn=c._team?'normal':temaVigente(pr.tema,base); const t=T[tn]||T.normal;
  const foto=fs.existsSync(`${R}/fotos/${c.slug}.jpg`)?`file://${R}/fotos/${c.slug}.jpg`:'';
  const tx=TX[c.slug]||{};
  const eb=c._team?'mitienda.beauty':(tx.eyebrow||'Farmasi');
  const tw=(c.tienda||'').trim().split(' '),tl=tw.length>1?tw.pop():'';
  const h1=c._team?`Tu tienda de<br><i>maquillaje</i>`:c.tienda?`${esc(tw.join(' '))}<br><i>${esc(tl)}</i>`:`Farmasi con<br><i>${esc(c.nombre)}</i>`;
  const desc=c._team?'Maquillaje con hasta 50% de descuento. Elige a tu consultora, arma tu pedido y mándalo por WhatsApp.':(tx.desc||'');
  const html=`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400;1,9..144,500&family=IBM+Plex+Mono:wght@500&display=swap">
  <style>*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;background:${t.bg};color:${t.ink};font-family:Outfit,sans-serif;position:relative;overflow:hidden}
  .w{position:absolute;inset:0;padding:64px 80px;display:flex;flex-direction:column;justify-content:space-between;width:840px}
  .top{display:flex;align-items:center;gap:22px}
  .ph{width:96px;height:96px;border-radius:50%;background:${t.soft} center/cover;flex:none}
  .eb{font-size:24px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${t.accent}}
  h1{font-family:Fraunces,serif;font-size:96px;line-height:1;font-weight:600;letter-spacing:-.02em;margin:0 0 22px}
  h1 i{font-weight:400;color:${t.accent}}
  p{font-size:32px;color:${t.muted};line-height:1.3;max-width:640px}
  .url{font-family:'IBM Plex Mono',monospace;font-size:28px;font-weight:500}
  .tag{position:absolute;right:40px;top:0}
  </style>${tag(t,c._team?'mi':c.nombre)}<div class="w"><div class="top">${foto?`<div class="ph" style="background-image:url('${foto}')"></div>`:''}<div class="eb">${esc(eb)}</div></div>
  <div><h1>${h1}</h1><p>${esc(desc)}</p></div><div class="url">mitienda.beauty${c._team?'':'/'+c.slug}</div></div>`;
  const tmp=`${R}/og/_tmp.html`;fs.writeFileSync(tmp,html);await pg.goto('file://'+tmp);await pg.waitForLoadState('networkidle');await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(200);
  await pg.screenshot({path:`${R}/og/${c.slug}.png`});console.log('og',c.slug,tn||'normal');}
await b.close();fs.unlinkSync(`${R}/og/_tmp.html`);})();
