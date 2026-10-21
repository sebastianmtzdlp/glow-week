#!/usr/bin/env python3
"""Genera una página por evento en eventos/<slug>/index.html.

Los eventos viven en _data/eventos.json (la única fuente). El diseño de la
página de cada evento está en scripts/evento_plantilla.html. La lista
(eventos/index.html) lee el JSON directo, así que no se genera.

Al cambiar _data/eventos.json en main, una acción de GitHub corre este
script sola. Para hacerlo a mano:  python3 scripts/eventos.py
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATOS = ROOT / "_data" / "eventos.json"
PLANTILLA = ROOT / "scripts" / "evento_plantilla.html"
SALIDA = ROOT / "eventos"

eventos = json.loads(DATOS.read_text(encoding="utf-8"))["eventos"]
tpl = PLANTILLA.read_text(encoding="utf-8")
vistos = set()
for e in eventos:
    slug = e["slug"]
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug):
        raise SystemExit(f"Slug inválido: {slug!r} (solo minúsculas, números y guiones)")
    if slug in vistos:
        raise SystemExit(f"Slug repetido: {slug}")
    vistos.add(slug)
    datos = json.dumps(e, ensure_ascii=False).replace("</", "<\\/")
    pagina = (tpl.replace("{{TITULO}}", html.escape(e["titulo"]))
                 .replace("{{RESUMEN}}", html.escape(e.get("resumen", "")))
                 .replace("{{SLUG}}", slug)
                 .replace("{{EVENTO_JSON}}", datos))
    d = SALIDA / slug
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(pagina, encoding="utf-8")
    print("ok", slug)
