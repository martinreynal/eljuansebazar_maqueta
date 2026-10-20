/**
 * Genera los modelos GLB de los productos que no son piezas torneadas simples:
 * cubiertos y utensilios, cuchillos y trinches de asado, pinzas, palitos,
 * apoya-palitos, cucharas de cerámica, bandejas, platos cuadrados,
 * semicuadrados y triangulares, bases de madera con patas, teteras, sartén,
 * tablas y cubiletes de madera, y los sets que combinan estas piezas.
 *
 * Geometría real en centímetros reales (la escena se exporta en metros).
 * Forma, piezas y medidas salen de la descripción del catálogo; los colores,
 * de la foto (catalogo-modelos.json). Todo es una reconstrucción aproximada.
 *
 * Uso: node scripts/modelos/resto.mjs rows.json catalogo-modelos.json madera.png fotos.json carpeta_texturas carpeta_salida SKU...
 *      (sin SKUs: genera todos los productos que este script sabe modelar)
 * Materiales PBR (esmalte con clearcoat, acero metálico, vidrio translúcido) y, en platos y
 * bandejas de cerámica, la superficie extraída de la foto (fotos.json / texturas).
 */
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { NodeIO } from "@gltf-transform/core";
import { KHRMaterialsClearcoat } from "@gltf-transform/extensions";
import { existsSync } from "node:fs";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); this.onload?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = `data:${blob.type};base64,${Buffer.from(b).toString("base64")}`; this.onloadend?.(); this.onload?.(); }); }
};

const [rowsPath, catalogPath, woodPath, fotosPath, texDir, outDir, ...only] = process.argv.slice(2);
const rows = JSON.parse(readFileSync(rowsPath, "utf8")).rows;
const catalog = new Map(JSON.parse(readFileSync(catalogPath, "utf8")).map((p) => [p.id, p]));
const woodPng = readFileSync(woodPath);
const fotos = JSON.parse(readFileSync(fotosPath, "utf8"));
let CUR = null; // SKU en construcción (para buscar su textura de foto)
mkdirSync(outDir, { recursive: true });

const CM = 0.01;
const SEG = 40;
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* ------------------------------------------------------------ materiales */
const M = {
  steel: () => new THREE.MeshStandardMaterial({ name: "acero", color: 0xcfd2d6, metalness: 0.9, roughness: 0.3 }),
  satin: () => new THREE.MeshStandardMaterial({ name: "acero-satinado", color: 0xc9ccd0, metalness: 0.85, roughness: 0.45 }),
  black: () => new THREE.MeshStandardMaterial({ name: "negro-mate", color: 0x2b2b2d, metalness: 0.55, roughness: 0.55 }),
  gold: () => new THREE.MeshStandardMaterial({ name: "dorado", color: 0xc8a25a, metalness: 0.9, roughness: 0.38 }),
  iron: () => new THREE.MeshStandardMaterial({ name: "hierro", color: 0x222224, metalness: 0.4, roughness: 0.8 }),
  ceramic: (c, rough = 0.35) => new THREE.MeshStandardMaterial({ name: "ceramica", color: c, roughness: rough, metalness: 0, side: THREE.DoubleSide }),
  glass: (c = 0xeaf2f4) => new THREE.MeshPhysicalMaterial({ name: "vidrio", color: c, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.38, side: THREE.DoubleSide }),
  // La textura de madera se incrusta al final; acá solo el tinte (en el nombre)
  wood: (tint = "#d6b38a") => new THREE.MeshStandardMaterial({ name: `madera:${tint}`, color: 0xffffff, roughness: 0.6, metalness: 0 }),
};
const WOOD = { natural: "#d9b88c", olivo: "#c9a77a", oscura: "#7a5236", nogal: "#8f6544", teca: "#9a6a43", bambu: "#e2c99a", hueso: "#efe6d4" };

/* ------------------------------------------------------------ utilidades */
const lathe = (pts, seg = SEG) => {
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  g.computeVertexNormals();
  return g;
};
const mesh = (g, m) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; };

