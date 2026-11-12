import Icon from "./Icon";
import { Verdict, NextSteps, Evidence } from "./Findings";
import { reportUrl, requestUrl } from "../api";

const LABELS = { graduate_name: "Student", institution: "Institution", certificate_number: "Certificate no.", degree: "Qualification", classification: "Classification", graduation_year: "Year" };

export default function CertResult({ details, cert, onFinal, onEdit }) {
  return (
    <section className="wrap report">
      <button className="back no-print" onClick={onEdit}><Icon name="back" size={18} /> Edit details</button>
      <Verdict data={cert} eyebrow={`Tier 2 · Institutional verification · ${cert.reference}`} />

      <div className="report-grid">
        <div className="main-col">
          <NextSteps data={cert} />
          <h3 className="sec-title">The check we ran</h3>
          <Evidence checks={cert.checks} />

          {cert.result === "Cannot Confirm" && (
            <div className="card no-print">
              <h3>Ask the institution to confirm</h3>
              <p>This opens Digital DNA's request page in a new tab, pre-filled with these details. In this demo the
                institution's confirmation link is shown on screen, not emailed.</p>
              <a className="btn" href={requestUrl(details)} target="_blank" rel="noreferrer">Request Institution Verification</a>
            </div>
          )}
        </div>
        <aside className="side-col">
          <div className="card">
            <h3>Details submitted</h3>
            <dl className="facts">
              {Object.entries(details).map(([k, v]) => (<span key={k} className="fact-row"><dt>{LABELS[k] || k}</dt><dd>{String(v)}</dd></span>))}
            </dl>
          </div>
        </aside>
      </div>

      <div className="disclaimer">
        <strong>Demonstration data.</strong> The institutional records used here are fictional and for demonstration only.
        A failed or unconfirmed result is not proof of forgery.
      </div>

      <div className="actions no-print">
        <button className="btn" onClick={onFinal}>View final report <Icon name="arrow" size={18} /></button>
        <a className="btn ghost" href={reportUrl(cert.reference)} target="_blank" rel="noreferrer"><Icon name="download" size={18} /> Download Tier 2 PDF</a>
      </div>
    </section>
  );
}
