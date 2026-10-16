"""
Genera src/products/catalog.json a partir del catálogo del bazar (rows2.json)
y de las fotos en miniatura.

- Forma 3D: según palabras clave del nombre/descripción.
- Colores: dominantes de la foto (ignorando el fondo claro).
- Medidas: las que aparecen en el texto; si no, estimadas por tipo de pieza.
Todo producto queda marcado como aproximación (approximate: true).

Uso: python3 scripts/generar-catalogo.py rows2.json carpeta_minis salida.json
"""
import json, re, sys, unicodedata
from collections import Counter
from PIL import Image

ROWS, MINIS, OUT = sys.argv[1:4]
rows = json.load(open(ROWS))["rows"]

CAT_NAMES = {
    "vajilla-estandar": "Vajilla estándar", "vajilla-blanca": "Vajilla blanca", "gres": "Gres",
    "vajilla-marmolada": "Vajilla marmolada", "vajilla-decorada": "Vajilla decorada", "cubiertos": "Cubiertos",
    "cristaleria": "Cristalería", "cafe": "Café de especialidad", "vajilla-oriental": "Vajilla oriental",
}

def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")

# ------------------------------------------------------------ medidas típicas (cm)
# (ancho, alto, profundidad) para piezas individuales cuando el texto no las trae
PIECES = {
    "plato playo":   ("plate", 27, 2.2, 27),
    "plato hondo":   ("bowl", 22, 4.5, 22),
    "plato postre":  ("plate", 21, 2, 21),
    "platito":       ("plate", 15, 1.8, 15),
    "plato":         ("plate", 26, 2.2, 26),
    "bandeja":       ("tray", 30, 2, 12),
    "fuente":        ("bowl", 30, 6, 30),
    "bowl":          ("bowl", 15, 7, 15),
    "bol":           ("bowl", 15, 7, 15),
    "cuenco":        ("bowl", 14, 6.5, 14),
    "compotera":     ("bowl", 13, 5.5, 13),
    "ensaladera":    ("bowl", 24, 10, 24),
    "ramekin":       ("bowl", 9, 5, 9),
    "mug":           ("mug", 12.5, 10, 8.5),
    "taza":          ("mug", 11.5, 8, 8),
    "pocillo":       ("mug", 8.5, 6, 6),
    "jarro":         ("mug", 12.5, 10, 8.5),
    "copa de agua":  ("glass", 9, 22, 9),
    "copa de vino":  ("glass", 8, 21, 8),
    "copa":          ("glass", 8, 20, 8),
    "vaso alto":     ("cylinder", 7, 15, 7),
    "vaso bajo":     ("cylinder", 8.5, 9.5, 8.5),
    "vaso":          ("cylinder", 7.5, 12, 7.5),
    "tetera":        ("bottle", 16, 14, 11),
    "jarra":         ("bottle", 12, 22, 12),
    "botella":       ("bottle", 8, 28, 8),
    "azucarera":     ("bowl", 10, 9, 10),
    "lechera":       ("mug", 10, 9, 7),
    "salsera":       ("bowl", 10, 5, 7),
    "cuchara":       ("tray", 3, 1.2, 18),
    "palillos":      ("tray", 2, 1, 23),
    "cremera":       ("mug", 7, 7, 6),
    "dispenser":     ("bottle", 7, 12, 7),
    "vinagrera":     ("bottle", 6, 14, 6),
    "sake":          ("bottle", 7, 14, 7),
    "sarten":        ("plate", 26, 5, 26),
    "cubilete":      ("cylinder", 8, 10, 8),
    "coleccion":     ("plate", 26, 2.2, 26),
    "apoya":         ("tray", 6, 1.5, 2.5),
}
PIECE_ORDER = sorted(PIECES, key=len, reverse=True)  # frases largas primero

OZ = {1: (6, 5, 6), 2: (6.5, 5.5, 6.5), 3: (7.5, 6, 7.5), 4: (8, 6.5, 8), 5: (8.5, 7, 8.5), 6: (9, 7.5, 9), 7: (9.5, 8, 9.5), 8: (10, 8.5, 10),
      10: (10.5, 9, 10.5), 12: (11.5, 10, 11.5), 14: (12, 10.5, 12), 16: (12.5, 11, 12.5)}

