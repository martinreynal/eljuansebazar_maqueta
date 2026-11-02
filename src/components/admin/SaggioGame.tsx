"use client";
import { useEffect, useRef, useState } from "react";
import { saggioSubmit, type Ranking } from "@/app/admin/saggio-actions";

type Kind = "silla" | "mesa" | "banqueta" | "pesado";
type Piece = { name: string; img: string; kind: Kind; golden?: boolean; fragile?: boolean };
type Body = {
  x: number; y: number; vx: number; vy: number; a: number; va: number; w: number; h: number;
  im: HTMLImageElement; name: string; kind: Kind; golden: boolean; fragile: boolean; boss: boolean;
  done: boolean; scored: boolean; rest: number; stacked: boolean; rel: number; layer: number;
  hitMozo: boolean; broken: boolean; armado: boolean; power: number;
};
type Fx = { x: number; y: number; vx: number; vy: number; life: number; r: number; color: string };
type Mode = "normal" | "diario";
type Phase = "menu" | "play" | "shop" | "over";
type Level = { name: string; goal: number; wind: number; mozo?: boolean; fan?: boolean; column?: boolean; ceiling?: number; onlyBanq?: boolean; orders?: boolean; vip?: boolean; boss?: boolean; tip: string };

const W = 960, H = 540, GROUND = H - 46, SLING = { x: 150, y: GROUND - 120 }, G = 900, POWER = 7.2, CAPACITY = 6, SHOT_TIME = 5, BASE_THROWS = 8, COST = 150;
const PHYS: Record<Kind, { power: number; bounce: number; spin: number; w: number; h: number; label: string; order: string }> = {
  silla: { power: 1, bounce: 0.4, spin: 1, w: 74, h: 74, label: "Silla", order: "silla" },
  mesa: { power: 0.86, bounce: 0.18, spin: 0.45, w: 92, h: 70, label: "Mesa · pesada", order: "mesa" },
  banqueta: { power: 1.02, bounce: 0.46, spin: 1.9, w: 64, h: 80, label: "Banqueta · gira mucho", order: "banqueta" },
  pesado: { power: 0.8, bounce: 0.15, spin: 0.35, w: 96, h: 72, label: "Sillón · muy pesado", order: "sillón" },
};
const LEVELS: Level[] = [
  { name: "Salón", goal: 350, wind: 0.6, vip: true, tip: "Las esquinas del salón valen x2 y la mesita VIP x5." },
  { name: "Terraza", goal: 450, wind: 1.8, mozo: true, orders: true, vip: true, tip: "Viento fuerte y un mozo que cruza: no le pegues. Cumplí la comanda." },
  { name: "Barra", goal: 450, wind: 0.8, fan: true, mozo: true, onlyBanq: true, vip: true, tip: "En la barra solo valen banquetas. Cuidado con el ventilador." },
  { name: "Lobby de hotel", goal: 550, wind: 0.7, column: true, ceiling: 190, mozo: true, orders: true, vip: true, tip: "Techo bajo y una columna: tirá más rasante." },
  { name: "Jefe final", goal: 0, wind: 1, fan: true, mozo: true, vip: true, boss: true, tip: "El último tiro es el sofá gigante: cargalo 3 veces y metelo." },
];

/** Generador pseudoaleatorio con semilla (el desafío del día usa la fecha). */
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const todaySeed = () => Number(new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).replace(/-/g, ""));

type Hud = {
  phase: Phase; mode: Mode; level: number; levelName: string; tip: string; goal: number; levelScore: number; score: number; throws: number; best: number; combo: number; msg: string;
  options: { name: string; kind: Kind; golden: boolean; fragile: boolean }[]; loaded: string; timer: number; bet: "none" | "offer" | "active";
  order: string; stack: number; boss: number; won: boolean; magnet: number; power: number; extra: number;
};

