#!/usr/bin/env python3
"""Copia los eventos de Supabase (tabla public.eventos) a _data/eventos.json.

Supabase es la fuente: para agregar o cambiar un evento se edita la tabla en
Supabase > Table Editor > eventos, y la acción de GitHub "Eventos" corre este
script cada 10 minutos y luego scripts/eventos.py, que hace las páginas.
Solo se reemplaza "eventos"; "_nota" y "series" (que van con un diseño) se
quedan en el JSON. Las filas con publicado = false no salen.

Para que un error en una fila no tumbe todo el sitio: un slug inválido se
salta, una serie que no existe se ignora y una responsable que no está en
_data/equipo.json se quita, cada una con un aviso. Si Supabase no responde o
no regresa ningún evento, no se toca nada.

A mano:  python3 scripts/eventos_supabase.py && python3 scripts/eventos.py
"""
import json
import re
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
DATOS = ROOT / "_data" / "eventos.json"
# La misma llave pública que usan los catálogos; la tabla solo deja leer los eventos publicados
URL = "https://ctutqqstqjdngxdjzckf.supabase.co/rest/v1/eventos?select=*&order=desde"
KEY = "sb_publishable_ltaNA7nnVozoSCOcZIjg"
MX = ZoneInfo("America/Mexico_City")
SLUG = re.compile(r"[a-z0-9]+(-[a-z0-9]+)*")
# Columnas que pasan tal cual al JSON (las vacías no se escriben)
TEXTO = ["serie", "slug", "edicion", "titulo", "tipo", "categoria", "imagen", "flyer", "icono", "color",
         "plantilla", "desde", "hasta", "ciudad", "zona", "lugar", "direccion", "mapa", "resumen", "puntos",
         "aportacion", "regalo", "colaboran", "responsables", "cupo"]


def aviso(msg):
    print(f"::warning::{msg}" if "GITHUB_ACTIONS" in __import__("os").environ else f"aviso: {msg}")


def hora(v):
    return datetime.fromisoformat(v).astimezone(MX).isoformat(timespec="seconds") if v else None


def evento(f, series, equipo):
    e = dict(f.get("extra") or {})
    f = {**f, "desde": hora(f["desde"]), "hasta": hora(f.get("hasta"))}
    if f.get("lat") is not None and f.get("lng") is not None:
        f["mapa"] = [f["lat"], f["lng"]]
    if f.get("serie") and f["serie"] not in series:
        aviso(f"{f['slug']}: la serie {f['serie']!r} no está en \"series\" de _data/eventos.json; sale como evento suelto")
        f["serie"] = None
    rs = f.get("responsables") or []
    if [r for r in rs if r not in equipo]:
        aviso(f"{f['slug']}: {', '.join(r for r in rs if r not in equipo)} no está en _data/equipo.json; se quita")
        f["responsables"] = [r for r in rs if r in equipo]
    for k in TEXTO:
        if f.get(k) not in (None, "", []):
            e[k] = f[k]
    return {k: e[k] for k in TEXTO if k in e} | {k: v for k, v in e.items() if k not in TEXTO}


def main():
    try:
        req = urllib.request.Request(URL, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
        filas = json.load(urllib.request.urlopen(req, timeout=30))
    except Exception as ex:
        aviso(f"No se pudo leer Supabase ({ex}); no se cambia nada")
        return
    if not isinstance(filas, list) or not filas:
        aviso("Supabase no regresó eventos; no se cambia nada")
        return
    data = json.loads(DATOS.read_text(encoding="utf-8"))
    series = {k for k in data.get("series", {}) if not k.startswith("_")}
    equipo = {c["slug"] for c in json.loads((ROOT / "_data" / "equipo.json").read_text(encoding="utf-8"))["consultoras"]}
    eventos = []
    for f in filas:
        if not SLUG.fullmatch(f.get("slug") or ""):
            aviso(f"Slug inválido {f.get('slug')!r} (solo minúsculas, números y guiones); se salta")
            continue
        eventos.append(evento(f, series, equipo))
    nuevo = {**data, "eventos": eventos}
    if nuevo == data:
        print("Sin cambios")
        return
    DATOS.write_text(json.dumps(nuevo, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"_data/eventos.json actualizado: {len(eventos)} eventos")


if __name__ == "__main__":
    main()
