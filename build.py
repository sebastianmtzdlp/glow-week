#!/usr/bin/env python3
"""Genera la carpeta de cada consultora a partir de _template y _data/equipo.json.
Uso: python3 build.py   (no borra promos.json existentes; solo crea los que falten y renueva los HTML)."""
import json, os
ROOT = os.path.dirname(os.path.abspath(__file__))
eq = json.load(open(os.path.join(ROOT, "_data/equipo.json")))
tpl = open(os.path.join(ROOT, "_template/index.html"), encoding="utf-8").read()
cat = open(os.path.join(ROOT, "_template/catalogo/index.html"), encoding="utf-8").read()
for c in eq["consultoras"]:
    d = os.path.join(ROOT, c["slug"]); os.makedirs(os.path.join(d, "catalogo"), exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(tpl.replace("{{NOMBRE}}", c["nombre"]).replace("{{SLUG}}", c["slug"]))
    open(os.path.join(d, "catalogo/index.html"), "w", encoding="utf-8").write(cat)
    p = os.path.join(d, "promos.json")
    if not os.path.exists(p):
        json.dump({"_nota": "Datos de esta consultora. Lo compartido está en ../_data/promos-base.json. Puedes sobreescribir cualquier campo aquí (p. ej. \"tema\").",
                   "base": "../_data/promos-base.json", "consultora": c["nombre"], "whatsapp": c["whatsapp"],
                   "instagram": c.get("ig", ""), "referidas": []}, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("ok", c["slug"])
