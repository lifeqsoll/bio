import { useEffect, useRef, useState } from "react";
import Spectrogram from "./Spectrogram.jsx";
import { copy } from "./copy.js";
import { sample } from "./field.js";

const LANG_KEY = "lifeqsoll-lang";

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [lang, setLang] = useState(() => readStored(LANG_KEY, "en"));
  const [solid, setSolid] = useState(false);
  const [rail, setRail] = useState(0);
  const readoutRef = useRef(null);
  const t = copy[lang] || copy.en;

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
    document.documentElement.dataset.theme = "night";
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* private mode */
    }
  }, [lang, t.htmlLang]);

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setRail(max > 0 ? window.scrollY / max : 0);
    };
    const onMove = (event) => {
      const node = readoutRef.current;
      if (!node) return;
      const nx = event.clientX / window.innerWidth;
      const ny = event.clientY / window.innerHeight;
      const next = sample(nx, ny, performance.now(), window.scrollY);
      const labels = node.querySelectorAll("span");
      labels[0].textContent = `${node.dataset.t} ${next.sec}s`;
      labels[1].textContent = `${node.dataset.band} ${next.band}`;
      labels[2].textContent = `${node.dataset.amp} ${next.v.toFixed(2)}`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const cells = Array.from({ length: 16 }, (_, i) => i / 15 <= rail);

  return (
    <div className="page" data-theme="night">
      <Spectrogram theme="night" />
      <div className="veil" />

      <header className={solid ? "nav solid" : "nav"}>
        <a className="word" href="#top">
          lifeqsoll
        </a>
        <nav className="nav-links">
          <a href="#work">{t.nav.work}</a>
          <a href="#stack">{t.nav.stack}</a>
          <a href="#contact">{t.nav.contact}</a>
        </nav>
        <div className="switches">
          <div className="lang" role="group" aria-label="Language">
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
            <button type="button" aria-pressed={lang === "ru"} onClick={() => setLang("ru")}>
              RU
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <p className="kicker">{t.heroKicker}</p>
          <h1>{t.heroTitle}</h1>
          <p className="lead">{t.heroLead}</p>
          <div className="actions">
            <a className="btn" href={t.links.github}>
              {t.ctaGithub}
            </a>
            <a className="btn ghost" href={t.links.project}>
              {t.ctaProject}
            </a>
            <a className="btn ghost" href={t.links.telegram}>
              {t.ctaTelegram}
            </a>
          </div>
        </section>

        <section className="block about">
          <p className="index">{t.aboutIndex}</p>
          <div>
            <h2>{t.aboutTitle}</h2>
            <p>{t.aboutBody}</p>
          </div>
        </section>

        <section className="block work" id="work">
          <div className="work-copy">
            <p className="index">{t.workIndex}</p>
            <p className="kicker">
              {t.workKicker} <span>{t.workVersion}</span>
            </p>
            <h2>{t.workTitle}</h2>
            <p className="lead slim">{t.workLead}</p>
            <h3>{t.problemTitle}</h3>
            <p>{t.problem}</p>
            <h3>{t.tasksTitle}</h3>
            <ol className="tasks">
              {t.tasks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          <aside className="plate">
            <p className="plate-label">{t.plateLabel}</p>
            <p className="formula">{t.plateFormula}</p>
            <MiniWindow theme="night" />
            <dl>
              {t.plateRows.map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className="block why">
          <p className="index">{t.whyIndex}</p>
          <div>
            <h2>{t.whyTitle}</h2>
            <ul className="reasons">
              {t.reasons.map((reason, i) => (
                <li key={reason.name}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{reason.name}</h3>
                    <p>{reason.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <h3>{t.limitsTitle}</h3>
            <p className="limits">{t.limits}</p>
          </div>
        </section>

        <section className="block stack" id="stack">
          <p className="index">{t.stackIndex}</p>
          <div>
            <h2>{t.stackTitle}</h2>
            <p className="stack-lead">{t.stackLead}</p>
            <ul className="chips">
              {t.stack.map(([name, note]) => (
                <li key={name}>
                  <strong>{name}</strong>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="block contact" id="contact">
          <h2>{t.contactTitle}</h2>
          <p>{t.contactLead}</p>
          <ul className="links">
            <li>
              <a href={t.links.github}>{t.linkLabels.github}</a>
            </li>
            <li>
              <a href={t.links.project}>{t.linkLabels.project}</a>
            </li>
            <li>
              <a href={t.links.demo}>{t.linkLabels.demo}</a>
            </li>
            <li>
              <a href={t.links.telegram}>{t.linkLabels.telegram}</a>
            </li>
          </ul>
        </section>
      </main>

      <div
        className="readout"
        aria-hidden="true"
        ref={readoutRef}
        data-t={t.readoutT}
        data-band={t.readoutBand}
        data-amp={t.readoutAmp}
      >
        <span>{t.readoutT} 36s</span>
        <span>{t.readoutBand} net</span>
        <span>{t.readoutAmp} 0.42</span>
      </div>
      <div className="rail" aria-hidden="true">
        {cells.map((on, i) => (
          <i key={i} className={on ? "on" : ""} />
        ))}
      </div>
    </div>
  );
}

function MiniWindow({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let running = true;
    const labels = ["cpu", "mem", "net", "disk", "gpu"];

    const draw = (time) => {
      if (!running) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cols = 60;
      const rows = labels.length;
      const gap = 2;
      const cellW = w / cols;
      const cellH = h / rows;
      const ink = theme === "paper";
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const { v } = sample((col + 0.5) / cols, (row + 0.5) / rows, reduce ? 8000 : time, 0);
          const alpha = ink ? 0.18 + v * 0.8 : 0.2 + v * 0.8;
          const g = ink ? 40 + v * 90 : 80 + v * 160;
          const b = ink ? 90 + v * 80 : 140 + v * 100;
          ctx.fillStyle = `rgba(${ink ? 12 : 40},${g | 0},${b | 0},${alpha.toFixed(3)})`;
          ctx.fillRect(col * cellW, row * cellH + 1, Math.max(1, cellW - gap), Math.max(1, cellH - gap - 1));
        }
      }
      if (!reduce) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="mini" aria-hidden="true" />;
}
