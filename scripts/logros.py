#!/usr/bin/env python3
"""Arma las páginas de logros del mes.

Lee _data/logros/<mes>-<año>.json y escribe:
  logros/<mes>-<año>/index.html  (una página por mes)
  logros/index.html              (índice, el mes más reciente arriba)

Solo publica nombre, nivel y título. Si fotos/<foto> no existe, la tarjeta
lleva las iniciales; al subir la foto, vuelve a correr este script.

Uso: python3 scripts/logros.py
"""
import html
import json
import os
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DATOS = RAIZ / "_data" / "logros"
NIVELES = ["25", "22", "18", "15", "12", "9", "6", "3"]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

e = html.escape

ICONO = ('<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" '
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/>'
         '<path d="M5 20h14"/></svg>')

CSS = """
:root{
  --bg:#fff;--ink:#262A4A;--muted:#6C7090;--line:#E6E8F0;--soft:#EEF0F8;
  --accent:#DB414C;--accent-t:#C8323F;--tint:#FDEEF0;
  --ease:cubic-bezier(.23,1,.32,1);
  --mono:"IBM Plex Mono",ui-monospace,monospace;
  --hand:"Caveat","Bradley Hand",cursive;
  color-scheme:light;
}
*{box-sizing:border-box;margin:0}
html{background:var(--bg);scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{background:var(--bg);color:var(--ink);font-family:Outfit,system-ui,sans-serif;font-size:16px;line-height:1.5;-webkit-text-size-adjust:100%;min-height:100svh;display:flex;flex-direction:column}
body>.wrap{flex:1 0 auto;width:100%}
a{color:var(--accent-t)}
.wrap{max-width:560px;margin:0 auto;padding:0 16px}
.top{display:flex;justify-content:space-between;align-items:center;padding:16px 0 0;font-size:14px}
.top a{color:var(--muted);text-decoration:none;padding:8px 0}
.brand{font-weight:300;letter-spacing:.18em;font-size:12px;color:var(--muted)}
.brand b{font-weight:600;letter-spacing:.08em;color:var(--accent-t);margin-left:6px}
.eyebrow{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-t)}

/* Portada */
.hero{padding:40px 0 28px}
h1{font-size:clamp(40px,12vw,60px);line-height:.98;font-weight:800;letter-spacing:-.025em;margin-top:10px}
h1 em{font-style:normal;color:var(--accent)}
.lead{font-size:18px;color:var(--muted);margin-top:14px;max-width:32ch}
.lead b{color:var(--ink);font-weight:600}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:24px}
.tile{background:var(--soft);border-radius:14px;padding:12px}
.tile b{display:block;font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:26px;font-weight:500;line-height:1.1}
.tile span{display:block;font-size:13px;color:var(--muted);margin-top:2px;line-height:1.25}

/* Índice de niveles: una escalera, un punto por persona */
.idx{margin-top:8px}
.idx h2{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding-bottom:8px;border-bottom:1.5px solid var(--ink)}
.idx ol{list-style:none;padding:0}
.idx a{display:grid;grid-template-columns:60px 1fr auto;align-items:center;gap:12px;min-height:46px;padding:6px 0;border-bottom:1px solid var(--line);color:var(--ink);text-decoration:none}
.idx .pct{font-family:var(--mono);font-variant-numeric:tabular-nums;font-weight:500;font-size:19px}
.idx .dots{display:flex;flex-wrap:wrap;gap:5px}
.idx .dots i{width:10px;height:10px;border-radius:50%;background:var(--accent)}
.idx .dots .none{height:2px;width:24px;border-radius:2px;background:var(--line)}
.idx .cnt{font-size:14px;color:var(--muted);text-align:right;white-space:nowrap}
.idx a.vacio .pct{color:var(--muted)}
.idx a:focus-visible{outline:2px solid var(--accent-t);outline-offset:2px;border-radius:4px}
@media (hover:hover){.idx a:hover .pct{color:var(--accent-t)}}

/* Secciones por nivel */
.lvl{padding:44px 0 4px;scroll-margin-top:8px}
.lvl-h{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding-bottom:14px}
.lvl-h h2{font-family:var(--mono);font-variant-numeric:tabular-nums;font-weight:500;font-size:56px;line-height:1;letter-spacing:-.03em}
.lvl-h h2 small{font-size:.5em;color:var(--accent);margin-left:2px}
.lvl-h p{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:right}
.cards{list-style:none;padding:0;display:grid;gap:8px}
.card{display:flex;align-items:center;gap:14px;padding:12px 14px;border:1px solid var(--line);border-radius:18px;background:var(--bg)}
.ava{position:relative;flex:none;width:56px;height:56px;border-radius:50%;overflow:hidden;background:var(--soft);display:grid;place-items:center;font-weight:600;font-size:18px;letter-spacing:.02em;color:var(--ink)}
.ava img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.who{min-width:0}
.who strong{display:block;font-size:17px;font-weight:600;line-height:1.25}
.who>span{display:block;font-size:14px;color:var(--muted);margin-top:1px}
.nueva{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:var(--tint);color:var(--accent-t);font-size:12px;font-weight:600;vertical-align:1px}
.d25 .card{background:var(--tint);border-color:#F6D3D7}
.d25 .ava{background:#fff}
.lvl.vac{padding-top:32px}
.lvl.vac .lvl-h h2{font-size:40px}
.empty{display:grid;grid-template-columns:56px 1fr;column-gap:14px;align-items:center;padding:16px;border:1.5px dashed #EBA3AA;border-radius:18px;background:var(--tint)}
.seat{width:56px;height:56px;border-radius:50%;border:1.5px dashed var(--accent);background:#fff;display:grid;place-items:center;font-weight:700;font-size:17px;color:var(--accent-t)}
.empty .q{font-size:19px;font-weight:700;line-height:1.2;color:var(--ink)}
.empty .q2{font-size:19px;font-weight:700;line-height:1.2;color:var(--accent-t)}
.empty .sub{font-size:15px;color:var(--muted);margin-top:4px}
.talk{grid-column:1/-1;margin-top:14px;display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border-radius:14px;background:var(--ink);color:#fff;font-weight:600;font-size:16px;text-decoration:none;transition:transform 160ms var(--ease)}
.talk:active{transform:scale(.97)}
.talk:focus-visible,.plan:focus-visible{outline:2px solid var(--accent-t);outline-offset:2px}
.plan{grid-column:2;justify-self:start;margin-top:2px;display:inline-flex;align-items:center;min-height:44px;margin-bottom:-6px;font-size:14px;font-weight:600;color:var(--accent-t);text-underline-offset:3px}
.note{font-family:var(--hand);font-weight:600;font-size:25px;line-height:1.1;color:var(--accent-t);margin:14px 0 0 70px;transform:rotate(-1.5deg);transform-origin:left}
.note::before{content:"";display:inline-block;width:18px;height:14px;margin-right:6px;border-left:1.75px solid currentColor;border-bottom:1.75px solid currentColor;border-bottom-left-radius:10px;vertical-align:4px}

.card .cert+.cert{margin-left:0}
.card .cert{margin-left:auto;flex:none;display:flex;flex-direction:column;align-items:center;gap:1px;min-width:44px;min-height:44px;justify-content:center;border-radius:12px;color:var(--accent-t);text-decoration:none;font-size:11px;font-weight:600;letter-spacing:.04em}
.card .cert:focus-visible{outline:2px solid var(--accent-t);outline-offset:2px}
@media (hover:hover){.card .cert:hover{background:var(--tint)}}
.d25 .card .cert{background:#fff}
.dl{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:16px;min-height:48px;border-radius:14px;background:var(--accent);color:#fff;font-weight:600;font-size:16px;text-decoration:none;transition:transform 160ms var(--ease)}
.dl:active{transform:scale(.97)}
.dl:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.dl-note{font-size:14px;color:var(--muted);margin-top:8px;text-align:center}

/* Banda coral */
.band{margin-top:56px;background:var(--accent);color:#fff;border-radius:28px 28px 0 0;padding:28px 0 max(28px,env(safe-area-inset-bottom))}
.band .url{font-family:var(--mono);font-size:16px;font-weight:500;overflow-wrap:anywhere}
.band p{font-size:15px;font-weight:500}
.band p+p{margin-top:6px}
.band .fine{font-size:13px;font-weight:400;opacity:.92;margin-top:14px}
.band a{color:#fff}

/* Índice de meses */
.months{list-style:none;padding:0;margin-top:8px;border-top:1.5px solid var(--ink)}
.months a{display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;padding:16px 0;border-bottom:1px solid var(--line);color:var(--ink);text-decoration:none}
.months strong{display:block;font-size:22px;font-weight:700;letter-spacing:-.01em}
.months span{display:block;font-size:14px;color:var(--muted)}
.months .go{font-family:var(--mono);font-size:14px;color:var(--accent-t)}
.months li:first-child strong::after{content:"más reciente";margin-left:8px;padding:1px 8px;border-radius:999px;background:var(--tint);color:var(--accent-t);font-size:12px;font-weight:600;letter-spacing:0;vertical-align:4px}
@media (hover:hover){.months a:hover strong{color:var(--accent-t)}}

@media (prefers-reduced-motion:no-preference){
  .idx .dots i{animation:pop 260ms var(--ease) both;animation-delay:calc(var(--n) * 18ms)}
}
@keyframes pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
"""