/** Deforma en planta una geometría de revolución de radio 1: cuadrada, rectangular, ovalada o triangular. */
function warp(g, { sx, sz, form = "square", n = 5 }) {
  const p = g.attributes.position;
  const sup = (t) => Math.pow(Math.pow(Math.abs(Math.cos(t)), n) + Math.pow(Math.abs(Math.sin(t)), n), -1 / n);
  // Triángulo de vértices redondeados (radio normalizado para que el ancho total sea w)
  const tri = (t) => (1 + 0.22 * Math.cos(3 * (t - Math.PI / 2))) / 1.22;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-9) continue;
    const t = Math.atan2(z, x);
    const k = form === "tri" ? tri(t) : form === "oval" ? 1 : sup(t) / Math.SQRT2 * Math.SQRT2;
    p.setXYZ(i, Math.cos(t) * r * k * sx, p.getY(i), Math.sin(t) * r * k * sz);
  }
  g.computeVertexNormals();
  return g;
}
// Perfiles de revolución de radio 1 (el alto se pasa en metros)
const PROFILE = {
  plate: (H) => [[0, 0], [0.55, 0], [0.62, 0.12 * H], [0.9, 0.82 * H], [1, H], [0.97, 0.98 * H], [0.88, 0.7 * H], [0.6, 0.16 * H], [0, 0.16 * H]],
  tray: (H) => [[0, 0], [0.86, 0], [0.9, 0.15 * H], [0.97, 0.85 * H], [1, H], [0.96, H], [0.9, 0.35 * H], [0, 0.32 * H]],
  bowl: (H) => [[0, 0], [0.45, 0], [0.5, 0.04 * H], [0.78, 0.45 * H], [0.97, 0.9 * H], [1, H], [0.93, H], [0.72, 0.42 * H], [0.42, 0.14 * H], [0, 0.12 * H]],
};
/** Plato/bandeja/bowl con planta cuadrada, rectangular, ovalada o triangular (medidas en cm). */
function shaped(kind, w, h, d, mat, form = "square", n = 5) {
  const g = lathe(PROFILE[kind](h * CM), 48);
  warp(g, { sx: (w * CM) / 2, sz: (d * CM) / 2, form, n });
  // cerámica: superficie de la foto proyectada desde arriba (si la hay)
  const ph = fotos[CUR]?.pieces?.[0];
  if (mat.name === "ceramica" && ph && existsSync(join(texDir, ph.top))) {
    const p = g.attributes.position, uv = g.attributes.uv, W = w * CM, D = d * CM;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / W + 0.5, 0.5 - p.getZ(i) / D);
    const c = mat.color;
    mat = mat.clone(); mat.name = `tex|${ph.top}|${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}|${mat.roughness > 0.6 ? "matte" : "gloss"}`;
    mat.color.set(0xffffff);
  }
  return mesh(g, mat);
}
const roundedRect = (w, d, r) => {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
};
/** Bloque de esquinas redondeadas apoyado en y=0 (medidas en cm). */
function block(w, h, d, mat, r = 0.6) {
  const bev = Math.min(h * 0.3, 0.3) * CM;
  const g = new THREE.ExtrudeGeometry(roundedRect(w * CM, d * CM, Math.min(r, w / 2.2, d / 2.2) * CM), { depth: Math.max(1e-4, h * CM - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 10 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bev, 0);
  return mesh(g, mat);
}
const flatUV = (g, W, D) => {
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / W + 0.5; uv[i * 2 + 1] = p.getZ(i) / D + 0.5; }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
};

/* ------------------------------------------------------------ cubiertos */
// Contorno simétrico a partir de una lista [y, medio-ancho] en cm (y = a lo largo de la pieza)
function profileShape(list) {
  const s = new THREE.Shape();
  s.moveTo(-list[0][1] * CM, list[0][0] * CM);
  for (const [y, hw] of list) s.lineTo(-hw * CM, y * CM);
  for (const [y, hw] of [...list].reverse()) s.lineTo(hw * CM, y * CM);
  s.closePath();
  return s;
}
/** Extruye un contorno plano y lo acuesta: el largo queda en -Z, el espesor en +Y. */
function flat(shape, thick, mat, lift = 0) {
  const bev = Math.min(thick * 0.35, 0.1) * CM;
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(1e-4, thick * CM - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.9, bevelSegments: 2, curveSegments: 10 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bev + lift * CM, 0);
  return mesh(g, mat);
}

/**
 * Pieza de cubiertería acostada, con el largo L (cm) sobre el eje Z (centrada).
 * kind: tenedor | cuchillo | cuchara | cucharita | trinche | cuchillo-asado | chef
 */
function utensil(kind, L, { metal = M.steel(), handle = null, handleLen = null, ratio = 1 } = {}) {
  const g = new THREE.Group();
  const hl = handleLen ?? L * (kind === "cuchara" || kind === "cucharita" ? 0.58 : kind === "trinche" ? 0.42 : kind === "cuchillo-asado" || kind === "chef" ? 0.42 : 0.55);
  const w = ratio;
  // Mango: metálico fino o de madera más grueso
  if (handle) {
    g.add(flat(profileShape([[0, 0.7 * w], [0.4, 0.95 * w], [hl * 0.5, 1.0 * w], [hl - 0.4, 0.85 * w], [hl, 0.75 * w]]), 1.6, handle));
    // remaches
    for (const y of [hl * 0.35, hl * 0.7]) {
      const r = mesh(new THREE.CylinderGeometry(0.22 * CM, 0.22 * CM, 1.7 * CM, 16), M.steel());
      r.position.set(0, 0.85 * CM, -y * CM);
      g.add(r);
    }
  } else {
    const hw = kind === "cucharita" ? 0.42 : 0.55;
    g.add(flat(profileShape([[0, hw * 0.75 * w], [0.6, hw * w], [hl * 0.55, hw * 0.85 * w], [hl, hw * 0.45 * w]]), 0.3, metal));
  }
  const y0 = hl, rest = L - hl;
  const lift = handle ? 0.6 : 0;
  switch (kind) {
    case "tenedor": case "trinche": {
      const tines = kind === "trinche" ? 2 : 4;
      const headW = kind === "trinche" ? 1.4 : L < 19 ? 1.0 : 1.15;
      const neck = rest * (kind === "trinche" ? 0.45 : 0.35);
      g.add(flat(profileShape([[y0 - 0.2, 0.35], [y0 + neck, 0.3], [y0 + neck + rest * 0.12, headW], [y0 + rest * 0.6, headW]]), 0.3, metal, lift));
      const tl = rest * 0.4, tw = (headW * 2) / (tines * 2 - 1);
      for (let i = 0; i < tines; i++) {
        const x = -headW + tw / 2 + i * tw * 2;
        const s = new THREE.Shape();
        s.moveTo((x - tw / 2) * CM, (y0 + rest * 0.6 - 0.1) * CM);
        s.lineTo((x + tw / 2) * CM, (y0 + rest * 0.6 - 0.1) * CM);
        s.lineTo((x + tw * 0.3) * CM, (L - 0.15) * CM);
        s.quadraticCurveTo(x * CM, (L + 0.1) * CM, (x - tw * 0.3) * CM, (L - 0.15) * CM);
        s.closePath();
        g.add(flat(s, 0.3, metal, lift));
      }
      break;
    }
    case "cuchillo": case "cuchillo-asado": case "chef": {
      const bw = kind === "chef" ? 4.2 : kind === "cuchillo-asado" ? 2.4 : 1.15;
      const s = new THREE.Shape();
      s.moveTo(-0.45 * CM, (y0 - 0.3) * CM);
      s.lineTo(0.45 * CM, (y0 - 0.3) * CM);
      s.lineTo(0.5 * CM, (y0 + 0.4) * CM);
      // lomo recto, filo curvo hacia la punta
      s.lineTo((bw * 0.45) * CM, (y0 + 0.9) * CM);
      s.lineTo((bw * 0.45) * CM, (y0 + rest * 0.55) * CM);
      s.quadraticCurveTo((bw * 0.45) * CM, (L - rest * 0.08) * CM, (bw * 0.1) * CM, L * CM);
      s.quadraticCurveTo((-bw * 0.55) * CM, (L - rest * 0.3) * CM, (-bw * 0.55) * CM, (y0 + rest * 0.25) * CM);
      s.lineTo((-bw * 0.55) * CM, (y0 + 0.9) * CM);
      s.lineTo(-0.5 * CM, (y0 + 0.4) * CM);
      s.closePath();
      g.add(flat(s, kind === "cuchillo" ? 0.25 : 0.3, metal, lift));
      break;
    }
    case "cuchara": case "cucharita": {
      const bw = kind === "cucharita" ? 1.35 : 2.1, bl = rest * 0.72;
      g.add(flat(profileShape([[y0 - 0.2, 0.42], [y0 + rest * 0.25, 0.3]]), 0.3, metal, lift));
      const bowl = new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      bowl.scale((bw / 2) * CM, 0.55 * CM, (bl / 2) * CM);
      bowl.translate(0, 0.6 * CM, -(L - bl / 2) * CM);
      const m = mesh(bowl, metal.clone()); m.material.side = THREE.DoubleSide;
      g.add(m);
      break;
    }
  }
  // centrar a lo largo
  g.children.forEach((c) => (c.position.z += (L / 2) * CM));
  return g;
}

/** Fila de piezas acostadas, una al lado de la otra (gap en cm). */
function row(items, gap = 1.6) {
  const g = new THREE.Group();
  const boxes = items.map((it) => new THREE.Box3().setFromObject(it));
  const total = boxes.reduce((a, b) => a + (b.max.x - b.min.x), 0) + gap * CM * (items.length - 1);
  let x = -total / 2;
  items.forEach((it, i) => {
    const b = boxes[i], w = b.max.x - b.min.x;
    it.position.x += x - b.min.x;
    x += w + gap * CM;
    g.add(it);
  });
  return g;
}
/** Grilla de piezas (cols columnas). */
function grid(items, cols, gap = 2) {
  const g = new THREE.Group();
  const rowsArr = [];
  for (let i = 0; i < items.length; i += cols) rowsArr.push(row(items.slice(i, i + cols), gap));
  const boxes = rowsArr.map((r) => new THREE.Box3().setFromObject(r));
  const total = boxes.reduce((a, b) => a + (b.max.z - b.min.z), 0) + gap * CM * (rowsArr.length - 1);
  let z = -total / 2;
  rowsArr.forEach((r, i) => { const b = boxes[i]; r.position.z += z - b.min.z; z += b.max.z - b.min.z + gap * CM; g.add(r); });
  return g;
}

/** Pinza de asado: dos brazos que se abren desde la bisagra, con mangos de madera. */
function tongs(L, armMat, handleMat) {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.add(flat(profileShape([[0, 0.9], [L * 0.95, 0.75], [L, 0.9]]), 0.25, armMat));
    // punta festoneada
    const tip = mesh(new THREE.BoxGeometry(2.2 * CM, 0.9 * CM, 0.25 * CM), armMat);
    tip.position.set(0, 0.45 * CM, -(L - 0.2) * CM);
    arm.add(tip);
    const h = flat(profileShape([[0.5, 1.05], [L * 0.4, 1.05]]), 1.5, handleMat, 0.25);
    arm.add(h);
    arm.rotation.y = side * 0.08;
    arm.position.x = side * 0.9 * CM;
    g.add(arm);
  }
  const hinge = mesh(new THREE.CylinderGeometry(0.9 * CM, 0.9 * CM, 0.6 * CM, 24), armMat);
  hinge.position.set(0, 0.3 * CM, 0);
  g.add(hinge);
  g.children.forEach((c) => (c.position.z += (L / 2) * CM));
  return g;
}

