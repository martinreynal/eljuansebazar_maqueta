/**
 * Modelos GLB "realistas" de las piezas torneadas (platos, bowls, tazas, vasos,
 * copas, botellas) y de los sets formados por ellas: la forma sale del catálogo
 * y de las proporciones medidas en la foto; la superficie, de texturas extraídas
 * de la foto (datos/fotos.json + datos/texturas); y los materiales usan PBR
 * (esmalte con clearcoat, vidrio con transmisión, etc.).
 *
 * Uso: node scripts/modelos/realista.mjs src/products/catalog.json datos/rows.json datos/fotos.json datos/texturas salida [SKU...]
 */
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { NodeIO } from "@gltf-transform/core";
import { KHRMaterialsClearcoat, KHRMaterialsTransmission, KHRMaterialsIOR, KHRMaterialsVolume, KHRTextureTransform } from "@gltf-transform/extensions";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); this.onload?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = `data:${blob.type};base64,${Buffer.from(b).toString("base64")}`; this.onloadend?.(); this.onload?.(); }); }
};

const [catalogPath, rowsPath, fotosPath, texDir, outDir, ...only] = process.argv.slice(2);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const rows = new Map(JSON.parse(readFileSync(rowsPath, "utf8")).rows.map((r) => [r.sku, r]));
const fotos = JSON.parse(readFileSync(fotosPath, "utf8"));
mkdirSync(outDir, { recursive: true });

const CM = 0.01, SEG = 64;
// Productos que modela resto.mjs con una receta propia (formas cuadradas, madera, teteras, cubiertos…): se dejan fuera
const RESTO = new Set(["ACE-01", "ACE-02", "ACE-03", "ACE-04", "ACE-05", "ACE-06", "ACE-07", "ACE-08", "ACE-09", "ACE-10", "ACE-11", "ACE-12", "BAM-01", "CER-02", "CER-10", "CER-11", "CER-12", "CER-19", "CUB-01", "CUB-02", "CUB-03", "CUB-04", "CUB-05", "CUB-06", "CUB-07", "CUB-08", "CUB-09", "CUB-10", "CUB-11", "CUB-12", "CUB-13", "CUB-14", "CUB-15", "CUB-16", "CUB-17", "CUB-18", "CUB-19", "CUB-20", "CUB-21", "CUB-22", "CUB-23", "CUB-24", "CUB-25", "CUB-26", "CUB-27", "CUB-28", "CUB-29", "CUB-30", "CUB-31", "CUB-32", "CUB-33", "CUB-34", "CUB-35", "CUB-36", "CUB-37", "CUB-38", "CUB-39", "CUB-40", "CUB-41", "CUB-42", "CUB-43", "EST-08", "MAD-02", "MAD-03", "ORI-01", "ORI-02", "ORI-03", "ORI-04", "ORI-05", "ORI-06", "ORI-08", "ORI-09", "ORI-20", "ORI-23", "ORI-24", "ORI-25", "ORI-26", "ORI-27", "ORI-28", "ORI-29", "ORI-30", "ORI-31", "ORI-32", "ORI-33", "ORI-34", "ORI-35", "ORI-36", "ORI-37", "ORI-38", "ORI-39", "ORI-40", "ORI-41", "ORI-47", "ORI-48", "ORI-59", "ORI-61", "ORI-64", "ORI-65", "ORI-66", "ORI-67"]);
const TURNED = new Set(["plate", "bowl", "mug", "cylinder", "glass", "bottle"]);
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const rgb = (a) => `${a[0]},${a[1]},${a[2]}`;

/* ------------------------------------------------------------ materiales (el nombre lleva la receta; se aplica tras exportar) */
// name: tipo|textura|color r,g,b|acabado   tipo: tex (textura) | flat (color) | glass
const mat = (name) => new THREE.MeshStandardMaterial({ name, color: 0xffffff, roughness: 0.5, metalness: 0, side: THREE.DoubleSide });

