#!/usr/bin/env python3
"""Genera las páginas de eventos a partir de _data/eventos.json (la única fuente).

- Evento suelto:          /eventos/<slug>/
- Serie (p. ej. Flowers to Go): /eventos/<serie>/ con todas sus ediciones,
  y cada edición en      /eventos/<serie>/<slug>/

Diseño: scripts/evento_<plantilla>.html y scripts/serie_<plantilla>.html; sin
"plantilla" se usan evento_plantilla.html y serie_plantilla.html. Un evento de
una serie usa la plantilla de su serie si no trae la suya. La lista general
(eventos/index.html) lee el JSON directo, así que no se genera.

Las páginas generadas que ya no salen del JSON (un evento borrado o renombrado)
se borran solas. Al cambiar el JSON en main, una acción de GitHub corre este
script. A mano:  python3 scripts/eventos.py
"""
import html
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATOS = ROOT / "_data" / "eventos.json"
SCRIPTS = ROOT / "scripts"
EVENTOS = ROOT / "eventos"
MARCA = "Generada por scripts/eventos.py"
SLUG = re.compile(r"[a-z0-9]+(-[a-z0-9]+)*")
BASE = "https://mitienda.beauty/"

data = json.loads(DATOS.read_text(encoding="utf-8"))
series = {k: v for k, v in data.get("series", {}).items() if not k.startswith("_")}
eventos = data["eventos"]


def valida(s):
    if not SLUG.fullmatch(s or ""):
        raise SystemExit(f"Nombre inválido: {s!r} (solo minúsculas, números y guiones)")


def plantilla(tipo, nombre):
    p = SCRIPTS / (f"{tipo}_{nombre}.html" if nombre else f"{tipo}_plantilla.html")
    if not p.exists():
        raise SystemExit(f"No existe la plantilla {p.relative_to(ROOT)}")
    return p.read_text(encoding="utf-8")


def escribe(destino, tpl, titulo, resumen, datos):
    d = ROOT / destino
    f = d / "index.html"
    if f.exists() and MARCA not in f.read_text(encoding="utf-8"):
        raise SystemExit(f"/{destino}/ ya existe y no la hizo este script: elige otro nombre")
    pagina = (tpl.replace("{{TITULO}}", html.escape(titulo))
                 .replace("{{RESUMEN}}", html.escape(resumen or ""))
                 .replace("{{RUTA}}", destino)
                 .replace("{{DATOS_JSON}}", json.dumps(datos, ensure_ascii=False).replace("</", "<\\/")))
    d.mkdir(parents=True, exist_ok=True)
    f.write_text(pagina, encoding="utf-8")
    hechas.add(f)
    print("ok", "/" + destino + "/")


hechas, rutas = set(), set()
for k in series:
    valida(k)
for e in eventos:
    valida(e["slug"])
    s = e.get("serie")
    if s and s not in series:
        raise SystemExit(f"El evento {e['slug']!r} dice serie {s!r}, que no está en \"series\"")
    destino = f"eventos/{s}/{e['slug']}" if s else f"eventos/{e['slug']}"
    if destino in rutas or (not s and e["slug"] in series):
        raise SystemExit(f"Dos páginas quieren /{destino}/")
    rutas.add(destino)
    e["_destino"] = destino

for k, sv in series.items():
    eds = [{kk: vv for kk, vv in e.items() if kk != "_destino"} | {"url": BASE + e["_destino"] + "/"}
           for e in eventos if e.get("serie") == k]
    datos = {**sv, "slug": k, "url": f"{BASE}eventos/{k}/", "ediciones": eds}
    escribe(f"eventos/{k}", plantilla("serie", sv.get("plantilla")), sv["nombre"], sv.get("resumen"), datos)

for e in eventos:
    sv = series.get(e.get("serie"), {})
    datos = {k: v for k, v in e.items() if k != "_destino"} | {"url": BASE + e["_destino"] + "/"}
    if sv:
        datos |= {"serie_nombre": sv["nombre"], "serie_url": f"/eventos/{e['serie']}/"}
    escribe(e["_destino"], plantilla("evento", e.get("plantilla") or sv.get("plantilla")),
            e["titulo"], e.get("resumen"), datos)

# Limpia páginas generadas que ya no están en el JSON
for f in EVENTOS.rglob("index.html"):
    if f not in hechas and f.parent != EVENTOS and MARCA in f.read_text(encoding="utf-8"):
        shutil.rmtree(f.parent) if not any(p.is_dir() for p in f.parent.iterdir()) else f.unlink()
        print("borrada", "/" + str(f.parent.relative_to(ROOT)) + "/")
