"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Detect portrait mobile — show rotate prompt
function usePortraitMobile() {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const check = () => {
      setPortrait(window.innerWidth < 768 && window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);
  return portrait;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CANVAS_W = 800;
const CANVAS_H = 250;
const GROUND_Y = 200;

const PLAYER_W = 40;
const PLAYER_H = 50;
const PLAYER_X = 60;

const GRAVITY = 0.6;
const JUMP_V = -13;

const OBSTACLE_W = 30;
const OBSTACLE_MIN_H = 30;
const OBSTACLE_MAX_H = 70;

const GOOD_OBSTACLE_CHANCE = 0.3;

const BAD_TYPES  = ["BANDIT", "SHERIFF", "TNT"];
const GOOD_TYPES = ["BAG", "GOLD", "CATTLE"];
const GOOD_AWARDS: Record<string, number> = { BAG: 10, GOLD: 25, CATTLE: 50 };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Obstacle {
  x: number; y: number; w: number; h: number;
  good: boolean; label: string; award: number; scored: boolean;
}
interface GameState {
  running: boolean; dead: boolean; money: number; score: number;
}

// ---------------------------------------------------------------------------
// Sprite drawing helpers
// ---------------------------------------------------------------------------

/** Filled star centred at (cx,cy), outer radius r, inner ri, n points */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number, ri: number, n: number
) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const angle = (i * Math.PI) / n - Math.PI / 2;
    const rad   = i % 2 === 0 ? r : ri;
    i === 0
      ? ctx.moveTo(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad)
      : ctx.lineTo(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

/** Rounded rectangle helper */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Player sprite ────────────────────────────────────────────────────────────
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  frame: number  // 0=idle,1=run1,2=run2
) {
  const W = PLAYER_W, H = PLAYER_H;

  // Legs — animate based on frame
  const legOff = frame === 1 ? -4 : frame === 2 ? 4 : 0;
  ctx.fillStyle = "#4A2200";
  ctx.fillRect(x + 5,        y + H * 0.62 + legOff, 10, H * 0.38);
  ctx.fillRect(x + W - 15,   y + H * 0.62 - legOff, 10, H * 0.38);

  // Boot tips
  ctx.fillStyle = "#2C1400";
  ctx.fillRect(x + 4,      y + H - 6 + legOff, 12, 6);
  ctx.fillRect(x + W - 16, y + H - 6 - legOff, 12, 6);

  // Duster / body
  ctx.fillStyle = "#8B4513";
  roundRect(ctx, x + 4, y + H * 0.28, W - 8, H * 0.38, 4);
  ctx.fill();

  // Belt
  ctx.fillStyle = "#3D1A00";
  ctx.fillRect(x + 4, y + H * 0.58, W - 8, 5);
  // Buckle
  ctx.fillStyle = "#D97706";
  ctx.fillRect(x + W / 2 - 4, y + H * 0.58, 8, 5);

  // Head (face)
  ctx.fillStyle = "#C2845A";
  ctx.beginPath();
  ctx.arc(x + W / 2, y + H * 0.2, 10, 0, Math.PI * 2);
  ctx.fill();

  // Hat brim (wide)
  ctx.fillStyle = "#3D1A00";
  ctx.fillRect(x - 7, y + H * 0.06, W + 14, 7);

  // Hat crown
  ctx.fillStyle = "#5C2D00";
  ctx.fillRect(x + 6, y - 14, W - 12, 20);

  // Hat band
  ctx.fillStyle = "#D97706";
  ctx.fillRect(x + 6, y + 4, W - 12, 3);

  // Eye
  ctx.fillStyle = "#1C0A00";
  ctx.beginPath();
  ctx.arc(x + W / 2 + 3, y + H * 0.18, 2, 0, Math.PI * 2);
  ctx.fill();

  // Moustache
  ctx.fillStyle = "#3D1A00";
  ctx.beginPath();
  ctx.ellipse(x + W / 2, y + H * 0.235, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Spur (small arc on boot)
  ctx.strokeStyle = "#B87333";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + 5, y + H - 3 + legOff, 3, 0, Math.PI * 2);
  ctx.stroke();
}

// ── BANDIT obstacle ───────────────────────────────────────────────────────────
function drawBandit(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;

  // Body — tattered black duster
  ctx.fillStyle = "#1A1A1A";
  roundRect(ctx, x + 2, y + h * 0.35, w - 4, h * 0.5, 3);
  ctx.fill();

  // Sombrero brim
  ctx.fillStyle = "#2C1400";
  ctx.fillRect(x - 6, y + h * 0.05, w + 12, 6);
  // Crown
  ctx.fillStyle = "#1A1A1A";
  ctx.fillRect(x + 2, y, w - 4, h * 0.1);

  // Head
  ctx.fillStyle = "#8B6050";
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.22, w * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Bandit mask (dark band across eyes)
  ctx.fillStyle = "#111";
  ctx.fillRect(x + 2, y + h * 0.14, w - 4, h * 0.1);

  // Red evil eyes
  ctx.fillStyle = "#DC2626";
  ctx.beginPath();
  ctx.arc(cx - 4, y + h * 0.17, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 4, y + h * 0.17, 2, 0, Math.PI * 2);
  ctx.fill();

  // Bandana
  ctx.fillStyle = "#7F1D1D";
  ctx.fillRect(x + 2, y + h * 0.28, w - 4, h * 0.08);

  // Two guns
  ctx.fillStyle = "#9CA3AF";
  ctx.fillRect(x,     y + h * 0.55, 6, 10);
  ctx.fillRect(x + w - 6, y + h * 0.55, 6, 10);

  // Label
  ctx.fillStyle = "#FCA5A5";
  ctx.font = `bold ${Math.max(7, h * 0.13)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("BANDIT", cx, y + h * 0.95);
}

// ── SHERIFF obstacle ──────────────────────────────────────────────────────────
function drawSheriff(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;

  // Body — cavalry blue
  ctx.fillStyle = "#1E3A5F";
  roundRect(ctx, x + 2, y + h * 0.35, w - 4, h * 0.5, 3);
  ctx.fill();

  // Badge star
  ctx.fillStyle = "#F59E0B";
  drawStar(ctx, cx, y + h * 0.48, 6, 3, 5);

  // Flat-brim cream hat
  ctx.fillStyle = "#E8D8B0";
  ctx.fillRect(x - 5, y + h * 0.05, w + 10, 5);
  ctx.fillRect(x + 3, y, w - 6, h * 0.1);

  // Head
  ctx.fillStyle = "#C2A070";
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.22, w * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Mustache
  ctx.fillStyle = "#5C4200";
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.27, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ice-grey eyes
  ctx.fillStyle = "#B0C4D8";
  ctx.beginPath();
  ctx.arc(cx - 4, y + h * 0.2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 4, y + h * 0.2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Stop-hand gesture (palm out)
  ctx.fillStyle = "#C2A070";
  ctx.fillRect(x + w - 2, y + h * 0.38, 6, 10);

  // Label
  ctx.fillStyle = "#93C5FD";
  ctx.font = `bold ${Math.max(7, h * 0.13)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("SHERIFF", cx, y + h * 0.95);
}

// ── TNT obstacle ──────────────────────────────────────────────────────────────
function drawTNT(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;

  // Crate — pine boards
  ctx.fillStyle = "#C49A5A";
  roundRect(ctx, x, y, w, h * 0.85, 2);
  ctx.fill();

  // Plank lines
  ctx.strokeStyle = "#8B6020";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.28); ctx.lineTo(x + w, y + h * 0.28);
  ctx.moveTo(x, y + h * 0.56); ctx.lineTo(x + w, y + h * 0.56);
  ctx.stroke();

  // Iron band
  ctx.strokeStyle = "#2C2C2C";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h * 0.85);

  // TNT lettering
  ctx.fillStyle = "#DC2626";
  ctx.font = `bold ${Math.max(8, h * 0.18)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("TNT", cx, y + h * 0.54);

  // Fuse
  ctx.strokeStyle = "#8B7355";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 4, y);
  ctx.quadraticCurveTo(cx + 10, y - 8, cx + 6, y - 18);
  ctx.stroke();

  // Spark at fuse tip
  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.arc(cx + 6, y - 18, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#F97316";
  ctx.beginPath();
  ctx.arc(cx + 6, y - 18, 2, 0, Math.PI * 2);
  ctx.fill();
}

// ── BAG obstacle (money bag) ──────────────────────────────────────────────────
function drawBag(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const bagH = h * 0.8;
  const bagY = y + h - bagH;

  // Bag body — bulging circle
  ctx.fillStyle = "#14532D";
  ctx.beginPath();
  ctx.ellipse(cx, bagY + bagH * 0.55, w * 0.48, bagH * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck tie
  ctx.fillStyle = "#052E16";
  ctx.beginPath();
  ctx.ellipse(cx, bagY + bagH * 0.08, w * 0.2, bagH * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gold cord knot
  ctx.fillStyle = "#F59E0B";
  ctx.beginPath();
  ctx.arc(cx, bagY + bagH * 0.06, 3, 0, Math.PI * 2);
  ctx.fill();

  // Dollar sign
  ctx.fillStyle = "#FDE68A";
  ctx.font = `bold ${Math.max(12, w * 0.7)}px Georgia`;
  ctx.textAlign = "center";
  ctx.fillText("$", cx, bagY + bagH * 0.72);

  // Coin spill at base
  ctx.fillStyle = "#FBBF24";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x + 4 + i * 9, y + h + 2, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Award label
  ctx.fillStyle = "#86EFAC";
  ctx.font = `bold ${Math.max(7, h * 0.12)}px monospace`;
  ctx.fillText("+$10", cx, y + h * 0.97);
}

// ── GOLD obstacle (nugget) ────────────────────────────────────────────────────
function drawGold(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2, cy = y + h * 0.5;

  // Nugget body — irregular blob via polygon
  ctx.fillStyle = "#B7791F";
  ctx.beginPath();
  const pts = [
    [cx - w*0.35, cy + h*0.1],
    [cx - w*0.45, cy - h*0.1],
    [cx - w*0.2,  cy - h*0.3],
    [cx,          cy - h*0.42],
    [cx + w*0.25, cy - h*0.35],
    [cx + w*0.45, cy - h*0.05],
    [cx + w*0.4,  cy + h*0.2],
    [cx + w*0.1,  cy + h*0.35],
    [cx - w*0.2,  cy + h*0.32],
  ];
  ctx.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
  ctx.closePath();
  ctx.fill();

  // Highlight facets
  ctx.fillStyle = "#FBBF24";
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy - h * 0.12, w * 0.18, h * 0.12, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FDE68A";
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - h * 0.16, w * 0.08, h * 0.06, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Small satellite nuggets
  ctx.fillStyle = "#D97706";
  ctx.beginPath();
  ctx.ellipse(x + 3, y + h * 0.8, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w - 4, y + h * 0.75, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Award label
  ctx.fillStyle = "#FDE68A";
  ctx.font = `bold ${Math.max(7, h * 0.14)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("+$25", cx, y + h);
}

// ── CATTLE obstacle (longhorn) ────────────────────────────────────────────────
function drawCattle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const bodyY = y + h * 0.45;

  // Body — large ellipse
  ctx.fillStyle = "#C2976A";
  ctx.beginPath();
  ctx.ellipse(cx, bodyY, w * 0.5, h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark patch
  ctx.fillStyle = "#6B3A1F";
  ctx.beginPath();
  ctx.ellipse(cx + 4, bodyY - 2, w * 0.2, h * 0.15, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = "#C2976A";
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.2, w * 0.28, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Horns — sweeping arcs
  ctx.strokeStyle = "#E8E0C0";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  // Left horn
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.25, y + h * 0.12);
  ctx.quadraticCurveTo(cx - w * 0.7, y - h * 0.08, cx - w * 0.55, y + h * 0.04);
  ctx.stroke();

  // Right horn
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.25, y + h * 0.12);
  ctx.quadraticCurveTo(cx + w * 0.7, y - h * 0.08, cx + w * 0.55, y + h * 0.04);
  ctx.stroke();

  // Eye
  ctx.fillStyle = "#1C0A00";
  ctx.beginPath();
  ctx.arc(cx + 3, y + h * 0.17, 2, 0, Math.PI * 2);
  ctx.fill();

  // Nostril
  ctx.fillStyle = "#8B4513";
  ctx.beginPath();
  ctx.ellipse(cx + 5, y + h * 0.26, 2.5, 1.5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = "#8B6050";
  const legY = y + h * 0.68;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + 3 + i * (w * 0.24), legY, 5, h * 0.32);
  }

  // Hooves
  ctx.fillStyle = "#2C1400";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + 2 + i * (w * 0.24), y + h - 5, 7, 5);
  }

  // FF brand mark
  ctx.strokeStyle = "#5C2A0A";
  ctx.lineWidth = 1;
  ctx.font = `bold 8px monospace`;
  ctx.fillStyle = "#5C2A0A";
  ctx.textAlign = "center";
  ctx.fillText("FF", cx + 8, bodyY + 4);

  // Award label
  ctx.fillStyle = "#86EFAC";
  ctx.font = `bold ${Math.max(7, h * 0.12)}px monospace`;
  ctx.fillText("+$50", cx, y + h * 0.98);
}

