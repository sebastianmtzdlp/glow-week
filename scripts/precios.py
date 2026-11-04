"""Precios de las tiendas: actualizar desde un texto pegado y revisar que todo cuadre.

Farmasi no deja que un servidor (GitHub, este contenedor) lea su tienda: responde 403.
Por eso los precios entran a mano, pero en un solo paso:

  python3 scripts/precios.py actualiza entrada.txt [--fecha 2026-11-04]
      Lee un texto pegado (de la tienda de Farmasi, del Back Office o escrito a mano).
      Cada producto se reconoce por su código (1001414, PK102730) o, si no trae código,
      por su nombre tal cual sale en _data/catalogo-farmasi.json. Los precios de la línea
      (o de las 3 líneas siguientes al nombre) se toman así: el más alto es el precio de
      catálogo y el más bajo, si es distinto, el precio con promo de la tienda.
      Actualiza _data/catalogo-farmasi.json, _data/fuera-de-catalogo.json y
      _data/catalogo.json, y escribe el resumen de cambios en precios-cambios.md.
      Los precios con promo del equipo (promos-base.json, "price") NO se tocan: solo avisa.

  python3 scripts/precios.py revisa [--dias 14]
      Revisa que los archivos cuadren entre sí y que los precios no estén viejos.
      Escribe el resultado en precios-revision.md y sale con código 1 si hay algo que ver.

Las tiendas leen estos JSON al abrir la página, así que no hay que correr build.py.
"""
import datetime as dt
import json
import os
import re
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RAIZ, "_data")
HOY = dt.date.today()


def lee(nombre):
    with open(os.path.join(DATA, nombre), encoding="utf-8") as f:
        return json.load(f)


def guarda(nombre, datos):
    """Respeta el formato de cada archivo para que el cambio en git sea solo lo que cambió."""
    ruta = os.path.join(DATA, nombre)
    with open(ruta, encoding="utf-8") as f:
        antes = f.read()
    with open(ruta, "w", encoding="utf-8") as f:
        if antes.startswith("{\n"):
            json.dump(datos, f, ensure_ascii=False, indent=1)
        else:
            json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
        if antes.endswith("\n"):
            f.write("\n")


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def dinero(n):
    return ("$%s" % format(n, ",.2f")).replace(".00", "")


RE_COD = re.compile(r"\b(PK\d{5,7}|\d{7})\b", re.I)
RE_PRECIO = re.compile(r"\$\s*([\d.,]+)|\b(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d{2,5}\.\d{1,2})\b")


def precios_en(linea):
    linea = RE_COD.sub(" ", linea)
    out = []
    for m in RE_PRECIO.finditer(linea):
        t = (m.group(1) or m.group(2)).rstrip(".,").replace(",", "")
        try:
            v = float(t)
        except ValueError:
            continue
        if 5 <= v <= 20000:
            out.append(v)
    return out


def todos_los_productos():
    """{código: nombre} de todo lo que tiene precio en el sitio."""
    cf = lee("catalogo-farmasi.json")["precios"]
    nombres = {c: v[0] for c, v in cf.items()}
    for g in lee("fuera-de-catalogo.json").get("grupos", []):
        for it in g.get("items", []):
            nombres.setdefault(it[0], it[1])
    return nombres


def lee_entrada(texto):
    """Devuelve {código: (precio_tienda, precio_catalogo)} y las líneas que no se entendieron."""
    nombres = todos_los_productos()
    por_nombre = {}
    for c, n in nombres.items():
        por_nombre.setdefault(norm(n), c)
    lineas = [l.strip() for l in texto.splitlines()]
    hallados, dudas = {}, []
    i = 0
    while i < len(lineas):
        l = lineas[i]
        if not l:
            i += 1
            continue
        cods = RE_COD.findall(l)
        cod = cods[0].upper() if cods else por_nombre.get(norm(re.sub(r"\$.*", "", l)))
        if not cod:
            i += 1
            continue
        ps = precios_en(l)
        j = i + 1
        # Precios en las líneas de abajo (tienda en celular: nombre, precio con promo, precio tachado).
        while j < len(lineas) and j <= i + 4:
            sig = lineas[j]
            if RE_COD.search(sig) or por_nombre.get(norm(re.sub(r"\$.*", "", sig))):
                break
            mas = precios_en(sig)
            if not mas and ps:
                break
            ps += mas
            j += 1
        if ps:
            hallados[cod] = (min(ps), max(ps))
        else:
            dudas.append(l)
        i = j
    return hallados, dudas


