#!/usr/bin/env python3
"""Arma _data/tarjetas-imprimibles.json: una tarjeta por producto (los tonos de un mismo producto van juntos).

Fuentes, sin inventar texto:
  - _data/fichas-farmasi.json   ficha oficial de mx.farmasi.com: desc, bullets, uso, tamano (la junta scripts o un RC)
  - _data/detalles.json         descripciones oficiales que ya usaba el tablero
  - catálogo, fuera de catálogo y promos-base para saber qué productos vende hoy la tienda

Los beneficios son las listas de la ficha tal cual; si la ficha no trae lista, son frases cortas
copiadas de la descripción oficial (sin reescribirlas). Productos sin texto oficial quedan fuera
y se listan en _data/tarjetas-imprimibles.json -> "sin_datos".

Uso: python3 scripts/tarjetas_imprimibles.py
"""
import json, os, re, unicodedata

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
def lee(p, d=None):
    try:
        return json.load(open(os.path.join(R, p), encoding="utf-8"))
    except FileNotFoundError:
        return d

BASE = lee("_data/promos-base.json", {})
CAT = lee("_data/catalogo-farmasi.json", {})
FUE = lee("_data/fuera-de-catalogo.json", {})
DET = (lee("_data/detalles.json", {}) or {}).get("productos", {})
FIC = lee("_data/fichas-farmasi.json", {}) or {}
FIC = FIC.get("productos", FIC)

# ---------- qué vende la tienda (igual que ventas-de-whatsapp/tarjetas.js) ----------
SECTIONS = [("Labios", 8), ("Ojos", 20), ("Rostro", 38), ("Brochas", 55), ("Fragancias", 56), ("Hombre", 58),
            ("Cuidado personal", 62), ("Skincare", 66), ("Masaje", 112), ("Cabello", 114), ("Nutriplus", 118)]
page = {}
for i, items in enumerate(CAT.get("productos", [])):
    for it in items or []:
        page.setdefault(it[0], i + 1)
def secc(c):
    p, s = page.get(c), ""
    if not p:
        return ""
    for n, desde in SECTIONS:
        if p >= desde:
            s = n
    return s

prods, vistos = [], set()
def add(code, name, cat):
    if code in vistos:
        return
    vistos.add(code)
    prods.append({"code": code, "name": name, "cat": cat})
for p in ((BASE.get("especial") or {}).get("productos") or []) + BASE.get("productos", []):
    add(p["code"], p["name"], p.get("cat") or secc(p["code"]))
for c, v in (CAT.get("precios") or {}).items():
    if v[3]:
        add(c, v[0], secc(c))
for g in FUE.get("grupos", []):
    if "arjeta" in g["titulo"]:
        continue
    for it in g["items"]:
        add(it[0], it[1], "Kits" if g["titulo"] in ("Kits y sets", "Sistemas Nutriplus", "Edición limitada y de temporada") else secc(it[0]))
ago = set(BASE.get("agotados", []))
prods = [p for p in prods if p["code"] not in ago]