def parse_dims(text):
    """Devuelve (w, h, d) en cm si el texto trae medidas, o None."""
    t = norm(text)
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*(?:x\s*(\d+(?:[.,]\d+)?)\s*)?cm", t)
    if m:
        a, b = float(m.group(1).replace(",", ".")), float(m.group(2).replace(",", "."))
        c = float(m.group(3).replace(",", ".")) if m.group(3) else None
        return ("wxd", a, b, c)
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*cm", t)
    if m:
        return ("diam", float(m.group(1).replace(",", ".")), None, None)
    m = re.search(r"(\d+)\s*oz", t)
    if m:
        return ("oz", int(m.group(1)), None, None)
    m = re.search(r"(\d+)\s*ml", t)
    if m:
        return ("ml", int(m.group(1)), None, None)
    return None

def pieces_from(desc):
    """Lista de piezas mencionadas tras ':' en la descripción de un set."""
    t = norm(desc)
    if ":" not in t:
        return []
    tail = t.split(":", 1)[1]
    parts = re.split(r",|\sy\s|\se\s", tail)
    out = []
    for p in parts:
        p = p.strip(" .")
        if not p:
            continue
        qty = 1
        m = re.match(r"(dos|tres|cuatro|seis|\d+)\s+(.*)", p)
        if m:
            qty = {"dos": 2, "tres": 3, "cuatro": 4, "seis": 6}.get(m.group(1)) or int(m.group(1))
            p = m.group(2)
        found = None
        for k in PIECE_ORDER:
            if k in p:
                found = k
                break
        if not found:
            continue
        # plural simple ("bowls", "tazas") ya matchea por substring
        for _ in range(min(qty, 3)):
            out.append(found)
    return out

def classify(row):
    name, desc = row["name"], row["description"]
    t = norm(name + " " + desc)
    cat = row["cat"]
    if cat == "cubiertos" or "cubiertos" in t or "acero inoxidable" in t:
        m = re.search(r"(\d+)\s*piezas", t)
        n = int(m.group(1)) if m else 5
        return {"shape": "cutlery", "count": min(n, 6)}
    if "palillos" in t:
        return {"shape": "tray", "dims": (2.5, 1, 23)}
    if "apoya-palitos" in t or "apoya palitos" in t:
        m = re.search(r"set de (\d+)", t)
        n = int(m.group(1)) if m else 1
        return {"shape": "group", "piece": "apoya", "count": min(n, 4)}
    if "palitos" in t or "palillos" in t:
        return {"shape": "tray", "dims": (2.5, 1, 23)}
    pcs = pieces_from(desc)
    if (t.startswith("set") or t.startswith("vajilla") or t.startswith("linea") or t.startswith("juego") or t.startswith("coleccion")) and len(pcs) >= 2:
        return {"shape": "set", "pieces": pcs}
    m = re.search(r"set x(\d)", t)
    if m:  # "Gres ... · set x3": plato playo, plato postre y bowl (x4 suma mug, x5 suma plato hondo)
        n = int(m.group(1))
        base_pcs = ["plato playo", "plato postre", "bowl", "mug", "plato hondo"][:n]
        return {"shape": "set", "pieces": base_pcs}
    if (t.startswith("vajilla") or t.startswith("coleccion")) and len(pcs) < 2:
        return {"shape": "set", "pieces": ["plato playo", "plato postre", "bowl", "taza"]}
    if t.startswith("set de") and len(pcs) < 2:
        # set de N piezas iguales (copas, vasos, platos cuadrados)
        m = re.search(r"set de (\d+)\s+([a-z ]+?)(?:\s+en|\s+de|,|$)", t)
        kind = m.group(2).strip() if m else ""
        for k in PIECE_ORDER:
            if k in kind or k in t:
                return {"shape": "group", "piece": k, "count": min(int(m.group(1)) if m else 4, 6)}
    if "cuadrad" in t and ("plato" in t or "platito" in t):
        size = 15 if "platito" in t else 24
        return {"shape": "tray", "dims": (size, 2, size)}
    if "bandeja" in t or "base de madera" in t or "tabla" in t:
        return {"shape": "tray", "dims": (30, 2, 12)}
    for k in PIECE_ORDER:
        if k in t:
            return {"shape": "single", "piece": k}
    return {"shape": "tray", "dims": (20, 3, 20)}