/* ------------------------------------------------------------ geometría */
function lathe(pts, seg = SEG) {
  // LatheGeometry ya trae las normales de la costura unificadas; no se recalculan (dejaría una línea visible)
  return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
}
/** Recalcula normales y vuelve a unificar la costura u=0/u=1 de una geometría de revolución. */
function fixSeam(g) {
  g.computeVertexNormals();
  const n = g.attributes.normal, p = g.attributes.position, seg = g.parameters?.segments ?? SEG;
  const perRow = seg + 1;
  for (let i = 0; i + seg < p.count; i += perRow) {
    const j = i + seg;
    const nx = (n.getX(i) + n.getX(j)) / 2, ny = (n.getY(i) + n.getY(j)) / 2, nz = (n.getZ(i) + n.getZ(j)) / 2;
    n.setXYZ(i, nx, ny, nz); n.setXYZ(j, nx, ny, nz);
  }
  n.needsUpdate = true;
}
/** UV planas (vista cenital): la textura cubre el cuadrado que envuelve la pieza. */
function uvPlanar(g, R) {
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2 * R) + 0.5, 0.5 - p.getZ(i) / (2 * R));
  uv.needsUpdate = true;
}
/** UV cilíndricas: u alrededor (0..1), v = altura relativa. */
function uvCyl(g, y0, y1) {
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i)) / (2 * Math.PI) + 0.5;
    uv.setXY(i, a, (p.getY(i) - y0) / Math.max(1e-6, y1 - y0));
  }
  uv.needsUpdate = true;
}
/** Acanalado vertical: modula el radio con ondas (vasos y copas "acanalados", "labrados"). */
function ribs(g, n = 28, amp = 0.025) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
    if (r < 1e-6) continue;
    const a = Math.atan2(z, x), k = 1 + amp * Math.cos(n * a);
    p.setXYZ(i, x * k, p.getY(i), z * k);
  }
  fixSeam(g);
}

/* Perfiles de revolución (radio normalizado 1, alto H en metros) */
const P = {
  plateOuter: (H) => [[0, 0], [0.5, 0], [0.56, 0.1 * H], [0.86, 0.72 * H], [0.985, 0.95 * H], [1, H]],
  plateTop: (H) => [[1, H], [0.985, H], [0.84, 0.8 * H], [0.6, 0.2 * H], [0.5, 0.17 * H], [0, 0.17 * H]],
  bowlOuter: (H) => [[0, 0], [0.42, 0], [0.47, 0.04 * H], [0.74, 0.4 * H], [0.95, 0.86 * H], [1, H]],
  bowlInner: (H) => [[1, H], [0.95, H], [0.73, 0.44 * H], [0.42, 0.14 * H], [0, 0.12 * H]],
  mugOuter: (H, b = 0.86) => [[0, 0], [b, 0], [b + 0.04 * (1 - b) / 0.14, 0.015 * H], [b + (1 - b) * 0.55, 0.3 * H], [1, 0.72 * H], [0.99, H]],
  mugInner: (H, b = 0.86) => [[0.99, H], [0.93, H], [b + (1 - b) * 0.45, 0.3 * H], [b * 0.96, 0.12 * H], [0, 0.11 * H]],
  cylOuter: (H, b = 0.9) => [[0, 0], [b, 0], [b + 0.03, 0.03 * H], [1, H]],
  cylInner: (H, b = 0.9) => [[1, H], [0.95, H], [b * 0.97, 0.1 * H], [0, 0.08 * H]],
  bowlOuterT: (H, b = 0.42) => [[0, 0], [b, 0], [b + 0.05, 0.04 * H], [b + (1 - b) * 0.55, 0.4 * H], [0.95, 0.86 * H], [1, H]],
  bowlInnerT: (H, b = 0.42) => [[1, H], [0.95, H], [b + (1 - b) * 0.53, 0.44 * H], [b, 0.14 * H], [0, 0.12 * H]],
  bottle: (H) => [[0, 0], [0.92, 0], [1, 0.06 * H], [1, 0.55 * H], [0.92, 0.66 * H], [0.38, 0.8 * H], [0.38, 0.93 * H], [0.44, 0.93 * H], [0.44, H], [0, H]],
  glass: (H) => [[0, 0], [0.85, 0], [0.8, 0.015 * H], [0.12, 0.05 * H], [0.07, 0.1 * H], [0.07, 0.42 * H], [0.3, 0.47 * H], [0.9, 0.62 * H], [1, 0.8 * H], [0.94, H], [0.9, H], [0.95, 0.8 * H], [0.86, 0.63 * H], [0.3, 0.5 * H], [0, 0.49 * H]],
};
const scaleR = (pts, R) => pts.map(([x, y]) => [x * R, y]);