HEAD = """<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png?v=3" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#ffffff">
<meta name="robots" content="noindex">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{ogtitle}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_MX">
<meta property="og:url" content="https://mitienda.beauty/{path}">
{ogimg}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Caveat:wght@600&display=swap" rel="stylesheet">
<style>{css}</style>
<script data-goatcounter="https://sebastianmtzdlp.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</head>
"""


def personas(n):
    return f"{n} persona" if n == 1 else f"{n} personas"


def pslug(nombre):
    import unicodedata, re
    t = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


STORY = ('<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" '
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/>'
         '<path d="M12 8v6"/><path d="m9.5 11.5 2.5 2.5 2.5-2.5"/></svg>')

WA = ('<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" '
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12Z"/>'
      '<path d="M8.5 10.5h7M8.5 14h4"/></svg>')


def vacio(k, mes):
    return (f'<div class="empty"><div class="seat" aria-hidden="true">Tú</div>'
            f'<div class="empty-t"><p class="q">Aquí aún no hay nadie.</p><p class="q2">¿Quieres ser tú?</p>'
            f'<p class="sub">Habla con tu upline y armen juntas tu plan para llegar al {k}%.</p></div>'
            f'<a class="plan" href="/plan-de-compensacion/">Ver qué pide cada nivel</a></div>')


