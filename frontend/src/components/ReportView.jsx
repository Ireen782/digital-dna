import { useState } from "react";

const RESULTS = {
  "Verified Source": { cls: "ok", icon: "✓", meaning: "Matched against an authoritative issuing source or a registered original." },
  "Likely Authentic": { cls: "ok", icon: "✓", meaning: "No significant manipulation indicators. The available checks support authenticity." },
  "Potentially Manipulated": { cls: "warn", icon: "!", meaning: "There is evidence of possible editing or alteration." },
  "Likely AI-Generated": { cls: "bad", icon: "!", meaning: "There are strong indicators of synthetic content." },
  "Unverified": { cls: "neutral", icon: "?", meaning: "There is not enough evidence either way." },
};

const STATUS = {
  pass: { cls: "ok", label: "Passed", icon: "✓" },
  warn: { cls: "warn", label: "Warning", icon: "!" },
  fail: { cls: "bad", label: "Failed", icon: "✕" },
  unverified: { cls: "neutral", label: "Unverified", icon: "?" },
};

const TIERS = { 1: "Tier 1 · Instant Check", 2: "Tier 2 · Verified Source" };

export default function ReportView({ report, previewUrl, isPdf, onReset, onRegister }) {
  const [copied, setCopied] = useState(false);
  const [analysedAt] = useState(() => (report.analyzed_at ? new Date(report.analyzed_at) : new Date()));
  const reference = report.reference || `DDNA-${report.sha256.slice(0, 8).toUpperCase()}`;
  const res = RESULTS[report.result] || RESULTS.Unverified;
  const fields = report.fields && typeof report.fields === "object" ? Object.entries(report.fields) : [];

  async function copyHash() {
    try {
      await navigator.clipboard.writeText(report.sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard may be blocked */ }
  }

  function downloadReport() {
    // Opens the browser print dialog; choose "Save as PDF" as the destination.
    const old = document.title;
    document.title = `Digital DNA report ${reference}`;
    window.print();
    document.title = old;
  }

  return (
    <section className="report">
      <div className="print-only print-head">
        <h1>Digital DNA Verification Report</h1>
        <p>Reference {reference} · Analysed {analysedAt.toLocaleString()}</p>
      </div>

      <div className={`verdict ${res.cls}`}>
        <div className="verdict-icon">{res.icon}</div>
        <div>
          <span className="tier-tag">{TIERS[report.tier] || TIERS[1]}</span>
          <h2>{report.result}</h2>
          <p className="summary">{report.summary}</p>
          <p className="meaning">{res.meaning}</p>
        </div>
      </div>

      <div className="report-grid">
        <div>
          <div className="card preview">
            <h3>File</h3>
            {previewUrl && !isPdf ? (
              <img src={previewUrl} alt="Uploaded document preview" />
            ) : (
              <div className="no-preview">{isPdf ? "PDF document" : "Demo file"}</div>
            )}
            <p className="filename">{report.filename}</p>
            <p className="muted ref">Reference {reference}<br />Analysed {analysedAt.toLocaleString()}</p>
            <div className="hash">
              <span className="muted">SHA-256</span>
              <code title={report.sha256}>{report.sha256.slice(0, 14)}…{report.sha256.slice(-6)}</code>
              <button className="link" onClick={copyHash}>{copied ? "Copied" : "Copy"}</button>
            </div>
          </div>

          {fields.length > 0 && (
            <div className="card">
              <h3>Details read from the document</h3>
              <dl className="facts">
                {fields.map(([k, v]) => (<span key={k} className="fact-row"><dt>{k.replace(/_/g, " ")}</dt><dd>{String(v)}</dd></span>))}
              </dl>
            </div>
          )}
        </div>

        <div className="checks">
          <h3>What we checked</h3>
          {report.checks.map((c) => {
            const st = STATUS[c.status] || STATUS.unverified;
            const pct = typeof c.score === "number" ? Math.round(c.score * 100) : null;
            return (
              <div key={c.name} className={`card check ${st.cls}`}>
                <div className="check-head">
                  <strong>{c.name}</strong>
                  <span className={`pill ${st.cls}`}>{st.icon} {st.label}</span>
                </div>
                <p>{c.detail}</p>
                {pct !== null && (
                  <div className="score">
                    <span className="muted">{c.name.includes("AI") ? "AI likelihood" : "Score"}: {pct}%</span>
                    <div className="bar"><div className={`fill ${st.cls}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                )}
              </div>
            );
          })}

          {report.tier !== 2 && (
            <div className="card tier-hint">
              <strong>Want a definitive match?</strong>
              <p>
                This was an Instant Check (Tier 1), which looks for signs of manipulation but cannot
                confirm a document was really issued. A Verified Source result (Tier 2) needs the
                issuer to confirm it, or to have registered the original.
              </p>
              <button className="link" onClick={onRegister}>Go to Register</button>
            </div>
          )}
        </div>
      </div>

      <div className="disclaimer">
        <strong>Read this as an indicator, not proof.</strong> Detectors can produce false positives
        and false negatives. A file that looks untampered can still carry false claims, and a
        failed or missing verification is not proof of forgery, since the issuer may simply have
        no verification service. For high-stakes decisions, ask for human review.
        University verification in this prototype is simulated.
      </div>

      <div className="actions">
        <button className="btn" onClick={downloadReport}>Download report (PDF)</button>
        <button className="btn secondary" onClick={onReset}>Check another file</button>
      </div>
    </section>
  );
}