/**
 * Construye una pieza apoyada en y=0. tex = { top, side, color, edge, finish, glass, ribbed }
 */
function piece(shape, w, h, d, tex) {
  const W = w * CM, H = h * CM, R = W / 2;
  const g = new THREE.Group();
  const fin = tex.finish;
  const texTop = tex.top ? `tex|${tex.top}|${rgb(tex.color)}|${fin}` : `flat||${rgb(tex.color)}|${fin}`;
  const texSide = tex.side ? `tex|${tex.side}|${rgb(tex.color)}|${fin}` : `flat||${rgb(tex.color)}|${fin}`;
  const flatC = `flat||${rgb(tex.color)}|${fin}`;
  if (tex.glass) {
    const glassM = `glass||${rgb(tex.color)}|${tex.ribbed ? "ribbed" : "plain"}`;
    const b = Math.min(1, Math.max(0.55, tex.taper ?? 0.9));
    const prof = shape === "glass" ? P.glass(H) : [...P.cylOuter(H, b), ...P.cylInner(H, b).slice(1)];
    const geo = lathe(scaleR(prof, R), 72);
    if (tex.ribbed) ribs(geo, shape === "glass" ? 36 : 28, 0.02);
    const m = new THREE.Mesh(geo, mat(glassM));
    g.add(m);
    return g;
  }
  switch (shape) {
    case "plate": {
      const top = lathe(scaleR(P.plateTop(H), R)); uvPlanar(top, R);
      const outer = lathe(scaleR(P.plateOuter(H), R)); uvPlanar(outer, R);
      g.add(new THREE.Mesh(top, mat(texTop)), new THREE.Mesh(outer, mat(tex.top ? texTop : flatC)));
      break;
    }
    case "bowl": {
      const b = Math.min(0.75, Math.max(0.3, tex.taper ?? 0.42));
      const outer = lathe(scaleR(P.bowlOuterT(H, b), R)); uvCyl(outer, 0, H);
      const inner = lathe(scaleR(P.bowlInnerT(H, b), R)); uvPlanar(inner, R);
      g.add(new THREE.Mesh(outer, mat(texSide)), new THREE.Mesh(inner, mat(tex.innerTop ? `tex|${tex.innerTop}|${rgb(tex.inner)}|${fin}` : `flat||${rgb(tex.inner)}|${fin}`)));
      break;
    }
    case "mug": {
      const rb = (d * CM) / 2, span = Math.max(0.012, W / 2 - rb);
      const body = new THREE.Group();
      const b = Math.min(1, Math.max(0.5, tex.taper ?? 0.86));
      const outer = lathe(scaleR(P.mugOuter(H, b), rb)); uvCyl(outer, 0, H);
      const inner = lathe(scaleR(P.mugInner(H, b), rb)); uvPlanar(inner, rb);
      body.add(new THREE.Mesh(outer, mat(texSide)), new THREE.Mesh(inner, mat(`flat||${rgb(tex.inner)}|${fin}`)));
      // asa: arco elíptico de sección redondeada
      const tube = Math.min(0.0075, span * 0.24), major = span * 0.52 + tube * 0.5;
      const curve = new THREE.EllipseCurve(0, 0, major, H * 0.33, -Math.PI / 2, Math.PI / 2, false, 0);
      const pts3 = curve.getPoints(32).map((p) => new THREE.Vector3(p.x, p.y, 0));
      const handle = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts3), 32, tube, 12, false), mat(flatC));
      handle.position.set(rb * 0.92 + 0.002, H * 0.52, 0);
      body.add(handle);
      body.position.x = -span / 2;
      body.rotation.y = -Math.PI / 4; // el asa queda a 45°, visible desde el frente y desde el costado
      g.add(body);
      break;
    }
    case "bottle": {
      const geo = lathe(scaleR(P.bottle(H), R)); uvCyl(geo, 0, H);
      g.add(new THREE.Mesh(geo, mat(texSide)));
      break;
    }
    default: { // cylinder opaco (vaso de cerámica, cubilete)
      const b = Math.min(1, Math.max(0.55, tex.taper ?? 0.9));
      const outer = lathe(scaleR(P.cylOuter(H, b), R)); uvCyl(outer, 0, H);
      const inner = lathe(scaleR(P.cylInner(H, b), R)); uvPlanar(inner, R);
      g.add(new THREE.Mesh(outer, mat(texSide)), new THREE.Mesh(inner, mat(`flat||${rgb(tex.inner)}|${fin}`)));
    }
  }
  return g;
}

