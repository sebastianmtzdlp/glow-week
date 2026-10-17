#!/usr/bin/env python3
"""Genera la tienda de cada consultora a partir de _template y _data/equipo.json.
Por consultora:  /<slug>/ (portada) · /tienda/ (todos los productos) · /producto/?c=CODE · /conoce/ · /catalogo/
Compartido:      /assets/ (tema.css, tienda.css, tienda.js)
Uso: python3 build.py   (no borra promos.json existentes; solo crea los que falten y renueva los HTML)."""
import json, os, re, shutil
ROOT = os.path.dirname(os.path.abspath(__file__))
T = os.path.join(ROOT, "_template")
rd = lambda *p: open(os.path.join(*p), encoding="utf-8").read()
eq = json.load(open(os.path.join(ROOT, "_data/equipo.json")))
board = rd(T, "index.html")
cat = rd(T, "catalogo/index.html")
head = rd(T, "paginas/head.html")

# --- assets compartidos: variables de color/tipografía de cada tema, sacadas del tablero (una sola fuente de verdad)
style = re.search(r"<style>(.*?)</style>", board, re.S).group(1)
root = re.search(r":root\{.*?\}", style, re.S).group(0)
themes = re.findall(r'\[data-tema="[a-z]+"\]\{[^}]*\}', style)
os.makedirs(os.path.join(ROOT, "assets"), exist_ok=True)
open(os.path.join(ROOT, "assets/tema.css"), "w", encoding="utf-8").write("/* Generado por build.py desde _template/index.html */\n" + root + "\n:root{--on-accent:#fff;--disp:var(--sans);--dw:600;--case:none;--track:0}\n" + "\n".join(themes) + "\n")
for f in ("tienda.css", "tienda.js"):
    shutil.copy(os.path.join(T, "assets", f), os.path.join(ROOT, "assets", f))

# --- tablero (ahora vive en /tienda/): rutas ajustadas un nivel más profundo
def tienda(html):
    for a, b in [('fetch("promos.json?v="', 'fetch("../promos.json?v="'),
                 ('fetch(D.base + "?v="', 'fetch("../" + D.base + "?v="'),
                 ('"../_data/mas-pedidos.json?v="', '"../../_data/mas-pedidos.json?v="'),
                 ('"../fotos/"', '"../../fotos/"'),
                 ('href="catalogo/"', 'href="../catalogo/"'),
                 ('"catalogo/" + location.search', '"../catalogo/" + location.search'),
                 ('fetch("../_data/detalles.json?v="', 'fetch("../../_data/detalles.json?v="')]:
        assert a in html, a
        html = html.replace(a, b)
    return html

def page(name, depth, title, desc):
    body = rd(T, "paginas", name + ".html")
    h = (head.replace("{{B}}", "./" if depth == 0 else "../").replace("{{A}}", "../assets/" if depth == 0 else "../../assets/")
         .replace("{{PAGE}}", {"inicio": "inicio", "producto": "tienda", "conoce": "conoce"}[name]).replace("{{TITLE}}", title).replace("{{DESC}}", desc))
    return h + body.replace("{{A}}", "../assets/" if depth == 0 else "../../assets/")

for c in eq["consultoras"]:
    n = c["nombre"]; d = os.path.join(ROOT, c["slug"])
    for sub in ("catalogo", "tienda", "producto", "conoce"): os.makedirs(os.path.join(d, sub), exist_ok=True)
    w = lambda rel, t: open(os.path.join(d, rel), "w", encoding="utf-8").write(t)
    w("index.html", page("inicio", 0, f"Farmasi con {n}", f"Tienda de maquillaje y cuidado personal con {n}. Elige tus productos y manda tu pedido por WhatsApp."))
    w("tienda/index.html", tienda(board.replace("{{NOMBRE}}", n)))
    w("producto/index.html", page("producto", 1, f"Producto · Farmasi con {n}", f"Producto Farmasi con {n}."))
    w("conoce/index.html", page("conoce", 1, f"Conoce a {n} · Farmasi", f"Conoce a {n}, consultora Farmasi, y cómo comprar o hacerte socia."))
    w("catalogo/index.html", cat)
    p = os.path.join(d, "promos.json")
    if not os.path.exists(p):
        json.dump({"_nota": "Datos de esta consultora. Lo compartido está en ../_data/promos-base.json. Puedes sobreescribir cualquier campo aquí (p. ej. \"tema\").",
                   "base": "../_data/promos-base.json", "consultora": n, "whatsapp": c["whatsapp"],
                   "instagram": c.get("ig", ""), "referidas": []}, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("ok", c["slug"])