/** Palito chino: cilindro afinado acostado a lo largo de Z. */
function chopstick(L, mat, bandMat = null, bands = []) {
  const g = new THREE.Group();
  const c = new THREE.CylinderGeometry(0.22 * CM, 0.38 * CM, L * CM, 16);
  c.rotateX(Math.PI / 2);
  const m = mesh(c, mat); m.position.y = 0.38 * CM; g.add(m);
  for (const f of bands) {
    const b = new THREE.CylinderGeometry(0.4 * CM, 0.4 * CM, 0.5 * CM, 16);
    b.rotateX(Math.PI / 2);
    const bm = mesh(b, bandMat); bm.position.set(0, 0.38 * CM, (f - 0.5) * L * CM); g.add(bm);
  }
  return g;
}
const chopPair = (L, mat, bandMat, bands) => {
  const a = chopstick(L, mat, bandMat, bands), b = chopstick(L, mat, bandMat, bands);
  a.position.x = -0.6 * CM; b.position.x = 0.6 * CM;
  const g = new THREE.Group(); g.add(a, b); return g;
};

/** Apoya-palitos: bloque bajo con forma según el tipo. */
function rest(kind, mat) {
  const g = new THREE.Group();
  if (kind === "curvo" || kind === "onda") {
    const t = new THREE.TorusGeometry(2.6 * CM, 0.55 * CM, 12, 32, Math.PI * 0.9);
    t.rotateY(Math.PI / 2); t.rotateZ(Math.PI);
    const m = mesh(t, mat); m.scale.set(1, 0.35, 1); m.position.y = 1.4 * CM; m.rotation.y = Math.PI / 2; g.add(m);
  } else if (kind === "torii") {
    g.add(block(6.5, 0.6, 1.2, mat, 0.2));
    for (const x of [-2, 2]) { const p = block(0.6, 1.4, 0.8, mat, 0.15); p.position.x = x * CM; g.add(p); }
    const top = block(7, 0.5, 1.2, mat, 0.2); top.position.y = 1.4 * CM; g.add(top);
  } else if (kind === "ovalado") {
    const s = mesh(new THREE.SphereGeometry(1, 32, 16), mat); s.scale.set(3 * CM, 0.8 * CM, 1.4 * CM); s.position.y = 0.8 * CM; g.add(s);
  } else {
    g.add(block(6, 1.2, 2, mat, 0.5));
  }
  return g;
}

