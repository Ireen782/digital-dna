import { useEffect, useState } from "react";
import { analyzeFile } from "./api";
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

  async function handleFile(file) {
    setFilename(file.name);
    setIsPdf(file.type === "application/pdf");
    setPreviewUrl(URL.createObjectURL(file));
    setStage("analyzing");
    try {
      // Keep the analysing screen up for at least 3s so the steps can be read
      const [data] = await Promise.all([analyzeFile(file), new Promise((r) => setTimeout(r, 3000))]);
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
    setTimeout(() => { setReport(demo.report); setStage("report"); }, 3000);
  }

  function reset() {
    setStage("upload");
    setReport(null);
    setPreviewUrl(null);
    setError("");
  }

  function go(v) { reset(); setView(v); }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo" onClick={() => go("check")}>
          {/* <Logo /> Digital DNA */}
          <span>🧬</span> Digital DNA
        </div>
        <nav>
          <button className={view === "check" ? "on" : ""} onClick={() => go("check")}>Check a file</button>
          <button className={view === "register" ? "on" : ""} onClick={() => go("register")}>Register an original</button>
        </nav>
      </header>

      <main>
        {view === "register" && <RegisterView />}
        {view === "check" && stage === "upload" && <UploadView onFile={handleFile} onDemo={handleDemo} />}
        {view === "check" && stage === "analyzing" && <AnalyzingView filename={filename} />}
        {view === "check" && stage === "report" && report && (
          <ReportView report={report} previewUrl={previewUrl} isPdf={isPdf} onReset={reset} onRegister={() => go("register")} />
        )}
        {view === "check" && stage === "error" && (
          <section className="analyzing">
            <h2>We couldn't analyse that file</h2>
            <p className="error-text">{error}</p>
            <button className="btn" onClick={reset}>Try again</button>
          </section>
        )}
      </main>

      <footer>Built for the Bingham Convocation Hackathon. A risk assessment, not a truth verdict.</footer>
    </div>
  );
}
