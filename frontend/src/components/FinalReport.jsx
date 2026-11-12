import Icon from "./Icon";
import Logo from "./Logo";
import { STATUS, OVERALL } from "../lib/info";
import { reportUrl } from "../api";

const LABELS = { graduate_name: "Student", institution: "Institution", certificate_number: "Certificate no.", degree: "Qualification", classification: "Classification", graduation_year: "Year" };
const FLAGGED = ["Potentially Manipulated", "Likely AI-Generated"];

function Checks({ checks }) {
  return (
    <ul className="final-checks">
      {checks.map((c) => {
        const st = STATUS[c.status] || STATUS.unverified;
        return (<li key={c.name}><span className={`pill ${st.cls}`}>{st.label}</span><div><strong>{c.name}</strong><small>{c.detail}</small></div></li>);
      })}
    </ul>
  );
}

export default function FinalReport({ report, details, cert, onBack, onReset }) {
  const overall = OVERALL[cert.result] || OVERALL["Cannot Confirm"];
  const flagged = report && FLAGGED.includes(report.result);
  const when = new Date();

  function printReport() {
    const old = document.title;
    document.title = `Digital DNA report ${cert.reference}`;
    window.print();
    document.title = old;
  }

  return (
    <section className="wrap report final">
      <div className="print-only print-head"><Logo /><h1>Digital DNA Verification Report</h1></div>
      <button className="back no-print" onClick={onBack}><Icon name="back" size={18} /> Back to Tier 2 result</button>

      <div className={`verdict ${overall.cls}`}>
        <div className="verdict-copy">
          <p className="eyebrow">Overall verification status</p>
          <h2>{overall.label}</h2>
          <p className="kind">{cert.summary}</p>
          {flagged && <p className="empathy"><Icon name="alert" size={18} /> The institution's record matches, but the Tier 1 forensic check flagged this file ({report.result}). Review the file before relying on it.</p>}
        </div>
      </div>

      <div className="final-grid">
        <div className="card">
          <h3>Candidate information</h3>
          <dl className="facts">
            {Object.entries(details).map(([k, v]) => (<span key={k} className="fact-row"><dt>{LABELS[k] || k}</dt><dd>{String(v)}</dd></span>))}
          </dl>
        </div>
        <div className="card">
          <h3>Document and references</h3>
          <dl className="facts">
            <span className="fact-row"><dt>File</dt><dd>{report ? report.filename : "Not uploaded"}</dd></span>
            {report && <span className="fact-row"><dt>Fingerprint</dt><dd><code className="wrap-code">{report.sha256}</code></dd></span>}
            {report && <span className="fact-row"><dt>Tier 1 ref.</dt><dd>{report.reference}</dd></span>}
            <span className="fact-row"><dt>Tier 2 ref.</dt><dd>{cert.reference}</dd></span>
            <span className="fact-row"><dt>Date</dt><dd>{when.toLocaleDateString(undefined, { dateStyle: "long" })}</dd></span>
          </dl>
        </div>
      </div>

      <div className="card">
        <h3>Tier 1 · Forensic document analysis{report ? `: ${report.result}` : ""}</h3>
        {report ? (<><p>{report.summary}</p><Checks checks={report.checks} /></>) : <p className="muted">No document was uploaded for this check.</p>}
      </div>
      <div className="card">
        <h3>Tier 2 · Institutional verification: {cert.result}</h3>
        <p>{cert.summary}</p>
        <Checks checks={cert.checks} />
      </div>

      <div className="disclaimer">
        <strong>An indicator, not proof.</strong> Tier 1 identifies potential document manipulation; passing is not proof of
        authenticity. Institutional records in this demonstration are fictional. A failed or unconfirmed result does not by
        itself prove forgery.
      </div>

      <div className="actions no-print">
        <button className="btn" onClick={printReport}><Icon name="download" size={18} /> Download Report</button>
        <a className="btn ghost" href={reportUrl(cert.reference)} target="_blank" rel="noreferrer">Official Tier 2 PDF</a>
        {report && <a className="btn ghost" href={reportUrl(report.reference)} target="_blank" rel="noreferrer">Official Tier 1 PDF</a>}
        <button className="btn ghost" onClick={onReset}>Verify Another Certificate</button>
      </div>
    </section>
  );
}
