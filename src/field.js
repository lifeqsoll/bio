export const BANDS = ["cpu", "mem", "swap", "faults", "net", "disk", "gpu", "sockets"];

export function sample(nx, ny, timeMs, scrollY) {
  const phase = timeMs * 0.00032 + scrollY * 0.0011;
  const wave =
    0.42 +
    0.26 * Math.sin(ny * 9.2 + phase * 2.4 + nx * 6.5) +
    0.16 * Math.sin(nx * 14.0 - phase * 1.7 + ny * 3.1) +
    0.1 * Math.sin((nx + ny) * 11.0 + phase * 3.3);
  const head = (phase * 0.55) % 1;
  const dist = Math.min(Math.abs(nx - head), 1 - Math.abs(nx - head));
  const sweep = Math.exp(-dist * dist * 380) * 0.34;
  const v = Math.min(1, Math.max(0, wave + sweep));
  const band = BANDS[Math.min(BANDS.length - 1, Math.floor(ny * BANDS.length))];
  return { v, band, sec: Math.floor(nx * 60), head };
}

export function pointerBoost(nx, ny, px, py) {
  const dx = nx - px;
  const dy = (ny - py) * 1.35;
  return Math.exp(-(dx * dx + dy * dy) * 22) * 0.62;
}
