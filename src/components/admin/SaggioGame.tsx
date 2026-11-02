"use client";
import { useEffect, useRef, useState } from "react";

type Kind = "silla" | "mesa" | "banqueta" | "pesado";
type Piece = { name: string; img: string; kind: Kind };
type Body = { x: number; y: number; vx: number; vy: number; a: number; va: number; w: number; h: number; im: HTMLImageElement; name: string; kind: Kind; done: boolean; scored: boolean; rest: number; stacked: boolean; rel: number; layer: number };
type Dust = { x: number; y: number; vx: number; vy: number; life: number; r: number };

const W = 960, H = 540, GROUND = H - 46, SLING = { x: 150, y: GROUND - 120 }, THROWS = 10, G = 900, POWER = 7.2;

/** Física de cada tipo: potencia de lanzamiento, rebote, giro y tamaño. */
const PHYS: Record<Kind, { power: number; bounce: number; spin: number; w: number; h: number; label: string }> = {
  silla: { power: 1, bounce: 0.4, spin: 1, w: 74, h: 74, label: "Silla" },
  mesa: { power: 0.86, bounce: 0.18, spin: 0.45, w: 92, h: 70, label: "Mesa · pesada" },
  banqueta: { power: 1.02, bounce: 0.46, spin: 1.9, w: 64, h: 80, label: "Banqueta · gira mucho" },
  pesado: { power: 0.8, bounce: 0.15, spin: 0.35, w: 96, h: 72, label: "Sillón · muy pesado" },
};

