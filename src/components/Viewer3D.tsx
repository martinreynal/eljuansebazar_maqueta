"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, Line, OrbitControls, TrackballControls, useGLTF } from "@react-three/drei";
import { Maximize2, Minimize2, Minus, Plus, RotateCcw } from "lucide-react";

export type ViewerMode = "studio" | "table";

/** Mesa de referencia: 120 × 80 cm, 75 cm de alto (medidas estándar). */
const TABLE = { w: 1.2, d: 0.8, h: 0.75, top: 0.03 };

type Size = { w: number; h: number; d: number };
type Ctl = { object: THREE.Camera; target: THREE.Vector3; minDistance: number; maxDistance: number; update: () => void; reset: () => void };

/**
 * Visor 3D de producto con dos modos:
 *  - "studio": producto aislado, rotación libre en tres ejes, fondo neutro.
 *  - "table": producto a escala real sobre una mesa estándar, con guía de
 *    escala, medidas y referencias de tamaño opcionales.
 */
export function Viewer3D({ url, name, mode = "studio" }: { url: string; name: string; mode?: ViewerMode }) {
  const box = useRef<HTMLDivElement>(null);
  const controls = useRef<Ctl | null>(null);
  const [fs, setFs] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState<Size | null>(null);
  const [guide, setGuide] = useState(true);
  const [measures, setMeasures] = useState(true);
  const [refs, setRefs] = useState(false);
  const table = mode === "table";
  // Relación de aspecto del visor: en pantallas angostas la cámara se aleja para que entre toda la mesa
  const [aspect, setAspect] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    setAspect(el.clientWidth / Math.max(1, el.clientHeight));
  }, []);

  const toggleFs = useCallback(async () => {
    const el = box.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen();
      else if (document.fullscreenElement) await document.exitFullscreen();
      else setFs((v) => !v);
    } catch {
      setFs((v) => !v);
    }
  }, []);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  useEffect(() => {
    if (!fs) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFs(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fs]);

  const zoom = (f: number) => {
    const c = controls.current;
    if (!c) return;
    const cam = c.object;
    const dir = cam.position.clone().sub(c.target);
    const len = THREE.MathUtils.clamp(dir.length() * f, c.minDistance, c.maxDistance);
    cam.position.copy(c.target).add(dir.setLength(len));
    c.update();
    setInteracted(true);
  };
  const reset = () => { controls.current?.reset(); setInteracted(false); };
  const onReady = useCallback((s: Size) => { setSize(s); setReady(true); }, []);

  // Cámara inicial: en estudio, de frente; en mesa, en diagonal para que entre toda la mesa
  const far = aspect && aspect < 1 ? Math.pow(1 / aspect, 0.7) : 1;
  const camera = table
    ? { fov: 30, near: 0.01, far: 50, position: [1.15 * far, 0.85 * far, 1.55 * far] as [number, number, number] }
    : { fov: 30, near: 0.01, far: 50, position: [0, 0.3, 3.1 * far] as [number, number, number] };

  return (
    <div ref={box} className={`v3d ${fs ? "v3d-fs" : ""} ${table ? "v3d-table" : ""}`} aria-label={`${table ? "Vista en mesa" : "Vista 3D"} de ${name}`}>
      {aspect !== null && <Canvas
        key={mode}
        dpr={[1, 2]}
        camera={camera}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 0.95; }}
        onPointerDown={() => setInteracted(true)}
        onWheel={() => setInteracted(true)}
      >
        {/* Fondo oscuro dentro de la escena: hace falta para que el vidrio (transmisión) muestre lo que hay detrás */}
        <color attach="background" args={["#171615"]} />
        <Suspense fallback={null}>
          <Studio soft={table} />
          {table ? (
            <>
              <Table />
              <Model url={url} spin={false} fit={false} onReady={onReady} />
              <ContactShadows position={[0, 0.0008, 0]} opacity={0.45} scale={1.6} blur={2.2} far={0.5} resolution={512} color="#000" />
              {guide && <ScaleGuide />}
              {measures && size && <Measures size={size} />}
              {refs && size && <References size={size} />}
            </>
          ) : (
            <>
              <Model url={url} spin={!interacted} fit onReady={onReady} />
              <ContactShadows position={[0, -0.72, 0]} opacity={0.5} scale={3.2} blur={2.8} far={0.9} resolution={512} color="#000" frames={Infinity} />
            </>
          )}
        </Suspense>
        {table ? (
          <OrbitControls
            ref={(c) => { controls.current = c as unknown as Ctl; }}
            target={[0, 0.06, 0]}
            enableDamping
            dampingFactor={0.1}
            minDistance={0.18}
            maxDistance={4.5}
            maxPolarAngle={Math.PI / 2 - 0.04}
            rotateSpeed={0.8}
          />
        ) : (
          <TrackballControls
            ref={(c) => { controls.current = c as unknown as Ctl; }}
            rotateSpeed={2.6}
            zoomSpeed={0.9}
            noPan
            dynamicDampingFactor={0.12}
            minDistance={1.2}
            maxDistance={5}
          />
        )}
      </Canvas>}

      {!ready && (
        <div className="v3d-loading" role="status">
          <span className="v3d-spin" />
          Cargando modelo 3D…
        </div>
      )}

      {table && (
        <div className="v3d-opts" role="group" aria-label="Referencias de tamaño">
          <button type="button" aria-pressed={guide} onClick={() => setGuide((v) => !v)}>Guía de escala</button>
          <button type="button" aria-pressed={measures} onClick={() => setMeasures((v) => !v)}>Medidas</button>
          <button type="button" aria-pressed={refs} onClick={() => setRefs((v) => !v)}>Referencias</button>
        </div>
      )}

      <div className="v3d-tools" role="toolbar" aria-label="Controles del visor 3D">
        <button type="button" onClick={() => zoom(0.8)} aria-label="Acercar" title="Acercar"><Plus /></button>
        <button type="button" onClick={() => zoom(1.25)} aria-label="Alejar" title="Alejar"><Minus /></button>
        <button type="button" onClick={reset} aria-label="Restablecer vista" title="Restablecer"><RotateCcw /></button>
        <button type="button" onClick={toggleFs} aria-label={fs ? "Salir de pantalla completa" : "Pantalla completa"} title={fs ? "Salir de pantalla completa" : "Pantalla completa"}>{fs ? <Minimize2 /> : <Maximize2 />}</button>
      </div>
      <p className="v3d-hint">
        {table ? "Mesa de referencia 120 × 80 cm · arrastrá para girar, rueda o pellizco para acercar" : "Arrastrá para girar · rueda o pellizco para acercar"}
      </p>
      <p className="v3d-note">{table && size ? `${fmt(size.w)} × ${fmt(size.d)} × ${fmt(size.h)} cm (ancho × prof. × alto) · ` : ""}Modelo 3D aproximado, reconstruido a partir de la foto</p>
    </div>
  );
}

