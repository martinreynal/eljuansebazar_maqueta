"""
Puntaje de definición (1 a 10) de cada foto de public/catalogo, para el panel
"Imágenes". Mide el tamaño real del producto dentro de la foto y cuánto detalle
fino conserva (una foto agrandada pierde poco al reducirla a la mitad).
Mismo cálculo que src/lib/image-score.ts para las fotos subidas desde el panel.
Uso: python3 scripts/puntaje-imagenes.py  →  src/lib/image-scores.json
"""
import json, os
import numpy as np
from PIL import Image

def score(path):
    im = Image.open(path).convert("RGB")
    W, H = im.size
    a = np.asarray(im, dtype=float)
    fg = (a.min(axis=2) < 235) | ((a.max(axis=2) - a.min(axis=2)) > 25)
    ys, xs = np.where(fg)
    if len(xs) < 100:
        return W, H, 1
    x0, x1, y0, y1 = (int(np.percentile(xs, 1)), int(np.percentile(xs, 99)), int(np.percentile(ys, 1)), int(np.percentile(ys, 99)))
    g = im.convert("L").crop((x0, y0, x1 + 1, y1 + 1))
    w, h = g.size
    half = g.resize((max(1, w // 2), max(1, h // 2)), Image.BILINEAR).resize((w, h), Image.BILINEAR)
    det = float(np.mean(np.abs(np.asarray(g, dtype=float) - np.asarray(half, dtype=float))))
    eff = max(w, h) * max(0.45, min(1.0, det / 2.5))
    return W, H, int(min(10, max(1, round(1 + 9 * (eff - 150) / 1050))))

out = {}
for f in sorted(os.listdir("public/catalogo")):
    if f.endswith(".jpg"):
        W, H, s = score(f"public/catalogo/{f}")
        out[f"/catalogo/{f}"] = [W, H, s]
json.dump(out, open("src/lib/image-scores.json", "w"), separators=(",", ":"))
from collections import Counter
print(len(out), sorted(Counter(v[2] for v in out.values()).items()))
