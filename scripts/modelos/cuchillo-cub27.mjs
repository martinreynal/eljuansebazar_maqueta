/**
 * Genera public/modelos/CUB-27.glb: cuchillo de acero inoxidable con mango de
 * madera y filo dentado, reconstruido a partir de la foto del catálogo y de
 * medidas típicas de un cuchillo de mesa (largo total ~21 cm).
 * Geometría real: hoja extruida con dientes, mango redondeado, dos remaches.
 * Uso: node scripts/modelos/cuchillo-cub27.mjs salida.glb
 */
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { NodeIO } from "@gltf-transform/core";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const out = process.argv[2] ?? "CUB-27.glb";

// GLTFExporter usa FileReader (API de navegador); en Node se emula con Blob.arrayBuffer
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); this.onload?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = `data:${blob.type};base64,${Buffer.from(b).toString("base64")}`; this.onloadend?.(); this.onload?.(); }); }
};
const here = dirname(fileURLToPath(import.meta.url));
const mm = 0.001;

// ---------------------------------------------------------------- hoja
// Eje X: largo (punta hacia +X). Eje Y: ancho (filo hacia -Y). Eje Z: espesor.
const BL = 108 * mm;      // largo de hoja
const heelW = 19 * mm;    // ancho en el talón
const thick = 1.6 * mm;
const blade = new THREE.Shape();
// lomo: recto desde el talón y curva ascendente hacia la punta
blade.moveTo(0, heelW * 0.55);
blade.lineTo(BL * 0.45, heelW * 0.55);
blade.bezierCurveTo(BL * 0.7, heelW * 0.55, BL * 0.9, heelW * 0.5, BL, heelW * 0.15);
// filo: desde la punta hacia el talón; los primeros 2/3 con dientes
const edgeY = (x) => -heelW * 0.45 + (x / BL) * heelW * 0.35; // el filo sube levemente hacia la punta
const toothPitch = 1.6 * mm, toothDepth = 0.8 * mm;
const serratedFrom = BL * 0.3; // desde acá hasta la punta hay dientes
let x = BL;
blade.lineTo(x, edgeY(x));
while (x - toothPitch > serratedFrom) {
  blade.lineTo(x - toothPitch / 2, edgeY(x - toothPitch / 2) + toothDepth);
  x -= toothPitch;
  blade.lineTo(x, edgeY(x));
}
blade.lineTo(serratedFrom, edgeY(serratedFrom));
blade.lineTo(0, edgeY(0));
blade.closePath();
const bladeGeo = new THREE.ExtrudeGeometry(blade, { depth: thick, bevelEnabled: true, bevelThickness: 0.45 * mm, bevelSize: 0.35 * mm, bevelSegments: 2, curveSegments: 24 });
bladeGeo.translate(0, 0, -thick / 2);
const steel = new THREE.MeshStandardMaterial({ name: "acero", color: 0xe4e6ea, metalness: 0.9, roughness: 0.28 });
const bladeMesh = new THREE.Mesh(bladeGeo, steel);
bladeMesh.name = "hoja";

// ---------------------------------------------------------------- mango
const HL = 105 * mm, HW = 20 * mm, HT = 12 * mm;
const handle = new THREE.Shape();
const r = 7 * mm;
// contorno en XY: ligeramente más ancho hacia el extremo, con punta redondeada
handle.moveTo(0, HW * 0.48);
handle.lineTo(-(HL - r), HW * 0.52);
handle.quadraticCurveTo(-HL, HW * 0.52, -HL, HW * 0.52 - r);
handle.lineTo(-HL, -HW * 0.52 + r);
handle.quadraticCurveTo(-HL, -HW * 0.52, -(HL - r), -HW * 0.52);
handle.lineTo(0, -HW * 0.42);
handle.closePath();
const bevel = HT * 0.33;
const handleGeo = new THREE.ExtrudeGeometry(handle, { depth: HT - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 5, curveSegments: 12 });
handleGeo.translate(0, 0, -(HT - bevel * 2) / 2);
// UVs planas para la textura de madera (a lo largo del mango)
{
  const pos = handleGeo.attributes.position, uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) { uv[i * 2] = (pos.getX(i) + HL) / HL; uv[i * 2 + 1] = (pos.getY(i) + HW) / (HW * 2); }
  handleGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}
const wood = new THREE.MeshStandardMaterial({ name: "madera", color: 0xffffff, metalness: 0, roughness: 0.55 });
const handleMesh = new THREE.Mesh(handleGeo, wood);
handleMesh.name = "mango";

// ---------------------------------------------------------------- remaches
const rivetGeo = new THREE.CylinderGeometry(2.2 * mm, 2.2 * mm, HT + 0.3 * mm, 24);
rivetGeo.rotateX(Math.PI / 2);
const rivets = new THREE.Group();
rivets.name = "remaches";
for (const rx of [-HL * 0.18, -HL * 0.42]) {
  const m = new THREE.Mesh(rivetGeo, steel);
  m.position.set(rx, 0, 0);
  rivets.add(m);
}

// El cuchillo se exporta acostado (como apoyado sobre una mesa): el espesor queda en Y
const knife = new THREE.Group();
knife.name = "cuchillo";
knife.add(bladeMesh, handleMesh, rivets);
knife.rotation.x = -Math.PI / 2;
const scene = new THREE.Scene();
scene.add(knife);

// Exportar glTF (JSON) en Node, convertirlo a GLB e incrustar la textura de madera con gltf-transform
const exporter = new GLTFExporter();
const glb = await new Promise((res, rej) => exporter.parse(scene, (r) => res(r), rej, { binary: true }));
const io = new NodeIO();
const doc = await io.readBinary(new Uint8Array(glb));
const tex = doc.createTexture("madera").setImage(readFileSync(join(here, "madera.png"))).setMimeType("image/png");
for (const mat of doc.getRoot().listMaterials()) {
  if (mat.getName() === "madera") mat.setBaseColorTexture(tex).setBaseColorFactor([0.86, 0.68, 0.5, 1]);
}
doc.getRoot().getAsset().generator = "El Juanse Bazar · reconstrucción desde foto de catálogo";
writeFileSync(out, await io.writeBinary(doc));
console.log("escrito", out, (await io.writeBinary(doc)).byteLength, "bytes");