# ---------- familias: un producto con varios tonos es una sola tarjeta ----------
# (regex sobre el nombre, id, marca, nombre en la tarjeta, línea)
FAM = [
    (r"(labial l[ií]quido matte|matte liq|matte liquid)", "matte-liquid-lipstick", "Farmasi", "Matte Liquid Lipstick", "Labios"),
    (r"latina lip", "latina-lip-liquor", "Farmasi", "Latina Lip Liquor", "Labios"),
    (r"creamy lipstick", "creamy-lipstick", "Farmasi", "Creamy Lipstick", "Labios"),
    (r"tinted lip plumper", "tinted-lip-plumper", "Farmasi", "Tinted Lip Plumper", "Labios"),
    (r"ultimate shine", "ultimate-shine-gloss", "Farmasi", "Ultimate Shine Lip Gloss", "Labios"),
    (r"lip liner", "lip-liner", "Farmasi", "Lip Liner", "Labios"),
    (r"glowy peptide", "glowy-peptide-lip-balm", "Farmasi", "Glowy Peptide Lip Balm", "Labios"),
    (r"lip stylo", "lip-stylo", "Farmasi", "Lip Stylo", "Labios"),
    (r"rich lip oil stick", "rich-lip-oil-stick", "Farmasi", "Rich Lip Oil Stick", "Labios"),
    (r"^lip oil", "lip-oil", "Farmasi", "Lip Oil", "Labios"),
    (r"royal cherry lip gloss", "royal-cherry-lip-gloss", "Royal Cherry", "Lip Gloss", "Labios"),
    (r"(eyeliner pencil|eye pencil)", "eye-pencil", "Farmasi", "Eye Pencil", "Ojos"),
    (r"precision brow", "precision-brow-pencil", "Farmasi", "Precision Brow Pencil", "Ojos"),
    (r"vfx pro (liquid )?concealer", "vfx-pro-concealer", "VFX Pro", "Liquid Concealer", "Rostro"),
    (r"(vfx pro fdt|vfx pro foundation)", "vfx-pro-foundation", "VFX Pro", "Foundation", "Rostro"),
    (r"^cc cream", "cc-cream", "Farmasi", "CC Cream", "Rostro"),
    (r"^bb cream", "bb-cream", "Farmasi", "BB Cream", "Rostro"),
    (r"^bb powder", "bb-powder", "Farmasi", "BB Powder", "Rostro"),
    (r"creamy stick contour", "creamy-stick-contour", "Farmasi", "Creamy Stick Contour", "Rostro"),
    (r"creamy stick blush", "creamy-stick-blush", "Farmasi", "Creamy Stick Blush", "Rostro"),
    (r"all in one palette", "all-in-one-palette", "Farmasi", "All in One Palette", "Rostro"),
    (r"air bronzer duo", "air-bronzer-duo", "Farmasi", "Air Bronzer Duo", "Rostro"),
    (r"air blush duo", "air-blush-duo", "Farmasi", "Air Blush Duo", "Rostro"),
    (r"stay fresh deo roll on .*women", "stay-fresh-women", "Stay Fresh", "Deo Roll On Women", "Cuidado personal"),
    (r"stay fresh deo roll on .*men", "stay-fresh-men", "Stay Fresh", "Deo Roll On Men", "Hombre"),
    (r"cc body lotion", "cc-body-lotion", "Farmasi", "CC Body Lotion", "Cuidado personal"),
    (r"^hand cream ", "hand-cream-aromas", "Farmasi", "Hand Cream", "Cuidado personal"),
    (r"complete blend", "complete-blend", "Nutriplus", "Complete Blend", "Nutriplus"),
    (r"aloe glow", "aloe-glow", "Nutriplus", "Aloe Glow", "Nutriplus"),
    (r"l-carnit", "l-carnitina", "Nutriplus", "L-Carnitina", "Nutriplus"),
    (r"serenity", "serenity", "Nutriplus", "Serenity", "Nutriplus"),
    (r"horizonte v", "horizonte-v", "Delish Café", "Horizonte V", "Kits"),
]
TONO = {"matte-liquid-lipstick", "latina-lip-liquor", "creamy-lipstick", "tinted-lip-plumper", "ultimate-shine-gloss",
        "lip-liner", "glowy-peptide-lip-balm", "lip-stylo", "rich-lip-oil-stick", "lip-oil", "royal-cherry-lip-gloss",
        "eye-pencil", "precision-brow-pencil", "vfx-pro-concealer", "vfx-pro-foundation", "cc-cream", "bb-cream",
        "bb-powder", "creamy-stick-contour", "creamy-stick-blush", "all-in-one-palette", "air-bronzer-duo", "air-blush-duo",
        "cc-body-lotion"}

def slug(t):
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")

