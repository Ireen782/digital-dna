import { useState } from "react";
import { DropZone, validate } from "./UploadView";
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
    setError("");
    setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) return setError("Choose the original file to register.");
    setBusy(true);
    setError("");
    try {
      setResult(await registerFile(file, issuer.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function reset() { setFile(null); setIssuer(""); setResult(null); setError(""); }

  if (result) {
    return (
      <section>
        <div className="intro"><h1>Original registered</h1></div>
        <div className="card">
          <p>
            This file's fingerprint is now on record. Anyone who later checks an identical copy
            will get a <strong>Verified Source</strong> result.
          </p>
          <dl className="facts">
            <dt>File</dt><dd>{result.filename || file?.name}</dd>
            {(result.issuer || issuer) && (<><dt>Issuer</dt><dd>{result.issuer || issuer}</dd></>)}
            {result.registered_at && (<><dt>Registered</dt><dd>{result.registered_at}</dd></>)}
            <dt>SHA-256</dt><dd><code className="wrap">{result.sha256}</code></dd>
          </dl>
          <button className="btn" onClick={reset}>Register another</button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="intro">
        <h1>Register an original</h1>
        <p>
          For issuers such as a university registry. Registering fingerprints (SHA-256) the
          original file so copies can later be checked as a Verified Source. The fingerprint is
          stored, not the document's contents.
        </p>
      </div>
      <form onSubmit={submit}>
        <DropZone onPick={pick} file={file} />
        <label className="field">
          Issuer name
          <input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="e.g. Bingham University" />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Registering…" : "Register file"}</button>
      </form>
    </section>
  );
}