/** Cuchara de cerámica oriental: cuenco ovalado y mango plano que sube. */
function soupSpoon(L, mat) {
  const g = new THREE.Group();
  const bl = L * 0.45, bw = L * 0.32;
  const bowl = lathe(PROFILE.bowl(1.6 * CM), 40);
  warp(bowl, { sx: (bw / 2) * CM, sz: (bl / 2) * CM, form: "oval" });
  const b = mesh(bowl, mat); b.position.z = (L / 2 - bl / 2) * CM; g.add(b);
  const h = flat(profileShape([[0, 0.9], [L * 0.55, 0.7], [L * 0.6, 0.6]]), 0.35, mat);
  h.rotation.x = 0.18; h.position.set(0, 0.9 * CM, (L / 2 - bl * 0.75) * CM);
  h.children?.forEach?.(() => {});
  g.add(h);
  return g;
}

/** Base de madera con patas (geta) para sushi. */
function geta(w, d, mat) {
  const g = new THREE.Group();
  const top = block(w, 1.6, d, mat, 0.4); top.position.y = 2 * CM; g.add(top);
  for (const x of [-1, 1]) { const leg = block(1.6, 2, d * 0.92, mat, 0.2); leg.position.x = x * (w / 2 - 3) * CM; g.add(leg); }
  return g;
}

/** Tetera: cuerpo torneado, pico, tapa y asa (lateral o de arco superior). */
function teapot({ r = 7, h = 10, body, lidMat, handleMat, arc = true, infuser = false }) {
  const g = new THREE.Group();
  const R = r * CM, H = h * CM;
  g.add(mesh(lathe([[0, 0], [0.6 * R, 0], [0.85 * R, 0.08 * H], [R, 0.45 * H], [0.9 * R, 0.85 * H], [0.55 * R, H], [0.5 * R, H * 0.97], [0, H * 0.97]]), body));
  const lid = mesh(lathe([[0, H * 1.1], [0.15 * R, H * 1.1], [0.12 * R, H * 1.04], [0.5 * R, H * 1.02], [0.56 * R, H], [0, H]]), lidMat);
  g.add(lid);
  const spout = mesh(new THREE.CylinderGeometry(0.12 * R, 0.24 * R, 0.75 * R, 20, 1, true), body);
  spout.rotation.z = -0.9; spout.position.set(1.15 * R, 0.62 * H, 0); g.add(spout);
  if (arc) {
    const a = mesh(new THREE.TorusGeometry(0.55 * R, 0.07 * R, 12, 36, Math.PI), handleMat);
    a.position.set(0, H * 1.0, 0); a.rotation.y = Math.PI / 2; g.add(a);
  } else {
    const a = mesh(new THREE.TorusGeometry(0.32 * H, 0.06 * R, 12, 36, Math.PI * 1.2), handleMat);
    a.position.set(-1.05 * R, 0.5 * H, 0); a.rotation.z = Math.PI * 0.4; g.add(a);
  }
  if (infuser) {
    const inf = mesh(new THREE.CylinderGeometry(0.32 * R, 0.28 * R, 0.8 * H, 24, 1, true), M.steel());
    inf.position.y = 0.55 * H; g.add(inf);
  }
  return g;
}