def tarjeta(p):
    foto = p.get("foto")
    img = ""
    if foto and (RAIZ / "fotos" / foto).exists():
        img = f'<img src="/fotos/{e(foto)}" alt="" loading="lazy" width="56" height="56">'
    nueva = '<span class="nueva">nueva</span>' if p.get("nueva") else ""
    return (f'<li class="card"><div class="ava" aria-hidden="true">{e(p["iniciales"])}{img}</div>'
            f'<div class="who"><strong>{e(p["nombre"])}</strong><span>{e(p["titulo"])}{nueva}</span></div>'
            f'<a class="cert" href="certificados/{pslug(p["nombre"])}.pdf" download '
            f'aria-label="Descargar el certificado de {e(p["nombre"])}">{ICONO}<span>PDF</span></a>'
            f'<a class="cert" href="stories/{pslug(p["nombre"])}.png" download '
            f'aria-label="Descargar la imagen para stories de {e(p["nombre"])}">{STORY}<span>STORY</span></a></li>')


def pagina_mes(d, slug):
    mes, anio = d["mes"], d["anio"]
    niv = d["niveles"]
    total = sum(len(niv[k]["personas"]) for k in NIVELES)
    dirs = len(niv["25"]["personas"])
    nuevas = sum(1 for k in NIVELES for p in niv[k]["personas"] if p.get("nueva"))
    con_gente = sum(1 for k in NIVELES if niv[k]["personas"])

    idx = []
    n = 0
    for k in NIVELES:
        ps = niv[k]["personas"]
        if ps:
            dots = "".join(f'<i style="--n:{n + i}"></i>' for i in range(len(ps)))
            n += len(ps)
            cls, cnt = "", personas(len(ps))
        else:
            dots, cls, cnt = '<i class="none"></i>', ' class="vacio"', "aún nadie"
        idx.append(f'<li><a href="#n{k}"{cls}><span class="pct">{k}%</span>'
                   f'<span class="dots" aria-hidden="true">{dots}</span><span class="cnt">{cnt}</span></a></li>')

    secs = []
    for k in NIVELES:
        ps = niv[k]["personas"]
        etiqueta = ("Directoras · " if k == "25" else "") + personas(len(ps))
        cuerpo = ('<ul class="cards">' + "".join(tarjeta(p) for p in ps) + "</ul>") if ps \
            else vacio(k, mes)
        nota = f'<p class="note">{e(niv[k]["nota"])}</p>' if niv[k].get("nota") else ""
        d25 = (" d25" if k == "25" else "") + ("" if ps else " vac")
        secs.append(f'<section class="lvl{d25}" id="n{k}" aria-labelledby="h{k}">'
                    f'<div class="lvl-h"><h2 id="h{k}">{k}<small>%</small></h2><p>{etiqueta}</p></div>'
                    f'{cuerpo}{nota}</section>')

    path = f"logros/{slug}/"
    og = RAIZ / "og" / "logros" / f"{slug}.png"
    ogimg = ""
    if og.exists():
        u = f"https://mitienda.beauty/og/logros/{slug}.png"
        ogimg = (f'<meta property="og:image" content="{u}">\n<meta property="og:image:width" content="1200">\n'
                 f'<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n'
                 f'<meta name="twitter:image" content="{u}">\n')
    desc = f"{total} personas del equipo de {d['equipo']} cerraron {mes} {anio} con nivel, del 25% al 3%."
    out = HEAD.format(title=f"Logros de {mes} {anio} · Mi Tienda Beauty",
                      ogtitle=f"Logros de {mes} {anio} · Equipo de {d['equipo']}",
                      desc=e(desc), path=path, ogimg=ogimg, css=CSS)
    nuevas_txt = "nueva con nivel" if nuevas == 1 else "nuevas con nivel"
    out += f"""<body>
<div class="wrap">
  <div class="top"><a href="/logros/">← Todos los meses</a><span class="brand">MI EQUIPO<b>Farmasi</b></span></div>

  <header class="hero">
    <p class="eyebrow">Equipo de {e(d['equipo'])} · {e(mes)} {anio}</p>
    <h1>Logros de <em>{e(mes)}</em></h1>
    <p class="lead"><b>{total} personas</b> cerraron {e(mes)} con nivel, en {con_gente} de los 8 niveles. Gracias por cada pedido.</p>
    <div class="tiles">
      <div class="tile"><b>{total}</b><span>con nivel</span></div>
      <div class="tile"><b>{dirs}</b><span>en dirección</span></div>
      <div class="tile"><b>{nuevas}</b><span>{nuevas_txt}</span></div>
    </div>
    <a class="dl" href="logros-{slug}.pdf" download>{ICONO}Descargar PDF</a>
    <p class="dl-note">Cada tarjeta trae su certificado en PDF y su imagen para stories.</p>
  </header>

  <nav class="idx" aria-label="Niveles">
    <h2>Niveles del mes</h2>
    <ol>{''.join(idx)}</ol>
  </nav>

  <main>{''.join(secs)}</main>
</div>

<footer class="band">
  <div class="wrap">
    <p class="url">mitienda.beauty/logros/{slug}</p>
    <p>Equipo de {e(d['equipo'])} · {e(mes)} {anio}</p>
    <p class="fine">Niveles del Back Office al cierre de {e(mes)}. Hecho por el equipo; no es material oficial de Farmasi. <a href="/logros/">Ver otros meses</a></p>
  </div>
</footer>
</body>
</html>
"""
    certificados(d, slug)
    stories(d, slug)
    return out, total, dirs