/** sagg.io — arrastrá la pieza hacia atrás y soltala para revolearla dentro del salón. */
export function SaggioGame({ pieces }: { pieces: Piece[] }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, left: THROWS, best: 0, msg: "Arrastrá la pieza hacia atrás y soltala", over: false, combo: 0, kind: "Silla" });
  const [sound, setSound] = useState(true);
  const soundRef = useRef(true);
  const restart = useRef<() => void>(() => {});
  useEffect(() => { soundRef.current = sound; }, [sound]);

  useEffect(() => {
    const c = cv.current!; const ctx = c.getContext("2d")!;
    const imgs = pieces.map((p) => { const im = new Image(); im.src = p.img; return { im, name: p.name, kind: p.kind }; });
    let best = 0; try { best = Number(localStorage.getItem("saggio-best") || 0); } catch { /* sin almacenamiento */ }
    let score = 0, left = THROWS, combo = 0, over = false, last = performance.now(), idx = 0;
    let loaded: Body | null = null, flying: Body[] = [], drag: { x: number; y: number } | null = null;
    let pops: { x: number; y: number; t: string; life: number; color: string }[] = [], dust: Dust[] = [];
    let shake = 0, boxShake = 0, wind = 0;
    const target = { x: 700, w: 180, dir: 1, speed: 60 };

    // Sonidos sintetizados (sin archivos)
    let ac: AudioContext | null = null;
    const tone = (f1: number, f2: number, dur: number, type: OscillatorType, vol = 0.18) => {
      if (!soundRef.current) return;
      try {
        ac ??= new AudioContext();
        const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
        o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur);
      } catch { /* sin audio */ }
    };
    const sHit = () => { tone(520, 1040, 0.14, "triangle"); setTimeout(() => tone(780, 1560, 0.16, "triangle", 0.14), 90); };
    const sMiss = () => tone(180, 70, 0.32, "sawtooth", 0.1);
    const sThud = (v: number) => tone(120, 50, 0.12, "sine", Math.min(0.25, v / 2400));
    const sTower = () => [0, 90, 180].forEach((d, i) => setTimeout(() => tone(600 + i * 200, 1200 + i * 300, 0.18, "square", 0.08), d));

    const sync = (msg?: string) => setHud((s) => ({ score, left, best, combo, over, msg: msg ?? s.msg, kind: loaded ? PHYS[loaded.kind].label : s.kind }));
    const newWind = () => { wind = Math.round((Math.random() * 2 - 1) * 10) / 10; if (Math.abs(wind) < 0.15) wind = 0; };
    const load = () => {
      if (left <= 0) {
        over = true;
        if (score > best) { best = score; try { localStorage.setItem("saggio-best", String(best)); } catch { /* */ } }
        sync("¡Fin! Tocá «Jugar de nuevo»"); return;
      }
      const p = imgs.length ? imgs[idx++ % imgs.length] : null; const kind: Kind = p?.kind ?? "silla"; const ph = PHYS[kind];
      loaded = { x: SLING.x, y: SLING.y, vx: 0, vy: 0, a: 0, va: 0, w: ph.w, h: ph.h, im: p?.im ?? new Image(), name: p?.name ?? "Silla", kind, done: false, scored: false, rest: 0, stacked: false, rel: 0, layer: 0 };
      newWind(); sync();
    };
    restart.current = () => { score = 0; left = THROWS; combo = 0; over = false; flying = []; pops = []; dust = []; target.speed = 60; load(); sync("Arrastrá la pieza hacia atrás y soltala"); };
    load(); sync();

    const pos = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
    const down = (e: PointerEvent) => { if (!loaded || over) return; const p = pos(e); if (Math.hypot(p.x - loaded.x, p.y - loaded.y) < 90) { drag = p; c.setPointerCapture(e.pointerId); } };
    const move = (e: PointerEvent) => { if (!drag || !loaded) return; const p = pos(e); const dx = p.x - SLING.x, dy = p.y - SLING.y, d = Math.min(110, Math.hypot(dx, dy)), k = d / (Math.hypot(dx, dy) || 1); loaded.x = SLING.x + dx * k; loaded.y = SLING.y + dy * k; };
    const up = () => {
      if (!drag || !loaded) return; drag = null;
      const dx = SLING.x - loaded.x, dy = SLING.y - loaded.y; if (Math.hypot(dx, dy) < 12) { loaded.x = SLING.x; loaded.y = SLING.y; return; }
      const ph = PHYS[loaded.kind];
      loaded.vx = dx * POWER * ph.power; loaded.vy = dy * POWER * ph.power; loaded.va = (Math.random() - 0.5) * 12 * ph.spin;
      flying.push(loaded); loaded = null; left--; tone(300, 160, 0.08, "sine", 0.06); sync("¡Allá va!");
      setTimeout(load, 750);
    };
    c.addEventListener("pointerdown", down); c.addEventListener("pointermove", move); c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);

    const puff = (x: number, y: number, n: number) => { for (let i = 0; i < n; i++) dust.push({ x: x + (Math.random() - 0.5) * 40, y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 120, life: 0.6 + Math.random() * 0.4, r: 4 + Math.random() * 6 }); };
    const stacked = () => flying.filter((b) => b.stacked);
    /** Superficie donde apoya una pieza dentro del salón: el piso del salón o la pieza apilada de abajo. */
    const surfaceIn = (b: Body) => {
      let top = GROUND - 18, layer = 1;
      for (const s of stacked()) {
        const sx = target.x + s.rel;
        if (Math.abs(sx - b.x) < (s.w + b.w) * 0.36) { const t = s.y - s.h / 2; if (t < top) { top = t; layer = s.layer + 1; } }
      }
      return { top, layer };
    };

    const drawPiece = (b: Body) => {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
      if (b.im.complete && b.im.naturalWidth) {
        const r = Math.min(b.w / b.im.naturalWidth, b.h / b.im.naturalHeight); const w = b.im.naturalWidth * r, h = b.im.naturalHeight * r;
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(-b.w / 2 - 4, -b.h / 2 - 4, b.w + 8, b.h + 8, 10); ctx.fill();
        ctx.drawImage(b.im, -w / 2, -h / 2, w, h);
      } else { ctx.fillStyle = "#C96F4A"; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); }
      ctx.restore();
    };
    const drawWind = () => {
      const cx = W / 2, cy = 34;
      ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.roundRect(cx - 95, cy - 18, 190, 36, 18); ctx.fill();
      ctx.fillStyle = "#4A5F55"; ctx.font = "600 12px DM Sans, sans-serif"; ctx.textAlign = "left"; ctx.fillText("VIENTO", cx - 82, cy + 4);
      const len = Math.abs(wind) * 70, dir = Math.sign(wind), ax = cx + 18;
      if (!wind) { ctx.fillStyle = "#6B7D73"; ctx.fillText("calma", ax - 10, cy + 4); return; }
      ctx.strokeStyle = "#C96F4A"; ctx.fillStyle = "#C96F4A"; ctx.lineWidth = 4; ctx.lineCap = "round";
      const x1 = ax + 30 - (dir * len) / 2, x2 = ax + 30 + (dir * len) / 2;
      ctx.beginPath(); ctx.moveTo(x1, cy); ctx.lineTo(x2, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2 + dir * 8, cy); ctx.lineTo(x2 - dir * 4, cy - 7); ctx.lineTo(x2 - dir * 4, cy + 7); ctx.fill();
    };

    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const prevX = target.x;
      target.x += target.dir * target.speed * dt; if (target.x < 430 || target.x + target.w > W - 30) target.dir *= -1;
      const boxDx = target.x - prevX;

      for (const b of flying) {
        if (b.stacked) { b.x = target.x + b.rel; continue; }
        if (b.done) continue;
        const ph = PHYS[b.kind];
        b.vy += G * dt; b.vx += wind * 230 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
        const inBox = b.x > target.x + 8 && b.x < target.x + target.w - 8;
        const surf = inBox ? surfaceIn(b) : { top: GROUND, layer: 0 };
        if (b.y > GROUND - 90 && !inBox && Math.abs(b.x - target.x) < 12) { b.vx = -Math.abs(b.vx) * 0.5 + boxDx / dt; b.x = target.x - 12; sThud(300); }
        if (b.y > GROUND - 90 && !inBox && Math.abs(b.x - (target.x + target.w)) < 12) { b.vx = Math.abs(b.vx) * 0.5 + boxDx / dt; b.x = target.x + target.w + 12; sThud(300); }
        if (b.y + b.h / 2 > surf.top) {
          const impact = Math.abs(b.vy);
          b.y = surf.top - b.h / 2; b.vy *= -ph.bounce; b.vx *= 0.7; b.va *= 0.55;
          if (impact > 260) { puff(b.x, surf.top, Math.min(14, Math.round(impact / 70))); shake = Math.max(shake, Math.min(10, impact / 120) * (b.kind === "pesado" || b.kind === "mesa" ? 1.4 : 1)); sThud(impact); }
          if (inBox && !b.scored) {
            b.scored = true; combo++; const pts = 100 + (combo - 1) * 50; score += pts; target.speed += 16; boxShake = 0.35;
            pops.push({ x: b.x, y: b.y - 50, t: `+${pts}${combo > 1 ? ` · combo x${combo}` : ""}`, life: 1.4, color: "#1E4D3D" }); sHit(); sync(`¡Adentro! ${b.name}`);
          }
          if (Math.abs(b.vy) < 45 && Math.abs(b.vx) < 30) {
            b.rest += dt;
            if (b.rest > 0.35) {
              b.done = true; b.vx = 0; b.vy = 0; b.a = 0; b.y = surf.top - b.h / 2;
              if (inBox) {
                // queda apilada dentro del salón y se mueve con él
                b.stacked = true; b.rel = b.x - target.x; b.layer = surf.layer;
                if (b.layer >= 3 && b.layer % 3 === 0) { score += 300; pops.push({ x: b.x, y: b.y - 80, t: "¡Torre de 3! +300", life: 1.8, color: "#C96F4A" }); sTower(); shake = 6; sync("¡Torre de 3 piezas!"); }
              } else if (!b.scored) { combo = 0; sMiss(); sync("Afuera… probá con más o menos fuerza"); }
            }
          }
        }
        if (b.x > W + 120 || b.x < -120) { b.done = true; if (!b.scored) { combo = 0; sMiss(); sync("Se fue del salón"); } }
      }
      // si una pila crece más que el salón, la de arriba se cae
      for (const s of stacked()) if (s.y - s.h / 2 < 40) { s.stacked = false; s.done = false; s.vx = target.dir * 120; s.vy = -100; s.va = 4; }
      flying = flying.filter((b) => b.stacked || !(b.done && (b.x > W + 100 || b.x < -100))).slice(-24);
      shake *= 0.86; boxShake = Math.max(0, boxShake - dt);

      // dibujo
      ctx.save();
      if (shake > 0.3) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#F4EFE7"); sky.addColorStop(1, "#EAE3D7"); ctx.fillStyle = sky; ctx.fillRect(-20, -20, W + 40, H + 40);
      ctx.fillStyle = "rgba(30,77,61,.06)"; for (let i = 0; i < 12; i++) ctx.fillRect(i * 90, 60, 3, GROUND - 60);
      ctx.fillStyle = "#D8CEBE"; ctx.fillRect(-20, GROUND, W + 40, H - GROUND + 20); ctx.fillStyle = "#C9BEAB"; ctx.fillRect(-20, GROUND, W + 40, 3);
      // salón (se sacude cuando entra algo)
      const bx = target.x + (boxShake > 0 ? Math.sin(now / 18) * 4 * (boxShake / 0.35) : 0);
      ctx.fillStyle = "#1E4D3D"; ctx.fillRect(bx, GROUND - 90, 8, 90); ctx.fillRect(bx + target.w - 8, GROUND - 90, 8, 90); ctx.fillRect(bx, GROUND - 18, target.w, 18);
      ctx.fillStyle = "#C96F4A"; ctx.fillRect(bx - 4, GROUND - 98, 16, 8); ctx.fillRect(bx + target.w - 12, GROUND - 98, 16, 8);
      ctx.fillStyle = "#F4EFE7"; ctx.font = "600 12px DM Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText("SALÓN", bx + target.w / 2, GROUND - 4);
      // gomera
      ctx.strokeStyle = "#163B2F"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(SLING.x, GROUND); ctx.lineTo(SLING.x, SLING.y + 34); ctx.stroke();
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(SLING.x, SLING.y + 34); ctx.lineTo(SLING.x - 26, SLING.y - 6); ctx.moveTo(SLING.x, SLING.y + 34); ctx.lineTo(SLING.x + 26, SLING.y - 6); ctx.stroke();
      if (loaded) {
        ctx.strokeStyle = "#A9573A"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(SLING.x - 26, SLING.y - 6); ctx.lineTo(loaded.x, loaded.y); ctx.lineTo(SLING.x + 26, SLING.y - 6); ctx.stroke();
        if (drag) { // trayectoria estimada (sin viento: hay que corregir a ojo)
          const pw = PHYS[loaded.kind].power;
          let x = loaded.x, y = loaded.y, vx = (SLING.x - loaded.x) * POWER * pw, vy = (SLING.y - loaded.y) * POWER * pw; ctx.fillStyle = "rgba(30,77,61,.35)";
          for (let i = 0; i < 22; i++) { vy += G * 0.035; x += vx * 0.035; y += vy * 0.035; if (y > GROUND) break; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
        }
        drawPiece(loaded);
      }
      for (const b of flying) drawPiece(b);
      for (const d of dust) { d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 200 * dt; ctx.globalAlpha = Math.max(0, d.life) * 0.55; ctx.fillStyle = "#B9AD98"; ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (1.6 - d.life), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1; dust = dust.filter((d) => d.life > 0);
      for (const p of pops) { p.life -= dt; p.y -= 30 * dt; ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.fillStyle = p.color; ctx.font = "700 22px Fraunces, serif"; ctx.textAlign = "center"; ctx.fillText(p.t, p.x, p.y); ctx.globalAlpha = 1; }
      pops = pops.filter((p) => p.life > 0);
      ctx.restore();
      drawWind();
      if (over) { ctx.fillStyle = "rgba(22,59,47,.82)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#F4EFE7"; ctx.textAlign = "center"; ctx.font = "500 54px Fraunces, serif"; ctx.fillText(`${score} puntos`, W / 2, H / 2 - 10); ctx.font = "16px DM Sans, sans-serif"; ctx.fillText(score >= best && score > 0 ? "¡Nuevo récord!" : `Récord: ${best}`, W / 2, H / 2 + 28); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("pointerdown", down); c.removeEventListener("pointermove", move); c.removeEventListener("pointerup", up); c.removeEventListener("pointercancel", up); ac?.close().catch(() => {}); };
  }, [pieces]);

  return (
    <>
      <div className="adm-h"><div><h2>sagg.io</h2><p>Revoleá muebles del catálogo adentro del salón. {THROWS} tiros por partida. Las mesas y sillones pesan más, las banquetas giran más, el viento cambia en cada tiro y si apilás 3 piezas sumás +300.</p></div></div>
      <div className="sg-hud">
        <span><b>{hud.score}</b> puntos</span><span><b>{hud.left}</b> tiros</span><span>Récord <b>{hud.best}</b></span>{hud.combo > 1 && <span className="sg-combo">combo x{hud.combo}</span>}
        <span className="sg-kind">{hud.kind}</span>
        <span className="sg-msg">{hud.msg}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setSound((s) => !s)} aria-pressed={sound}>{sound ? "Sonido: sí" : "Sonido: no"}</button>
        <button className="btn btn-dark btn-sm" onClick={() => restart.current()}>Jugar de nuevo</button>
      </div>
      <canvas ref={cv} width={W} height={H} className="sg-canvas" aria-label="Juego sagg.io: arrastrá y soltá para revolear muebles" />
    </>
  );
}
