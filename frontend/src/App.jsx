import { useRef, useState } from "react";

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const resultSets = [
  {
    status: "Likely Authentic", tone: "green", score: 86,
    summary: "The available checks did not identify significant manipulation indicators. This is a preliminary assessment, not proof of authenticity.",
    findings: [
      ["File fingerprint generated", "A SHA-256 fingerprint was created for this uploaded file.", "good"],
      ["File format recognised", "The file type is supported by this prototype interface.", "good"],
      ["Issuer verification", "The prototype uses a simulated issuer check; no real university database was contacted.", "warn"]
    ]
  },
  {
    status: "Potentially Manipulated", tone: "amber", score: 42,
    summary: "Some indicators require closer review. Do not treat this result as a final finding of fraud.",
    findings: [
      ["Review recommended", "The demo scenario has been configured to represent a document that may have been edited.", "warn"],
      ["Issuer verification", "No authoritative issuing-source confirmation was obtained.", "warn"],
      ["Human review required", "Compare the document with an independently obtained copy or contact the issuer.", "info"]
    ]
  },
  {
    status: "Unverified", tone: "slate", score: 0,
    summary: "There is not enough evidence in this prototype to support an authenticity assessment.",
    findings: [
      ["Issuer not recognised", "The issuer could not be matched against the prototype's simulated records.", "warn"],
      ["No authoritative source match", "No real institutional verification service was contacted.", "info"],
      ["Insufficient evidence", "An unverified document is not necessarily fake.", "info"]
    ]
  }
];

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16.5v3A1.5 1.5 0 0 1 18.5 21h-13A1.5 1.5 0 0 1 4 19.5v-3"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/></>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 11v5M12 7h.01"/></>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>
  };
  return <svg {...common}>{paths[name] || paths.info}</svg>;
}