/* ------------------------------------------------------------ acabado y texturas por producto */
function finishOf(text, pieceInfo, src) {
  if (/\bmate\b|matte|sin esmalt/.test(text)) return "matte";
  if (/satinad|semi ?mate/.test(text)) return "satin";
  if (/brillante|esmaltad|glaseado|reactiv|craquelad|laqueado|laca/.test(text)) return "gloss";
  if (pieceInfo && pieceInfo.spec > 0.012) return "gloss";
  if (pieceInfo && pieceInfo.value < 90) return "satin";
  return "gloss";
}

function texturesFor(sku, srcShape, piecesDef, text, src) {
  const f = fotos[sku];
  const blobs = f?.pieces ?? [];
  const n = piecesDef.length;
  const assignable = blobs.length >= n && n > 0;
  const fallback = [parseInt(src.color.slice(1, 3), 16), parseInt(src.color.slice(3, 5), 16), parseInt(src.color.slice(5, 7), 16)];
  return piecesDef.map((pc, k) => {
    const b = assignable ? blobs[k] : blobs[0];
    const glassy = src.glass || /vidrio|cristal/.test(text) && !/ceramic|gres|porcel/.test(text);
    if (!b) return { color: fallback, inner: fallback, edge: fallback, finish: finishOf(text, null, src), glass: glassy, ribbed: /acanalad|labrad|facetad|rayad|estriad/.test(text) };
    const has = (name) => existsSync(join(texDir, name));
    const pre = b.top.replace(/-top\.jpg$/, "");
    const discOk = assignable && pc.shape === "plate" && b.disc && b.tilt >= 0.45 && has(`${pre}-disc.jpg`);
    const stripOk = assignable && b.strip && ["bowl", "mug", "bottle", "cylinder"].includes(pc.shape) && has(`${pre}-strip.jpg`);
    return {
      color: b.inner, inner: pc.shape === "bowl" ? b.inner : b.inner, edge: b.edge,
      top: discOk ? `${pre}-disc.jpg` : b.top,
      innerTop: pc.shape === "bowl" ? b.top : null,
      side: stripOk ? `${pre}-strip.jpg` : b.side,
      finish: finishOf(text, b, src), glass: glassy, ribbed: /acanalad|labrad|facetad|rayad|estriad/.test(text),
      aspect: b.aspect, taper: (assignable ? b.taper : undefined), single: assignable && blobs.length === 1 && n === 1,
    };
  });
}

/** Alto deducido de la foto para piezas sueltas (proporción de la silueta). */
function heightFromPhoto(shape, w, d, h, t) {
  if (!t.single || !t.aspect || t.glass) return h;
  const a = t.aspect;
  if (shape === "bowl") return Math.min(0.8 * w, Math.max(0.3 * w, w * (a - 0.2)));
  if (shape === "cylinder" || shape === "glass") return Math.min(3 * w, Math.max(0.6 * w, w * (a - 0.08)));
  if (shape === "mug") return Math.min(1.5 * d, Math.max(0.65 * d, w * a * 0.95));
  if (shape === "bottle") return Math.min(3 * w, Math.max(0.8 * w, w * a * 0.95));
  return h;
}