KEEP = re.compile(r"^(VFX|FDT|SPF|FPS|BB|CC|DD|XL|UV|PRO|II|III|3D|4D)$")
def bonito(n):
    n = re.sub(r"^FRM\s+", "", n or "", flags=re.I).strip()
    if n == n.upper() and re.search("[A-Z]", n):
        n = " ".join(w if KEEP.match(w) or (re.search(r"\d", w) and len(w) <= 4) else w[:1] + w[1:].lower() for w in n.split())
    n = re.sub(r"(\d)\s?ML\b", r"\1 ml", n, flags=re.I)
    n = re.sub(r"\s+\d+(?:[.,]\d+)?\s?(ml|g|gr)\.?$", "", n, flags=re.I)  # el tamaño va en el subtítulo
    return re.sub(r"\s+", " ", n).strip(" .")

def marca_nombre(n):
    n = bonito(n)
    for pat, m in [(r"^dr\.? ?c\.? ?tuna\s*", "Dr. C. Tuna"), (r"\s*dr\.? ?c\.? ?tuna$", "Dr. C. Tuna"),
                   (r"^nutriplus\+?\s*", "Nutriplus"), (r"\s*nutriplus\+?$", "Nutriplus"),
                   (r"^vfx pro\s*", "VFX Pro"), (r"^delish caf[eé]\s*", "Delish Café"), (r"^masculine\s*", "Masculine"),
                   (r"^royal cherry\s*", "Royal Cherry"), (r"^shea&almond\.?\s*", "Shea & Almond"),
                   (r"^oasis collection\s*-?\s*", "Oasis Collection"), (r"^farmasi\s*", "Farmasi"), (r"^flaunt it!?\s*", "Flaunt It!")]:
        if re.search(pat, n, flags=re.I):
            r = re.sub(pat, "", n, flags=re.I).strip(" -")
            return m, r or n
    return "Farmasi", n

# ---------- texto oficial ----------
def oraciones(t):
    t = re.sub(r"\s+", " ", t or "").strip()
    t = re.sub(r"\b([A-Z])\. (?=[A-Z])", "\\1.§", t)  # "Dr. C. Tuna" no corta oración
    t = re.sub(r"\b(Dr|Sra|Sr)\. ", "\\1.§", t)
    partes = re.split(r"(?<=[.!?])\s+(?=[¡¿A-ZÁÉÍÓÚÑ])", t)
    return [p.replace("§", " ").strip() for p in partes if p.strip()]

def limpia(b):
    b = re.sub(r"^[\-•·*✓✔]\s*", "", b.strip())
    b = re.sub(r"\s+", " ", b)
    b = re.sub(r"^(?:[A-ZÁÉÍÓÚÑ¡!]{2,}[\s!.,]+){2,}(?=[A-ZÁÉÍÓÚÑ][a-záéíóúñ])", "", b)  # quita gritos al inicio: "TU DOSIS DIARIA DE GLOW Efecto..."
    return b.rstrip(".").strip()

CLAIM = re.compile(r"^(vegan|libre|sin |no (probado|testado)|apto para vegan|f[oó]rmula vegana|non gmo|materias primas veganas|100% vegana|dermatol|probado|seguro para la piel|hipoalerg|elaborado bajo|con ingredientes naturales y f)", re.I)

def beneficios(code):
    """Devuelve (lista, fuente, titulo). Kits: lo que incluye. Resto: frases de la descripción + puntos de la ficha."""
    f = FIC.get(code) or {}
    d = DET.get(code) or {}
    bl = [limpia(x) for x in (f.get("bullets") or []) if x and 3 < len(x.strip()) <= 110
          and not re.match(r"^(contenido|modo de uso|uso:|ingredientes)", x.strip(), re.I)]
    if f.get("kit"):
        return (bl[:6], "contenido del kit en la ficha", "INCLUYE") if bl else ([], "", "")
    desc = f.get("desc") or d.get("b") or ""
    frases = [limpia(o) for o in oraciones(desc) if 12 <= len(o) <= 260 and not o.isupper()
              and not re.search(r"(formato|contenido|cont\.|size)\s*:?\s*\d", o, re.I)]
    puntos = [b for b in bl if not CLAIM.match(b)]
    sellos = [b for b in bl if CLAIM.match(b)]
    sellos += [limpia(o) for o in oraciones(d.get("s") or "") if 8 <= len(o) <= 110]
    out, vis = [], set()
    def mete(lst, tope):
        for c in lst:
            k = c.lower()
            if k in vis or len(out) >= tope:
                continue
            vis.add(k)
            out.append(c)
    mete(puntos, 4)
    mete(frases, 4 if puntos else 3)
    if out:
        mete(sellos, len(out) + 2)
    if len(out) < 2:
        return [], "", ""
    return out[:6], ("ficha oficial" if f else "descripción oficial"), "BENEFICIOS"

