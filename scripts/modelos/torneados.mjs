/**
 * Genera modelos GLB para las piezas torneadas del catálogo (platos, bowls,
 * tazas, vasos, copas, botellas/dispensers) y para los sets compuestos solo
 * por piezas torneadas, a partir de src/products/catalog.json (forma, medidas
 * y colores tomados de la foto y la descripción de cada producto).
 *
 * Uso: node scripts/modelos/torneados.mjs src/products/catalog.json carpeta_salida
 * Imprime la lista de SKUs generados (una por línea) en stdout.
 */
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); this.onload?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = `data:${blob.type};base64,${Buffer.from(b).toString("base64")}`; this.onloadend?.(); this.onload?.(); }); }
};

const [catalogPath, outDir] = process.argv.slice(2);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
mkdirSync(outDir, { recursive: true });
const CM = 0.01;
const TURNED = new Set(["plate", "bowl", "mug", "cylinder", "glass", "bottle"]);
const SEG = 48;

const lathe = (pts, seg = SEG) => {
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  g.computeVertexNormals();
  return g;
};
const mat = (color, { rough = 0.35, metal = 0, glass = false, side } = {}) => {
  if (glass) return new THREE.MeshPhysicalMaterial({ color, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.38, side: THREE.DoubleSide });
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, side: side ?? THREE.FrontSide });
};
const dbl = THREE.DoubleSide;

/** Construye una pieza con su base apoyada en y=0 y centrada en x/z. */
function piece(shape, w, h, d, src) {
  const W = w * CM, H = h * CM, D = d * CM, r = W / 2;
  const color = src.color, accent = src.accent ?? src.color, glass = !!src.glass;
  const rough = src.roughness ?? 0.35;
  const g = new THREE.Group();
  switch (shape) {
    case "plate": {
      g.add(new THREE.Mesh(lathe([[0, 0], [0.55 * r, 0], [0.62 * r, 0.12 * H], [0.9 * r, 0.82 * H], [r, H], [0.97 * r, 0.98 * H], [0.88 * r, 0.7 * H], [0.6 * r, 0.16 * H], [0, 0.16 * H]]), mat(color, { rough, glass, side: dbl })));
      const well = new THREE.Mesh(new THREE.CircleGeometry(0.59 * r, SEG), mat(glass ? color : accent, { rough, glass }));
      well.rotation.x = -Math.PI / 2; well.position.y = 0.16 * H + 0.0006;
      g.add(well);
      break;
    }
    case "bowl":
      g.add(new THREE.Mesh(lathe([[0, 0], [0.45 * r, 0], [0.5 * r, 0.04 * H], [0.78 * r, 0.45 * H], [0.97 * r, 0.9 * H], [r, H], [0.93 * r, H], [0.72 * r, 0.42 * H], [0.42 * r, 0.14 * H], [0, 0.12 * H]]), mat(color, { rough, glass, side: dbl })));
      break;
    case "cylinder": { // vaso: leve conicidad, hueco
      g.add(new THREE.Mesh(lathe([[0, 0], [0.9 * r, 0], [0.92 * r, 0.03 * H], [r, H], [0.94 * r, H], [0.86 * r, 0.1 * H], [0, 0.08 * H]]), mat(color, { rough, glass, side: dbl })));
      break;
    }
    case "glass":
      g.add(new THREE.Mesh(lathe([[0, 0], [0.85 * r, 0], [0.8 * r, 0.015 * H], [0.12 * r, 0.05 * H], [0.07 * r, 0.1 * H], [0.07 * r, 0.42 * H], [0.3 * r, 0.47 * H], [0.9 * r, 0.62 * H], [r, 0.8 * H], [0.94 * r, H], [0.9 * r, H], [0.95 * r, 0.8 * H], [0.86 * r, 0.63 * H], [0.3 * r, 0.5 * H], [0, 0.49 * H]]), mat(color, { rough, glass: true, side: dbl })));
      break;
    case "bottle":
      g.add(new THREE.Mesh(lathe([[0, 0], [0.95 * r, 0], [r, 0.05 * H], [r, 0.58 * H], [0.9 * r, 0.66 * H], [0.36 * r, 0.8 * H], [0.36 * r, 0.93 * H], [0.42 * r, 0.93 * H], [0.42 * r, H], [0, H]]), mat(color, { rough, glass })));
      break;
    case "mug": {
      const rb = D / 2; // cuerpo; W incluye el asa
      const span = Math.max(0.012, W / 2 - rb);
      const body = new THREE.Group();
      body.add(new THREE.Mesh(lathe([[0, 0], [0.9 * rb, 0], [0.92 * rb, 0.01 * H], [rb, H], [0.92 * rb, H], [0.86 * rb, 0.12 * H], [0, 0.11 * H]]), mat(color, { rough, glass, side: dbl })));
      const inner = new THREE.Mesh(new THREE.CircleGeometry(0.86 * rb, SEG), mat(accent, { rough }));
      inner.rotation.x = -Math.PI / 2; inner.position.y = 0.11 * H + 0.0005;
      body.add(inner);
      const tube = Math.min(0.007, span * 0.22), major = span * 0.5 + tube * 0.6;
      const handle = new THREE.Mesh(new THREE.TorusGeometry(major, tube, 12, 32), mat(color, { rough }));
      handle.position.set(rb + span - major - tube, H * 0.52, 0);
      body.add(handle);
      body.position.x = -span / 2;
      g.add(body);
      break;
    }
  }
  return g;
}

const made = [];
for (const p of catalog) {
  const s = p.source;
  if (s.type !== "primitive") continue;
  const scene = new THREE.Scene();
  if (TURNED.has(s.shape)) {
    scene.add(piece(s.shape, p.dimensions.w, p.dimensions.h, p.dimensions.d, s));
  } else if (s.shape === "set" && s.pieces?.length && s.pieces.every((x) => TURNED.has(x.shape))) {
    for (const pc of s.pieces) {
      const g = piece(pc.shape, pc.w, pc.h, pc.d, s);
      g.position.set((pc.x ?? 0) * CM, 0, (pc.z ?? 0) * CM);
      scene.add(g);
    }
  } else continue;
  const exporter = new GLTFExporter();
  const glb = await new Promise((res, rej) => exporter.parse(scene, res, rej, { binary: true }));
  writeFileSync(join(outDir, `${p.id}.glb`), Buffer.from(glb));
  made.push(p.id);
}
console.log(made.join("\n"));
