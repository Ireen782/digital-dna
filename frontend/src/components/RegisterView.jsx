import { useState } from "react";
import DropZone, { validate } from "./DropZone";
import Icon from "./Icon";
import { registerFile } from "../api";

export default function RegisterView() {
  const [file, setFile] = useState(null);
  const [issuer, setIssuer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function pick(f) {
    const problem = validate(f);
    if (problem) return setError(problem);
    setError(""); setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) return setError("Please choose the original file to register.");
    setBusy(true); setError("");
    try { setResult(await registerFile(file, issuer.trim())); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function useDemo() {
    try {
      const res = await fetch("/demo/Genuine.jpg");
      pick(new File([await res.blob()], "Genuine.jpg", { type: "image/jpeg" }));
      setIssuer((v) => v || "Demo University");
    } catch { setError("Couldn't load the demo original."); }
  }

  function reset() { setFile(null); setIssuer(""); setResult(null); setError(""); }

  return (
    <section className="wrap page-narrow">
      {result ? (
        <>
          <p className="eyebrow">Done</p>
          <h2 className="page-title">Original registered</h2>
          <div className="card">
            <p>
              This file's fingerprint is now on record. Anyone who later checks an identical copy
              will get a <strong>Verified Source</strong> result.
            </p>
            <dl className="facts">
              <span className="fact-row"><dt>File</dt><dd>{result.filename || file?.name}</dd></span>
              {(result.issuer || issuer) && <span className="fact-row"><dt>Issuer</dt><dd>{result.issuer || issuer}</dd></span>}
              {result.registered_at && <span className="fact-row"><dt>Registered</dt><dd>{result.registered_at}</dd></span>}
              <span className="fact-row"><dt>Fingerprint</dt><dd><code className="wrap-code">{result.sha256}</code></dd></span>
            </dl>
            <button className="btn" onClick={reset}>Register another</button>
          </div>
        </>
      ) : (
        <>
          <p className="eyebrow">For issuers</p>
          <h2 className="page-title">Register an original</h2>
          <p className="lead-dark">
            Universities, registries and employers can register the original of a document. When
            someone later checks an identical copy, they get a Verified Source result. We store the
            file's fingerprint, not its contents.
          </p>
          <ul className="mini-steps">
            <li><Icon name="upload" size={20} /> Upload the original</li>
            <li><Icon name="lock" size={20} /> We store its fingerprint</li>
            <li><Icon name="shield" size={20} /> Copies can be verified</li>
          </ul>
          <form onSubmit={submit}>
            <DropZone onPick={pick} file={file} />
            <button type="button" className="link" onClick={useDemo}>Use the demo original (Genuine.jpg)</button>
            <label className="field">Issuer name
              <input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="e.g. Bingham University" />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="btn" disabled={busy}>{busy ? "Registering…" : "Register file"}</button>
          </form>
        </>
      )}
    </section>
  );
}
