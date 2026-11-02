"use client";
import { useEffect, useRef, useState } from "react";

type Piece = { name: string; img: string };
type Body = { x: number; y: number; vx: number; vy: number; a: number; va: number; w: number; h: number; im: HTMLImageElement; name: string; done: boolean; scored: boolean; rest: number };

const W = 960, H = 540, GROUND = H - 46, SLING = { x: 150, y: GROUND - 120 }, THROWS = 10, G = 900;

/** sagg.io — arrastrá la pieza hacia atrás y soltala para revolearla dentro del salón. */
export function SaggioGame({ pieces }: { pieces: Piece[] }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, left: THROWS, best: 0, msg: "Arrastrá la silla hacia atrás y soltala", over: false, combo: 0 });
  const restart = useRef<() => void>(() => {});

  useEffect(() => {
    const c = cv.current!; const ctx = c.getContext("2d")!;
    const imgs = pieces.map((p) => { const im = new Image(); im.src = p.img; return { im, name: p.name }; });
    let best = 0; try { best = Number(localStorage.getItem("saggio-best") || 0); } catch { /* sin almacenamiento */ }
    let score = 0, left = THROWS, combo = 0, over = false, t0 = performance.now(), last = t0;
    let loaded: Body | null = null, flying: Body[] = [], drag: { x: number; y: number } | null = null, pops: { x: number; y: number; t: string; life: number }[] = [];
    const target = { x: 700, w: 170, dir: 1, speed: 60 };
    const pick = () => imgs[Math.floor(Math.random() * Math.max(1, imgs.length))];
    const load = () => {
      if (left <= 0) { over = true; if (score > best) { best = score; try { localStorage.setItem("saggio-best", String(best)); } catch { /* */ } } sync("¡Fin! Tocá «Jugar de nuevo»"); return; }
      const p = pick(); const w = 74, h = 74;
      loaded = { x: SLING.x, y: SLING.y, vx: 0, vy: 0, a: 0, va: 0, w, h, im: p?.im ?? new Image(), name: p?.name ?? "Silla", done: false, scored: false, rest: 0 };
    };
    const sync = (msg?: string) => setHud((s) => ({ score, left, best, combo, over, msg: msg ?? s.msg }));
    restart.current = () => { score = 0; left = THROWS; combo = 0; over = false; flying = []; pops = []; target.speed = 60; load(); sync("Arrastrá la silla hacia atrás y soltala"); };
    load(); sync();

    const pos = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
    const down = (e: PointerEvent) => { if (!loaded || over) return; const p = pos(e); if (Math.hypot(p.x - loaded.x, p.y - loaded.y) < 90) { drag = p; c.setPointerCapture(e.pointerId); } };
    const move = (e: PointerEvent) => { if (!drag || !loaded) return; const p = pos(e); const dx = p.x - SLING.x, dy = p.y - SLING.y, d = Math.min(110, Math.hypot(dx, dy)), k = d / (Math.hypot(dx, dy) || 1); loaded.x = SLING.x + dx * k; loaded.y = SLING.y + dy * k; };
    const up = () => {
      if (!drag || !loaded) return; drag = null;
      const dx = SLING.x - loaded.x, dy = SLING.y - loaded.y; if (Math.hypot(dx, dy) < 12) { loaded.x = SLING.x; loaded.y = SLING.y; return; }
      loaded.vx = dx * 7.2; loaded.vy = dy * 7.2; loaded.va = (Math.random() - 0.5) * 12; flying.push(loaded); loaded = null; left--; sync("¡Allá va!");
      setTimeout(load, 700);
    };
    c.addEventListener("pointerdown", down); c.addEventListener("pointermove", move); c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);

    const drawPiece = (b: Body) => {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
      if (b.im.complete && b.im.naturalWidth) {
        const r = Math.min(b.w / b.im.naturalWidth, b.h / b.im.naturalHeight); const w = b.im.naturalWidth * r, h = b.im.naturalHeight * r;
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(-b.w / 2 - 4, -b.h / 2 - 4, b.w + 8, b.h + 8, 10); ctx.fill();
        ctx.drawImage(b.im, -w / 2, -h / 2, w, h);
      } else { ctx.fillStyle = "#C96F4A"; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); }
      ctx.restore();
    };
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      // salón (objetivo) que se mueve
      target.x += target.dir * target.speed * dt; if (target.x < 430 || target.x + target.w > W - 30) target.dir *= -1;
      for (const b of flying) {
        if (b.done) continue;
        b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
        const inBox = b.x > target.x + 8 && b.x < target.x + target.w - 8;
        const floor = inBox ? GROUND - 18 : GROUND;
        // paredes del salón
        if (b.y > GROUND - 90 && !inBox && Math.abs(b.x - target.x) < 10) { b.vx *= -0.5; b.x = target.x - 10; }
        if (b.y > GROUND - 90 && !inBox && Math.abs(b.x - (target.x + target.w)) < 10) { b.vx *= -0.5; b.x = target.x + target.w + 10; }
        if (b.y + b.h / 2 > floor) {
          b.y = floor - b.h / 2; b.vy *= -0.38; b.vx *= 0.72; b.va *= 0.6;
          if (inBox && !b.scored) {
            b.scored = true; combo++; const pts = 100 + (combo - 1) * 50; score += pts; target.speed += 18;
            pops.push({ x: b.x, y: b.y - 50, t: `+${pts}${combo > 1 ? ` · combo x${combo}` : ""}`, life: 1.4 }); sync(`¡Adentro! ${b.name}`);
          }
          if (Math.abs(b.vy) < 40 && Math.abs(b.vx) < 25) { b.rest += dt; if (b.rest > 0.4) { b.done = true; if (!b.scored) { combo = 0; sync("Afuera… probá con más o menos fuerza"); } } }
        }
        if (b.x > W + 120 || b.x < -120) { b.done = true; if (!b.scored) { combo = 0; sync("Se fue del salón"); } }
      }
      flying = flying.filter((b) => !(b.done && (b.x > W + 100 || b.x < -100))).slice(-14);

      // dibujo
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#F4EFE7"); sky.addColorStop(1, "#EAE3D7"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(30,77,61,.06)"; for (let i = 0; i < 12; i++) ctx.fillRect(i * 90 + ((now / 80) % 90), 60, 3, GROUND - 60);
      ctx.fillStyle = "#D8CEBE"; ctx.fillRect(0, GROUND, W, H - GROUND); ctx.fillStyle = "#C9BEAB"; ctx.fillRect(0, GROUND, W, 3);
      // salón
      ctx.fillStyle = "#1E4D3D"; ctx.fillRect(target.x, GROUND - 90, 8, 90); ctx.fillRect(target.x + target.w - 8, GROUND - 90, 8, 90); ctx.fillRect(target.x, GROUND - 18, target.w, 18);
      ctx.fillStyle = "#C96F4A"; ctx.fillRect(target.x - 4, GROUND - 98, 16, 8); ctx.fillRect(target.x + target.w - 12, GROUND - 98, 16, 8);
      ctx.fillStyle = "#F4EFE7"; ctx.font = "600 12px DM Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText("SALÓN", target.x + target.w / 2, GROUND - 4);
      // gomera
      ctx.strokeStyle = "#163B2F"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(SLING.x, GROUND); ctx.lineTo(SLING.x, SLING.y + 34); ctx.stroke();
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(SLING.x, SLING.y + 34); ctx.lineTo(SLING.x - 26, SLING.y - 6); ctx.moveTo(SLING.x, SLING.y + 34); ctx.lineTo(SLING.x + 26, SLING.y - 6); ctx.stroke();
      if (loaded) {
        ctx.strokeStyle = "#A9573A"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(SLING.x - 26, SLING.y - 6); ctx.lineTo(loaded.x, loaded.y); ctx.lineTo(SLING.x + 26, SLING.y - 6); ctx.stroke();
        if (drag) { // trayectoria estimada
          let x = loaded.x, y = loaded.y, vx = (SLING.x - loaded.x) * 7.2, vy = (SLING.y - loaded.y) * 7.2; ctx.fillStyle = "rgba(30,77,61,.35)";
          for (let i = 0; i < 26; i++) { vy += G * 0.035; x += vx * 0.035; y += vy * 0.035; if (y > GROUND) break; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
        }
        drawPiece(loaded);
      }
      for (const b of flying) drawPiece(b);
      for (const p of pops) { p.life -= dt; p.y -= 30 * dt; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = "#1E4D3D"; ctx.font = "700 22px Fraunces, serif"; ctx.textAlign = "center"; ctx.fillText(p.t, p.x, p.y); ctx.globalAlpha = 1; }
      pops = pops.filter((p) => p.life > 0);
      if (over) { ctx.fillStyle = "rgba(22,59,47,.82)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#F4EFE7"; ctx.textAlign = "center"; ctx.font = "500 54px Fraunces, serif"; ctx.fillText(`${score} puntos`, W / 2, H / 2 - 10); ctx.font = "16px DM Sans, sans-serif"; ctx.fillText(score >= best && score > 0 ? "¡Nuevo récord!" : `Récord: ${best}`, W / 2, H / 2 + 28); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("pointerdown", down); c.removeEventListener("pointermove", move); c.removeEventListener("pointerup", up); c.removeEventListener("pointercancel", up); };
  }, [pieces]);

  return (
    <>
      <div className="adm-h"><div><h2>sagg.io</h2><p>Revoleá sillas y mesas del catálogo adentro del salón. {THROWS} tiros por partida; cada acierto seguido suma combo y el salón se mueve más rápido.</p></div></div>
      <div className="sg-hud">
        <span><b>{hud.score}</b> puntos</span><span><b>{hud.left}</b> tiros</span><span>Récord <b>{hud.best}</b></span>{hud.combo > 1 && <span className="sg-combo">combo x{hud.combo}</span>}
        <span className="sg-msg">{hud.msg}</span>
        <button className="btn btn-dark btn-sm" onClick={() => restart.current()}>Jugar de nuevo</button>
      </div>
      <canvas ref={cv} width={W} height={H} className="sg-canvas" aria-label="Juego sagg.io: arrastrá y soltá para revolear muebles" />
    </>
  );
}
