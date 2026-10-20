"""
Analiza la foto de cada producto para los modelos 3D realistas:
- separa el producto del fondo (fotos de estudio sobre fondo claro),
- detecta cada pieza (componentes conexas) con su elipse y proporciones,
- extrae texturas: "top" (la pieza vista desde arriba, desproyectada a un
  círculo) y "side" (franja lateral, espejada para envolver la pieza),
- colores medios, color del borde y cuánto brillo (acabado).

Uso: python3 analizar-fotos.py public/catalogo src/products/catalog.json salida.json carpeta_texturas
"""
import json, sys, os, math
import numpy as np, cv2

FOTOS, CATALOG, OUT, TEXDIR = sys.argv[1:5]
os.makedirs(TEXDIR, exist_ok=True)
catalog = json.load(open(CATALOG))
W = 1024
TOP, SIDE = 512, (768, 256)

def unpad(im):
    """Las fotos del catálogo vienen cuadradas con bandas blancas puras: se quitan."""
    white = (im.min(axis=2) >= 250)
    rows = np.where(white.mean(axis=1) < 0.995)[0]; cols = np.where(white.mean(axis=0) < 0.995)[0]
    if len(rows) < 10 or len(cols) < 10: return im
    return im[rows[0]:rows[-1] + 1, cols[0]:cols[-1] + 1]

def load(sku):
    im = cv2.imread(f"{FOTOS}/{sku}.jpg")
    if im is None: return None
    im = unpad(im)
    h, w = im.shape[:2]
    k = W / max(h, w)
    return cv2.resize(im, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA)

def background(im):
    """Colores de fondo (agrupando los píxeles del borde, por si hay pared + mesa) y si es un fondo claro liso."""
    h, w = im.shape[:2]; m = int(min(h, w) * 0.05)
    ring = np.concatenate([im[:m].reshape(-1, 3), im[-m:].reshape(-1, 3), im[:, :m].reshape(-1, 3), im[:, -m:].reshape(-1, 3)]).astype(np.float32)
    K = 4
    _, labels, centers = cv2.kmeans(ring, K, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0), 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.ravel(), minlength=K)
    centers = centers[counts > len(ring) * 0.04]  # solo los grupos con peso real
    bg = centers[np.argmax(counts[counts > len(ring) * 0.04])]
    studio = bg.mean() > 150
    return bg, bool(studio), centers

def mask_of(im, centers):
    imf = im.astype(np.float32)
    d = np.min([np.abs(imf - c).sum(axis=2) for c in centers], axis=0)
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    sat = hsv[..., 1].astype(int)
    m = ((d > 60) | ((sat > 70) & (d > 28))).astype(np.uint8)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k, iterations=2)
    ff = m.copy(); hh, ww = m.shape
    cv2.floodFill(ff, np.zeros((hh + 2, ww + 2), np.uint8), (0, 0), 1)
    m = m | (1 - ff)
    return m

def components(m):
    n, lab, st, cen = cv2.connectedComponentsWithStats(m, 8)
    area = m.shape[0] * m.shape[1]
    out = []
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < area * 0.006 or w < 40 or h < 40: continue
        out.append({"i": i, "x": int(x), "y": int(y), "w": int(w), "h": int(h), "area": int(a)})
    out.sort(key=lambda c: -c["area"])
    return lab, out