CERT_CSS = """
:root{--ink:#262A4A;--muted:#6C7090;--line:#E6E8F0;--soft:#EEF0F8;--accent:#DB414C;--accent-t:#C8323F;--tint:#FDEEF0;color-scheme:light}
@page{size:540px 675px;margin:0}
*{box-sizing:border-box;margin:0}
html,body{background:#fff}
body{font-family:Outfit,system-ui,sans-serif;color:var(--ink);display:grid;place-items:center;min-height:100vh;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.c{width:540px;height:675px;overflow:hidden;background:#fff;display:flex;flex-direction:column;padding:16px 16px 0}
.in{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 28px;border:1px solid var(--line);border-radius:22px}
.brand{font-weight:300;letter-spacing:.18em;font-size:11px;color:var(--muted)}
.brand b{font-weight:600;letter-spacing:.08em;color:var(--accent-t);margin-left:6px}
.eyebrow{margin-top:26px;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-t)}
.ava{margin-top:22px;width:132px;height:132px;border-radius:50%;overflow:hidden;background:var(--soft);display:grid;place-items:center;font-weight:600;font-size:40px;position:relative;box-shadow:0 0 0 6px #fff,0 0 0 7px var(--line)}
.ava img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
h1{margin-top:22px;font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-.015em;text-wrap:balance;max-width:16ch}
.t{margin-top:6px;font-size:15px;color:var(--muted)}
.t span{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:var(--tint);color:var(--accent-t);font-size:12px;font-weight:600}
.lvl{margin-top:18px;font-size:16px;color:var(--muted)}
.pct{font-family:"IBM Plex Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums;font-weight:500;font-size:92px;line-height:1;letter-spacing:-.04em;color:var(--ink);margin-top:4px}
.pct small{font-size:.5em;color:var(--accent)}
.band{background:var(--accent);color:#fff;padding:18px 28px 22px;text-align:center;margin:16px -16px 0}
.band p{font-size:14px;font-weight:600}
.band .url{font-family:"IBM Plex Mono",ui-monospace,monospace;font-weight:500;font-size:12px;margin-top:4px;opacity:.95}
"""


