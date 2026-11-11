import { useEffect, useState } from "react";
import { analyzeFile, DEMO_MODE } from "./api";
import UploadView from "./components/UploadView";
import AnalyzingView from "./components/AnalyzingView";
import ReportView from "./components/ReportView";
import RegisterView from "./components/RegisterView";
import Logo from "./components/Logo";

export default function App() {
  const [view, setView] = useState("check"); // check | register
  const [stage, setStage] = useState("upload"); // upload | analyzing | report | error
  const [filename, setFilename] = useState("");
  const [report, setReport] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [stage, view]);

  async function handleFile(file) {
    setFilename(file.name);
    setIsPdf(file.type === "application/pdf");
    setPreviewUrl(URL.createObjectURL(file));
    setStage("analyzing");
    try {
      // Keep the analysing screen up for at least 3.6s so the steps can be read
      const [data] = await Promise.all([analyzeFile(file), new Promise((r) => setTimeout(r, 3600))]);
      setReport(data);
      setStage("report");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setStage("error");
    }
  }

  function handleDemo(demo) {
    setFilename(demo.report.filename);
    setPreviewUrl(null);
    setIsPdf(false);
    setStage("analyzing");
    setTimeout(() => { setReport(demo.report); setStage("report"); }, 3600);
  }

  function reset() {
    setStage("upload"); setReport(null); setPreviewUrl(null); setError("");
  }
  function go(v) { reset(); setView(v); }
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
            <button className={view === "check" ? "on" : ""} onClick={() => go("check")}>Check a file</button>
            <button className={view === "register" ? "on" : ""} onClick={() => go("register")}>Register an original</button>
          </nav>
        </div>
      </header>
      {DEMO_MODE && (
        <div className="demo-banner no-print">Demo mode: results are simulated and no backend is used.</div>
      )}

      <main>
        {view === "register" && <RegisterView />}
        {view === "check" && stage === "upload" && <UploadView onFile={handleFile} onDemo={handleDemo} onRegister={() => go("register")} />}
        {view === "check" && stage === "analyzing" && <AnalyzingView filename={filename} previewUrl={previewUrl} isPdf={isPdf} />}
        {view === "check" && stage === "report" && report && (
          <ReportView report={report} previewUrl={previewUrl} isPdf={isPdf} onReset={reset} onRegister={() => go("register")} />
        )}
        {view === "check" && stage === "error" && (
          <section className="wrap page-narrow center">
            <p className="eyebrow">Something went wrong</p>
            <h2 className="page-title">We couldn't analyse that file</h2>
            <p className="lead-dark">{error}</p>
            <p className="muted">Nothing is wrong with your file. This is a connection problem on our side.</p>
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