export default function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState("");
  const [stage, setStage] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const acceptFile = async (selected) => {
    setError("");
    setReport(null);
    setHash("");
    setProgress(0);
    setStage("idle");
    if (!selected) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    const extensionOkay = /\.(pdf|png|jpe?g|webp)$/i.test(selected.name);
    if (!allowed.includes(selected.type) && !extensionOkay) {
      setError("Unsupported file. Please upload a PDF, PNG, JPG or WEBP file.");
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError("This prototype accepts files up to 15 MB.");
      return;
    }
    setFile(selected);
    try {
      if (window.crypto?.subtle) {
        const buffer = await selected.arrayBuffer();
        const digest = await window.crypto.subtle.digest("SHA-256", buffer);
        setHash(Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join(""));
      } else {
        setHash("SHA-256 unavailable in this browser context");
      }
    } catch {
      setHash("Fingerprint could not be generated");
    }
  };

  const runAnalysis = () => {
    if (!file) return;
    setStage("analysing");
    setProgress(0);
    setReport(null);
    let value = 0;
    const timer = setInterval(() => {
      value = Math.min(value + 10 + Math.round(Math.random() * 9), 100);
      setProgress(value);
      if (value >= 100) {
        clearInterval(timer);
        const name = file.name.toLowerCase();
        // Demo-only scenarios: filenames containing "edited" or "unknown" select illustrative outcomes.
        const chosen = name.includes("edited") ? resultSets[1] : name.includes("unknown") ? resultSets[2] : resultSets[0];
        setReport({ ...chosen, fileName: file.name, fileSize: formatBytes(file.size), createdAt: new Date().toLocaleString(), hash });
        setStage("complete");
      }
    }, 180);
  };

  const reset = () => {
    setFile(null); setHash(""); setReport(null); setStage("idle"); setProgress(0); setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const printReport = () => window.print();

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={e => e.preventDefault()}>
          <span className="brand-mark"><Icon name="shield" size={23}/></span>
          <span>DIGITAL <b>DNA</b></span>
        </a>
        <nav><a href="#how-it-works">How it works</a><a href="#about">About</a></nav>
        <span className="prototype-pill"><i/> HACKATHON PROTOTYPE</span>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><span/> DIGITAL AUTHENTICITY, MADE UNDERSTANDABLE</div>
          <h1>Don't just see it.<br/><span>Verify it.</span></h1>
          <p className="hero-copy">Upload a certificate or document and review the signals behind its digital authenticity. Clear evidence. Explainable results. No registration required.</p>
          <div className="hero-trust"><span><Icon name="lock" size={16}/> No account needed</span><span><Icon name="check" size={16}/> Evidence-based checks</span><span><Icon name="info" size={16}/> Honest about uncertainty</span></div>
        </section>

        <section className="workspace">
          <div className="section-heading">
            <div><p className="kicker">START VERIFICATION</p><h2>Upload your document</h2><p className="muted">Supported formats: PDF, PNG, JPG and WEBP · Maximum 15 MB</p></div>
            <div className="step-label"><span>01</span> UPLOAD <b>—</b> <span className={stage !== "idle" ? "active-step" : ""}>02</span> ANALYSE <b>—</b> <span className={stage === "complete" ? "active-step" : ""}>03</span> REPORT</div>
          </div>

          <div className={`upload-card ${dragging ? "dragging" : ""}`} onDragOver={e => {e.preventDefault();setDragging(true);}} onDragLeave={() => setDragging(false)} onDrop={e => {e.preventDefault();setDragging(false);acceptFile(e.dataTransfer.files?.[0]);}}>
            {!file ? <>
              <div className="upload-icon"><Icon name="upload" size={27}/></div>
              <h3>Drop your document here</h3>
              <p>or browse files from your device</p>
              <button className="button primary" onClick={() => inputRef.current?.click()}><Icon name="file" size={17}/> Choose a file</button>
              <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" hidden onChange={e => acceptFile(e.target.files?.[0])}/>
              <div className="upload-foot"><Icon name="lock" size={14}/> Your document is processed locally in this demo interface.</div>
            </> : <>
              <div className="file-selected-icon"><Icon name="file" size={27}/></div>
              <div className="selected-details"><h3>{file.name}</h3><p>{formatBytes(file.size)} <span>·</span> {file.type || "Document"}</p><small>{hash ? "SHA-256 fingerprint generated" : "Generating fingerprint…"}</small></div>
              <button className="text-button" onClick={reset}>Remove file</button>
              {hash && <div className="hash-box"><span>SHA-256</span><code>{hash}</code></div>}
              <button className="button primary analyse-button" disabled={stage === "analysing"} onClick={runAnalysis}>{stage === "analysing" ? "Analysing…" : "Analyse document"} <Icon name="arrow" size={17}/></button>
            </>}
            {error && <div className="error-message">{error}</div>}
          </div>

          {stage === "analysing" && <div className="progress-card"><div className="progress-top"><b>Reviewing document signals</b><span>{progress}%</span></div><div className="progress-track"><div style={{width:`${progress}%`}}/></div><p>Preparing file fingerprint and running the prototype demonstration checks…</p></div>}

          {report && <section className="report-card" id="report">
            <div className="report-header"><div><p className="kicker">ANALYSIS COMPLETE</p><h2>Authenticity report</h2></div><button className="button outline" onClick={printReport}><Icon name="download" size={16}/> Print report</button></div>
            <div className={`result-banner ${report.tone}`}><div className="result-symbol"><Icon name={report.tone === "green" ? "check" : "info"} size={24}/></div><div className="result-copy"><span>ASSESSMENT RESULT</span><h3>{report.status}</h3><p>{report.summary}</p></div><div className="score"><strong>{report.score === 0 ? "—" : `${report.score}%`}</strong><small>DEMO INDICATOR</small></div></div>
            <div className="report-meta"><div><span>FILE</span><b>{report.fileName}</b></div><div><span>SIZE</span><b>{report.fileSize}</b></div><div><span>GENERATED</span><b>{report.createdAt}</b></div></div>
            <h3 className="findings-title">Evidence and observations</h3>
            <div className="findings">{report.findings.map((item, i) => <div className="finding" key={i}><span className={`finding-dot ${item[2]}`}/><div><b>{item[0]}</b><p>{item[1]}</p></div></div>)}</div>
            <div className="disclaimer"><Icon name="info" size={18}/><p><b>Important:</b> This is a hackathon frontend demonstration. Results are illustrative and are not produced by real OCR, ELA, AI-detection or university verification services. A risk assessment is not a truth verdict. Always seek independent confirmation for important decisions.</p></div>
            <button className="button secondary full-button" onClick={reset}><Icon name="refresh" size={16}/> Verify another document</button>
          </section>}
        </section>

        <section className="how-section" id="how-it-works">
          <div className="center-heading"><p className="kicker">A LAYERED APPROACH</p><h2>More than a single check.</h2><p className="muted">Digital DNA is designed to combine multiple signals before presenting an explainable risk assessment.</p></div>
          <div className="layers-grid">
            <article className="layer-card"><span className="layer-number">01</span><div className="layer-icon"><Icon name="file"/></div><h3>Digital forensics</h3><p>Metadata, file properties, compression artefacts and Error Level Analysis (ELA).</p></article>
            <article className="layer-card"><span className="layer-number">02</span><div className="layer-icon"><Icon name="check"/></div><h3>Document intelligence</h3><p>OCR extraction and checks for inconsistent fonts, altered fields and layout anomalies.</p></article>
            <article className="layer-card"><span className="layer-number">03</span><div className="layer-icon"><Icon name="shield"/></div><h3>Source verification</h3><p>Issuer and document-identifier checks against an available authoritative source.</p></article>
            <article className="layer-card"><span className="layer-number">04</span><div className="layer-icon"><Icon name="info"/></div><h3>Risk assessment</h3><p>Signals are combined into a result with plain-language reasons and limitations.</p></article>
          </div>
        </section>

        <section className="about-strip" id="about"><div><p className="kicker">BUILT ON RESPONSIBLE VERIFICATION</p><h2>Evidence, not assumptions.</h2><p>Digital DNA does not label a document as fake simply because it cannot verify it. It communicates uncertainty and encourages human review.</p></div><div className="about-badge"><Icon name="shield" size={30}/><b>Don't Just See It.<br/>Verify It.</b></div></section>
      </main>

      <footer><a className="brand footer-brand" href="#" onClick={e => e.preventDefault()}><span className="brand-mark"><Icon name="shield" size={19}/></span><span>DIGITAL <b>DNA</b></span></a><span>© 2026 Digital DNA · Bingham Convocation Hackathon</span><span>Prototype interface</span></footer>
    </div>
  );
}