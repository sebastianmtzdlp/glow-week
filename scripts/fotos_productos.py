"""Guarda en el sitio la foto de cada producto que se puede elegir en /ventas-de-whatsapp/.

Las fotos de Farmasi no dejan que el navegador las dibuje dentro de una imagen nueva
(no traen permiso CORS), así que la tarjeta para compartir usa una copia propia:
ventas-de-whatsapp/fotos/<codigo>.webp (o .png). Solo baja las que faltan.

Uso: python3 scripts/fotos_productos.py
Lo corre solo la acción "Fotos de productos" cuando cambian los catálogos.
"""
import json
import os
import sys
import time
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(RAIZ, "ventas-de-whatsapp", "fotos")
CDN = "https://content.mx.farmasi.com/Product/"


def lee(nombre):
    with open(os.path.join(RAIZ, "_data", nombre), encoding="utf-8") as f:
        return json.load(f)


def codigos():
    out = {}
    base = lee("promos-base.json")
    esp = (base.get("especial") or {}).get("productos") or []
    for p in esp + base.get("productos", []):
        out.setdefault(p["code"], p.get("img") or "")
    for c, v in lee("catalogo-farmasi.json").get("precios", {}).items():
        if v[3]:
            out.setdefault(c, "")
    for g in lee("fuera-de-catalogo.json").get("grupos", []):
        if "tarjeta" in g.get("titulo", "").lower():
            continue
        for it in g.get("items", []):
            out.setdefault(it[0], "")
    return out


def intentos(code, img):
    l = []
    if img:
        l += [img.replace("_250", "_400"), img]
    l += [code + x for x in ("_400", "_400_1", "_250", "_250_1")]
    vistos, res = set(), []
    for n in l:
        if n not in vistos:
            vistos.add(n)
            res.append((CDN + n + ".webp", ".webp"))
    res.append((CDN + code + "_250.png", ".png"))
    return res


def baja(url):
    req = urllib.request.Request(url, headers={"User-Agent": "mitienda-beauty-fotos/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        if r.status != 200:
            return None
        datos = r.read()
        return datos if len(datos) > 500 else None


def main():
    os.makedirs(DEST, exist_ok=True)
    nuevas = faltan = 0
    for code, img in sorted(codigos().items()):
        if any(os.path.exists(os.path.join(DEST, code + e)) for e in (".webp", ".png")):
            continue
        ok = False
        for url, ext in intentos(code, img):
            try:
                datos = baja(url)
            except Exception:
                datos = None
            if datos:
                with open(os.path.join(DEST, code + ext), "wb") as f:
                    f.write(datos)
                nuevas += 1
                ok = True
                break
        if not ok:
            faltan += 1
            print("sin foto:", code)
        time.sleep(0.15)
    print(f"{nuevas} fotos nuevas, {faltan} sin foto")
    return 0


if __name__ == "__main__":
    sys.exit(main())
