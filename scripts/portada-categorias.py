"""
Genera las fotos de "Explorá por categoría" (public/categorias/<slug>.jpg, 600×600):
recorta el producto, lo centra con margen parejo sobre blanco y, si la foto tiene
fondo propio (ambientada), la recorta a cuadrado para que llene la tarjeta.
Uso: python3 scripts/portada-categorias.py
"""
import numpy as np
from PIL import Image

PICKS = {
    "platos-y-bowls": "EST-05", "gres": "GR4-19", "vajilla-blanca": "BLC-06", "vajilla-decorada": "HOJ-01",
    "vajilla-marmolada": "MAR-19", "cubiertos": "CUB-30", "cristaleria": "CRI-17", "cafe": "CER-07",
    "vajilla-oriental": "ORI-40", "sillas": "SIL-028", "mesas": "MES-013", "banquetas": "BAN-016",
    "boxes-y-bancos": "BOX-006", "sofas-y-sillones": "SOF-006", "mesas-auxiliares": "AUX-010", "exterior": "EXT-008",
    "asado-y-parrilla": "CUB-31", "exterior-lounge": "EXT-051",
}
S, MARGIN = 600, 0.09

def cover(sku):
    im = Image.open(f"public/catalogo/{sku}.jpg").convert("RGB")
    a = np.asarray(im, dtype=int)
    nonwhite = (a.min(axis=2) < 238) | ((a.max(axis=2) - a.min(axis=2)) > 18)
    rows, cols = np.where(nonwhite.any(axis=1))[0], np.where(nonwhite.any(axis=0))[0]
    box = (cols.min(), rows.min(), cols.max() + 1, rows.max() + 1)
    crop = im.crop(box)
    c = np.asarray(crop, dtype=int)
    edge = np.concatenate([c[0], c[-1], c[:, 0], c[:, -1]])
    white_edge = ((edge.min(axis=1) > 245) & ((edge.max(axis=1) - edge.min(axis=1)) < 12)).mean()
    w, h = crop.size
    if white_edge < 0.6:  # foto con fondo propio (estudio gris o ambientada)
        if max(w, h) / min(w, h) < 1.3:  # casi cuadrada: recortar al centro
            s = min(w, h)
            crop = crop.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
            return crop.resize((S, S), Image.LANCZOS)
        # apaisada o vertical: completar el cuadrado con el tono de fondo de la propia foto,
        # fundido suavemente en los bordes para que no se note el empalme
        from PIL import ImageFilter
        s = max(w, h)
        py, px = (s - h) // 2, (s - w) // 2
        side = c[-1] if w > h else c[:, -1]
        side2 = c[0] if w > h else c[:, 0]
        bg = tuple(int(v) for v in np.median(np.concatenate([side, side2]), axis=0))
        sq = Image.new("RGB", (s, s), bg)
        sq.paste(crop, (px, py))
        mask = Image.new("L", (s, s), 0)
        f = max(2, s // 40)
        mask.paste(255, (px + f, py + f, px + w - f, py + h - f))
        mask = mask.filter(ImageFilter.GaussianBlur(f))
        sq = Image.composite(sq, Image.new("RGB", (s, s), bg), mask)
        return sq.resize((S, S), Image.LANCZOS)
    inner = int(S * (1 - 2 * MARGIN))
    k = inner / max(w, h)
    r = crop.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    out = Image.new("RGB", (S, S), (255, 255, 255))
    out.paste(r, ((S - r.width) // 2, (S - r.height) // 2))
    return out

for slug, sku in PICKS.items():
    cover(sku).save(f"public/categorias/{slug}.jpg", quality=86, optimize=True, progressive=True)
    print(slug, sku)
