import { useRef, useState } from "react";
import { DEMO_CASES } from "../mockReports";

export const ACCEPT = ["image/png", "image/jpeg", "application/pdf"];

export function validate(file) {
  if (!file) return "Please choose a file.";
  if (!ACCEPT.includes(file.type)) return "Please upload a PNG, JPG or PDF file.";
  if (file.size > 15 * 1024 * 1024) return "That file is over 15 MB. Please use a smaller one.";
  return "";
}

export function DropZone({ onPick, file }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className={`dropzone ${dragging ? "dragging" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); onPick(e.dataTransfer.files[0]); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
    >
      <div className="dz-icon">⬆</div>
      <strong>{file ? file.name : "Drag and drop a file here, or click to browse"}</strong>
      <span className="muted">PNG, JPG or PDF, up to 15 MB</span>
      <input ref={inputRef} type="file" accept={ACCEPT.join(",")} hidden onChange={(e) => onPick(e.target.files[0])} />
    </div>
  );
}

export default function UploadView({ onFile, onDemo }) {
  const [error, setError] = useState("");

  function pick(file) {
    const problem = validate(file);
    if (problem) return setError(problem);
    setError("");
    onFile(file);
  }

  return (
    <section>
      <div className="intro">
        <h1>Don't just see it. <span className="accent">Verify it.</span></h1>
        <p>
          Upload a certificate or document and get an authenticity assessment with the reasons
          spelled out. No account is needed.
        </p>
      </div>

      <DropZone onPick={pick} />
      {error && <p className="error-text">{error}</p>}
      <p className="note">🔒 Files are deleted after analysis. Results are indicators, not proof.</p>

      <div className="tiers">
        <div className="tier-card">
          <span className="tier-tag">Tier 1</span>
          <h3>Instant Check</h3>
          <p>
            Works on any file with no registration. We look at metadata, editing traces, text
            and layout consistency, and AI-generation signals.
          </p>
        </div>
        <div className="tier-card">
          <span className="tier-tag">Tier 2</span>
          <h3>Verified Source</h3>
          <p>
            Where the issuing institution offers a verification channel, we check the document's
            details against its records (simulated in this prototype). Issuers can also register
            originals on the Register tab.
          </p>
        </div>
      </div>

      <div className="demo">
        <h3>Try a demo case</h3>
        <div className="demo-buttons">
          {DEMO_CASES.map((d) => (
            <button key={d.key} className="btn secondary" onClick={() => onDemo(d)}>{d.label}</button>
          ))}
        </div>
      </div>
    </section>
  );
}