/* ------------------------------------------------------------ recetas por producto */
const pieceLen = { "tenedor de postre": 18, "tenedor de mesa": 20.5, "cuchillo de mesa": 22.5, "cuchillo de postre": 21, "cuchara de mesa": 20, "cucharita": 14, "cuchara de postre": 18, tenedor: 20.5, cuchillo: 22.5, cuchara: 20 };
const kindOf = (p) => (p.startsWith("tenedor") ? "tenedor" : p.startsWith("cuchillo") ? "cuchillo" : p === "cucharita" ? "cucharita" : "cuchara");
const CYCLE = ["tenedor de mesa", "cuchillo de mesa", "cuchara de mesa", "cucharita", "tenedor de postre", "cuchillo de postre", "cuchara de postre", "cucharita"];

function cutleryMetal(t) {
  if (t.includes("negro")) return M.black();
  if (t.includes("dorado")) return M.gold();
  if (t.includes("satinado")) return M.satin();
  return M.steel();
}
function woodTint(t) {
  if (t.includes("olivo")) return WOOD.olivo;
  if (t.includes("nogal")) return WOOD.nogal;
  if (t.includes("oscura")) return WOOD.oscura;
  if (t.includes("hueso")) return WOOD.hueso;
  if (t.includes("teca")) return WOOD.teca;
  if (t.includes("bambu")) return WOOD.bambu;
  return WOOD.natural;
}
const hex = (c) => new THREE.Color(c ?? "#e8e6e1");