def certificados(d, slug):
    mes, anio, eq = d["mes"], d["anio"], d["equipo"]
    dest = RAIZ / "logros" / slug / "certificados"
    dest.mkdir(parents=True, exist_ok=True)
    for k in NIVELES:
        for p in d["niveles"][k]["personas"]:
            foto = p.get("foto")
            img = f'<img src="/fotos/{e(foto)}" alt="">' if foto and (RAIZ / "fotos" / foto).exists() else ""
            nueva = "<span>nueva</span>" if p.get("nueva") else ""
            nivel_txt = f"cerraste {e(mes)} {anio} en el nivel" if k != "25" else f"cerraste {e(mes)} {anio} en dirección, con"
            h = f"""<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Certificado de {e(mes)} {anio} · {e(p['nombre'])}</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>{CERT_CSS}</style></head>
<body><div class="c">
<div class="in">
  <p class="brand">MI EQUIPO<b>Farmasi</b></p>
  <p class="eyebrow">Logros de {e(mes)} {anio}</p>
  <div class="ava" aria-hidden="true">{e(p['iniciales'])}{img}</div>
  <h1>{e(p['nombre'])}</h1>
  <p class="t">{e(p['titulo'])}{nueva}</p>
  <p class="lvl">{nivel_txt}</p>
  <p class="pct">{k}<small>%</small></p>
</div>
<div class="band"><p>Gracias por tu trabajo de este mes · Equipo de {e(eq)}</p><p class="url">mitienda.beauty/logros/{slug}</p></div>
</div></body></html>
"""
            (dest / f"{pslug(p['nombre'])}.html").write_text(h, encoding="utf-8")


STORY_CSS = """
:root{--ink:#262A4A;--muted:#6C7090;--line:#E6E8F0;--soft:#EEF0F8;--accent:#DB414C;--accent-t:#C8323F;--tint:#FDEEF0;color-scheme:light}
*{box-sizing:border-box;margin:0}
html,body{background:#fff;width:540px;height:960px;overflow:hidden}
body{font-family:Outfit,system-ui,sans-serif;color:var(--ink)}
.s{width:540px;height:960px;display:flex;flex-direction:column;background:#fff}
/* zonas seguras de stories: ~125px arriba y abajo sin texto importante */
.top{height:150px;background:var(--tint);display:flex;align-items:flex-end;justify-content:center;padding-bottom:22px}
.brand{font-weight:300;letter-spacing:.18em;font-size:13px;color:var(--muted)}
.brand b{font-weight:600;letter-spacing:.08em;color:var(--accent-t);margin-left:6px}
.in{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 40px}
.eyebrow{font-size:14px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-t)}
.ava{margin-top:26px;width:170px;height:170px;border-radius:50%;overflow:hidden;background:var(--soft);display:grid;place-items:center;font-weight:600;font-size:52px;position:relative;box-shadow:0 0 0 8px #fff,0 0 0 9.5px #F2B8BE}
.ava img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
h1{margin-top:28px;font-size:38px;line-height:1.08;font-weight:800;letter-spacing:-.02em;text-wrap:balance;max-width:14ch}
.t{margin-top:8px;font-size:17px;color:var(--muted)}
.t span{display:inline-block;margin-left:6px;padding:2px 10px;border-radius:999px;background:var(--tint);color:var(--accent-t);font-size:14px;font-weight:600}
.ig{margin-top:12px;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:18px;font-weight:500;color:var(--accent-t)}
.lvl{margin-top:30px;font-size:18px;color:var(--muted)}
.pct{font-family:"IBM Plex Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums;font-weight:500;font-size:132px;line-height:1;letter-spacing:-.04em;margin-top:6px}
.pct small{font-size:.5em;color:var(--accent)}
.band{height:190px;background:var(--accent);color:#fff;text-align:center;padding:26px 40px 0}
.band p{font-size:16px;font-weight:600}
.band .url{font-family:"IBM Plex Mono",ui-monospace,monospace;font-weight:500;font-size:14px;margin-top:6px;opacity:.95}
"""


