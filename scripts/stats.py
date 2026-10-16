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
for h in hits:
    p, n = h["path"].strip("/"), h["count"]
    if h.get("event"):
        if p.startswith("agregar/"): adds[p.split("/",1)[1]] = adds.get(p.split("/",1)[1], 0) + n
        elif p.startswith("pedido-enviado/") or p.startswith("pedido-catalogo/"):
            s = p.split("/",1)[1]; orders[s] = orders.get(s, 0) + n
        elif p == "wa-flotante": wa += n
    else:
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
out = {"actualizado": now.strftime("%Y-%m-%d"), "hora": now.strftime("%H:%M"), "desde": START[:10],
       "totales": {"visitas": tot.get("total", 0), "agregados": sum(adds.values()), "pedidos": sum(orders.values()), "wa": wa},
       "dias": dias, "consultoras": cons, "productos": productos}
json.dump(out, open(os.path.join(ROOT, "_data/estadisticas.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
# Ranking para los tableros: solo cuando ya hay datos suficientes (>=20 agregados en total, >=3 el producto)
codes = [c for c, n in top if n >= 3][:6] if sum(adds.values()) >= 20 else []
json.dump({"codes": codes, "nota": "Se llena solo con scripts/stats.py cuando hay datos suficientes."}, open(os.path.join(ROOT, "_data/mas-pedidos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", out["totales"], "mas pedidos:", codes)
