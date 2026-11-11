import { useState } from "react";
import Icon from "./Icon";
import ScoreRing from "./ScoreRing";
import DocPreview from "./DocPreview";
import { STATUS, RESULTS, TIERS, computeScore, band, describeCheck } from "../lib/info";

export default function ReportView({ report, previewUrl, isPdf, onReset, onRegister }) {
  const [copied, setCopied] = useState(false);
  const [analysedAt] = useState(() => (report.analyzed_at ? new Date(report.analyzed_at) : new Date()));
  const reference = report.reference || `DDNA-${report.sha256.slice(0, 8).toUpperCase()}`;
  const info = RESULTS[report.result] || RESULTS.Unverified;
  const { score, rows } = computeScore(report);
  const b = band(score);
  const fields = report.fields && typeof report.fields === "object" ? Object.entries(report.fields) : [];
  const needsAttention = report.checks.filter((c) => c.status !== "pass");

  async function copyHash() {
    try {
      await navigator.clipboard.writeText(report.sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard may be blocked */ }
  }

  function downloadReport() {
    const old = document.title;
    document.title = `Digital DNA report ${reference}`;
    window.print();
    document.title = old;
  }

  return (
    <section className="wrap report">
      <div className="print-only print-head">
        <h1>Digital DNA Verification Report</h1>
        <p>Reference {reference} · Analysed {analysedAt.toLocaleString()}</p>
      </div>

      <button className="back no-print" onClick={onReset}><Icon name="back" size={18} /> Check another file</button>

      {/* ---------- Verdict ---------- */}
      <div className={`verdict ${info.cls}`}>
        <div className="verdict-score">
          <ScoreRing score={score} cls={b.cls} />
          <span className={`band ${b.cls}`}>{b.label}</span>
          <small>Integrity score</small>
        </div>
        <div className="verdict-copy">
          <p className="eyebrow">{TIERS[report.tier] || TIERS[1]} · {report.result}</p>
          <h2>{info.headline}</h2>
          <p className="kind">{report.summary}</p>
          <p className="empathy"><Icon name="heart" size={18} /> {info.empathy}</p>
        </div>
      </div>

      <div className="report-grid">
        <div className="main-col">
          {/* ---------- Next steps ---------- */}
          <div className="card next">
            <h3>What to do next</h3>
            <ol>
              {info.steps.map((s, i) => (<li key={i}><span>{i + 1}</span>{s}</li>))}
            </ol>
            {info.own && <p className="own"><Icon name="user" size={16} /> {info.own}</p>}
          </div>

          {/* ---------- Evidence ---------- */}
          <h3 className="sec-title">The evidence behind the score</h3>
          <div className="evidence">
            {report.checks.map((c, i) => {
              const st = STATUS[c.status] || STATUS.unverified;
              const ci = describeCheck(c.name);
              const row = rows?.find((r) => r.name === c.name);
              const pct = typeof c.score === "number" ? Math.round(c.score * 100) : null;
              return (
                <article key={c.name} className={`ev ${st.cls}`} style={{ "--i": i }}>
                  <span className={`ev-ico ${st.cls}`}><Icon name={ci.icon} size={22} /></span>
                  <div className="ev-body">
                    <div className="ev-head">
                      <h4>{ci.title}</h4>
                      <span className={`pill ${st.cls}`}>{st.label}</span>
                    </div>
                    {ci.what && <p className="what">{ci.what}</p>}
                    <p className="found"><strong>What we found:</strong> {c.detail}</p>
                    {pct !== null && <p className="what">AI likelihood: {pct}%</p>}
                    {c.status !== "pass" && ci.todo && <p className="todo">→ {ci.todo}</p>}
                  </div>
                  {row && (
                    <div className="pts">
                      <strong>{row.points}</strong><span>/ {row.max}</span>
                      <div className="meter"><div className={`fill ${st.cls}`} style={{ width: `${(row.points / row.max) * 100}%` }} /></div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <details className="how-score">
            <summary>How is the score calculated?</summary>
            <p>
              The integrity score shows how untouched the file looks, out of 100. Each check is worth
              a fixed number of points: hidden file details 25, edit traces 25, AI signals 30,
              issuer confirmation 20. A passed check earns all its points, a warning earns half, a
              strong concern earns none, and "couldn't confirm" earns half because it is neutral. The
              AI check uses its measured likelihood directly. The score is a guide, not proof of origin.
            </p>
          </details>
        </div>

        {/* ---------- Side column ---------- */}
        <aside className="side-col">
          <div className="card">
            <h3>Your file</h3>
            <DocPreview previewUrl={previewUrl} isPdf={isPdf} highlight={report.highlight} />
            <p className="filename">{report.filename}</p>
            {needsAttention.length > 0 && report.highlight === "year" && (
              <p className="legend"><span className="swatch" /> Highlighted: the area that looks changed</p>
            )}
          </div>

          {fields.length > 0 && (
            <div className="card">
              <h3>Details we read</h3>
              <dl className="facts">
                {fields.map(([k, v]) => (<span key={k} className="fact-row"><dt>{k.replace(/_/g, " ")}</dt><dd>{String(v)}</dd></span>))}
              </dl>
            </div>
          )}

          <div className="card">
            <h3>Report record</h3>
            <dl className="facts">
              <span className="fact-row"><dt>Reference</dt><dd>{reference}</dd></span>
              <span className="fact-row"><dt>Analysed</dt><dd>{analysedAt.toLocaleString()}</dd></span>
            </dl>
            <div className="hash">
              <span className="muted">Fingerprint (SHA-256)</span>
              <code title={report.sha256}>{report.sha256.slice(0, 14)}…{report.sha256.slice(-6)}</code>
              <button className="link no-print" onClick={copyHash}>{copied ? "Copied" : "Copy"}</button>
            </div>
          </div>

          {report.tier !== 2 && (
            <div className="card tier-hint no-print">
              <h3>Want a definitive answer?</h3>
              <p>
                An Instant Check can spot signs of tampering but can't confirm a document was really
                issued. Only the issuer can do that.
              </p>
              <button className="link" onClick={onRegister}>Issuers: register an original →</button>
            </div>
          )}
        </aside>
      </div>

      <div className="disclaimer">
        <strong>An indicator, not proof.</strong> Detectors can be wrong in both directions. A file
        that looks untouched can still carry false claims, and a failed or missing verification is
        not proof of forgery, since the issuer may simply have no verification service. For
        high-stakes decisions, ask for human review. Issuer verification here is simulated.
      </div>

      <div className="actions no-print">
        <button className="btn" onClick={downloadReport}><Icon name="download" size={18} /> Download report (PDF)</button>
        <button className="btn ghost" onClick={onReset}>Check another file</button>
      </div>
    </section>
  );
}
