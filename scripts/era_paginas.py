#!/usr/bin/env python3
"""Genera Tu era Creator en una sola página (programas/tu-era-creator/index.html).

El contenido sale de dos archivos, que son la única fuente:
  programas/tu-era-creator/clases.md     las clases y herramientas
  programas/tu-era-creator/preguntas.md  la pestaña de Preguntas
El diseño y el código de la página están en scripts/era_plantilla.html.

Las páginas viejas (una por clase) quedan como redirecciones a su clase
dentro de la página única, para que los links que ya se compartieron sigan
funcionando.

Si cambias una clase o una pregunta, corre:  python3 scripts/era_paginas.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "programas" / "tu-era-creator"
CLASES = BASE / "clases.md"
PREGUNTAS = BASE / "preguntas.md"
PLANTILLA = ROOT / "scripts" / "era_plantilla.html"

# Orden en el que aparecen después de las 8 clases (el id se queda igual
# para que el avance guardado en el celular de cada quien siga sirviendo).
HERRAMIENTAS = [13, 12, 9, 10]

# Páginas viejas: carpeta -> a dónde mandan en la página única.
VIEJAS = {"empieza-aqui": "#clase-0", "checklist": "#clase-9", "diccionario": "#clase-10",
          "preguntas": "#preguntas", "avance": "#clase-12", "crecer-cuenta": "#clase-13"}
VIEJAS.update({f"clase-{i}": f"#clase-{i}" for i in range(1, 9)})


def bloques():
    raw = CLASES.read_text(encoding="utf-8")
    out = {}
    for block in re.split(r"^@@ ", raw, flags=re.M):
        if block.strip():
            out[int(block.split("|", 1)[0])] = "@@ " + block.rstrip() + "\n"
    return out


def lecciones():
    b = bloques()
    ids = [i for i in range(0, 9)] + HERRAMIENTAS
    falta = [i for i in ids if i not in b]
    assert not falta, f"faltan en clases.md: {falta}"
    md = "".join(b[i] for i in ids)
    # "## Tu tarea" se muestra como tarea con su cuaderno para escribir.
    return re.sub(r"^## Tu tarea\s*$", "## 📝 Tu tarea", md, flags=re.M)


def redireccion(destino):
    url = "../" + destino
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Tu era Creator</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="{url}">
<meta http-equiv="refresh" content="0; url={url}">
<script>location.replace("{url}");</script>
</head><body>
<!-- Generado por scripts/era_paginas.py. Esta clase ahora vive en la página única. -->
<p><a href="{url}">Ir a Tu era Creator</a></p>
</body></html>
"""


def main():
    page = PLANTILLA.read_text(encoding="utf-8")
    for ph, val in (("__LESSONS_MD__", lecciones()), ("__FAQ_MD__", PREGUNTAS.read_text(encoding="utf-8"))):
        assert page.count(ph) == 1, ph
        page = page.replace(ph, json.dumps(val, ensure_ascii=False).replace("</", "<\\/"))
    (BASE / "index.html").write_text(page, encoding="utf-8")
    print("programas/tu-era-creator/index.html")
    for carpeta, destino in VIEJAS.items():
        d = BASE / carpeta
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(redireccion(destino), encoding="utf-8")
        print(f"programas/tu-era-creator/{carpeta}/index.html -> {destino}")


if __name__ == "__main__":
    main()
