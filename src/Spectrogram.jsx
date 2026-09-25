import { useEffect, useRef } from "react";
import { pointerBoost, sample } from "./field.js";

const PALETTES = {
  night: {
    bg: "#061018",
    low: [8, 24, 44],
    mid: [28, 104, 196],
    high: [214, 232, 255],
  },
  paper: {
    bg: "#f4f7fb",
    low: [214, 226, 240],
    mid: [36, 104, 196],
    high: [8, 28, 58],
  },
};

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgba(palette, v) {
  const t = Math.min(1, Math.max(0, v));
  const rgb = t < 0.55 ? mix(palette.low, palette.mid, t / 0.55) : mix(palette.mid, palette.high, (t - 0.55) / 0.45);
  const alpha = palette === PALETTES.paper ? 0.22 + t * 0.72 : 0.18 + t * 0.82;
  return `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${alpha.toFixed(3)})`;
}

export default function Spectrogram({ theme }) {
  const ref = useRef(null);
  const mouse = useRef({ x: 0.62, y: 0.38 });
  const trail = useRef([]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let running = true;

    const onMove = (event) => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      mouse.current = { x, y };
      const next = trail.current;
      next.push({ x, y, life: 1 });
      if (next.length > 14) next.shift();
    };

    const draw = (time) => {
      if (!running) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const palette = PALETTES[theme] || PALETTES.night;
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, w, h);

      const cols = w < 720 ? 36 : 64;
      const rows = w < 720 ? 16 : 26;
      const gap = 3;
      const cellW = (w - gap) / cols;
      const cellH = (h - gap) / rows;
      const scrollY = window.scrollY;
      const stamp = reduce ? 12000 : time;

      for (const point of trail.current) point.life *= 0.9;

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const nx = (col + 0.5) / cols;
          const ny = (row + 0.5) / rows;
          let { v } = sample(nx, ny, stamp, scrollY);
          v += pointerBoost(nx, ny, mouse.current.x, mouse.current.y);
          for (const point of trail.current) {
            v += pointerBoost(nx, ny, point.x, point.y) * point.life * 0.45;
          }
          const x = gap * 0.5 + col * cellW;
          const y = gap * 0.5 + row * cellH;
          ctx.fillStyle = rgba(palette, v);
          ctx.beginPath();
          ctx.roundRect(x, y, Math.max(1, cellW - gap), Math.max(1, cellH - gap), 2);
          ctx.fill();
        }
      }

      if (!reduce) frame = requestAnimationFrame(draw);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [theme]);

  return <canvas ref={ref} className="spectrogram" aria-hidden="true" />;
}
