#!/usr/bin/env python3
"""Genera una página por clase de Tu era Creator (programas/tu-era-creator/<slug>/).

El contenido sale de programas/tu-era-creator/clases.md, que es la única fuente.
Si cambias una clase, corre:  python3 scripts/era_paginas.py
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "programas" / "tu-era-creator"
CLASES = BASE / "clases.md"
N = 8  # clases numeradas; lo demás es bienvenida o herramientas

SLUGS = {0: "empieza-aqui", 9: "checklist", 10: "diccionario"}


def slug(i):
    return SLUGS.get(i, f"clase-{i}")


def lessons():
    raw = CLASES.read_text(encoding="utf-8")
    out = []
    for block in re.split(r"^@@ ", raw, flags=re.M):
        if not block.strip():
            continue
        lines = block.split("\n")
        h = [x.strip() for x in lines[0].split("|")]
        body = "\n".join(lines[1:]).strip()
        intro, _, rest = body.partition("\n")
        out.append({"id": int(h[0]), "kicker": h[1], "title": h[2], "topic": h[3],
                    "intro": intro.strip(), "body": rest.strip()})
    return out


def inline(t):
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)


def md(src):
    """Mismo subconjunto de Markdown que usa la página principal."""
    out, lst = [], None
    for raw in html.escape(src, quote=False).split("\n"):
        l = raw.strip()
        ul = re.match(r"^[-*]\s+(.*)", l)
        ol = re.match(r"^\d+[.)]\s+(.*)", l)
        if ul or ol:
            tag = "ul" if ul else "ol"
            if lst != tag:
                if lst:
                    out.append(f"</{lst}>")
                out.append(f"<{tag}>")
                lst = tag
            out.append(f"<li>{inline((ul or ol).group(1))}</li>")
            continue
        if lst:
            out.append(f"</{lst}>")
            lst = None
        if l.startswith("### "):
            out.append(f"<h4>{inline(l[4:])}</h4>")
        elif l.startswith("## "):
            out.append(f"<h2>{inline(l[3:])}</h2>")
        elif l.startswith("&gt; "):
            out.append(f'<div class="callout"><p>{inline(l[5:])}</p></div>')
        elif l:
            out.append(f"<p>{inline(l)}</p>")
    if lst:
        out.append(f"</{lst}>")
    return "\n".join(out)


def e(s):
    return html.escape(s, quote=True)


CSS = """
*{box-sizing:border-box}
:root{
  --bg:#0F0F14; --surface:#1A1A22; --ink:#F5F3F7; --muted:#A6A3B2; --line:#2E2D3A; --accent:#FF6A3D; --accent-ink:#1A0A04; --lilac:#C9B8FF; --seg:#3A3946;
  --display:"Unbounded","Arial Black",system-ui,sans-serif; --body:"Onest",system-ui,-apple-system,sans-serif;
  color-scheme:dark;
}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 var(--body);padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
a{color:inherit}
:focus-visible{outline:2px solid var(--lilac);outline-offset:3px}
.wrap{max-width:760px;margin:0 auto;padding:0 16px 56px}
.top{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;margin:0 -16px;background:rgba(15,15,20,.94);border-bottom:1px solid var(--line)}
.back{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:600;font-size:15px;color:var(--muted)}
.back b{font:800 15px/1 var(--display);letter-spacing:-.03em;color:var(--ink)}
.back b span{color:var(--accent)}
.segs{display:flex;gap:4px;width:min(200px,40vw)}
.segs i{flex:1;height:4px;border-radius:2px;background:var(--seg)}
.segs i.on{background:var(--ink)}
.segs i.cur{background:var(--accent)}
.hero{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 20px;align-items:end;padding:44px 0 22px}
.hero.nonum{grid-template-columns:minmax(0,1fr)}
.num{grid-row:span 3;font:800 clamp(96px,22vw,168px)/.78 var(--display);letter-spacing:-.06em;color:var(--accent)}
.k{margin:0;font:500 clamp(16px,3.4vw,20px)/1 var(--display);color:var(--lilac)}
h1{margin:0;font:800 clamp(32px,7vw,54px)/.98 var(--display);letter-spacing:-.04em;text-wrap:balance}
.topic{margin:4px 0 0;color:var(--muted);font-size:clamp(17px,2.6vw,19px);line-height:1.4}
.intro{margin:0 0 30px;padding:20px 0 26px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);font-size:clamp(19px,3vw,21px);line-height:1.5}
.body p,.body li{max-width:64ch}
.body p{margin:0 0 .9em}
.body ul,.body ol{margin:0 0 1.1em;padding-left:1.3em}
.body li{margin:.45em 0}
.body li::marker{color:var(--accent);font-weight:700}
.body strong{font-weight:700;color:#FFFFFF}
.body h2{margin:44px 0 12px;font:700 clamp(22px,4.4vw,27px)/1.12 var(--display);letter-spacing:-.025em;text-wrap:balance}
.body h4{margin:24px 0 8px;font-size:18px}
.callout{margin:28px 0;padding:22px 24px;border-radius:18px;background:var(--lilac);color:#14111F}
.callout p{margin:0;font:700 clamp(19px,4vw,24px)/1.28 var(--display);letter-spacing:-.02em;max-width:36ch;text-wrap:balance}
.callout strong{color:#14111F}
.done-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:40px;padding-top:24px;border-top:2px solid var(--ink)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1.5px solid var(--line);background:transparent;color:var(--ink);font:600 15px/1.2 var(--body);padding:12px 18px;border-radius:999px;cursor:pointer;text-decoration:none;transition:transform .16s cubic-bezier(.23,1,.32,1)}
.btn:active{transform:scale(.97)}
.btn.solid{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.btn.on{background:var(--lilac);border-color:var(--lilac);color:#14111F}
.hint{margin:0;color:var(--muted);font-size:14px}
.nav{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin-top:28px}
@media (max-width:520px){.nav{grid-template-columns:minmax(0,1fr)}}
.card{display:flex;flex-direction:column;gap:6px;min-height:118px;justify-content:space-between;padding:16px;border-radius:18px;background:var(--surface);border:1px solid var(--line);text-decoration:none;transition:transform .16s cubic-bezier(.23,1,.32,1)}
.card:active{transform:scale(.98)}
.card small{font-size:13px;font-weight:700;color:var(--muted)}
.card b{font:700 18px/1.15 var(--display);letter-spacing:-.02em}
.card.next{border:2px solid var(--accent)}
.card.next small{color:var(--accent)}
.card.ph{visibility:hidden}
.aviso{max-width:760px;margin:40px auto 0;padding:22px 16px 40px;border-top:1px solid var(--line);color:var(--muted);font:500 14px/1.5 var(--body)}
.aviso strong{color:var(--ink)}
@media (prefers-reduced-motion:reduce){*{transition-duration:.01ms!important}}
"""

AVISO = ('<footer class="aviso"><strong>Aviso:</strong> Las cifras y ejemplos de este material son casos '
         'específicos o metas, no promesas. Ningún resultado, ingreso o venta está garantizado; cada persona '
         'tiene resultados distintos y dependen de su esfuerzo, su mercado y sus decisiones.</footer>')


def card(x, cls, label):
    if x is None:
        return '<span class="card ph" aria-hidden="true"></span>'
    return (f'<a class="card {cls}" href="../{slug(x["id"])}/"><small>{e(label)}</small>'
            f'<b>{e(x["title"])}</b></a>')


def page(x, prev, nxt):
    i = x["id"]
    step = 1 <= i <= N
    segs = "".join(f'<i data-s="{s}"{" class=cur" if s == i else ""}></i>' for s in range(1, N + 1))
    head = (f'<header class="hero{"" if step else " nonum"}">'
            + (f'<span class="num" aria-hidden="true">{i}</span>' if step else "")
            + f'<p class="k">{e(x["kicker"])}</p><h1>{e(x["title"])}</h1>'
              f'<p class="topic">{e(x["topic"])}</p></header>')
    done = ""
    if step:
        done = ('<div class="done-row"><button type="button" class="btn" id="seen" aria-pressed="false">'
                'Marcar como completada</button><p class="hint">Tu avance se guarda en este dispositivo y '
                'también se ve en la página del curso.</p></div>')
    nav = (f'<nav class="nav" aria-label="Más clases">{card(prev, "", "Anterior")}'
           f'{card(nxt, "next", "Sigue")}</nav>')
    title = f'{x["kicker"]} · {x["title"]} · Tu era Creator' if step else f'{x["title"]} · Tu era Creator'
    js = """
(function(){
var K="era-creator-seen",ID=%d,seen=[];
try{seen=JSON.parse(localStorage.getItem(K)||"[]")||[];}catch(e){}
function save(){try{localStorage.setItem(K,JSON.stringify(seen));}catch(e){}}
function has(i){return seen.indexOf(i)>=0;}
function paint(){
  Array.prototype.forEach.call(document.querySelectorAll(".segs i"),function(el){var s=+el.getAttribute("data-s");el.className=s===ID?"cur":(has(s)?"on":"");});
  var b=document.getElementById("seen");if(b){var on=has(ID);b.textContent=on?"Completada ✓":"Marcar como completada";b.classList.toggle("on",on);b.setAttribute("aria-pressed",String(on));}
}
var b=document.getElementById("seen");
if(b)b.onclick=function(){if(has(ID))seen.splice(seen.indexOf(ID),1);else seen.push(ID);save();paint();};
if(ID===0&&!has(0)){seen.push(0);save();}
paint();
})();
""" % i
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(x["topic"])}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(x["topic"])}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800&family=Onest:wght@400;500;600;700&display=swap">
<style>{CSS}</style>
</head><body>
<!-- Generado por scripts/era_paginas.py desde programas/tu-era-creator/index.html. No editar a mano. -->
<div class="wrap">
<div class="top"><a class="back" href="../"><span aria-hidden="true">←</span><b>Creator<span>.</span></b></a><div class="segs" aria-hidden="true">{segs}</div></div>
{head}
<p class="intro">{inline(e(x["intro"]))}</p>
<article class="body">
{md(x["body"])}
</article>
{done}
{nav}
</div>
{AVISO}
<script>{js}</script>
</body></html>
"""


def main():
    ls = lessons()
    for k, x in enumerate(ls):
        prev = ls[k - 1] if k > 0 else None
        nxt = ls[k + 1] if k + 1 < len(ls) else None
        d = BASE / slug(x["id"])
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(page(x, prev, nxt), encoding="utf-8")
        print(f"{d.relative_to(ROOT)}/index.html")


if __name__ == "__main__":
    main()