def ellipse(lab, c):
    sub = (lab[c["y"]:c["y"] + c["h"], c["x"]:c["x"] + c["w"]] == c["i"]).astype(np.uint8)
    cnts, _ = cv2.findContours(sub, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnt = max(cnts, key=cv2.contourArea)
    if len(cnt) < 5:
        return (c["x"] + c["w"] / 2, c["y"] + c["h"] / 2), (c["w"], c["h"]), 0.0
    (cx, cy), (a, b), ang = cv2.fitEllipse(cnt)
    return (cx + c["x"], cy + c["y"]), (a, b), ang

def gain_for(px):
    """Las fotos tienen sombra propia: se aclara apenas sin quemar."""
    v = px.max(axis=1)
    p97 = np.percentile(v, 97)
    return float(min(1.22, max(1.0, 236 / max(p97, 1))))

def apply_gain(img, g):
    return np.clip(img.astype(float) * g, 0, 255).astype(np.uint8)

def bgr2rgb(c): return [int(c[2]), int(c[1]), int(c[0])]

def swatch_of(im, lab, c, prefer="min"):
    """Muestra de superficie (unos pocos cm reales) tomada del interior de la pieza, sin el sombreado grande:
    conserva el moteado, el veteado o el dibujo y deja fuera la iluminación de la foto. Se repite espejada.
    Entre varias zonas candidatas se elige la más uniforme (evita bordes entre piezas apiladas)."""
    mk = (lab == c["i"]).astype(np.uint8)
    dist = cv2.distanceTransform(mk, cv2.DIST_L2, 5)
    dmax = dist.max()
    if dmax < 12: return None, 0
    ys, xs = np.where(dist >= dmax * 0.6)
    idx = np.random.RandomState(0).choice(len(ys), size=min(12, len(ys)), replace=False)
    best = None; cands = []
    for j in idx:
        y, x = int(ys[j]), int(xs[j])
        r = int(min(dist[y, x] * 0.85, 44)); r = min(r, x, y, im.shape[1] - x - 1, im.shape[0] - y - 1)
        if r < 10: continue
        patch = cv2.resize(im[y - r:y + r, x - r:x + r].astype(np.float32), (128, 128), interpolation=cv2.INTER_AREA)
        low = cv2.GaussianBlur(patch, (0, 0), 30)
        detail = patch / (low + 1.0)
        sd = float(detail.std())
        cands.append((sd, detail, r))
        if best is None or sd < best[0]: best = (sd, detail, r)
    if best is None: return None, 0
    if prefer == "median" and cands:
        cands.sort(key=lambda t: t[0]); best = cands[len(cands) // 2]
    sd, detail, r = best
    if sd > 0.09: detail = 1 + (detail - 1) * (0.09 / sd)
    detail = np.clip(detail, 0.78, 1.25)
    row = np.hstack([detail, detail[:, ::-1]]); blk = np.vstack([row, row[::-1]])
    return np.tile(blk, (2, 2, 1)), r

def band_colors(im, lab, c):
    mk = (lab == c["i"]).astype(np.uint8)
    k = max(3, int(min(c["w"], c["h"]) * 0.035))
    er = cv2.erode(mk, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    band = (mk > 0) & (er == 0)
    core = cv2.erode(mk, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k * 3, k * 3))) > 0
    edge = np.median(im[band], axis=0) if band.sum() > 30 else np.median(im[mk > 0], axis=0)
    inner = np.median(im[core], axis=0) if core.sum() > 30 else edge
    # un borde más oscuro suele ser la sombra del contorno, no un filete: se descarta
    if edge.mean() < inner.mean() * 0.8: edge = inner * 0.93
    return edge, inner

def disc_texture(im, lab, c, ell, path):
    """Desproyecta la elipse de la pieza a un círculo (vista cenital). Solo sirve si la pieza es una elipse limpia."""
    (cx, cy), (a, b), ang = ell
    if a < b: a, b, ang = b, a, ang + 90
    fill = c["area"] / max(1.0, math.pi * a * b / 4)
    if fill < 0.8 or fill > 1.15 or b / a < 0.3: return None, float(b / a)
    t = math.radians(ang)
    M = np.array([[math.cos(t) * a / 2, -math.sin(t) * b / 2, cx], [math.sin(t) * a / 2, math.cos(t) * b / 2, cy]])
    S = np.array([[2 / TOP, 0, -1], [0, 2 / TOP, -1], [0, 0, 1]])
    A = M @ S
    img = cv2.warpAffine(im, A, (TOP, TOP), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    mk = cv2.warpAffine((lab == c["i"]).astype(np.uint8) * 255, A, (TOP, TOP), flags=cv2.INTER_NEAREST | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    yy, xx = np.mgrid[0:TOP, 0:TOP]
    rr = np.hypot(xx - TOP / 2 + .5, yy - TOP / 2 + .5) / (TOP / 2)
    ring = (rr > 0.9) & (rr < 0.985) & (mk > 0)
    pool = img[ring] if ring.sum() > 50 else img[mk > 0]
    edge = np.median(pool, axis=0) if len(pool) else np.array([200.0, 200.0, 200.0])
    img = img.copy(); img[(mk == 0) | (rr > 1.0)] = edge
    img = apply_gain(img, gain_for(img[rr < 0.98].reshape(-1, 3)))
    cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 82])
    return path, float(b / a)

def radial_texture(swatch, inner, edge, path, rim=0.04):
    """Textura cenital sintética: color interior → color del borde, con el detalle del parche real."""
    yy, xx = np.mgrid[0:TOP, 0:TOP]
    rr = np.clip(np.hypot(xx - TOP / 2 + .5, yy - TOP / 2 + .5) / (TOP / 2), 0, 1)
    w = np.clip((rr - (1 - rim)) / rim, 0, 1)[..., None]
    base = inner[None, None, :] * (1 - w) + edge[None, None, :] * w
    if swatch is not None:
        sw = cv2.resize(swatch, (TOP, TOP), interpolation=cv2.INTER_LINEAR)
        img = np.clip(base * sw, 0, 255)
    else:
        img = base
    cv2.imwrite(path, img.astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 82])

def side_synth(swatch, mean, edge, path):
    """Textura lateral sintética (base un poco más oscura, borde superior con el color del borde)."""
    H, Wd = SIDE[1], SIDE[0]
    v = np.linspace(0, 1, H)[:, None, None]
    base = mean[None, None, :] * (0.88 + 0.12 * v)
    top = np.clip((v - 0.965) / 0.035, 0, 1)
    base = base * (1 - top) + edge[None, None, :] * top
    if swatch is not None:
        sw = cv2.resize(swatch, (Wd, H), interpolation=cv2.INTER_LINEAR)
        img = np.clip(base * sw, 0, 255)
    else:
        img = base
    cv2.imwrite(path, img[::-1].astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 82])

