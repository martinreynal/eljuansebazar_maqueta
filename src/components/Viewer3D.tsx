"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, TrackballControls, useGLTF } from "@react-three/drei";
import type { TrackballControls as TrackballControlsImpl } from "three-stdlib";
import { Maximize2, Minimize2, Minus, Plus, RotateCcw } from "lucide-react";

/**
 * Visor 3D de producto: fondo neutro oscuro, luz de estudio, sombra suave.
 * Rotación libre en los tres ejes (mouse o táctil), zoom, reinicio y pantalla completa.
 * El modelo se centra y se escala para ocupar el visor sin importar sus medidas reales.
 */
export function Viewer3D({ url, name }: { url: string; name: string }) {
  const box = useRef<HTMLDivElement>(null);
  const controls = useRef<TrackballControlsImpl | null>(null);
  const [fs, setFs] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [ready, setReady] = useState(false);

  // Pantalla completa: API nativa si existe; si no (iPhone), modo "fijo" con CSS
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
    const cam = c.object as THREE.PerspectiveCamera;
    const dir = cam.position.clone().sub(c.target);
    const len = THREE.MathUtils.clamp(dir.length() * f, c.minDistance, c.maxDistance);
    cam.position.copy(c.target).add(dir.setLength(len));
    c.update();
    setInteracted(true);
  };
  const reset = () => { controls.current?.reset(); setInteracted(false); };

  return (
    <div ref={box} className={`v3d ${fs ? "v3d-fs" : ""}`} aria-label={`Vista 3D de ${name}`}>
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 30, near: 0.01, far: 50, position: [0, 0.3, 3.1] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 0.95; }}
        onPointerDown={() => setInteracted(true)}
        onWheel={() => setInteracted(true)}
      >
        <Suspense fallback={null}>
          <Studio />
          <Model url={url} spin={!interacted} onReady={() => setReady(true)} />
          <ContactShadows position={[0, -0.72, 0]} opacity={0.5} scale={3.2} blur={2.8} far={0.9} resolution={512} color="#000" frames={Infinity} />
        </Suspense>
        <TrackballControls
          ref={controls}
          rotateSpeed={2.6}
          zoomSpeed={0.9}
          noPan
          dynamicDampingFactor={0.12}
          minDistance={1.2}
          maxDistance={5}
        />
      </Canvas>

      {!ready && (
        <div className="v3d-loading" role="status">
          <span className="v3d-spin" />
          Cargando modelo 3D…
        </div>
      )}

      <div className="v3d-tools" role="toolbar" aria-label="Controles del visor 3D">
        <button type="button" onClick={() => zoom(0.8)} aria-label="Acercar" title="Acercar"><Plus /></button>
        <button type="button" onClick={() => zoom(1.25)} aria-label="Alejar" title="Alejar"><Minus /></button>
        <button type="button" onClick={reset} aria-label="Restablecer orientación" title="Restablecer"><RotateCcw /></button>
        <button type="button" onClick={toggleFs} aria-label={fs ? "Salir de pantalla completa" : "Pantalla completa"} title={fs ? "Salir de pantalla completa" : "Pantalla completa"}>{fs ? <Minimize2 /> : <Maximize2 />}</button>
      </div>
      <p className="v3d-hint">Arrastrá para girar · rueda o pellizco para acercar</p>
      <p className="v3d-note">Modelo 3D aproximado, reconstruido a partir de la foto</p>
    </div>
  );
}

/** Iluminación de estudio sin descargas externas: luces + entorno con paneles de luz. */
function Studio() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[2.5, 3, 2]} intensity={1.1} />
      <directionalLight position={[-3, 1.5, -2]} intensity={0.6} />
      {/* Entorno tipo estudio (softboxes alrededor) para que el acero refleje luz desde cualquier ángulo */}
      <Environment resolution={256} environmentIntensity={0.9}>
        <Lightformer form="rect" intensity={4} position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={3} position={[0, 1, 5]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[-5, 1, 1]} rotation={[0, Math.PI / 2, 0]} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[5, 1, -1]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[0, 1, -5]} rotation={[0, Math.PI, 0]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={0.6} position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[8, 8, 1]} color="#bfb6a8" />
      </Environment>
    </>
  );
}

/** Carga el GLB, lo centra en el origen y lo escala para que su lado mayor mida 1.7 unidades. */
function Model({ url, spin, onReady }: { url: string; spin: boolean; onReady: () => void }) {
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
    const k = 1.2 / Math.max(size.x, size.y, size.z, 1e-6);
    s.scale.setScalar(k);
    s.position.copy(center).multiplyScalar(-k);
    const maxXZ = Math.max(size.x, size.z, 1e-6);
    return { s, aspect: size.x / Math.max(size.y, 1e-6), flat: size.y / maxXZ < 0.3 };
  }, [scene]);
  const { invalidate } = useThree();
  useEffect(() => { onReady(); invalidate(); }, [onReady, invalidate]);
  // Giro suave hasta que el usuario toma el control
  useFrame((_, dt) => {
    if (spin && group.current) group.current.rotation.y += dt * 0.35;
  });
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
