#!/usr/bin/env python3
"""Genera la carpeta de cada consultora a partir de _template y _data/equipo.json.
Uso: python3 build.py   (no borra promos.json existentes; solo crea los que falten y renueva los HTML)."""
import json, os
try:
    import segno
except ImportError:
    segno = None
ROOT = os.path.dirname(os.path.abspath(__file__))
eq = json.load(open(os.path.join(ROOT, "_data/equipo.json")))
tpl = open(os.path.join(ROOT, "_template/index.html"), encoding="utf-8").read()
cat = open(os.path.join(ROOT, "_template/catalogo/index.html"), encoding="utf-8").read()
tar = open(os.path.join(ROOT, "_template/tarjeta/index.html"), encoding="utf-8").read()
for c in eq["consultoras"]:
    d = os.path.join(ROOT, c["slug"]); os.makedirs(os.path.join(d, "catalogo"), exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(tpl.replace("{{NOMBRE}}", c["nombre"]).replace("{{SLUG}}", c["slug"]))
    open(os.path.join(d, "catalogo/index.html"), "w", encoding="utf-8").write(cat)
    if segno:
        q = segno.make("https://mitienda.beauty/%s/" % c["slug"], error="m", boost_error=False); m = list(q.matrix); qn = len(m)
        os.makedirs(os.path.join(d, "tarjeta"), exist_ok=True)
        open(os.path.join(d, "tarjeta/index.html"), "w", encoding="utf-8").write(tar.replace("{{NOMBRE}}", c["nombre"]).replace("{{SLUG}}", c["slug"]).replace("{{QN}}", str(qn)).replace("{{QR}}", "".join("".join(str(v) for v in r) for r in m)))
    p = os.path.join(d, "promos.json")
    if not os.path.exists(p):
        json.dump({"_nota": "Datos de esta consultora. Lo compartido está en ../_data/promos-base.json. Puedes sobreescribir cualquier campo aquí (p. ej. \"tema\").",
                   "base": "../_data/promos-base.json", "consultora": c["nombre"], "whatsapp": c["whatsapp"],
                   "instagram": c.get("ig", ""), "referidas": []}, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("ok", c["slug"])

# Índices de equipo: /equipo/<slug>/ (ver _data/equipos.json)
teams_path = os.path.join(ROOT, "_data/equipos.json")
if os.path.exists(teams_path):
    eq_tpl = open(os.path.join(ROOT, "_template/equipo/index.html"), encoding="utf-8").read()
    teams = json.load(open(teams_path, encoding="utf-8"))
    for slug, t in teams.items():
        if slug.startswith("_"): continue
        d = os.path.join(ROOT, "equipo", slug); os.makedirs(d, exist_ok=True)
        lider = next((c for c in eq["consultoras"] if c["slug"] == t.get("lider")), {})
        html = (eq_tpl.replace("{{TEAM}}", slug).replace("{{NOMBRE_EQ}}", t["nombre"]).replace("{{TITULO}}", t["titulo"])
                      .replace("{{BIENVENIDA}}", t.get("bienvenida", "")))
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(html)
        print("ok equipo", slug)