const fmt = (m: number) => { const cm = m * 100; return (cm < 10 ? Math.round(cm * 10) / 10 : Math.round(cm)).toLocaleString("es-AR"); };

/** Iluminación de estudio sin descargas externas: luces + entorno con paneles de luz. */
function Studio({ soft = false }: { soft?: boolean }) {
  // Iluminación de estudio fotográfico: softbox grande arriba, luz principal cálida de frente-izquierda,
  // contraluz fría y una banda angosta que dibuja un reflejo alargado en esmaltes, vidrio y acero.
  return (
    <>
      <ambientLight intensity={soft ? 0.35 : 0.25} />
      <directionalLight position={[2.5, 3.5, 2]} intensity={soft ? 0.8 : 1.0} color="#fff4e6" />
      <directionalLight position={[-3, 1.5, -2]} intensity={0.45} color="#e8f0ff" />
      <Environment resolution={512} environmentIntensity={soft ? 0.75 : 1.0}>
        <Lightformer form="rect" intensity={3.5} position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[7, 7, 1]} color="#fff8f0" />
        <Lightformer form="rect" intensity={3.2} position={[-3, 2, 4]} rotation={[0, 0.6, 0]} scale={[5, 3.5, 1]} color="#fff4e6" />
        <Lightformer form="rect" intensity={1.6} position={[5, 1, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 4, 1]} color="#e9f0fb" />
        <Lightformer form="rect" intensity={1.2} position={[0, 1, -5]} rotation={[0, Math.PI, 0]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={6} position={[1.5, 3, 3]} rotation={[-0.6, 0.3, 0]} scale={[0.35, 4, 1]} />
        <Lightformer form="rect" intensity={0.5} position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[8, 8, 1]} color="#bfb6a8" />
      </Environment>
    </>
  );
}

