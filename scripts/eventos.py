#!/usr/bin/env python3
"""Genera una página por evento.

Los eventos viven en _data/eventos.json (la única fuente). Cada evento sale
en /eventos/<slug>/, o en /<ruta>/ si tiene "ruta" (p. ej. /flowers-to-go/).
El diseño es scripts/evento_plantilla.html, o scripts/evento_<plantilla>.html
si el evento dice "plantilla". La lista (eventos/index.html) lee el JSON
directo, así que no se genera.

Al cambiar _data/eventos.json en main, una acción de GitHub corre este
script sola. Para hacerlo a mano:  python3 scripts/eventos.py
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATOS = ROOT / "_data" / "eventos.json"
SCRIPTS = ROOT / "scripts"
MARCA = "Generada por scripts/eventos.py"
SLUG = re.compile(r"[a-z0-9]+(-[a-z0-9]+)*")

eventos = json.loads(DATOS.read_text(encoding="utf-8"))["eventos"]
vistas = set()
for e in eventos:
    slug, ruta = e["slug"], e.get("ruta")
    for s in filter(None, [slug, ruta]):
        if not SLUG.fullmatch(s):
            raise SystemExit(f"Nombre inválido: {s!r} (solo minúsculas, números y guiones)")
    destino = ruta or f"eventos/{slug}"
    if destino in vistas:
        raise SystemExit(f"Dos eventos quieren la misma página: /{destino}/")
    vistas.add(destino)
    d = ROOT / destino
    viejo = d / "index.html"
    # Una ruta propia no puede pisar una carpeta que no hizo este script (una consultora, un programa…)
    if d.exists() and not (viejo.exists() and MARCA in viejo.read_text(encoding="utf-8")):
        raise SystemExit(f"/{destino}/ ya existe y no es de eventos: elige otra ruta")
    tpl = (SCRIPTS / (f"evento_{e['plantilla']}.html" if e.get("plantilla") else "evento_plantilla.html")).read_text(encoding="utf-8")
    datos = json.dumps({**e, "url": f"https://mitienda.beauty/{destino}/"}, ensure_ascii=False).replace("</", "<\\/")
    pagina = (tpl.replace("{{TITULO}}", html.escape(e["titulo"]))
                 .replace("{{RESUMEN}}", html.escape(e.get("resumen", "")))
                 .replace("{{RUTA}}", destino)
                 .replace("{{EVENTO_JSON}}", datos))
    d.mkdir(parents=True, exist_ok=True)
    viejo.write_text(pagina, encoding="utf-8")
    print("ok", "/" + destino + "/")