def actualiza(ruta, fecha):
    with open(ruta, encoding="utf-8") as f:
        hallados, dudas = lee_entrada(f.read())
    if not hallados:
        print("No encontré ningún producto con precio en el texto.")
        return 1

    cat = lee("catalogo-farmasi.json")
    fuera = lee("fuera-de-catalogo.json")
    base = lee("catalogo.json")
    promos = lee("promos-base.json")
    sube, baja, promo, sin_cambio, nuevos = [], [], [], 0, []

    def anota(cod, nombre, antes, ahora, tienda_antes, tienda_ahora):
        nonlocal sin_cambio
        if antes != ahora:
            (sube if ahora > antes else baja).append("- %s (%s): %s → %s" % (nombre, cod, dinero(antes), dinero(ahora)))
        if tienda_antes != tienda_ahora and tienda_ahora is not None:
            if tienda_ahora < ahora:
                promo.append("- %s (%s): promo de la tienda %s (catálogo %s)" % (nombre, cod, dinero(tienda_ahora), dinero(ahora)))
            elif tienda_antes is not None and tienda_antes < antes:
                promo.append("- %s (%s): terminó la promo, regresa a %s" % (nombre, cod, dinero(ahora)))
        if antes == ahora and tienda_antes == tienda_ahora:
            sin_cambio += 1

    vistos = set()
    en_promos = {p.get("code") for p in promos.get("productos", []) + ((promos.get("especial") or {}).get("productos") or [])}
    for cod, (tienda, catalogo) in hallados.items():
        if cod in cat["precios"]:
            v = cat["precios"][cod]
            anota(cod, v[0], v[2], catalogo, v[1], tienda)
            v[1], v[2], v[3] = tienda, catalogo, 1
            vistos.add(cod)
        for g in fuera.get("grupos", []):
            for it in g.get("items", []):
                if it[0] == cod:
                    if cod not in vistos:
                        anota(cod, it[1], it[2], catalogo, None, None)
                        vistos.add(cod)
                    it[2] = catalogo
        if cod not in vistos and cod not in en_promos:
            nuevos.append("- %s: %s" % (cod, dinero(catalogo)))

    # catalogo.json agrupa varios tonos con un solo precio: se cambia solo si todos sus tonos
    # (con lo nuevo y lo que ya había en catalogo-farmasi.json) dicen lo mismo.
    for g in base.get("productos", []):
        ps = {hallados[c][1] if c in hallados else cat["precios"][c][2]
              for c in g.get("codigos", []) if c in hallados or c in cat["precios"]}
        if not any(c in hallados for c in g.get("codigos", [])):
            continue
        if len(ps) == 1:
            p = ps.pop()
            g["precio"] = int(p) if p.is_integer() else p

    # Promos del equipo: no se cambian solas, solo se avisa si su precio de catálogo ya no cuadra.
    revisar = []
    esp = (promos.get("especial") or {}).get("productos") or []
    for p in promos.get("productos", []) + esp:
        if p.get("code") in hallados:
            nuevo = hallados[p["code"]][1]
            if p.get("retail") != nuevo:
                revisar.append("- %s (%s): el tablero dice %s de catálogo, Farmasi dice %s. Promo actual %s."
                               % (p.get("name"), p["code"], dinero(p.get("retail") or 0), dinero(nuevo), dinero(p.get("price") or 0)))

    cat["actualizado"] = fecha
    cat["_nota"] = re.sub(r"Precios revisados el [^.]*\.", "Precios revisados el %s." % fecha, cat.get("_nota", ""))
    fuera["actualizado"] = fecha
    fuera.pop("hora", None)
    guarda("catalogo-farmasi.json", cat)
    guarda("fuera-de-catalogo.json", fuera)
    guarda("catalogo.json", base)

    r = ["# Cambios de precios (%s)" % fecha, "",
         "Leí %d productos del texto: %d sin cambio." % (len(hallados), sin_cambio), ""]
    for titulo, lista in (("Subieron", sube), ("Bajaron", baja), ("Promos de la tienda", promo),
                          ("Revisa la promo del equipo", revisar), ("Códigos que no están en el sitio", nuevos)):
        if lista:
            r += ["## %s (%d)" % (titulo, len(lista))] + lista + [""]
    if dudas:
        r += ["## Sin precio en el texto (%d)" % len(dudas)] + ["- " + d for d in dudas] + [""]
    no_vinieron = [c for c, v in cat["precios"].items() if v[3] and c not in hallados]
    if no_vinieron and len(hallados) > 50:
        r += ["## No vinieron en el texto (%d)" % len(no_vinieron),
              "Puede que ya no estén en la tienda o que no se copiaron. No se quitaron."] + \
             ["- %s (%s)" % (cat["precios"][c][0], c) for c in no_vinieron[:40]] + [""]
    with open(os.path.join(RAIZ, "precios-cambios.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(r))
    print("\n".join(r))
    return 0


def revisa(dias):
    cat = lee("catalogo-farmasi.json")
    cf = cat["precios"]
    base = lee("catalogo.json")
    promos = lee("promos-base.json")
    fuera = lee("fuera-de-catalogo.json")
    avisos = []

    fecha = dt.date.fromisoformat(cat.get("actualizado", "2000-01-01"))
    edad = (HOY - fecha).days
    if edad > dias:
        avisos.append("Los precios se revisaron hace %d días (%s). Farmasi cambia precios y promos con cada catálogo."
                      % (edad, fecha.strftime("%d/%m/%Y")))

    for g in base.get("productos", []):
        for c in g.get("codigos", []):
            if c in cf and cf[c][2] != g["precio"]:
                avisos.append("%s (%s): catalogo.json dice %s y catalogo-farmasi.json dice %s."
                              % (g["nombre"], c, dinero(g["precio"]), dinero(cf[c][2])))
    esp = (promos.get("especial") or {}).get("productos") or []
    for p in promos.get("productos", []) + esp:
        c = p.get("code")
        if c in cf and p.get("retail") and cf[c][2] != p["retail"]:
            avisos.append("%s (%s): el tablero dice %s de catálogo y catalogo-farmasi.json dice %s."
                          % (p.get("name"), c, dinero(p["retail"]), dinero(cf[c][2])))
        if p.get("price") and p.get("retail") and p["price"] > p["retail"]:
            avisos.append("%s (%s): el precio con promo (%s) es mayor que el de catálogo (%s)."
                          % (p.get("name"), c, dinero(p["price"]), dinero(p["retail"])))
    for c, v in cf.items():
        if v[1] > v[2]:
            avisos.append("%s (%s): precio de tienda %s mayor que el de catálogo %s." % (v[0], c, dinero(v[1]), dinero(v[2])))
    for g in fuera.get("grupos", []):
        for it in g.get("items", []):
            if it[0] in cf and cf[it[0]][2] != it[2]:
                avisos.append("%s (%s): fuera-de-catalogo.json dice %s y catalogo-farmasi.json dice %s."
                              % (it[1], it[0], dinero(it[2]), dinero(cf[it[0]][2])))

    r = ["# Revisión de precios (%s)" % HOY.isoformat(), ""]
    r += ["- " + a for a in avisos] if avisos else ["Todo cuadra y los precios están al día."]
    r += ["", "Para actualizar: pega en el proyecto el texto de la tienda de Farmasi (o una lista código y precio) "
          "y pide \"Actualiza los precios\"."]
    with open(os.path.join(RAIZ, "precios-revision.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(r) + "\n")
    print("\n".join(r))
    return 1 if avisos else 0


def main(a):
    if len(a) >= 2 and a[0] == "actualiza":
        fecha = a[a.index("--fecha") + 1] if "--fecha" in a else HOY.isoformat()
        return actualiza(a[1], fecha)
    if a and a[0] == "revisa":
        return revisa(int(a[a.index("--dias") + 1]) if "--dias" in a else 14)
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
