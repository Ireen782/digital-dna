import { useState } from "react";
import Icon from "./Icon";
import { verifyCertificate } from "../api";

const EMPTY = { institution: "", graduate_name: "", certificate_number: "", degree: "", classification: "", graduation_year: "" };

// Presenter shortcuts. These use the backend's FICTIONAL demo records (see GET /demo-records).
const SCENARIOS = [
  { label: "Matching record", values: { institution: "Demo University", graduate_name: "Amina Yusuf", certificate_number: "DU/2022/00123", degree: "B.Sc. Computer Science", classification: "Second Class Upper", graduation_year: "2022" } },
  { label: "Incorrect details", values: { institution: "Demo University", graduate_name: "Amina Yusuf", certificate_number: "DU/2022/00123", degree: "B.Sc. Computer Science", classification: "First Class", graduation_year: "2022" } },
  { label: "Unconnected institution", values: { institution: "Bingham University", graduate_name: "Adaeze Okafor", certificate_number: "BU/2022/04817", degree: "B.Sc. Computer Science", classification: "Second Class Upper", graduation_year: "2022" } },
];

function clean(f) {
  const d = {};
  Object.entries(f).forEach(([k, v]) => {
    const t = String(v ?? "").trim();
    if (t) d[k] = k === "graduation_year" ? Number(t) : t;
  });
  return d;
}

export default function CertificateForm({ initial, hasReport, onDone, onBack }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const d = clean(f);
    if (!d.graduate_name || !d.institution || !d.certificate_number)
      return setError("Please fill in the student's name, the institution and the certificate number.");
    if (d.graduation_year !== undefined && !/^\d{4}$/.test(String(d.graduation_year)))
      return setError("Graduation year should be four digits, for example 2022.");
    setBusy(true); setError("");
    try {
      onDone(d, await verifyCertificate(d));
    } catch (err) {
      setError(err.message); setBusy(false);
    }
  }

  return (
    <section className="wrap page-narrow">
      {hasReport && <button className="back no-print" onClick={onBack}><Icon name="back" size={18} /> Back to Tier 1 report</button>}
      <p className="eyebrow">Tier 2 · Institutional verification</p>
      <h2 className="page-title">Check the details with the institution</h2>
      <p className="lead-dark">Enter the details printed on the certificate. Institutional records here are fictional demo data.</p>

      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <label className="field">Student full name<input value={f.graduate_name} onChange={set("graduate_name")} placeholder="e.g. Amina Yusuf" /></label>
          <label className="field">Institution name<input value={f.institution} onChange={set("institution")} placeholder="e.g. Demo University" /></label>
          <label className="field">Certificate number<input value={f.certificate_number} onChange={set("certificate_number")} placeholder="e.g. DU/2022/00123" /></label>
          <label className="field">Qualification and course<input value={f.degree} onChange={set("degree")} placeholder="e.g. B.Sc. Computer Science" /></label>
          <label className="field">Classification (optional)<input value={f.classification} onChange={set("classification")} placeholder="e.g. Second Class Upper" /></label>
          <label className="field">Graduation year<input value={f.graduation_year} onChange={set("graduation_year")} inputMode="numeric" placeholder="e.g. 2022" /></label>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Verifying…" : "Verify Institutionally"}</button>
      </form>

      <details className="demo-panel no-print">
        <summary>Presenter shortcuts (demo data)</summary>
        <div className="demo-chips">
          {SCENARIOS.map((s) => (
            <button key={s.label} type="button" className="chip dark" onClick={() => { setF({ ...EMPTY, ...s.values }); setError(""); }}>{s.label}</button>
          ))}
        </div>
      </details>
    </section>
  );
}