function build(row) {
  const sku = row.sku, t = norm(`${row.name} ${row.description}`), cat = catalog.get(sku) ?? {};
  const src = cat.source ?? {};
  const color = hex(src.color), accent = hex(src.accent ?? src.color);
  const cer = M.ceramic(color);
  const lenCm = (() => { const m = t.match(/(\d+(?:[.,]\d+)?)\s*cm/); return m ? parseFloat(m[1].replace(",", ".")) : null; })();

  // ---- cubiertería de mesa
  if (/^cub-(0\d|1\d|2[0-4])$/i.test(sku)) {
    const metal = cutleryMetal(t);
    let pieces = [];
    const tail = t.includes(":") ? t.split(":")[1].split(".")[0] : "";
    for (const part of tail.split(/,|\sy\s/)) {
      const p = part.trim();
      const k = Object.keys(pieceLen).sort((a, b) => b.length - a.length).find((x) => p.includes(x));
      if (k) pieces.push(k);
    }
    if (!pieces.length) { const n = +(t.match(/(\d+)\s*piezas/)?.[1] ?? 5); pieces = CYCLE.slice(0, Math.min(n, 8)); }
    return row_(pieces.map((p) => utensil(kindOf(p), pieceLen[p], { metal: metal.clone() })));
  }
  if (sku === "CUB-25") return utensil("cuchara", 20, { handle: M.wood(WOOD.natural) });
  if (sku === "CUB-26") return utensil("tenedor", 20.5, { handle: M.wood(WOOD.natural) });
  if (sku === "CUB-28") return row_([utensil("cuchillo-asado", 22, { handle: M.wood(WOOD.natural) }), utensil("tenedor", 20.5, { handle: M.wood(WOOD.natural) })]);
  if (sku === "CUB-29" || sku === "CUB-30") { const metal = sku === "CUB-29" ? M.black() : M.steel(); return row_(["tenedor de mesa", "cuchillo de mesa", "cuchara de mesa", "cucharita"].map((p) => utensil(kindOf(p), pieceLen[p], { metal: metal.clone() }))); }
  if (/^cub-3[1-4]$/i.test(sku)) {
    const tint = sku === "CUB-34" ? WOOD.hueso : woodTint(t);
    return row_([utensil("cuchillo-asado", 27, { handle: M.wood(tint) }), utensil("trinche", 27, { handle: M.wood(tint) })], 2);
  }
  if (sku === "CUB-35") return utensil("trinche", 45, { handle: M.wood(WOOD.natural), handleLen: 14 });
  if (sku === "CUB-36") return utensil("trinche", 38, { handle: M.wood(WOOD.oscura), handleLen: 14 });
  if (/^cub-3[7-9]$/i.test(sku)) return tongs(35, sku === "CUB-37" ? M.black() : M.steel(), M.wood(sku === "CUB-39" ? WOOD.oscura : WOOD.natural));
  if (/^cub-4[0-3]$/i.test(sku)) return utensil(sku === "CUB-43" ? "chef" : "cuchillo-asado", sku === "CUB-42" ? 32 : 29, { handle: M.wood(woodTint(t)), handleLen: 12 });

  // ---- acero negro y piezas sueltas (ACE)
  if (sku === "ACE-01" || sku === "ACE-02") return grid(Array.from({ length: 6 }, () => utensil("cucharita", 13, { metal: M.black() })), 6, 1.2);
  if (sku === "ACE-07") return grid(Array.from({ length: 6 }, () => utensil("cuchara", 18, { metal: M.black() })), 6, 1.2);
  if (/^ace-0[3-6]$/i.test(sku)) { const L = lenCm ?? 20; return row_(["cuchara", "tenedor", "cuchillo", "cuchara", "tenedor", "cuchillo"].map((k) => utensil(k, L, { metal: M.black() })), 1.2); }
  if (sku === "ACE-08") return utensil("cucharita", 13);
  if (sku === "ACE-09") return utensil("cuchara", 20);
  if (sku === "ACE-10") return utensil("cucharita", 15);
  if (sku === "ACE-11") return utensil("tenedor", 20);
  if (sku === "ACE-12") return utensil("cuchillo", 22);

  // ---- oriental: palitos, apoya-palitos, cucharas
  if (["ORI-23", "ORI-24", "ORI-26", "ORI-27", "ORI-28"].includes(sku)) {
    const map = {
      "ORI-23": [M.ceramic(0x1e1e20, 0.4), M.gold(), [0.2]],
      "ORI-24": [M.ceramic(0x1c1c1e, 0.5), M.gold(), []],
      "ORI-26": [M.wood(WOOD.natural), null, []],
      "ORI-27": [M.ceramic(0x1c1c1e, 0.4), M.steel(), [0.15, 0.22, 0.29]],
      "ORI-28": [M.ceramic(0x3f6b4a, 0.4), M.gold(), [0.2]],
    }[sku];
    return chopPair(23, map[0], map[1], map[2]);
  }
  if (sku === "ORI-25") { const items = Array.from({ length: 5 }, () => chopstick(22.5, M.steel(), M.black(), [0.08, 0.14, 0.2])); return row_(items, 0.8); }
  if (/^ori-(29|3[0-6])$/i.test(sku)) {
    const n = +(t.match(/set de (\d+)/)?.[1] ?? 1);
    const kind = t.includes("curv") ? "curvo" : t.includes("onda") ? "onda" : t.includes("torii") ? "torii" : t.includes("ovalad") ? "ovalado" : "rect";
    const mat = sku === "ORI-33" ? M.steel() : t.includes("negro") ? M.ceramic(0x1d1d1f, 0.3) : t.includes("verde") ? M.ceramic(0x5d7b5c, 0.6) : t.includes("blanco") ? M.ceramic(0xf1efe9) : cer;
    return row_(Array.from({ length: Math.min(n, 4) }, () => rest(kind, mat.clone())), 1.5);
  }
  if (sku === "ORI-64") { const g = new THREE.Group(); const head = shaped("tray", 6.5, 0.8, 8, M.ceramic(0xf4f2ee), "oval"); head.position.z = -5 * CM; g.add(head); g.add(flat(profileShape([[-1, 1.2], [9, 1.0]]), 0.6, M.ceramic(0xf4f2ee))); return g; }
  if (/^ori-6[5-7]$/i.test(sku)) { const n = sku === "ORI-65" ? 6 : 4; return row_(Array.from({ length: n }, () => soupSpoon(13.5, M.ceramic(color))), 1.2); }

  // ---- bandejas, platos con forma y madera
  if (["ORI-01", "ORI-02", "ORI-40", "CER-11"].includes(sku)) { const [w, d] = sku === "CER-11" ? [30, 17] : [30, 12]; return shaped("tray", w, 2, d, M.ceramic(color, sku === "ORI-01" || sku === "ORI-40" ? 0.85 : 0.3), "square", 7); }
  if (sku === "BAM-01") { const g = new THREE.Group(); const b = block(31.5, 1.6, 14, M.wood(WOOD.bambu), 1); g.add(b); const rim1 = block(31.5, 1, 1, M.wood(WOOD.bambu), 0.4); rim1.position.set(0, 1.5 * CM, -6.5 * CM); const rim2 = rim1.clone(); rim2.position.z = 6.5 * CM; g.add(rim1, rim2); return g; }
  if (["ORI-03", "ORI-38", "ORI-39"].includes(sku)) return geta(sku === "ORI-38" ? 24 : 30, sku === "ORI-38" ? 10 : 14, M.wood(WOOD.natural));
  if (sku === "ORI-37") return grid(Array.from({ length: 2 }, () => geta(24, 24, M.wood(WOOD.teca))), 2, 3);
  if (sku === "EST-08") return shaped("plate", 24, 2.2, 24, M.ceramic(0xf3f1ec), "square", 6);
  if (sku === "CER-12") return shaped("plate", 19, 2, 19, cer, "square", 3.5);
  if (sku === "ORI-05") return shaped("plate", 10, 1.8, 10, M.ceramic(0x1b1b1d, 0.15), "square", 6);
  if (sku === "ORI-06") return shaped("plate", 24, 2.4, 24, M.ceramic(0x222224, 0.8), "square", 5);
  if (sku === "ORI-61") return shaped("tray", 15, 1.8, 10, M.ceramic(0x2e5b8f, 0.25), "square", 6);
  if (sku === "ORI-20") { const g = new THREE.Group(); const p = shaped("plate", 15, 1.6, 15, M.ceramic(0x1c1c1e, 0.4), "tri"); p.position.y = 0.6 * CM; g.add(p); for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + Math.PI / 2; const f = mesh(new THREE.CylinderGeometry(0.5 * CM, 0.6 * CM, 0.7 * CM, 12), M.ceramic(0x1c1c1e, 0.4)); f.position.set(Math.cos(a) * 3.5 * CM, 0.35 * CM, Math.sin(a) * 3.5 * CM); g.add(f); } return g; }
  if (sku === "ORI-04") return grid([30, 26, 21].map((s) => shaped("plate", s, 2.2, s, M.ceramic(0xf4f2ee), "square", 6)), 3, 2.5);
  if (sku === "ORI-59") return row_(Array.from({ length: 3 }, () => shaped("plate", 10, 1.8, 10, M.ceramic(0xf4f2ee), "square", 6)), 2);
  if (sku === "CER-02") return shaped("bowl", 18.5, 7.4, 18.5, M.ceramic(0x2b4f78, 0.2), "tri");
  if (sku === "MAD-02") {
    const g = new THREE.Group();
    const w = M.wood(WOOD.natural);
    g.add(mesh(lathe([[0, 0], [0.15, 0], [0.15, 0.015], [0.145, 0.02], [0.115, 0.02], [0.11, 0.012], [0.105, 0.012], [0.1, 0.02], [0, 0.02]].map(([x, y]) => [x, y])), w));
    return g;
  }
  if (sku === "MAD-03") {
    const g = new THREE.Group();
    const cup = mesh(lathe([[0, 0], [0.04, 0], [0.042, 0.1], [0.036, 0.1], [0.034, 0.01], [0, 0.01]]), M.wood(WOOD.natural));
    cup.position.x = -6 * CM; g.add(cup);
    const lid = mesh(new THREE.CylinderGeometry(4.4 * CM, 4.4 * CM, 0.5 * CM, 40), M.steel()); lid.position.set(-6 * CM, 10.25 * CM, 0); g.add(lid);
    const box = block(9, 9, 9, M.wood(WOOD.oscura), 0.3); box.position.x = 5.5 * CM; g.add(box);
    return g;
  }
  if (sku === "CER-19") {
    const g = new THREE.Group(), iron = M.iron();
    g.add(mesh(lathe([[0, 0], [0.12, 0], [0.13, 0.008], [0.135, 0.05], [0.128, 0.05], [0.122, 0.012], [0, 0.01]]), iron));
    const h = block(17, 1.6, 3, iron, 1.2); h.position.set(21.5 * CM, 3 * CM, 0); h.rotation.z = 0.12; g.add(h);
    const aux = mesh(new THREE.TorusGeometry(2.4 * CM, 0.6 * CM, 10, 24, Math.PI), iron); aux.rotation.x = -Math.PI / 2; aux.rotation.z = Math.PI / 2; aux.position.set(-13.5 * CM, 4.4 * CM, 0); g.add(aux);
    return g;
  }
  if (sku === "ORI-08") {
    const g = new THREE.Group();
    const lacquer = M.ceramic(0x6b4228, 0.25), red = M.ceramic(0xa3241d, 0.25);
    g.add(mesh(lathe(PROFILE.bowl(0.075).map(([x, y]) => [x * 0.06, y])), lacquer));
    const inner = mesh(new THREE.CircleGeometry(0.055, 40), red); inner.rotation.x = -Math.PI / 2; inner.position.y = 0.068; g.add(inner);
    const lid = mesh(lathe([[0, 0.1], [0.012, 0.1], [0.012, 0.094], [0.03, 0.092], [0.058, 0.078], [0.062, 0.074], [0, 0.074]]), lacquer);
    g.add(lid);
    return g;
  }
  if (sku === "ORI-09") return grid(Array.from({ length: 3 }, () => { const m = mesh(lathe(PROFILE.bowl(0.07).map(([x, y]) => [x * 0.075, y])), M.wood(WOOD.teca)); return m; }), 3, 2);
  if (sku === "ORI-41") {
    const g = new THREE.Group();
    const tray = shaped("tray", 20, 1.5, 11, cer, "oval"); g.add(tray);
    const b = mesh(lathe([[0, 0], [0.032, 0], [0.035, 0.05], [0.028, 0.085], [0.012, 0.1], [0.012, 0.115], [0, 0.115]]), cer); b.position.set(-3 * CM, 0.5 * CM, 0); g.add(b);
    const cup = mesh(lathe(PROFILE.bowl(0.03).map(([x, y]) => [x * 0.03, y])), cer); cup.position.set(5 * CM, 0.5 * CM, 0); g.add(cup);
    return g;
  }
  if (sku === "CER-10") return teapot({ r: 7.5, h: 11, body: cer, lidMat: cer, handleMat: M.wood(WOOD.bambu), arc: true });
  if (sku === "ORI-48") return teapot({ r: 7, h: 10, body: M.glass(), lidMat: M.glass(), handleMat: M.wood(WOOD.bambu), arc: true });
  if (sku === "ORI-47") return teapot({ r: 7, h: 11, body: M.glass(), lidMat: M.steel(), handleMat: M.glass(), arc: false, infuser: true });

  // ---- sets con bandeja o formas cuadradas: se arman desde las piezas del catálogo
  if (src.shape === "set" && src.pieces?.length) {
    const square = t.includes("cuadrad");
    const g = new THREE.Group();
    for (const pc of src.pieces) {
      let o;
      const m = M.ceramic(color);
      if (pc.shape === "tray") o = shaped("tray", pc.w, pc.h, pc.d, m, "square", 7);
      else if (pc.shape === "plate") o = square ? shaped("plate", pc.w, pc.h, pc.d, m, "square", 5) : mesh(lathe(PROFILE.plate(pc.h * CM).map(([x, y]) => [x * (pc.w / 2) * CM, y])), m);
      else if (pc.shape === "bowl") o = square ? shaped("bowl", pc.w, pc.h, pc.d, m, "square", 5) : mesh(lathe(PROFILE.bowl(pc.h * CM).map(([x, y]) => [x * (pc.w / 2) * CM, y])), m);
      else if (pc.shape === "cylinder") o = mesh(lathe([[0, 0], [0.9, 0], [0.92, 0.03 * pc.h * CM], [1, pc.h * CM], [0.94, pc.h * CM], [0.86, 0.1 * pc.h * CM], [0, 0.08 * pc.h * CM]].map(([x, y], i) => [i === 0 || x === 0 ? 0 : x * (pc.w / 2) * CM, y])), m);
      else if (pc.shape === "mug") { o = new THREE.Group(); const rb = (pc.d / 2) * CM, H = pc.h * CM; o.add(mesh(lathe([[0, 0], [0.9 * rb, 0], [rb, H], [0.92 * rb, H], [0.86 * rb, 0.12 * H], [0, 0.11 * H]]), m)); const hdl = mesh(new THREE.TorusGeometry(H * 0.25, 0.6 * CM, 10, 24), m); hdl.position.set(rb + H * 0.18, H * 0.52, 0); o.add(hdl); }
      else continue;
      o.position.x += (pc.x ?? 0) * CM; o.position.z += (pc.z ?? 0) * CM;
      g.add(o);
    }
    return g;
  }
  return null;
}
const row_ = row;