/* ------------------------------------------------------------ exportación con texturas y PBR */
const io = new NodeIO().registerExtensions([KHRMaterialsClearcoat, KHRMaterialsTransmission, KHRMaterialsIOR, KHRMaterialsVolume, KHRTextureTransform]);
const texCache = new Map();
async function exportGLB(scene, file) {
  const exporter = new GLTFExporter();
  const glb = await new Promise((res, rej) => exporter.parse(scene, res, rej, { binary: true }));
  const doc = await io.readBinary(new Uint8Array(glb));
  const clearcoat = doc.createExtension(KHRMaterialsClearcoat);
  const transmission = doc.createExtension(KHRMaterialsTransmission);
  const ior = doc.createExtension(KHRMaterialsIOR);
  const volume = doc.createExtension(KHRMaterialsVolume);
  const textures = new Map();
  const texOf = (name) => {
    if (!textures.has(name)) textures.set(name, doc.createTexture(name).setImage(readFileSync(join(texDir, name))).setMimeType("image/jpeg"));
    return textures.get(name);
  };
  for (const m of doc.getRoot().listMaterials()) {
    const [kind, tex, col, fin] = (m.getName() || "").split("|");
    const c = col ? col.split(",").map((v) => Math.pow(+v / 255, 2.2)) : [1, 1, 1];
    m.setDoubleSided(true);
    if (kind === "glass") {
      const mode = process.env.GLASS || "both";
      const tint = [0.9 + c[0] * 0.1, 0.9 + c[1] * 0.1, 0.9 + c[2] * 0.1];
      m.setRoughnessFactor(0.05).setMetallicFactor(0);
      if (mode === "blend" || mode === "both") { m.setAlphaMode("BLEND").setBaseColorFactor([tint[0], tint[1], tint[2], mode === "both" ? 0.5 : 0.32]); }
      else m.setBaseColorFactor([tint[0], tint[1], tint[2], 1]);
      if (mode === "trans" || mode === "both") {
        m.setExtension("KHR_materials_transmission", transmission.createTransmission().setTransmissionFactor(mode === "both" ? 0.6 : 1));
        m.setExtension("KHR_materials_ior", ior.createIOR().setIOR(1.5));
        m.setExtension("KHR_materials_volume", volume.createVolume().setThicknessFactor(0.003).setAttenuationDistance(0.6).setAttenuationColor([0.92, 0.96, 0.98]));
      }
      continue;
    }
    if (kind === "tex" && tex) { m.setBaseColorTexture(texOf(tex)).setBaseColorFactor([1, 1, 1, 1]); }
    else m.setBaseColorFactor([c[0], c[1], c[2], 1]);
    m.setMetallicFactor(0);
    if (fin === "gloss") {
      m.setRoughnessFactor(0.32);
      m.setExtension("KHR_materials_clearcoat", clearcoat.createClearcoat().setClearcoatFactor(0.7).setClearcoatRoughnessFactor(0.12));
    } else if (fin === "satin") m.setRoughnessFactor(0.5);
    else m.setRoughnessFactor(0.78);
  }
  writeFileSync(file, await io.writeBinary(doc));
}

/* ------------------------------------------------------------ recorrido del catálogo */
const targets = only.length ? catalog.filter((p) => only.includes(p.id)) : catalog;
const made = [];
for (const p of targets) {
  const s = p.source;
  if (s.type !== "primitive" || RESTO.has(p.id)) continue;
  const row = rows.get(p.id); const text = norm(`${row?.name ?? p.name} ${row?.description ?? ""}`);
  let defs;
  if (TURNED.has(s.shape)) defs = [{ shape: s.shape, w: p.dimensions.w, h: p.dimensions.h, d: p.dimensions.d, x: 0, z: 0 }];
  else if (s.shape === "set" && s.pieces?.length && s.pieces.every((x) => TURNED.has(x.shape))) defs = s.pieces;
  else continue;
  const texs = texturesFor(p.id, s.shape, defs, text, s);
  const scene = new THREE.Scene();
  defs.forEach((pc, k) => {
    const t = texs[k];
    const h = heightFromPhoto(pc.shape, pc.w, pc.d, pc.h, t);
    const g = piece(pc.shape, pc.w, h, pc.d, t);
    g.position.set((pc.x ?? 0) * CM, 0, (pc.z ?? 0) * CM);
    scene.add(g);
  });
  await exportGLB(scene, join(outDir, `${p.id}.glb`));
  made.push(p.id);
}
console.log(made.join("\n"));