# ------------------------------------------------------------ colores de la foto
def hex_(rgb):
    return "#%02x%02x%02x" % tuple(int(max(0, min(255, c))) for c in rgb)

def photo_colors(sku):
    try:
        im = Image.open(f"{MINIS}/{sku}.jpg").convert("RGB").resize((96, 96))
    except Exception:
        return ("#d9d4cc", "#8a8580")
    px = list(im.getdata())
    def sat(p):
        mx, mn = max(p), min(p)
        return 0 if mx == 0 else (mx - mn) / mx
    # El fondo de las fotos es blanco o gris claro: se descartan los píxeles claros y sin color
    fg = [p for p in px if not (sum(p) / 3 > 205 and sat(p) < 0.15)]
    if len(fg) < len(px) * 0.10:
        # Producto blanco/claro: base clara y acento con lo poco de color o sombra que haya
        acc = (150, 146, 140)
        if fg:
            acc = tuple(sum(c[i] for c in fg) / len(fg) for i in range(3))
        return ("#f1efea", hex_(acc))
    q = Counter((p[0] // 24, p[1] // 24, p[2] // 24) for p in fg)
    top = [c for c, _ in q.most_common(6)]
    def avg(bucket):
        ps = [p for p in fg if (p[0] // 24, p[1] // 24, p[2] // 24) == bucket]
        return tuple(sum(c[i] for c in ps) / len(ps) for i in range(3))
    base = avg(top[0])
    accent = base
    for b in top[1:]:
        a = avg(b)
        if sum(abs(a[i] - base[i]) for i in range(3)) > 70:
            accent = a
            break
    # Las fotos tienen sombra propia: se aclara apenas el color base
    base = tuple(min(255, c * 1.06 + 4) for c in base)
    # Productos claros: la foto los oscurece por la sombra; se acercan al blanco
    if sum(base) / 3 > 170 and sat(base) < 0.12:
        base = tuple(c + (248 - c) * 0.55 for c in base)
    return (hex_(base), hex_(accent))

# ------------------------------------------------------------ armado
def piece_def(kind, dims_hint=None):
    shape, w, h, d = PIECES[kind]
    if dims_hint:
        k, a, b, c = dims_hint
        if k == "diam" and shape in ("plate", "bowl"):
            w = d = a; h = round(a * (0.08 if shape == "plate" else 0.4), 1)
        elif k == "wxd":
            w, d = a, b
            if c: h = c
        elif k == "oz" and shape == "mug":
            dd, hh, _ = OZ.get(min(OZ, key=lambda x: abs(x - a)))
            d = dd; h = hh; w = round(dd * 1.45, 1)
        elif k == "ml":
            if shape == "bowl":
                w = d = round(8 + (a / 1300) * 14, 1); h = round(w * 0.42, 1)
            elif shape == "mug":
                oz = a / 29.57
                dd, hh, _ = OZ.get(min(OZ, key=lambda x: abs(x - oz)))
                d = dd; h = hh; w = round(dd * 1.45, 1)
    return {"shape": shape, "w": w, "h": h, "d": d}

GAP = 2.5
out = []
for r in rows:
    sku = r["sku"]
    base, accent = photo_colors(sku)
    text = r["name"] + " " + r["description"]
    t = norm(text)
    cls = classify(r)
    hint = parse_dims(text)
    glassy = r["cat"] == "cristaleria" or "vidrio" in t or "cristal" in t
    metallic = cls["shape"] == "cutlery"
    source = {"type": "primitive", "color": base, "accent": accent,
              "roughness": 0.08 if glassy else (0.3 if metallic else 0.35),
              "metalness": 0.9 if metallic else 0.0}
    if glassy:
        source["glass"] = True
    note_parts = ["Forma y colores aproximados a partir de la foto del catálogo."]

    if cls["shape"] == "set":
        pcs = [piece_def(k) for k in cls["pieces"]]
        # Ordenar de mayor a menor y disponer en filas de hasta 100 cm (entra en una mesa de 120 × 80)
        pcs.sort(key=lambda p: -p["w"])
        rows_l, cur, cur_w = [], [], 0
        for p in pcs:
            if cur and cur_w + GAP + p["w"] > 100:
                rows_l.append(cur); cur, cur_w = [], 0
            cur.append(p); cur_w += (GAP if cur_w else 0) + p["w"]
        if cur: rows_l.append(cur)
        row_ws = [sum(p["w"] for p in rp) + GAP * (len(rp) - 1) for rp in rows_l]
        row_ds = [max(p["d"] for p in rp) for rp in rows_l]
        total_d = sum(row_ds) + GAP * (len(rows_l) - 1)
        z = -total_d / 2
        for row_pcs, rw, rd in zip(rows_l, row_ws, row_ds):
            x = -rw / 2
            for p in row_pcs:
                p["x"] = round(x + p["w"] / 2, 1); p["z"] = round(z + rd / 2, 1)
                x += p["w"] + GAP
            z += rd + GAP
        total_w = max(row_ws)
        dims = {"w": round(total_w, 1), "h": max(p["h"] for p in pcs), "d": round(total_d, 1)}
        source["shape"] = "set"; source["pieces"] = pcs
        note_parts.append(f"Set de {len(pcs)} piezas dispuestas en fila; medidas típicas de cada pieza (estimadas).")
    elif cls["shape"] == "group":
        p = piece_def(cls["piece"], hint)
        n = cls["count"]
        pcs = []
        cols = 3 if n > 4 else (2 if n >= 4 else n)
        for i in range(n):
            pcs.append({**p, "x": round((i % cols - (cols - 1) / 2) * (p["w"] + GAP), 1), "z": round((i // cols - ((n - 1) // cols) / 2) * (p["d"] + GAP), 1)})
        rows_n = (n - 1) // cols + 1
        dims = {"w": round(cols * p["w"] + (cols - 1) * GAP, 1), "h": p["h"], "d": round(rows_n * p["d"] + (rows_n - 1) * GAP, 1)}
        source["shape"] = "set"; source["pieces"] = pcs
        note_parts.append(f"Se muestran {n} unidades; medidas estimadas.")
    elif cls["shape"] == "cutlery":
        n = cls["count"]
        dims = {"w": round(n * 3.2 + (n - 1) * 1.2, 1), "h": 1.2, "d": 22}
        source["shape"] = "cutlery"; source["count"] = n
        note_parts.append("Juego de cubiertos representado en fila; largo estimado 22 cm.")
    elif cls["shape"] == "tray":
        w, h, d = cls["dims"]
        if hint and hint[0] == "wxd":
            w, d = hint[1], hint[2]
            if hint[3]: h = hint[3]
        dims = {"w": w, "h": h, "d": d}
        source["shape"] = "box"
        note_parts.append("Pieza plana representada como bloque.")
    else:  # single
        p = piece_def(cls["piece"], hint)
        dims = {"w": p["w"], "h": p["h"], "d": p["d"]}
        source["shape"] = p["shape"]
    if hint:
        note_parts.append("Medidas tomadas del catálogo donde figuran.")
    else:
        note_parts.append("Medidas estimadas.")

    out.append({
        "id": sku, "name": r["name"], "category": CAT_NAMES.get(r["cat"], r["cat"]),
        "dimensions": dims, "source": source,
        "thumbnail": f"catalogo/mini/{sku}.jpg",
        "approximate": True, "note": " ".join(note_parts),
    })

json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
print(len(out), "productos")
print(Counter(p["source"]["shape"] for p in out))
