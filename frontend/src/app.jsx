import { useEffect, useRef, useState } from "react";
import { verifyFile } from "./api";
import UploadView from "./components/UploadView";
import AnalyzingView from "./components/AnalyzingView";
import ReportView from "./components/ReportView";
import CertificateForm from "./components/CertificateForm";
import CertResult from "./components/CertResult";
import FinalReport from "./components/FinalReport";
import RegisterView from "./components/RegisterView";
import Logo from "./components/Logo";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [view, setView] = useState("check"); // check | register
  const [step, setStep] = useState("upload"); // upload | analyzing | report | error | form | result | final
  const [filename, setFilename] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [report, setReport] = useState(null); // Tier 1 response from POST /verify
  const [details, setDetails] = useState({}); // what was typed into the Tier 2 form
  const [cert, setCert] = useState(null); // Tier 2 response from POST /verify-certificate
  const [error, setError] = useState("");
  const run = useRef(0); // ignores a slow response if the user has already moved on

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step, view]);

  async function handleFile(file) {
    const id = ++run.current;
    setFilename(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setReport(null); setCert(null); setDetails({});
    setStep("analyzing");
    try {
      // Keep the analysing screen up for at least 3.6s so the steps can be read.
      const [data] = await Promise.all([verifyFile(file), wait(3600)]);
      if (id !== run.current) return;
      setReport(data);
      setStep("report");
    } catch (e) {
      if (id !== run.current) return;
      setError(e.message || "Something went wrong.");
      setStep("error");
    }
  }

  function reset() {
    run.current++;
    setStep("upload"); setReport(null); setCert(null); setDetails({}); setPreviewUrl(null); setError("");
  }
  function go(v) { reset(); setView(v); }
  function detailsOnly() { reset(); setView("check"); setStep("form"); }
  function jump(id) {
    go("check");
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  return (
    <div className="app">
      <header className="topbar no-print">
        <div className="wrap bar">
          <button className="brand" onClick={() => go("check")} aria-label="Digital DNA home"><Logo /></button>
          <nav>
            <button className={view === "check" && step !== "form" && step !== "result" && step !== "final" ? "on" : ""} onClick={() => go("check")}>Check a file</button>
            <button className={view === "check" && ["form", "result", "final"].includes(step) ? "on" : ""} onClick={detailsOnly}>Verify details</button>
            <button className={view === "register" ? "on" : ""} onClick={() => go("register")}>Register an original</button>
          </nav>
        </div>
      </header>

      <main>
        {view === "register" && <RegisterView />}
        {view === "check" && step === "upload" && <UploadView onFile={handleFile} onRegister={() => go("register")} />}
        {view === "check" && step === "analyzing" && <AnalyzingView filename={filename} previewUrl={previewUrl} isPdf={false} />}
        {view === "check" && step === "report" && report && (
          <ReportView report={report} previewUrl={previewUrl} onReset={reset} onContinue={() => setStep("form")} />
        )}
        {view === "check" && step === "form" && (
          <CertificateForm initial={details} hasReport={!!report} onBack={() => setStep("report")}
            onDone={(d, c) => { setDetails(d); setCert(c); setStep("result"); }} />
        )}
        {view === "check" && step === "result" && cert && (
          <CertResult details={details} cert={cert} onEdit={() => setStep("form")} onFinal={() => setStep("final")} />
        )}
        {view === "check" && step === "final" && cert && (
          <FinalReport report={report} details={details} cert={cert} onBack={() => setStep("result")} onReset={reset} />
        )}
        {view === "check" && step === "error" && (
          <section className="wrap page-narrow center">
            <p className="eyebrow">Something went wrong</p>
            <h2 className="page-title">We couldn't analyse that file</h2>
            <p className="lead-dark">{error}</p>
            <button className="btn" onClick={reset}>Try again</button>
          </section>
        )}
      </main>

      <footer className="foot no-print">
        <div className="wrap foot-grid">
          <div className="foot-brand">
            <button className="brand" onClick={() => go("check")} aria-label="Digital DNA home"><Logo /></button>
            <p>Check before you trust. Digital DNA shows how much to trust a document, why, and what to do next.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><button onClick={() => go("check")}>Check a file</button></li>
              <li><button onClick={() => go("register")}>Register an original</button></li>
              <li><button onClick={() => jump("how")}>How it works</button></li>
              <li><button onClick={() => jump("tiers")}>Two levels of certainty</button></li>
            </ul>
          </div>
          <div>
            <h4>Good to know</h4>
            <ul className="plain">
              <li>Files are deleted after analysis</li>
              <li>Results are indicators, not proof</li>
              <li>Issuer checks are simulated here</li>
            </ul>
          </div>
          <div>
            <h4>Our goals</h4>
            <p className="goals-text">Supporting the UN Sustainable Development Goals.</p>
            <div className="sdg"><span>SDG 9</span><span>SDG 16</span><span>SDG 17</span></div>
          </div>
        </div>
        <div className="foot-bottom">
          <div className="wrap foot-bottom-in">
            <span>© 2026 Digital DNA</span>
            <span>Upload. Investigate. Verify.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