/**
 * Carga el GLB y lo apoya centrado en el origen (base en y = 0).
 * fit = true: lo escala para llenar el visor (modo estudio).
 * fit = false: conserva su tamaño real en metros (modo mesa).
 */
function Model({ url, spin, fit, onReady }: { url: string; spin: boolean; fit: boolean; onReady: (s: Size) => void }) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group>(null);
  const prepared = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    const b = new THREE.Box3().setFromObject(s);
    const size = new THREE.Vector3(), center = new THREE.Vector3();
    b.getSize(size); b.getCenter(center);
    const k = fit ? 1.2 / Math.max(size.x, size.y, size.z, 1e-6) : 1;
    s.scale.setScalar(k);
    if (fit) s.position.copy(center).multiplyScalar(-k);
    else s.position.set(-center.x, -b.min.y, -center.z);
    const maxXZ = Math.max(size.x, size.z, 1e-6);
    return { s, size: { w: size.x, h: size.y, d: size.z }, aspect: size.x / Math.max(size.y, 1e-6), flat: size.y / maxXZ < 0.3 };
  }, [scene, fit]);
  const { invalidate } = useThree();
  useEffect(() => { onReady(prepared.size); invalidate(); }, [onReady, invalidate, prepared]);
  useFrame((_, dt) => {
    if (spin && group.current) group.current.rotation.y += dt * 0.35;
  });
  if (!fit) return <primitive object={prepared.s} />;
  // Piezas alargadas (un cuchillo) se presentan inclinadas; las planas (platos), vistas desde arriba; el resto, de frente
  const tilt = prepared.aspect > 2.5 && !prepared.flat ? [0.55, -0.35, 0.15] : prepared.flat ? [0.95, -0.25, 0] : [0.3, -0.45, 0];
  return (
    <group rotation={tilt as [number, number, number]}>
      <group ref={group}>
        <primitive object={prepared.s} />
      </group>
    </group>
  );
}

/** Mesa de referencia: tapa y cuatro patas, madera clara lisa. La tapa queda en y = 0. */
function Table() {
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b39b76", roughness: 0.85 }), []);
  const legH = TABLE.h - TABLE.top, leg = 0.045, inset = 0.06;
  return (
    <group>
      <mesh position={[0, -TABLE.top / 2, 0]} material={wood} receiveShadow>
        <boxGeometry args={[TABLE.w, TABLE.top, TABLE.d]} />
      </mesh>
      {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (TABLE.w / 2 - inset), -TABLE.top - legH / 2, sz * (TABLE.d / 2 - inset)]} material={wood}>
          <boxGeometry args={[leg, legH, leg]} />
        </mesh>
      ))}
      {/* Piso apenas insinuado para que la mesa no flote */}
      <mesh position={[0, -TABLE.h - 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color="#1c1a18" roughness={1} />
      </mesh>
    </group>
  );
}

const LINE = "#e8e3da";

