#!/usr/bin/env python3
"""Arma el contenido de las herramientas Pro.

El texto de las versiones Pro NO vive en este repositorio (es público). Vive en
/mnt/project-files/herramientas-pro/fuente/<producto>.md y se sube a Supabase
(tabla pro_contenido, sin acceso público). Este script:

  1. parte cada .md en capítulos (## títulos, ### Bloque y # Parte),
  2. los convierte a HTML,
  3. escribe el SQL para cargarlos (fuera del repo) y
  4. escribe en el repo solo el índice público (títulos, sin contenido).

Uso:
  pip install markdown
  python3 scripts/pro-contenido.py /mnt/project-files/herramientas-pro/fuente /mnt/project-files/herramientas-pro/pro-contenido.sql
"""
import json, pathlib, re, sys
import markdown

PRODUCTOS = ["plan-anual", "planes-nivel", "plan-compromiso", "plan-mentora", "plan-equipo"]
CORTE = re.compile(r"^(# Parte .*|## .*|### Bloque .*)$", re.M)

def capitulos(md):
    md = re.sub(r"^# (?!Parte).*\n", "", md, count=1)  # quita el título del documento
    marcas = [m for m in CORTE.finditer(md)]
    intro = md[: marcas[0].start()].strip() if marcas else md.strip()
    caps = []
    if intro:
        caps.append(("Antes de empezar", intro))
    for i, m in enumerate(marcas):
        fin = marcas[i + 1].start() if i + 1 < len(marcas) else len(md)
        titulo = re.sub(r"^#+\s*", "", m.group(1)).strip()
        cuerpo = md[m.end():fin].strip()
        if titulo.startswith("Parte ") and not cuerpo:
            continue
        if titulo.startswith("Parte "):
            titulo = titulo.split("·", 1)[-1].strip()
        caps.append((titulo, cuerpo))
    return [(t, c) for t, c in caps if c.replace("---", "").strip()]

LISTA = re.compile(r"^\s*([-*]|\d+\.)\s")

def html(md):
    md = re.sub(r"^---\s*$", "", md, flags=re.M)
    # python-markdown pide una línea en blanco antes de cada lista
    out, prev = [], ""
    for linea in md.split("\n"):
        if LISTA.match(linea) and prev.strip() and not LISTA.match(prev) and not prev.startswith("  "):
            out.append("")
        out.append(linea); prev = linea
    md = "\n".join(out)
    return markdown.markdown(md, extensions=["tables", "sane_lists"])

def sql_txt(s):
    return "$pro$" + s.replace("$pro$", "") + "$pro$"

def main(fuente, salida):
    fuente = pathlib.Path(fuente)
    indice, filas = {}, []
    for p in PRODUCTOS:
        caps = capitulos((fuente / f"{p}.md").read_text())
        indice[p] = [t for t, _ in caps]
        for i, (t, c) in enumerate(caps, 1):
            filas.append(f"('{p}', {i}, {sql_txt(t)}, {sql_txt(html(c))})")
    sql = ["-- Contenido de las herramientas Pro. Generado por scripts/pro-contenido.py. NO subir al repo.",
           "begin;", "delete from public.pro_contenido;",
           "insert into public.pro_contenido (producto, orden, titulo, html) values", ",\n".join(filas) + ";", "commit;"]
    pathlib.Path(salida).write_text("\n".join(sql) + "\n")
    raiz = pathlib.Path(__file__).resolve().parent.parent
    (raiz / "mentorias/herramientas/pro/indice.json").write_text(json.dumps(indice, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(filas)} capítulos → {salida}")
    for p, caps in indice.items():
        print(f"  {p}: {len(caps)}")

if __name__ == "__main__":
    main(*sys.argv[1:3])
