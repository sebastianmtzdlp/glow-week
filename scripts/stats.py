#!/usr/bin/env python3
"""Lee GoatCounter y escribe _data/estadisticas.json y _data/mas-pedidos.json.
Uso: GC_TOKEN=... python3 scripts/stats.py   (token de SOLO LECTURA; nunca se guarda en el repo)"""
import json, os, re, sys, urllib.request, urllib.parse, datetime as dt
SITE = "https://sebastianmtzdlp.goatcounter.com/api/v0"
TOK = os.environ.get("GC_TOKEN")
if not TOK: sys.exit("Falta GC_TOKEN")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
START = "2026-10-16T00:00:00Z"   # inicio del conteo
END = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None).strftime("%Y-%m-%dT%H:%M:%SZ")

def api(path, **q):
    url = f"{SITE}/{path}?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOK}"})
    with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)

# todas las rutas y eventos (paginado)
hits, excl = [], []
for _ in range(20):
    q = dict(start=START, end=END, limit=100)
    if excl: q["exclude_paths"] = ",".join(map(str, excl))
    d = api("stats/hits", **q)
    hits += d["hits"]
    if not d.get("more"): break
    excl = [h["path_id"] for h in hits]
tot = api("stats/total", start=START, end=END)

eq = J("_data/equipo.json")["consultoras"]
names = {c["slug"]: c["nombre"] for c in eq}
prod = {}
try:
    for p in J("_data/promos-base.json")["productos"]: prod[p["code"]] = f'{p["name"]} {p.get("shade","")}'.strip()
    for c, v in J("_data/catalogo-farmasi.json")["precios"].items(): prod.setdefault(c, v[0])
    for g in J("_data/fuera-de-catalogo.json")["grupos"]:
        for it in g["items"]: prod.setdefault(it[0], it[1])
except Exception: pass

board, cat, adds, orders, wa = {}, {}, {}, {}, 0
ritmo = {"visitas": 0}  # Ritmo de Puntos: visitas a la página y conteo de cada evento ritmo-puntos/<accion>
# Eventos: visitas a /eventos, a cada serie y a cada evento, y clics eventos/<slug>/<accion>
EV = {e["slug"]: e for e in J("_data/eventos.json")["eventos"]}
SERIES = set(J("_data/eventos.json").get("series", {}))
ev = {"hub": 0, "series": {}, "por_evento": {k: {"visitas": 0, "clics": {}} for k in EV}}
xc = {}  # por consultora: {slug: {"agregar": {code: n}, "ver": {code: n}}}
for h in hits:
    p, n = h["path"].split("?")[0].split("#")[0].strip("/"), h["count"]
    if p == "eventos" or p.startswith("eventos/"):
        if p.startswith("eventos/propuestas"): continue
        partes = p.split("/")
        if h.get("event"):
            if len(partes) == 3 and partes[1] in EV:
                c = ev["por_evento"][partes[1]]["clics"]; c[partes[2]] = c.get(partes[2], 0) + n
        elif p == "eventos": ev["hub"] += n
        elif partes[-1] in EV: ev["por_evento"][partes[-1]]["visitas"] += n
        elif len(partes) == 2 and partes[1] in SERIES: ev["series"][partes[1]] = ev["series"].get(partes[1], 0) + n
        continue
    if h.get("event"):
        m = re.fullmatch(r"c/([a-z0-9]+)/(agregar|ver)/(\d+)", p)
        if m:
            d = xc.setdefault(m.group(1), {"agregar": {}, "ver": {}})[m.group(2)]; d[m.group(3)] = d.get(m.group(3), 0) + n; continue
        if p.startswith("agregar/"): adds[p.split("/",1)[1]] = adds.get(p.split("/",1)[1], 0) + n
        elif p.startswith("pedido-enviado/") or p.startswith("pedido-catalogo/"):
            s = p.split("/",1)[1]; orders[s] = orders.get(s, 0) + n
        elif p == "wa-flotante": wa += n
        elif p.startswith("ritmo-puntos/"): k = p.split("/",1)[1]; ritmo[k] = ritmo.get(k, 0) + n
    else:
        if p == "herramientas/ritmo-de-puntos": ritmo["visitas"] += n; continue
        m = re.fullmatch(r"([a-z0-9]+)/catalogo", p)
        if m: cat[m.group(1)] = cat.get(m.group(1), 0) + n; continue
        m = re.fullmatch(r"([a-z0-9]+)", p)
        if m and m.group(1) in names: board[m.group(1)] = board.get(m.group(1), 0) + n

dias = [{"d": s["day"], "v": s["daily"] if isinstance(s.get("daily"), int) else sum(s.get("hourly", []))} for s in tot.get("stats", [])]
cons = [{"slug": s, "nombre": names[s], "visitas": board.get(s, 0), "catalogo": cat.get(s, 0), "pedidos": orders.get(s, 0)} for s in names]
cons.sort(key=lambda x: (-x["visitas"]-x["catalogo"], x["nombre"]))
top = sorted(adds.items(), key=lambda x: -x[1])
productos = [{"code": c, "name": prod.get(c, c), "agregados": n} for c, n in top[:20]]
now = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None) - dt.timedelta(hours=6)
eventos = {"hub": ev["hub"], "series": ev["series"],
    "nombres": {c.split("-", 1)[1]: names.get(c.split("-", 1)[1], c.split("-", 1)[1].capitalize())
                for v in ev["por_evento"].values() for c in v["clics"] if c.startswith("whatsapp-")},
    "lista": sorted(
    ({"slug": k, "titulo": EV[k]["titulo"], "desde": EV[k].get("desde"), **v} for k, v in ev["por_evento"].items()),
    key=lambda x: -(x["visitas"] + sum(x["clics"].values())))}
def topn(d, k=5): return [{"code": c, "name": prod.get(c, c), "n": n} for c, n in sorted(d.items(), key=lambda x: -x[1])[:k]]
por = {s: {"agregados": topn(v["agregar"]), "vistos": topn(v["ver"])} for s, v in xc.items()}
out = {"actualizado": now.strftime("%Y-%m-%d"), "hora": now.strftime("%H:%M"), "desde": START[:10],
       "totales": {"visitas": tot.get("total", 0), "agregados": sum(adds.values()), "pedidos": sum(orders.values()), "wa": wa},
       "dias": dias, "consultoras": cons, "productos": productos, "por_consultora": por, "ritmo": ritmo, "eventos": eventos}
def guardar(ruta, nuevo, ignorar=()):
    """Escribe solo si cambió algo (sin contar fecha/hora), para no llenar el historial de commits."""
    f = os.path.join(ROOT, ruta)
    try:
        viejo = json.load(open(f, encoding="utf-8"))
        if {k: v for k, v in viejo.items() if k not in ignorar} == {k: v for k, v in nuevo.items() if k not in ignorar}: return False
    except Exception: pass
    json.dump(nuevo, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=1); return True
ch1 = guardar("_data/estadisticas.json", out, ("actualizado", "hora"))
# Ranking para los tableros: solo cuando ya hay datos suficientes (>=20 agregados en total, >=3 el producto)
codes = [c for c, n in top if n >= 3][:6] if sum(adds.values()) >= 20 else []
ch2 = guardar("_data/mas-pedidos.json", {"codes": codes, "nota": "Se llena solo con scripts/stats.py cuando hay datos suficientes."})
print("ok", out["totales"], "mas pedidos:", codes, "cambios:", ch1 or ch2)