/** Regla discreta sobre el borde frontal (120 cm) y el lateral izquierdo (80 cm): marcas cada 10 cm, número cada 20. */
function ScaleGuide() {
  const y = 0.0012;
  const front = TABLE.d / 2 - 0.02, left = -TABLE.w / 2 + 0.02;
  const ticks: React.ReactNode[] = [];
  for (let cm = 0; cm <= 120; cm += 10) {
    const x = -TABLE.w / 2 + cm / 100;
    const major = cm % 20 === 0;
    ticks.push(<Line key={`f${cm}`} points={[[x, y, front], [x, y, front - (major ? 0.03 : 0.016)]]} color={LINE} lineWidth={1} transparent opacity={0.75} />);
    if (major && cm > 0 && cm < 120) ticks.push(<Html key={`fl${cm}`} position={[x, y, front - 0.045]} center className="v3d-lbl"><span>{cm}</span></Html>);
  }
  for (let cm = 0; cm <= 80; cm += 10) {
    const z = TABLE.d / 2 - cm / 100;
    const major = cm % 20 === 0;
    ticks.push(<Line key={`s${cm}`} points={[[left, y, z], [left + (major ? 0.03 : 0.016), y, z]]} color={LINE} lineWidth={1} transparent opacity={0.75} />);
    if (major && cm > 0 && cm < 80) ticks.push(<Html key={`sl${cm}`} position={[left + 0.05, y, z]} center className="v3d-lbl"><span>{cm}</span></Html>);
  }
  return (
    <group>
      <Line points={[[-TABLE.w / 2, y, front], [TABLE.w / 2, y, front]]} color={LINE} lineWidth={1} transparent opacity={0.75} />
      <Line points={[[left, y, TABLE.d / 2], [left, y, -TABLE.d / 2]]} color={LINE} lineWidth={1} transparent opacity={0.75} />
      {ticks}
      <Html position={[TABLE.w / 2 - 0.05, y, front - 0.045]} center className="v3d-lbl"><span>cm</span></Html>
    </group>
  );
}

/** Cotas del producto: ancho, profundidad y alto, con su valor en cm. */
function Measures({ size }: { size: Size }) {
  const hw = size.w / 2, hd = size.d / 2, h = size.h;
  const off = 0.035, y = 0.0015, tick = 0.012;
  const zF = hd + off, xR = hw + off;
  return (
    <group>
      {/* ancho */}
      <Line points={[[-hw, y, zF], [hw, y, zF]]} color={LINE} lineWidth={1} />
      <Line points={[[-hw, y, zF - tick], [-hw, y, zF + tick]]} color={LINE} lineWidth={1} />
      <Line points={[[hw, y, zF - tick], [hw, y, zF + tick]]} color={LINE} lineWidth={1} />
      <Html position={[0, y, zF + 0.03]} center className="v3d-dim"><span>{fmt(size.w)} cm</span></Html>
      {/* profundidad */}
      <Line points={[[xR, y, -hd], [xR, y, hd]]} color={LINE} lineWidth={1} />
      <Line points={[[xR - tick, y, -hd], [xR + tick, y, -hd]]} color={LINE} lineWidth={1} />
      <Line points={[[xR - tick, y, hd], [xR + tick, y, hd]]} color={LINE} lineWidth={1} />
      <Html position={[xR + 0.03, y, 0]} center className="v3d-dim"><span>{fmt(size.d)} cm</span></Html>
      {/* alto */}
      <Line points={[[xR, 0, zF], [xR, h, zF]]} color={LINE} lineWidth={1} />
      <Line points={[[xR - tick, h, zF], [xR + tick, h, zF]]} color={LINE} lineWidth={1} />
      <Html position={[xR + 0.02, h / 2, zF + 0.02]} center className="v3d-dim"><span>{fmt(size.h)} cm</span></Html>
    </group>
  );
}

/** Referencias de tamaño cotidianas, apoyadas junto al producto: tarjeta y lata de 330 ml. */
function References({ size }: { size: Size }) {
  const x = size.w / 2 + 0.16;
  const grey = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9a948b", roughness: 0.6 }), []);
  const can = { r: 0.033, h: 0.115 };
  const card = { w: 0.0856, d: 0.054, t: 0.0008 };
  return (
    <group>
      <mesh position={[x, can.h / 2, -0.12]} material={grey} castShadow>
        <cylinderGeometry args={[can.r, can.r, can.h, 40]} />
      </mesh>
      <Html position={[x, can.h + 0.03, -0.12]} center className="v3d-lbl"><span>Lata 330 ml · 11,5 cm</span></Html>
      <mesh position={[x, card.t / 2, 0.14]} material={grey} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[card.w, card.t, card.d]} />
      </mesh>
      <Html position={[x, 0.025, 0.14]} center className="v3d-lbl"><span>Tarjeta 8,6 × 5,4 cm</span></Html>
    </group>
  );
}
