import Icon from "./Icon";
import DocPreview from "./DocPreview";
import { Verdict, NextSteps, Evidence } from "./Findings";
import { reportUrl } from "../api";

// Tier 1 report: the backend's forensic checks on the uploaded file.
export default function ReportView({ report, previewUrl, onContinue, onReset }) {
  return (
    <section className="wrap report">
      <button className="back no-print" onClick={onReset}><Icon name="back" size={18} /> Check another file</button>
      <Verdict data={report} eyebrow={`Tier 1 · Forensic document analysis · ${report.reference}`} />

      <div className="report-grid">
        <div className="main-col">
          <NextSteps data={report} />
          <h3 className="sec-title">The checks we ran</h3>
          <Evidence checks={report.checks} />
        </div>
        <aside className="side-col">
          <div className="card">
            <h3>Your file</h3>
            <DocPreview previewUrl={previewUrl} isPdf={false} />
            <p className="filename">{report.filename}</p>
          </div>
          <div className="card">
            <h3>Report record</h3>
            <dl className="facts">
              <span className="fact-row"><dt>Reference</dt><dd>{report.reference}</dd></span>
              <span className="fact-row"><dt>Fingerprint</dt><dd><code className="wrap-code">{report.sha256}</code></dd></span>
            </dl>
          </div>
        </aside>
      </div>

      <div className="disclaimer">
        <strong>An indicator, not proof.</strong> Tier 1 identifies potential document manipulation. A
        document passing forensic analysis is not automatically authentic. Only the issuing institution can confirm that.
      </div>

      <div className="actions no-print">
        <button className="btn" onClick={onContinue}>Continue to Institutional Verification <Icon name="arrow" size={18} /></button>
        <a className="btn ghost" href={reportUrl(report.reference)} target="_blank" rel="noreferrer"><Icon name="download" size={18} /> Download Tier 1 PDF</a>
      </div>
    </section>
  );
}
