import { useEffect, useState } from "react";
import DocPreview from "./DocPreview";
import Icon from "./Icon";

const STEPS = [
  ["Reading the file", "Opening it and looking at its hidden details."],
  ["Looking for edits", "Checking whether any part was saved differently."],
  ["Checking for AI", "Estimating whether an AI tool made the image."],
  ["Checking registered originals", "Comparing the file's fingerprint with registered originals."],
];

export default function AnalyzingView({ filename, previewUrl, isPdf }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, STEPS.length - 1)), 850);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="wrap analyzing">
      <DocPreview previewUrl={previewUrl} isPdf={isPdf} scanning />
      <div className="an-copy">
        <p className="eyebrow">Investigating</p>
        <h2>Looking closely at {filename}</h2>
        <p className="muted">This usually takes under a minute. Your file is processed privately.</p>
        <ul className="an-steps">
          {STEPS.map(([t, d], i) => (
            <li key={t} className={i < active ? "done" : i === active ? "active" : ""}>
              <span className="dot">{i < active ? <Icon name="check" size={16} stroke={2.4} /> : i + 1}</span>
              <div><strong>{t}</strong><small>{d}</small></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
