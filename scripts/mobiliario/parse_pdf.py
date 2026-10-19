"""
Extrae los productos del PDF "Catálogo Mobiliario 2026": nombre, descripción,
sección y foto (asignada por posición en la grilla de 3 × 4 por página).

Uso: pdfimages -all -p catalogo.pdf raw/i && python3 parse_pdf.py catalogo.pdf carpeta_salida raw
Genera carpeta_salida/productos.json y carpeta_salida/img/<SKU>.jpg
"""
import json, os, re, sys, unicodedata
import pdfplumber
from pypdf import PdfReader
from PIL import Image
import io

PDF, OUT = sys.argv[1], sys.argv[2]
RAW = sys.argv[3] if len(sys.argv) > 3 else "raw"
os.makedirs(f"{OUT}/img", exist_ok=True)

SECTIONS = {
    "SILLAS": ("sillas", "Sillas", "SIL"),
    "MESAS": ("mesas", "Mesas", "MES"),
    "BANQUETAS": ("banquetas", "Banquetas", "BAN"),
    "BOXES Y BANCOS": ("boxes-y-bancos", "Boxes y bancos", "BOX"),
    "SOFÁS Y SILLONES": ("sofas-y-sillones", "Sofás y sillones", "SOF"),
    "MESAS AUXILIARES": ("mesas-auxiliares", "Mesas auxiliares", "AUX"),
    "EXTERIOR": ("exterior", "Mobiliario exterior", "EXT"),
}

def slugify(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def col_of(x):
    return 0 if x < 200 else 1 if x < 380 else 2

reader = PdfReader(PDF)
products, counters = [], {}
with pdfplumber.open(PDF) as pdf:
    for pno, page in enumerate(pdf.pages):
        words = page.extract_words(extra_attrs=["fontname", "size"])
        # Encabezado de sección: Poppins Medium tamaño 8 arriba de la página
        head = " ".join(w["text"] for w in words if w["top"] < 60 and "Med" in w["fontname"] and abs(w["size"] - 8) < 0.3)
        if head not in SECTIONS:
            continue
        slug, cat_name, prefix = SECTIONS[head]
        # Nombres (Poppins Medium 9.5) y descripciones (Poppins Light 7.5), agrupados por fila (top) y columna
        rows = {}
        for w in words:
            if "Med" in w["fontname"] and abs(w["size"] - 9.5) < 0.3:
                rows.setdefault(("n", round(w["top"])), []).append(w)
            elif "Lig" in w["fontname"] and abs(w["size"] - 7.5) < 0.3 and w["top"] > 60 and w["top"] < 800:
                rows.setdefault(("d", round(w["top"])), []).append(w)
        name_tops = sorted(t for (k, t) in rows if k == "n")
        # Fotos de la página con su posición. Las imágenes físicas se extrajeron antes con
        # `pdfimages -all -p` (raw/i-<página>-<n>.jpg) en el mismo orden del contenido de la página.
        page_imgs = []
        for idx, im in enumerate(page.images):
            page_imgs.append({"x": (im["x0"] + im["x1"]) / 2, "bottom": im["bottom"], "top": im["top"], "idx": idx})
        raw_files = sorted(f for f in os.listdir(RAW) if re.match(rf"i-{pno + 1:03d}-\d+\.", f))

        for nt in name_tops:
            names = rows[("n", nt)]
            # descripción: la fila Light más cercana por debajo (hasta 20 pt)
            dkeys = [t for (k, t) in rows if k == "d" and nt < t < nt + 20]
            descs = rows[("d", dkeys[0])] if dkeys else []
            for col in range(3):
                nw = sorted([w for w in names if col_of(w["x0"]) == col], key=lambda w: w["x0"])
                if not nw:
                    continue
                name = " ".join(w["text"] for w in nw)
                dw = sorted([w for w in descs if col_of(w["x0"]) == col], key=lambda w: w["x0"])
                desc = " ".join(w["text"] for w in dw)
                # foto: en la misma columna, cuyo borde inferior está justo arriba del nombre
                cand = [i for i in page_imgs if col_of(i["x"]) == col and 0 < nt - i["bottom"] < 40]
                counters[prefix] = counters.get(prefix, 0) + 1
                sku = f"{prefix}-{counters[prefix]:03d}"
                img_file = None
                if cand:
                    idx = cand[0]["idx"]
                    try:
                        pil = Image.open(f"{RAW}/{raw_files[idx]}").convert("RGB")
                        img_file = f"{sku}.jpg"
                        pil.save(f"{OUT}/img/{img_file}", quality=92)
                    except Exception as e:  # noqa
                        print("sin imagen", sku, name, e, file=sys.stderr)
                products.append({"sku": sku, "name": name, "description": desc.replace("…", "").strip(), "truncated": "…" in desc,
                                 "category": slug, "category_name": cat_name, "page": pno + 1, "image": img_file})

json.dump(products, open(f"{OUT}/productos.json", "w"), ensure_ascii=False, indent=1)
from collections import Counter
print(len(products), Counter(p["category"] for p in products), "sin foto:", sum(1 for p in products if not p["image"]))