/** sagg.io — juego interno del panel. */
export function SaggioGame({ pieces, ranking: initialRanking }: { pieces: Piece[]; ranking: Ranking }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ start: (m: Mode) => void; choose: (i: number) => void; buy: (k: "power" | "extra" | "magnet") => void; next: () => void; cash: () => void; risk: () => void }>(null);
  const [hud, setHud] = useState<Hud>({ phase: "menu", mode: "normal", level: 0, levelName: "", tip: "", goal: 0, levelScore: 0, score: 0, throws: 0, best: 0, combo: 0, msg: "", options: [], loaded: "", timer: SHOT_TIME, bet: "none", order: "", stack: 0, boss: 0, won: false, magnet: 0, power: 1, extra: 0 });
  const [ranking, setRanking] = useState(initialRanking);
  const [sound, setSound] = useState(true);
  const soundRef = useRef(true);
  useEffect(() => { soundRef.current = sound; }, [sound]);

  useEffect(() => {
    const c = cv.current!; const ctx = c.getContext("2d")!;
    const imgs = pieces.map((p) => { const im = new Image(); im.src = p.img; return { ...p, im }; });
    const bossIm = imgs.find((p) => p.kind === "pesado")?.im ?? new Image();
    let best = 0; try { best = Number(localStorage.getItem("saggio-best") || 0); } catch { /* sin almacenamiento */ }

    // ---------- estado del juego ----------
    let rng = Math.random, mode: Mode = "normal", phase: Phase = "menu";
    let li = 0, score = 0, levelScore = 0, throws = 0, combo = 0, wind = 0, msg = "", won = false;
    let powerUp = 1, extraThrows = 0, magnet = 0;
    let loaded: Body | null = null, flying: Body[] = [], options: (typeof imgs)[number][] = [];
    let drag: { x: number; y: number } | null = null, timer = SHOT_TIME, bet: "none" | "offer" | "active" = "none", bossCharge = 0;
    let order: Record<string, number> = {}, got: Record<string, number> = {};
    let pops: { x: number; y: number; t: string; life: number; color: string }[] = [], fx: Fx[] = [];
    let shake = 0, boxShake = 0, last = performance.now(), hudTick = 0;
    const target = { x: 700, w: 220, dir: 1, speed: 55, vip: 110 };
    const mozo = { x: 260, dir: 1, stun: 0 };
    const fan = { x: 470, y: 130, r: 90 };
    const L = () => LEVELS[li];

    // ---------- sonido ----------
    let ac: AudioContext | null = null;
    const tone = (f1: number, f2: number, dur: number, type: OscillatorType, vol = 0.16) => {
      if (!soundRef.current) return;
      try {
        ac ??= new AudioContext();
        const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
        o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur);
      } catch { /* sin audio */ }
    };
    const sHit = () => { tone(520, 1040, 0.14, "triangle"); setTimeout(() => tone(780, 1560, 0.16, "triangle", 0.12), 90); };
    const sMiss = () => tone(180, 70, 0.32, "sawtooth", 0.09);
    const sThud = (v: number) => tone(120, 50, 0.12, "sine", Math.min(0.24, v / 2400));
    const sJingle = (n = 3) => Array.from({ length: n }).forEach((_, i) => setTimeout(() => tone(600 + i * 200, 1200 + i * 300, 0.18, "square", 0.07), i * 90));
    const sCrash = () => { tone(900, 200, 0.25, "square", 0.08); setTimeout(() => tone(1400, 300, 0.2, "square", 0.06), 60); };

    // ---------- HUD ----------
    const sync = (m?: string) => {
      if (m !== undefined) msg = m;
      const need = Object.entries(order).map(([k, n]) => `${got[k] ?? 0}/${n} ${k}${n > 1 ? (k.endsWith("n") ? "es" : "s") : ""}`).join(" · ");
      setHud({
        phase, mode, level: li + 1, levelName: L()?.name ?? "", tip: L()?.tip ?? "", goal: L()?.goal ?? 0, levelScore, score, throws, best, combo, msg,
        options: options.map((o) => ({ name: o.name, kind: o.kind, golden: !!o.golden, fragile: !!o.fragile })),
        loaded: loaded ? `${loaded.boss ? "Sofá gigante" : loaded.name} · ${loaded.boss ? "jefe" : PHYS[loaded.kind].label}${loaded.golden ? " · ★ x3" : ""}${loaded.fragile ? " · frágil" : ""}` : "",
        timer: Math.ceil(timer), bet, order: need, stack: flying.filter((b) => b.stacked).length, boss: bossCharge, won, magnet, power: powerUp, extra: extraThrows,
      });
    };
    const addScore = (n: number) => { score = Math.max(0, score + n); levelScore = Math.max(0, levelScore + n); };
    const pop = (x: number, y: number, t: string, color = "#1E4D3D", life = 1.4) => pops.push({ x, y, t, life, color });
    const burst = (x: number, y: number, n: number, color: string, spread = 160) => { for (let i = 0; i < n; i++) fx.push({ x: x + (rng() - 0.5) * 40, y, vx: (rng() - 0.5) * spread, vy: -rng() * 140, life: 0.6 + rng() * 0.4, r: 4 + rng() * 6, color }); };

    // ---------- flujo ----------
    const newWind = () => { wind = Math.round((rng() * 2 - 1) * 10) / 10 * (L()?.wind ?? 1); if (Math.abs(wind) < 0.12) wind = 0; };
    const newOrder = () => {
      order = {}; got = {};
      if (!L().orders) return;
      const kinds = ["silla", "mesa", "banqueta", "sillón"];
      const a = kinds[Math.floor(rng() * 2)], b = kinds[Math.floor(rng() * kinds.length)];
      order[a] = (order[a] ?? 0) + 2; order[b] = (order[b] ?? 0) + 1;
    };
    const pickPiece = () => {
      const pool = L().onlyBanq && rng() < 0.7 ? imgs.filter((p) => p.kind === "banqueta") : imgs;
      const list = pool.length ? pool : imgs;
      if (rng() < 0.12) { const stars = imgs.filter((p) => p.golden); if (stars.length) return stars[Math.floor(rng() * stars.length)]; }
      return list[Math.floor(rng() * list.length)];
    };
    const makeBody = (p: (typeof imgs)[number] | null, boss = false): Body => {
      const kind: Kind = boss ? "pesado" : p?.kind ?? "silla"; const ph = PHYS[kind];
      return { x: SLING.x, y: SLING.y, vx: 0, vy: 0, a: 0, va: 0, w: boss ? 150 : ph.w, h: boss ? 100 : ph.h, im: boss ? bossIm : p?.im ?? new Image(), name: boss ? "Sofá gigante" : p?.name ?? "Silla", kind, golden: !boss && !!p?.golden, fragile: !boss && (!!p?.fragile || rng() < 0.1), boss, done: false, scored: false, rest: 0, stacked: false, rel: 0, layer: 0, hitMozo: false, broken: false, armado: false, power: boss ? 0.72 : ph.power };
    };
    const nextShot = () => {
      if (phase !== "play") return;
      if (throws <= 0) { endLevel(); return; }
      newWind(); timer = SHOT_TIME; loaded = null;
      if (L().boss && throws === 1) { loaded = makeBody(null, true); bossCharge = 0; options = []; sync("¡El jefe! Tensá y soltá 3 veces para cargarlo"); return; }
      options = imgs.length ? [pickPiece(), pickPiece()] : [];
      if (!options.length) { loaded = makeBody(null); }
      sync(options.length ? "Elegí la próxima pieza" : undefined);
    };
    const settleAll = () => !flying.some((b) => !b.done && !b.stacked);
    const endLevel = () => {
      const wait = () => {
        if (!settleAll()) { setTimeout(wait, 300); return; }
        if (L().boss) { won = true; return gameOver(); }
        if (levelScore < L().goal) return gameOver();
        phase = "shop"; sJingle(4); sync(`¡Nivel superado! ${levelScore} / ${L().goal}`);
      };
      setTimeout(wait, 600);
    };
    const gameOver = () => {
      phase = "over"; loaded = null; options = [];
      if (score > best) { best = score; try { localStorage.setItem("saggio-best", String(best)); } catch { /* */ } }
      sync(won ? "¡Ganaste sagg.io!" : "Fin de la partida");
      saggioSubmit({ score, mode, level: li + 1 }).then(setRanking).catch(() => {});
    };
    const startLevel = () => {
      throws = BASE_THROWS + extraThrows + (L().boss ? 0 : 0); levelScore = 0; combo = 0; bet = "none";
      flying = []; fx = []; pops = []; target.speed = 55 + li * 12; target.vip = 60 + rng() * 100; fan.x = 400 + rng() * 160;
      newOrder(); phase = "play"; nextShot(); sync(L().tip);
    };
    const start = (m: Mode) => {
      mode = m; rng = m === "diario" ? mulberry(todaySeed()) : Math.random;
      li = 0; score = 0; won = false; powerUp = 1; extraThrows = 0; magnet = 0; startLevel();
    };
    const choose = (i: number) => {
      if (phase !== "play" || !options[i] || loaded) return;
      loaded = makeBody(options[i]); options = []; timer = SHOT_TIME; sync("Tensá y soltá");
    };
    const buy = (k: "power" | "extra" | "magnet") => {
      if (phase !== "shop" || score < COST) return;
      score -= COST; if (k === "power") powerUp *= 1.12; if (k === "extra") extraThrows += 1; if (k === "magnet") magnet += 1;
      tone(700, 900, 0.12, "triangle", 0.1); sync(k === "power" ? "Gomera más fuerte" : k === "extra" ? "Tiro extra por nivel" : "Silla imán lista");
    };
    const next = () => { if (phase !== "shop") return; li = Math.min(LEVELS.length - 1, li + 1); startLevel(); };
    const cash = () => { if (bet !== "offer") return; addScore(200); bet = "none"; pop(W / 2, 140, "+200 cobrado", "#C96F4A"); sync("Combo cobrado"); };
    const risk = () => { if (bet !== "offer") return; bet = "active"; sync("Apostaste: si el próximo entra +400, si no −200"); };
    api.current = { start, choose, buy, next, cash, risk };
    sync("Elegí un modo para empezar");

    // ---------- control ----------
    const release = (auto = false) => {
      if (!loaded) return;
      let dx = SLING.x - loaded.x, dy = SLING.y - loaded.y;
      if (auto && Math.hypot(dx, dy) < 12) { dx = 30; dy = -10; }
      if (!auto && Math.hypot(dx, dy) < 12) { loaded.x = SLING.x; loaded.y = SLING.y; return; }
      if (loaded.boss && bossCharge < 2) {
        bossCharge++; loaded.x = SLING.x; loaded.y = SLING.y; shake = 4; tone(200 + bossCharge * 120, 400 + bossCharge * 200, 0.2, "square", 0.08);
        timer = SHOT_TIME; sync(`Carga ${bossCharge}/3`); return;
      }
      const pw = loaded.power * powerUp * (loaded.boss ? 1.25 : 1);
      loaded.vx = dx * POWER * pw; loaded.vy = dy * POWER * pw; loaded.va = (rng() - 0.5) * 12 * PHYS[loaded.kind].spin;
      flying.push(loaded); loaded = null; throws--; tone(300, 160, 0.08, "sine", 0.06);
      sync(auto ? "¡Se escapó solo!" : "¡Allá va!");
      setTimeout(nextShot, 800);
    };
    const pos = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
    const down = (e: PointerEvent) => { if (!loaded || phase !== "play") return; const p = pos(e); if (Math.hypot(p.x - loaded.x, p.y - loaded.y) < 95) { drag = p; c.setPointerCapture(e.pointerId); } };
    const move = (e: PointerEvent) => { if (!drag || !loaded) return; const p = pos(e); const dx = p.x - SLING.x, dy = p.y - SLING.y, d = Math.min(110, Math.hypot(dx, dy)), k = d / (Math.hypot(dx, dy) || 1); loaded.x = SLING.x + dx * k; loaded.y = SLING.y + dy * k; };
    const up = () => { if (!drag) return; drag = null; release(); };
    c.addEventListener("pointerdown", down); c.addEventListener("pointermove", move); c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);

    // ---------- puntaje ----------
    const stacked = () => flying.filter((b) => b.stacked);
    const surfaceIn = (b: Body) => {
      let top = GROUND - 18, layer = 1;
      for (const s of stacked()) { const sx = target.x + s.rel; if (Math.abs(sx - b.x) < (s.w + b.w) * 0.36) { const t = s.y - s.h / 2; if (t < top) { top = t; layer = s.layer + 1; } } }
      return { top, layer };
    };
    const scorePiece = (b: Body) => {
      b.scored = true; boxShake = 0.35;
      const rel = b.x - target.x;
      if (stacked().length >= CAPACITY) { combo = 0; pop(b.x, b.y - 50, "Salón lleno", "#A9573A"); sMiss(); sync("El salón está lleno (6 piezas)"); return; }
      if (L().onlyBanq && b.kind !== "banqueta" && !b.boss) { combo = 0; pop(b.x, b.y - 50, "En la barra solo banquetas", "#A9573A"); sMiss(); sync("En la barra solo valen banquetas"); return; }
      combo++;
      let pts = b.boss ? 1000 : 100, tag = "";
      if (L().vip && Math.abs(rel - target.vip) < 30) { pts *= 5; tag = " · VIP x5"; }
      else if (rel < target.w * 0.22 || rel > target.w * 0.78) { pts *= 2; tag = " · esquina x2"; }
      if (b.golden) { pts *= 3; tag += " · ★ x3"; }
      pts += (combo - 1) * 50;
      if (bet === "active") { pts += 400; tag += " · apuesta +400"; bet = "none"; }
      addScore(pts); target.speed += 12;
      pop(b.x, b.y - 50, `+${pts}${tag}${combo > 1 ? ` · combo x${combo}` : ""}`); sHit();
      // comanda
      if (L().orders && !b.boss) {
        const k = PHYS[b.kind].order;
        if ((order[k] ?? 0) > (got[k] ?? 0)) {
          got[k] = (got[k] ?? 0) + 1;
          if (Object.entries(order).every(([kk, n]) => (got[kk] ?? 0) >= n)) { addScore(500); pop(W / 2, 120, "¡Comanda completa! +500", "#C96F4A", 2); sJingle(4); newOrder(); }
        } else { addScore(-50); pop(b.x, b.y - 80, "No estaba en la comanda −50", "#A9573A"); }
      }
      if (combo >= 3 && combo % 3 === 0 && bet === "none") bet = "offer";
      sync(`¡Adentro! ${b.name}`);
    };
    const checkArmado = (b: Body) => {
      for (const s of stacked()) {
        if (s === b || s.layer !== 1 || b.layer !== 1) continue;
        const pair = (b.kind === "silla" && s.kind === "mesa") || (b.kind === "mesa" && s.kind === "silla");
        if (pair && !b.armado && Math.abs(s.rel - b.rel) < (s.w + b.w) / 2 + 14) { b.armado = true; addScore(150); pop(b.x, b.y - 90, "¡Mesa armada! +150", "#C96F4A", 1.8); sJingle(2); sync("¡Mesa armada!"); return; }
      }
    };
    const miss = (b: Body, text: string) => {
      if (b.scored) return;
      combo = 0; sMiss();
      if (bet === "active") { addScore(-200); bet = "none"; pop(W / 2, 140, "Apuesta perdida −200", "#A9573A"); }
      sync(text);
    };

    // ---------- dibujo ----------
    const drawPiece = (b: Body) => {
      if (b.broken) return;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
      ctx.fillStyle = b.golden ? "#E8C468" : "#fff"; ctx.beginPath(); ctx.roundRect(-b.w / 2 - 5, -b.h / 2 - 5, b.w + 10, b.h + 10, 10); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(-b.w / 2 - 1, -b.h / 2 - 1, b.w + 2, b.h + 2, 8); ctx.fill();
      if (b.im.complete && b.im.naturalWidth) { const r = Math.min(b.w / b.im.naturalWidth, b.h / b.im.naturalHeight); ctx.drawImage(b.im, (-b.im.naturalWidth * r) / 2, (-b.im.naturalHeight * r) / 2, b.im.naturalWidth * r, b.im.naturalHeight * r); }
      else { ctx.fillStyle = "#C96F4A"; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); }
      if (b.fragile) { ctx.fillStyle = "#A9573A"; ctx.font = "700 9px DM Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText("FRÁGIL", 0, b.h / 2 + 1); }
      if (b.golden) { ctx.fillStyle = "#B8860B"; ctx.font = "700 14px sans-serif"; ctx.textAlign = "center"; ctx.fillText("★", b.w / 2 - 4, -b.h / 2 + 10); }
      ctx.restore();
    };
    const drawMozo = () => {
      const x = mozo.x, y = GROUND, s = mozo.stun > 0;
      ctx.save(); ctx.translate(x, y); if (s) ctx.rotate(Math.sin(performance.now() / 60) * 0.15);
      ctx.fillStyle = "#22372F"; ctx.fillRect(-8, -48, 6, 48); ctx.fillRect(2, -48, 6, 48);
      ctx.fillStyle = "#fff"; ctx.fillRect(-14, -92, 28, 46); ctx.fillStyle = "#22372F"; ctx.fillRect(-14, -70, 28, 4);
      ctx.fillStyle = "#E9C9A8"; ctx.beginPath(); ctx.arc(0, -102, 11, 0, 7); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(10, -86); ctx.lineTo(28 * mozo.dir, -100); ctx.stroke();
      if (!s) { ctx.fillStyle = "#C9BEAB"; ctx.fillRect(28 * mozo.dir - 18, -106, 36, 5); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(28 * mozo.dir, -110, 14, 4, 0, 0, 7); ctx.fill(); }
      ctx.restore();
    };
    const drawWind = () => {
      const cx = W / 2, cy = 30;
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.roundRect(cx - 95, cy - 17, 190, 34, 17); ctx.fill();
      ctx.fillStyle = "#4A5F55"; ctx.font = "600 12px DM Sans, sans-serif"; ctx.textAlign = "left"; ctx.fillText("VIENTO", cx - 82, cy + 4);
      if (!wind) { ctx.fillStyle = "#6B7D73"; ctx.fillText("calma", cx + 18, cy + 4); return; }
      const len = Math.min(1, Math.abs(wind) / 1.8) * 70, dir = Math.sign(wind), ax = cx + 48;
      ctx.strokeStyle = "#C96F4A"; ctx.fillStyle = "#C96F4A"; ctx.lineWidth = 4; ctx.lineCap = "round";
      const x1 = ax - (dir * len) / 2, x2 = ax + (dir * len) / 2;
      ctx.beginPath(); ctx.moveTo(x1, cy); ctx.lineTo(x2, cy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x2 + dir * 8, cy); ctx.lineTo(x2 - dir * 4, cy - 7); ctx.lineTo(x2 - dir * 4, cy + 7); ctx.fill();
    };
    const drawScene = (now: number) => {
      const lv = L();
      const bg = lv?.name === "Terraza" ? ["#EAF0E8", "#DCE6DA"] : lv?.name === "Barra" ? ["#EFE4D6", "#E4D3BF"] : lv?.name === "Lobby de hotel" ? ["#EDE7DD", "#DFD5C6"] : lv?.boss ? ["#E9E0D6", "#D8CBBB"] : ["#F4EFE7", "#EAE3D7"];
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, bg[0]); sky.addColorStop(1, bg[1]); ctx.fillStyle = sky; ctx.fillRect(-20, -20, W + 40, H + 40);
      if (lv?.name === "Terraza") { ctx.fillStyle = "rgba(30,77,61,.12)"; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(60 + i * 130, 120 + Math.sin(i) * 20, 40, 0, 7); ctx.fill(); } }
      else { ctx.fillStyle = "rgba(30,77,61,.06)"; for (let i = 0; i < 12; i++) ctx.fillRect(i * 90, 60, 3, GROUND - 60); }
      if (lv?.ceiling) { ctx.fillStyle = "#4A5F55"; ctx.fillRect(-20, -20, W + 40, lv.ceiling + 20); ctx.fillStyle = "#E8C468"; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(120 + i * 150, lv.ceiling + 6, 6, 0, 7); ctx.fill(); } }
      ctx.fillStyle = "#D8CEBE"; ctx.fillRect(-20, GROUND, W + 40, H - GROUND + 20); ctx.fillStyle = "#C9BEAB"; ctx.fillRect(-20, GROUND, W + 40, 3);
      if (lv?.column) { ctx.fillStyle = "#B9AD98"; ctx.fillRect(540, GROUND - 200, 26, 200); ctx.fillStyle = "#A39782"; ctx.fillRect(534, GROUND - 210, 38, 12); }
      if (lv?.fan) {
        ctx.strokeStyle = "#4A5F55"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fan.x, lv.ceiling ?? 0); ctx.lineTo(fan.x, fan.y); ctx.stroke();
        ctx.save(); ctx.translate(fan.x, fan.y); ctx.rotate(now / 90); ctx.fillStyle = "#6B5A44"; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.ellipse(32, 0, 30, 6, 0, 0, 7); ctx.fill(); } ctx.restore();
        ctx.fillStyle = "rgba(30,77,61,.06)"; ctx.beginPath(); ctx.arc(fan.x, fan.y, fan.r, 0, 7); ctx.fill();
      }
      // salón
      const bx = target.x + (boxShake > 0 ? Math.sin(now / 18) * 4 * (boxShake / 0.35) : 0);
      ctx.fillStyle = "rgba(201,111,74,.12)"; ctx.fillRect(bx + 8, GROUND - 90, target.w * 0.22 - 8, 72); ctx.fillRect(bx + target.w * 0.78, GROUND - 90, target.w * 0.22 - 8, 72);
      if (lv?.vip) { const vx = bx + target.vip; ctx.fillStyle = "#E8C468"; ctx.fillRect(vx - 24, GROUND - 30, 48, 6); ctx.fillRect(vx - 3, GROUND - 24, 6, 6); ctx.fillStyle = "#8a6a10"; ctx.font = "700 10px DM Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText("VIP x5", vx, GROUND - 36); }
      ctx.fillStyle = "#1E4D3D"; ctx.fillRect(bx, GROUND - 90, 8, 90); ctx.fillRect(bx + target.w - 8, GROUND - 90, 8, 90); ctx.fillRect(bx, GROUND - 18, target.w, 18);
      ctx.fillStyle = "#C96F4A"; ctx.fillRect(bx - 4, GROUND - 98, 16, 8); ctx.fillRect(bx + target.w - 12, GROUND - 98, 16, 8);
      ctx.fillStyle = "#F4EFE7"; ctx.font = "600 12px DM Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText(`${lv?.onlyBanq ? "BARRA" : "SALÓN"} · ${stacked().length}/${CAPACITY}`, bx + target.w / 2, GROUND - 4);
      if (lv?.mozo) drawMozo();
      // gomera
      ctx.strokeStyle = "#163B2F"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(SLING.x, GROUND); ctx.lineTo(SLING.x, SLING.y + 34); ctx.stroke();
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(SLING.x, SLING.y + 34); ctx.lineTo(SLING.x - 26, SLING.y - 6); ctx.moveTo(SLING.x, SLING.y + 34); ctx.lineTo(SLING.x + 26, SLING.y - 6); ctx.stroke();
    };

    // ---------- bucle ----------
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const lv = L();
      if (phase === "play") {
        const prevX = target.x;
        target.x += target.dir * target.speed * dt;
        const minX = lv.column ? 590 : 430, maxX = W - 20 - target.w;
        if (target.x < minX) { target.x = minX; target.dir = 1; } else if (target.x > maxX) { target.x = maxX; target.dir = -1; }
        const boxDx = target.x - prevX;
        if (lv.mozo) { if (mozo.stun > 0) mozo.stun -= dt; else { mozo.x += mozo.dir * 75 * dt; if (mozo.x < 240 || mozo.x > (lv.column ? 500 : 620)) mozo.dir *= -1; } }
        if (loaded && !drag && options.length === 0) { timer -= dt; if (timer <= 0) release(true); }
        else if (loaded && drag) { timer -= dt; if (timer <= 0) { drag = null; release(true); } }

        for (const b of flying) {
          if (b.stacked) { b.x = target.x + b.rel; continue; }
          if (b.done) continue;
          const ph = PHYS[b.kind];
          b.vy += G * dt; b.vx += wind * 230 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
          // ventilador: desvía
          if (lv.fan && Math.hypot(b.x - fan.x, b.y - fan.y) < fan.r) { b.vx += (rng() - 0.5) * 2600 * dt; b.vy += 500 * dt; b.va += (rng() - 0.5) * 8 * dt; }
          // techo bajo
          if (lv.ceiling && b.y - b.h / 2 < lv.ceiling) { b.y = lv.ceiling + b.h / 2; b.vy = Math.abs(b.vy) * 0.4; sThud(400); }
          // columna
          if (lv.column && b.y + b.h / 2 > GROUND - 200 && b.x + b.w / 2 > 540 && b.x - b.w / 2 < 566) {
            if (b.y + b.h / 2 - b.vy * dt <= GROUND - 200) { b.y = GROUND - 200 - b.h / 2; b.vy = -Math.abs(b.vy) * 0.3; }
            else { b.vx = -b.vx * 0.5; b.x = b.x < 553 ? 540 - b.w / 2 : 566 + b.w / 2; sThud(500); }
          }
          // mozo
          if (lv.mozo && !b.hitMozo && mozo.stun <= 0 && Math.abs(b.x - mozo.x) < 26 + b.w / 3 && b.y + b.h / 2 > GROUND - 115) {
            b.hitMozo = true; b.vx = -b.vx * 0.35; b.vy = -Math.abs(b.vy) * 0.3; mozo.stun = 1.2; addScore(-80);
            burst(mozo.x + 28 * mozo.dir, GROUND - 110, 14, "#ffffff", 260); pop(mozo.x, GROUND - 140, "¡Le pegaste al mozo! −80", "#A9573A"); sCrash(); sync("¡Cuidado con el mozo!");
          }
          const inBox = b.x > target.x + 8 && b.x < target.x + target.w - 8;
          // imán: la silla se acomoda sobre la última pieza apilada
          if (magnet > 0 && b.kind === "silla" && inBox && b.vy > 0 && stacked().length) { const s = stacked()[stacked().length - 1]; b.vx += (target.x + s.rel - b.x) * 8 * dt * 10; }
          const surf = inBox ? surfaceIn(b) : { top: GROUND, layer: 0 };
          if (b.y > GROUND - 90 && !inBox && Math.abs(b.x - target.x) < 12) { b.vx = -Math.abs(b.vx) * 0.5 + boxDx / dt; b.x = target.x - 12; sThud(300); }
          if (b.y > GROUND - 90 && !inBox && Math.abs(b.x - (target.x + target.w)) < 12) { b.vx = Math.abs(b.vx) * 0.5 + boxDx / dt; b.x = target.x + target.w + 12; sThud(300); }
          if (b.y + b.h / 2 > surf.top) {
            const impact = Math.abs(b.vy);
            b.y = surf.top - b.h / 2; b.vy *= -ph.bounce; b.vx *= 0.7; b.va *= 0.55;
            if (b.fragile && impact > 620) {
              b.broken = true; b.done = true; burst(b.x, surf.top, 18, "#C9A06A", 300); addScore(-100); pop(b.x, b.y - 40, "¡Se rompió! −100", "#A9573A"); sCrash(); combo = 0; sync(`Se rompió: ${b.name}`); continue;
            }
            if (impact > 260) { burst(b.x, surf.top, Math.min(14, Math.round(impact / 70)), "#B9AD98"); shake = Math.max(shake, Math.min(10, impact / 120) * (b.kind === "pesado" || b.kind === "mesa" ? 1.4 : 1)); sThud(impact); }
            if (inBox && !b.scored) scorePiece(b);
            if (Math.abs(b.vy) < 45 && Math.abs(b.vx) < 30) {
              b.rest += dt;
              if (b.rest > 0.35) {
                b.done = true; b.vx = 0; b.vy = 0; b.a = 0; b.y = surf.top - b.h / 2;
                if (inBox) {
                  b.stacked = true; b.rel = b.x - target.x; b.layer = surf.layer;
                  if (magnet > 0 && b.kind === "silla" && b.layer > 1) { magnet--; sync("Silla imán usada"); }
                  checkArmado(b);
                  if (b.layer >= 3 && b.layer % 3 === 0) { addScore(300); pop(b.x, b.y - 80, "¡Torre de 3! +300", "#C96F4A", 1.8); sJingle(3); shake = 6; sync("¡Torre de 3 piezas!"); }
                } else miss(b, "Afuera… probá con más o menos fuerza");
              }
            }
          }
          if (b.x > W + 120 || b.x < -120) { b.done = true; miss(b, "Se fue del salón"); }
        }
        for (const s of stacked()) if (s.y - s.h / 2 < (lv.ceiling ?? 40)) { s.stacked = false; s.done = false; s.vx = target.dir * 120; s.vy = -100; s.va = 4; }
        flying = flying.filter((b) => b.stacked || !(b.done && (b.broken || b.x > W + 100 || b.x < -100))).slice(-24);
      }
      shake *= 0.86; boxShake = Math.max(0, boxShake - dt);
      hudTick += dt; if (hudTick > 0.25 && phase === "play") { hudTick = 0; sync(); }

      ctx.save();
      if (shake > 0.3) ctx.translate((rng() - 0.5) * shake, (rng() - 0.5) * shake);
      drawScene(now);
      if (loaded) {
        ctx.strokeStyle = "#A9573A"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(SLING.x - 26, SLING.y - 6); ctx.lineTo(loaded.x, loaded.y); ctx.lineTo(SLING.x + 26, SLING.y - 6); ctx.stroke();
        if (drag) {
          const pw = loaded.power * powerUp * (loaded.boss ? 1.25 : 1);
          let x = loaded.x, y = loaded.y, vx = (SLING.x - loaded.x) * POWER * pw, vy = (SLING.y - loaded.y) * POWER * pw; ctx.fillStyle = "rgba(30,77,61,.35)";
          for (let i = 0; i < 22; i++) { vy += G * 0.035; x += vx * 0.035; y += vy * 0.035; if (y > GROUND) break; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
        }
        drawPiece(loaded);
        // reloj del tiro
        ctx.strokeStyle = timer < 2 ? "#A9573A" : "#1E4D3D"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(SLING.x, SLING.y - 70, 14, -Math.PI / 2, -Math.PI / 2 + (Math.max(0, timer) / SHOT_TIME) * Math.PI * 2); ctx.stroke();
        if (loaded.boss) { ctx.fillStyle = "#1E4D3D"; ctx.font = "700 14px DM Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText(`CARGA ${bossCharge}/3`, SLING.x, SLING.y + 80); }
      }
      for (const b of flying) drawPiece(b);
      for (const d of fx) { d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 220 * dt; ctx.globalAlpha = Math.max(0, d.life) * 0.6; ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (1.6 - d.life), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1; fx = fx.filter((d) => d.life > 0);
      for (const p of pops) { p.life -= dt; p.y -= 30 * dt; ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.fillStyle = p.color; ctx.font = "700 20px Fraunces, serif"; ctx.textAlign = "center"; ctx.fillText(p.t, p.x, p.y); ctx.globalAlpha = 1; }
      pops = pops.filter((p) => p.life > 0);
      ctx.restore();
      if (phase === "play") drawWind();
      if (phase !== "play") { ctx.fillStyle = "rgba(22,59,47,.86)"; ctx.fillRect(0, 0, W, H); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("pointerdown", down); c.removeEventListener("pointermove", move); c.removeEventListener("pointerup", up); c.removeEventListener("pointercancel", up); ac?.close().catch(() => {}); };
  }, [pieces]);

  const h = hud;
  const name = (e: string) => e.split("@")[0];
  return (
    <>
      <div className="adm-h"><div><h2>sagg.io</h2><p>Revoleá muebles del catálogo adentro del salón. 5 niveles, comandas, mozo, viento, ventilador, techo bajo y un jefe final.</p></div></div>
      <div className="sg-wrap">
        <div className="sg-main">
          {h.phase === "play" && (
            <div className="sg-hud">
              <span className="sg-lvl">Nivel {h.level} · {h.levelName}</span>
              <span><b>{h.levelScore}</b>/{h.goal || "∞"} del nivel</span>
              <span>Total <b>{h.score}</b></span>
              <span><b>{h.throws}</b> tiros</span>
              {h.combo > 1 && <span className="sg-combo">combo x{h.combo}</span>}
              {h.order && <span className="sg-order">Comanda: {h.order}</span>}
              <span style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-sm" onClick={() => setSound((s) => !s)} aria-pressed={sound}>{sound ? "Sonido: sí" : "Sonido: no"}</button>
            </div>
          )}
          <div className="sg-stage">
            <canvas ref={cv} width={960} height={540} className="sg-canvas" aria-label="Juego sagg.io: arrastrá y soltá para revolear muebles" />
            {h.phase === "play" && h.options.length > 0 && (
              <div className="sg-choose">
                <span>Elegí la próxima pieza</span>
                {h.options.map((o, i) => (
                  <button key={i} className={`sg-opt ${o.golden ? "gold" : ""}`} onClick={() => api.current?.choose(i)}>
                    <b>{o.name}</b><small>{o.kind === "pesado" ? "Sillón · muy pesado" : o.kind === "mesa" ? "Mesa · pesada" : o.kind === "banqueta" ? "Banqueta · gira" : "Silla"}{o.golden ? " · ★ x3" : ""}{o.fragile ? " · frágil" : ""}</small>
                  </button>
                ))}
              </div>
            )}
            {h.phase === "play" && h.bet === "offer" && (
              <div className="sg-bet">
                <span>¡Combo x{h.combo}! ¿Cobrás o arriesgás?</span>
                <button className="btn btn-ghost btn-sm" onClick={() => api.current?.cash()}>Cobrar +200</button>
                <button className="btn btn-dark btn-sm" onClick={() => api.current?.risk()}>Arriesgar (+400 / −200)</button>
              </div>
            )}
            {h.phase === "play" && h.options.length === 0 && <div className="sg-msgbar">{h.loaded && <b>{h.loaded} · {h.timer}s</b>}<span>{h.msg}</span></div>}
            {h.phase === "menu" && (
              <div className="sg-over">
                <h3>sagg.io</h3>
                <p>Arrastrá la pieza hacia atrás y soltala. Tenés 5 segundos por tiro.</p>
                <div className="sg-btns">
                  <button className="btn btn-lg sg-primary" onClick={() => api.current?.start("normal")}>Jugar</button>
                  <button className="btn btn-lg sg-secondary" onClick={() => api.current?.start("diario")}>Desafío del día</button>
                </div>
                <small>En el desafío del día todos juegan con las mismas piezas y el mismo viento.</small>
              </div>
            )}
            {h.phase === "shop" && (
              <div className="sg-over">
                <h3>¡Nivel {h.level} superado!</h3>
                <p>Total: {h.score} puntos. Cada mejora cuesta {COST} puntos.</p>
                <div className="sg-btns">
                  <button className="btn sg-secondary" disabled={h.score < COST} onClick={() => api.current?.buy("power")}>Gomera más fuerte (x{h.power.toFixed(2)})</button>
                  <button className="btn sg-secondary" disabled={h.score < COST} onClick={() => api.current?.buy("extra")}>Tiro extra (+{h.extra})</button>
                  <button className="btn sg-secondary" disabled={h.score < COST} onClick={() => api.current?.buy("magnet")}>Silla imán ({h.magnet})</button>
                </div>
                <button className="btn btn-lg sg-primary" onClick={() => api.current?.next()}>Seguir al nivel {h.level + 1}: {LEVELS[h.level]?.name}</button>
              </div>
            )}
            {h.phase === "over" && (
              <div className="sg-over">
                <h3>{h.won ? "¡Ganaste sagg.io!" : "Fin de la partida"}</h3>
                <p className="sg-big">{h.score} puntos</p>
                <p>Llegaste al nivel {h.level} · {h.levelName}{!h.won && h.goal ? ` (hacían falta ${h.goal} y sumaste ${h.levelScore})` : ""}{h.mode === "diario" ? " · desafío del día" : ""}</p>
                <div className="sg-btns">
                  <button className="btn btn-lg sg-primary" onClick={() => api.current?.start(h.mode)}>Jugar de nuevo</button>
                  <button className="btn btn-lg sg-secondary" onClick={() => api.current?.start(h.mode === "diario" ? "normal" : "diario")}>{h.mode === "diario" ? "Modo normal" : "Desafío del día"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <aside className="sg-rank">
          <h4>Ranking del equipo</h4>
          <ol>{ranking.normal.length ? ranking.normal.map((r, i) => <li key={i}><span>{name(r.email)}</span><b>{r.score}</b></li>) : <li className="hint">Todavía no hay puntajes</li>}</ol>
          <h4>Desafío de hoy</h4>
          <ol>{ranking.diario.length ? ranking.diario.map((r, i) => <li key={i}><span>{name(r.email)}</span><b>{r.score}</b></li>) : <li className="hint">Nadie jugó hoy</li>}</ol>
          <p className="hint">Tu récord en este navegador: {h.best}</p>
        </aside>
      </div>
    </>
  );
}