def side_texture(im, lab, c, path, body_frac=0.6):
    """Franja lateral real (columnas centrales, de la base al borde), espejada. Solo para piezas sueltas."""
    x0 = int(c["x"] + c["w"] * (1 - body_frac) / 2); x1 = int(c["x"] + c["w"] * (1 + body_frac) / 2)
    y0 = int(c["y"] + c["h"] * 0.08)
    sub = im[y0:c["y"] + c["h"], x0:x1]
    mk = (lab[y0:c["y"] + c["h"], x0:x1] == c["i"])
    if mk.mean() < 0.85: return None
    sub = sub.copy(); med = np.median(sub[mk], axis=0); sub[~mk] = med
    strip = cv2.resize(sub, (SIDE[0] // 2, SIDE[1]), interpolation=cv2.INTER_AREA)
    strip = cv2.GaussianBlur(strip, (0, 0), 1.0)
    full = np.concatenate([strip, strip[:, ::-1]], axis=1)
    full = apply_gain(full, gain_for(full.reshape(-1, 3)))[::-1]
    cv2.imwrite(path, full, [cv2.IMWRITE_JPEG_QUALITY, 82])
    return path

def taper_of(lab, c):
    """Ancho de la base respecto al ancho superior (mitad izquierda, para no contar el asa)."""
    sub = (lab[c["y"]:c["y"] + c["h"], c["x"]:c["x"] + c["w"]] == c["i"])
    h = sub.shape[0]
    cx = int(np.round(np.where(sub.any(axis=0))[0].mean())) if sub.any() else sub.shape[1] // 2
    def width(y0, y1):
        ws = []
        for y in range(int(h * y0), max(int(h * y0) + 1, int(h * y1))):
            xs = np.where(sub[y, :cx])[0]
            if len(xs): ws.append(cx - xs[0])
        return float(np.median(ws)) if ws else 0.0
    top = width(0.12, 0.3); bot = width(0.78, 0.93)
    return round(bot / top, 3) if top > 0 else 1.0

def finish_of(im, lab, c):
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    mk = lab == c["i"]
    v = hsv[..., 2][mk].astype(int); s = hsv[..., 1][mk].astype(int)
    mean_v = v.mean()
    spec = ((v > max(235, mean_v + 55)) & (s < 60)).mean()
    tex = float(np.std(cv2.Laplacian(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), cv2.CV_32F)[mk])) if mk.sum() > 100 else 0.0
    return float(spec), float(mean_v), tex

results = {}
for p in catalog:
    sku = p["id"]
    im = load(sku)
    if im is None: continue
    bg, studio, centers = background(im)
    r = {"studio": studio, "bg": [int(bg[2]), int(bg[1]), int(bg[0])], "pieces": []}
    if True:
        m = mask_of(im, centers)
        lab, comps = components(m)
        for k, c in enumerate(comps[:8]):
            ell = ellipse(lab, c)
            # set fotografiado junto (menos siluetas que piezas): se prefiere una muestra con el dibujo típico, no la más lisa
            npieces = len(p["source"].get("pieces") or [1])
            sw, swr = swatch_of(im, lab, c, "median" if len(comps) < npieces else "min")
            edge, inner = band_colors(im, lab, c)
            g = gain_for(im[lab == c["i"]].reshape(-1, 3))
            edge_g, inner_g = np.clip(edge * g, 0, 255), np.clip(inner * g, 0, 255)
            sw_g = sw
            disc, tilt = disc_texture(im, lab, c, ell, f"{TEXDIR}/{sku}-{k}-disc.jpg")
            radial_texture(sw_g, inner_g, edge_g, f"{TEXDIR}/{sku}-{k}-top.jpg")
            side_synth(sw_g, inner_g, edge_g, f"{TEXDIR}/{sku}-{k}-side.jpg")
            strip = side_texture(im, lab, c, f"{TEXDIR}/{sku}-{k}-strip.jpg") if len(comps) == 1 or c["area"] > 0.6 * comps[0]["area"] else None
            spec, mv, tex = finish_of(im, lab, c)
            r["pieces"].append({"bbox": [c["x"], c["y"], c["w"], c["h"]], "area": c["area"], "aspect": round(c["h"] / c["w"], 3), "taper": taper_of(lab, c),
                                "tilt": round(tilt, 3), "edge": bgr2rgb(edge_g), "inner": bgr2rgb(inner_g), "spec": round(spec, 4), "value": round(mv, 1), "detail": round(tex, 2),
                                "swatch": int(swr), "disc": bool(disc), "strip": bool(strip), "top": f"{sku}-{k}-top.jpg", "side": f"{sku}-{k}-side.jpg"})
    results[sku] = r

json.dump(results, open(OUT, "w"), default=lambda o: int(o) if isinstance(o, (np.integer,)) else float(o))
n = sum(1 for r in results.values() if r["studio"])
print(len(results), "fotos;", n, "de estudio;", sum(len(r["pieces"]) for r in results.values()), "piezas detectadas")