def subtitulo(code):
    f = FIC.get(code) or {}
    return (f.get("tamano") or "").strip()

# ---------- arma tarjetas ----------
tarjetas, porfam = [], {}
for p in prods:
    nm = p["name"]
    fam = next((f for f in FAM if re.search(f[0], nm, flags=re.I)), None)
    if fam:
        _, fid, marca, nombre, linea = fam
        if fid not in porfam:
            porfam[fid] = {"id": fid, "marca": marca, "nombre": nombre, "linea": linea, "codes": []}
            tarjetas.append(porfam[fid])
        porfam[fid]["codes"].append(p["code"])
    else:
        marca, nombre = marca_nombre(nm)
        linea = p["cat"] if p["cat"] in ("Nutriplus", "Skincare", "Labios", "Ojos", "Rostro", "Fragancias", "Cuidado personal",
                                          "Cabello", "Hombre", "Masaje", "Brochas", "Kits") else ""
        if not linea:
            low = nm.lower()
            linea = ("Nutriplus" if marca in ("Nutriplus", "Delish Café") or re.search(r"gumm|(guaran|citrus).*powder|omega|spirulina|turmeric|sambucus|matcha|electrolyte|collagen|shaker", low)
                     else "Skincare" if marca == "Dr. C. Tuna" and not re.search(r"sun|masaje|massage|aceite|oil|bronce", low)
                     else "Masaje" if re.search(r"masaje|massage", low)
                     else "Cuidado personal" if re.search(r"jab[oó]n|soap|crema|cream|body|depil|toothpaste|butter|wash", low)
                     else "Rostro" if re.search(r"palette|powder|blush|bronzer|highlight|primer|balm", low)
                     else "Ojos" if re.search(r"mascara|eyeshadow|lash|brow", low)
                     else "Labios" if re.search(r"lip", low)
                     else "Kits")
        tarjetas.append({"id": slug(nm) + "-" + p["code"].lower(), "marca": marca, "nombre": nombre, "linea": linea, "codes": [p["code"]]})

salida, sin = [], []
for t in tarjetas:
    ben, fuente, src, tit = [], "", None, ""
    for c in t["codes"]:  # el primer tono que tenga texto oficial
        ben, fuente, tit = beneficios(c)
        if ben:
            src = c
            break
    t["tonos"] = len(t["codes"]) if t["id"] in TONO else 0
    t["sub"] = subtitulo(src or t["codes"][0]) if not t["tonos"] else ""
    t["beneficios"] = ben
    t["fuente"] = fuente
    if tit == "INCLUYE":
        t["titulo"] = tit
    t["foto"] = t["codes"][0]
    (salida if ben else sin).append(t)

ORD = ["Nutriplus", "Skincare", "Labios", "Ojos", "Rostro", "Fragancias", "Cuidado personal", "Cabello", "Hombre", "Masaje", "Brochas", "Kits"]
salida.sort(key=lambda t: (ORD.index(t["linea"]) if t["linea"] in ORD else 99, t["marca"] != "Nutriplus", t["marca"], t["nombre"]))
out = {
    "_nota": "Lo arma scripts/tarjetas_imprimibles.py. Beneficios copiados de la ficha oficial de Farmasi México, sin reescribir. No editar a mano.",
    "productos": salida,
    "sin_datos": [{"codes": t["codes"], "nombre": (t["marca"] + " " + t["nombre"]).strip()} for t in sin],
}
json.dump(out, open(os.path.join(R, "_data/tarjetas-imprimibles.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"{len(salida)} tarjetas con texto oficial · {len(sin)} sin datos · {len(prods)} códigos en la tienda")
