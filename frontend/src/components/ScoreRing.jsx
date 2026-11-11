import { useEffect, useState } from "react";

export default function ScoreRing({ score, cls, size = 176 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setVal(score); return; }
    let raf, start;
    const tick = (t) => {
      start ??= t;
      const p = Math.min((t - start) / 1300, 1);
      setVal(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const r = 70, c = 2 * Math.PI * r;
  return (
    <div className={`ring ${cls}`} style={{ width: size, height: size }} role="img" aria-label={`Integrity score ${score} out of 100`}>
      <svg viewBox="0 0 180 180">
        <circle className="ring-bg" cx="90" cy="90" r={r} />
        <circle className="ring-fg" cx="90" cy="90" r={r} strokeDasharray={c}
          strokeDashoffset={c * (1 - val / 100)} transform="rotate(-90 90 90)" />
      </svg>
      <div className="ring-num"><strong>{val}</strong><span>out of 100</span></div>
    </div>
  );
}
