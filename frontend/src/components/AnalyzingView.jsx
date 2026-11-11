import { useEffect, useState } from "react";

const STEPS = [
  "Digital forensics: metadata and error level analysis",
  "Document intelligence: reading fields and layout",
  "Source verification: checking for an issuer record",
  "Risk assessment: combining the signals",
];

export default function AnalyzingView({ filename }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, STEPS.length - 1)), 800);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="analyzing">
      <div className="spinner" />
      <h2>Analysing {filename}</h2>
      <ul className="steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i < active ? "done" : i === active ? "active" : ""}>
            <span className="dot">{i < active ? "✓" : i + 1}</span>
            {s}
          </li>
        ))}
      </ul>
    </section>
  );
}