/* ------------------------------------------------------------ exportar */
const targets = only.length ? rows.filter((r) => only.includes(r.sku)) : rows;
const io = new NodeIO().registerExtensions([KHRMaterialsClearcoat]);
const made = [];
for (const r of targets) {
  CUR = r.sku;
  const obj = build(r);
  if (!obj) continue;
  // Apoyar en y=0 y centrar en planta
  const scene = new THREE.Scene();
  const holder = new THREE.Group(); holder.add(obj); scene.add(holder);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder);
  const c = new THREE.Vector3(); box.getCenter(c);
  holder.position.set(-c.x, -box.min.y, -c.z);
  // UV planas para la madera
  holder.traverse((o) => {
    if (o.isMesh && String(o.material?.name).startsWith("madera")) {
      const b = new THREE.Box3().setFromBufferAttribute(o.geometry.attributes.position); const s = new THREE.Vector3(); b.getSize(s);
      flatUV(o.geometry, Math.max(s.x, 0.02), Math.max(s.z, 0.02));
    }
  });
  const exporter = new GLTFExporter();
  const glb = await new Promise((res, rej) => exporter.parse(scene, res, rej, { binary: true }));
  const doc = await io.readBinary(new Uint8Array(glb));
  const clearcoat = doc.createExtension(KHRMaterialsClearcoat);
  const glossy = (mat, cc = 0.6) => mat.setRoughnessFactor(0.32).setExtension("KHR_materials_clearcoat", clearcoat.createClearcoat().setClearcoatFactor(cc).setClearcoatRoughnessFactor(0.12));
  let tex = null; const photoTex = new Map();
  for (const mat of doc.getRoot().listMaterials()) {
    const n = mat.getName() || "";
    if (n.startsWith("madera")) {
      tex ??= doc.createTexture("madera").setImage(woodPng).setMimeType("image/png");
      const tint = new THREE.Color(n.split(":")[1] || "#d6b38a");
      mat.setBaseColorTexture(tex).setBaseColorFactor([tint.r * 1.15, tint.g * 1.15, tint.b * 1.15, 1].map((v, i) => (i < 3 ? Math.min(1, v) : v))).setRoughnessFactor(0.55);
    } else if (n.startsWith("tex|")) {
      const [, file, , fin] = n.split("|");
      if (!photoTex.has(file)) photoTex.set(file, doc.createTexture(file).setImage(readFileSync(join(texDir, file))).setMimeType("image/jpeg"));
      mat.setBaseColorTexture(photoTex.get(file)).setBaseColorFactor([1, 1, 1, 1]).setMetallicFactor(0);
      if (fin === "matte") mat.setRoughnessFactor(0.78); else glossy(mat);
    } else if (n === "ceramica") {
      if (mat.getRoughnessFactor() > 0.6) mat.setRoughnessFactor(0.78); else glossy(mat);
    } else if (n === "vidrio") {
      const c = mat.getBaseColorFactor();
      mat.setAlphaMode("BLEND").setBaseColorFactor([c[0], c[1], c[2], 0.32]).setRoughnessFactor(0.05).setMetallicFactor(0);
      glossy(mat, 0.8).setRoughnessFactor(0.05);
    } else if (n === "acero") mat.setMetallicFactor(1).setRoughnessFactor(0.22);
    else if (n === "acero-satinado") mat.setMetallicFactor(1).setRoughnessFactor(0.45);
    else if (n === "dorado") mat.setMetallicFactor(1).setRoughnessFactor(0.3);
    else if (n === "negro-mate") mat.setMetallicFactor(0.55).setRoughnessFactor(0.5);
    else if (n === "hierro") mat.setMetallicFactor(0.6).setRoughnessFactor(0.75);
  }
  writeFileSync(join(outDir, `${r.sku}.glb`), await io.writeBinary(doc));
  made.push(r.sku);
}
console.log(made.join("\n"));