// ── Sky gradient ──────────────────────────────────────────────────────────────
function drawSky(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0,    "#1E1B4B");   // deep indigo at top
  grad.addColorStop(0.45, "#92400E");   // burnt sienna midway
  grad.addColorStop(0.75, "#D97706");   // amber
  grad.addColorStop(1,    "#FDE68A");   // pale gold at horizon
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

  // Distant mesa silhouettes
  ctx.fillStyle = "#4C1D95";
  const mesas = [
    [0, 60, 120, 80], [110, 70, 90, 80], [260, 55, 140, 95],
    [450, 65, 110, 85], [580, 58, 130, 92], [720, 72, 100, 78],
  ];
  for (const [mx, my, mw] of mesas) {
    ctx.beginPath();
    ctx.moveTo(mx, GROUND_Y);
    ctx.lineTo(mx, my + 12);
    ctx.quadraticCurveTo(mx + 10, my, mx + mw * 0.5, my);
    ctx.quadraticCurveTo(mx + mw - 10, my, mx + mw, my + 12);
    ctx.lineTo(mx + mw, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
}

// ── Ground ────────────────────────────────────────────────────────────────────
function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
  // Base dirt
  const grad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
  grad.addColorStop(0, "#A0522D");
  grad.addColorStop(1, "#5C3D1A");
  ctx.fillStyle = grad;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

  // Top edge highlight
  ctx.fillStyle = "#C49A5A";
  ctx.fillRect(0, GROUND_Y, CANVAS_W, 3);

  // Scrolling pebble / crack marks
  ctx.fillStyle = "#7B4D1A";
  const marks = [30, 80, 150, 220, 300, 400, 480, 560, 640, 730, 800];
  for (const bx of marks) {
    const rx = ((bx - offset % CANVAS_W) + CANVAS_W * 2) % (CANVAS_W + 40) - 20;
    ctx.fillRect(rx, GROUND_Y + 8, 18, 2);
    ctx.fillRect(rx + 5, GROUND_Y + 14, 8, 2);
  }

  // Sparse dead grass tufts
  ctx.strokeStyle = "#5C4A1A";
  ctx.lineWidth = 1.5;
  const tufts = [60, 200, 370, 510, 680];
  for (const bx of tufts) {
    const rx = ((bx - offset % CANVAS_W) + CANVAS_W * 2) % (CANVAS_W + 60) - 30;
    ctx.beginPath();
    ctx.moveTo(rx, GROUND_Y + 2);
    ctx.lineTo(rx - 4, GROUND_Y - 6);
    ctx.moveTo(rx, GROUND_Y + 2);
    ctx.lineTo(rx, GROUND_Y - 8);
    ctx.moveTo(rx, GROUND_Y + 2);
    ctx.lineTo(rx + 4, GROUND_Y - 5);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function WildRiderGame() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const stateRef    = useRef<GameState>({ running: false, dead: false, money: 0, score: 0 });
  const frameRef    = useRef<number>(0);
  const frameCount  = useRef<number>(0);     // for sprite animation

  const playerY  = useRef(GROUND_Y - PLAYER_H);
  const playerVY = useRef(0);
  const onGround = useRef(true);

  const obstacles    = useRef<Obstacle[]>([]);
  const spawnTimer   = useRef(0);
  const spawnInterval = useRef(90);
  const speed        = useRef(5);
  const groundOffset = useRef(0);

  const [uiMoney, setUiMoney]     = useState(0);
  const [uiDead,  setUiDead]      = useState(false);
  const [, setUiStarted] = useState(false);

  const resetGame = useCallback(() => {
    stateRef.current = { running: true, dead: false, money: 0, score: 0 };
    playerY.current  = GROUND_Y - PLAYER_H;
    playerVY.current = 0;
    onGround.current = true;
    obstacles.current  = [];
    spawnTimer.current = 0;
    spawnInterval.current = 90;
    speed.current = 5;
    groundOffset.current = 0;
    frameCount.current = 0;
    setUiMoney(0);
    setUiDead(false);
    setUiStarted(true);
  }, []);

  const jump = useCallback(() => {
    if (onGround.current && stateRef.current.running) {
      playerVY.current = JUMP_V;
      onGround.current = false;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!stateRef.current.running && !stateRef.current.dead) resetGame();
        else jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const spawnObstacle = () => {
      const h = OBSTACLE_MIN_H + Math.random() * (OBSTACLE_MAX_H - OBSTACLE_MIN_H);
      const good  = Math.random() < GOOD_OBSTACLE_CHANCE;
      const label = good
        ? GOOD_TYPES[Math.floor(Math.random() * GOOD_TYPES.length)]
        : BAD_TYPES [Math.floor(Math.random() * BAD_TYPES.length)];
      const award = good ? GOOD_AWARDS[label] ?? 10 : 0;
      obstacles.current.push({
        x: CANVAS_W + 10,
        y: GROUND_Y - h,
        w: OBSTACLE_W,
        h,
        good, label, award, scored: false,
      });
    };

    const checkCollision = (obs: Obstacle) =>
      PLAYER_X < obs.x + obs.w &&
      PLAYER_X + PLAYER_W > obs.x &&
      playerY.current < obs.y + obs.h &&
      playerY.current + PLAYER_H > obs.y;

    const drawObstacle = (obs: Obstacle) => {
      ctx.save();
      switch (obs.label) {
        case "BANDIT":  drawBandit (ctx, obs.x, obs.y, obs.w, obs.h); break;
        case "SHERIFF": drawSheriff(ctx, obs.x, obs.y, obs.w, obs.h); break;
        case "TNT":     drawTNT    (ctx, obs.x, obs.y, obs.w, obs.h); break;
        case "BAG":     drawBag    (ctx, obs.x, obs.y, obs.w, obs.h); break;
        case "GOLD":    drawGold   (ctx, obs.x, obs.y, obs.w, obs.h); break;
        case "CATTLE":  drawCattle (ctx, obs.x, obs.y, obs.w, obs.h); break;
      }
      ctx.restore();
    };

    const draw = () => {
      const gs = stateRef.current;
      const fc = frameCount.current;

      // Sky
      drawSky(ctx);

      // Ground
      drawGround(ctx, groundOffset.current);

      // Player
      ctx.save();
      const pframe = gs.running ? (Math.floor(fc / 8) % 3) : 0;
      drawPlayer(ctx, PLAYER_X, playerY.current, pframe);
      ctx.restore();

      // Obstacles
      for (const obs of obstacles.current) {
        drawObstacle(obs);
      }

      // HUD
      ctx.fillStyle = "rgba(12,4,0,0.55)";
      ctx.fillRect(6, 6, 180, 46);
      ctx.fillStyle = "#F59E0B";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Distance: ${gs.score} yds`, 14, 24);
      ctx.fillText(`Wallet:  $${gs.money}`,      14, 44);

      if (!gs.running && !gs.dead) {
        ctx.fillStyle = "rgba(12,4,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#F59E0B";
        ctx.font = "bold 28px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("⚡ PRESS SPACE TO RIDE ⚡", CANVAS_W / 2, CANVAS_H / 2);
      }

      if (gs.dead) {
        ctx.fillStyle = "rgba(12,4,0,0.6)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#DC2626";
        ctx.font = "bold 34px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER, PARTNER", CANVAS_W / 2, CANVAS_H / 2 - 22);
        ctx.fillStyle = "#FDE68A";
        ctx.font = "18px 'Courier New', monospace";
        ctx.fillText(`Final $${gs.money}   •   ${gs.score} yds`, CANVAS_W / 2, CANVAS_H / 2 + 12);
        ctx.fillStyle = "#9CA3AF";
        ctx.font = "13px 'Courier New', monospace";
        ctx.fillText("SPACE / Tap to ride again", CANVAS_W / 2, CANVAS_H / 2 + 38);
      }

      ctx.textAlign = "left";
    };

    const tick = () => {
      const gs = stateRef.current;

      if (gs.running) {
        frameCount.current++;
        groundOffset.current += speed.current;

        playerVY.current += GRAVITY;
        playerY.current  += playerVY.current;

        if (playerY.current >= GROUND_Y - PLAYER_H) {
          playerY.current  = GROUND_Y - PLAYER_H;
          playerVY.current = 0;
          onGround.current = true;
        }

        spawnTimer.current++;
        if (spawnTimer.current >= spawnInterval.current) {
          spawnObstacle();
          spawnTimer.current = 0;
          spawnInterval.current = Math.max(45, spawnInterval.current - 1);
        }

        for (const obs of obstacles.current) {
          obs.x -= speed.current;
          if (!obs.scored && checkCollision(obs)) {
            if (obs.good) {
              gs.money += obs.award;
              setUiMoney(gs.money);
              obs.scored = true;
            } else {
              gs.running = false;
              gs.dead    = true;
              setUiDead(true);
              break;
            }
          }
        }

        obstacles.current = obstacles.current.filter((o) => o.x + o.w > 0);
        gs.score++;
        if (gs.score % 300 === 0) speed.current = Math.min(14, speed.current + 0.5);
      }

      draw();
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const portraitMobile = usePortraitMobile();

  if (portraitMobile) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "1rem", padding: "2.5rem 1.5rem", textAlign: "center",
        background: "rgba(12,4,0,0.82)", backdropFilter: "blur(16px)",
        border: "1px solid rgba(217,119,6,0.25)", borderRadius: "1rem",
      }}>
        <div style={{ fontSize: "3rem", animation: "spin 2s linear infinite" }}>📱</div>
        <p style={{ fontFamily: "Georgia, serif", color: "#E8C060", fontSize: "1.1rem", fontWeight: 700 }}>
          Rotate Your Device
        </p>
        <p style={{ color: "#9A7040", fontSize: "0.85rem", maxWidth: 260 }}>
          Frontier Rider plays best in landscape. Rotate your phone sideways to ride.
        </p>
        <div style={{ fontSize: "2rem" }}>↻</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="border-4 border-amber-700 rounded-lg shadow-xl cursor-pointer"
        style={{ maxWidth: "100%", width: "100%", touchAction: "none" }}
        onClick={() => {
          if (!stateRef.current.running && !stateRef.current.dead) resetGame();
          else jump();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (!stateRef.current.running && !stateRef.current.dead) resetGame();
          else jump();
        }}
      />
      <div className="flex gap-8 text-amber-900 font-mono text-lg">
        <span>Wallet: <strong>${uiMoney}</strong></span>
        {uiDead && (
          <button
            className="px-4 py-1 bg-amber-700 text-white rounded hover:bg-amber-800"
            onClick={resetGame}
          >
            Ride Again
          </button>
        )}
      </div>
      <p className="text-xs text-amber-600 mt-1">
        🟢 BAG +$10 &nbsp;|&nbsp; GOLD +$25 &nbsp;|&nbsp; CATTLE +$50
        &nbsp;&nbsp;•&nbsp;&nbsp;
        🔴 BANDIT / SHERIFF / TNT = game over
      </p>
    </div>
  );
}