def stories(d, slug):
    mes, anio, eq = d["mes"], d["anio"], d["equipo"]
    cred = d.get("ig_equipo", "").strip().lstrip("@")
    dest = RAIZ / "logros" / slug / "stories"
    dest.mkdir(parents=True, exist_ok=True)
    for k in NIVELES:
        for p in d["niveles"][k]["personas"]:
            foto = p.get("foto")
            img = f'<img src="/fotos/{e(foto)}" alt="">' if foto and (RAIZ / "fotos" / foto).exists() else ""
            nueva = "<span>nueva</span>" if p.get("nueva") else ""
            ig = p.get("ig", "").strip().lstrip("@")
            ig_html = f'<p class="ig">@{e(ig)}</p>' if ig else ""
            nivel_txt = f"cerró {e(mes)} {anio} en dirección, con" if k == "25" else f"cerró {e(mes)} {anio} en el nivel"
            credito = f" · @{e(cred)}" if cred else ""
            h = f"""<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8">
<meta name="viewport" content="width=540">
<meta name="robots" content="noindex">
<title>Story de {e(mes)} {anio} · {e(p['nombre'])}</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>{STORY_CSS}</style></head>
<body><div class="s">
<div class="top"><p class="brand">MI EQUIPO<b>Farmasi</b></p></div>
<div class="in">
  <p class="eyebrow">Logros de {e(mes)} {anio}</p>
  <div class="ava" aria-hidden="true">{e(p['iniciales'])}{img}</div>
  <h1>{e(p['nombre'])}</h1>
  <p class="t">{e(p['titulo'])}{nueva}</p>
  {ig_html}
  <p class="lvl">{nivel_txt}</p>
  <p class="pct">{k}<small>%</small></p>
</div>
<div class="band"><p>Equipo de {e(eq)}{credito}</p><p class="url">mitienda.beauty/logros/{slug}</p></div>
</div></body></html>
"""
            (dest / f"{pslug(p['nombre'])}.html").write_text(h, encoding="utf-8")


def orden(slug):
    mes, anio = slug.rsplit("-", 1)
    return int(anio) * 12 + MESES.index(mes)


def main():
    meses = []
    for f in sorted(DATOS.glob("*.json")):
        slug = f.stem
        d = json.loads(f.read_text(encoding="utf-8"))
        out, total, dirs = pagina_mes(d, slug)
        dest = RAIZ / "logros" / slug / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(out, encoding="utf-8")
        meses.append((orden(slug), slug, d, total, dirs))
        print("escrito", dest.relative_to(RAIZ))
    meses.sort(reverse=True)

    items = "".join(
        f'<li><a href="/logros/{s}/"><div><strong>{e(d["mes"].capitalize())} {d["anio"]}</strong>'
        f'<span>{t} con nivel · {dr} en dirección</span></div><span class="go">Ver →</span></a></li>'
        for _, s, d, t, dr in meses)
    equipo = meses[0][2]["equipo"] if meses else "Selene"
    idx = HEAD.format(title="Logros del equipo · Mi Tienda Beauty", ogtitle=f"Logros del equipo de {equipo}",
                      desc=e(f"Los niveles de cada mes del equipo de {equipo}, del 25% al 3%."),
                      path="logros/", ogimg="", css=CSS)
    idx += f"""<body>
<div class="wrap">
  <div class="top"><a href="/">← Mi Tienda Beauty</a><span class="brand">MI EQUIPO<b>Farmasi</b></span></div>
  <header class="hero">
    <p class="eyebrow">Equipo de {e(equipo)}</p>
    <h1>Logros <em>del equipo</em></h1>
    <p class="lead">Cada mes, quién cerró en cada nivel, del 25% al 3%.</p>
  </header>
  <ol class="months">{items}</ol>
</div>
<footer class="band">
  <div class="wrap">
    <p class="url">mitienda.beauty/logros</p>
    <p>Equipo de {e(equipo)}</p>
    <p class="fine">Hecho por el equipo; no es material oficial de Farmasi.</p>
  </div>
</footer>
</body>
</html>
"""
    (RAIZ / "logros" / "index.html").write_text(idx, encoding="utf-8")
    print("escrito logros/index.html")


if __name__ == "__main__":
    main()
