import { useState } from "react";
import DropZone, { validate } from "./DropZone";
import Icon from "./Icon";
import SampleCertificate from "./SampleCertificate";
import Reveal from "./Reveal";
import { DEMO_CASES } from "../mockReports";

export default function UploadView({ onFile, onDemo, onRegister }) {
  const [error, setError] = useState("");
  const [resultData, setResultData] = useState(null);

  function pick(file) {
    const problem = validate(file);
    if (problem) return setError(problem);
    setError("");
    onFile(file);
  }

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow light">Digital authenticity check</p>
            <h1>Check before <em>you trust.</em></h1>
            <p className="lead">
              Upload a certificate or document. In under a minute you'll see how much to trust it,
              why, and exactly what to do next.
            </p>

            <DropZone onPick={pick} />
            {error && <p className="error-text on-dark">{error}</p>}

            <div className="samples">
              <span>No file handy? Try a sample:</span>
              {DEMO_CASES.map((d) => (
                <button key={d.key} className="chip" onClick={() => onDemo(d)}>{d.label}</button>
              ))}
            </div>

            <ul className="assure">
              <li><Icon name="user" size={18} /> No account needed</li>
              <li><Icon name="lock" size={18} /> Deleted after analysis</li>
              <li><Icon name="eye" size={18} /> Every finding explained</li>
            </ul>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-cert"><SampleCertificate highlight="year" /></div>
            <div className="callout c1"><span className="cdot warn" />
              <div><strong>Year field</strong><small>Saved differently from the rest</small></div></div>
            <div className="callout c2"><span className="cdot neutral" />
              <div><strong>Issuer</strong><small>Couldn't be confirmed</small></div></div>
            <div className="callout c3">
              <div><small>Integrity score</small><strong className="big">63<i>/100</i></strong></div></div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section" id="how">
        <div className="wrap how-grid">
          <Reveal className="how-intro">
            <p className="eyebrow">How it works</p>
            <h2>You drop the file in. We do the <span className="squig">squinting.</span></h2>
            <p>
              No account, no forms, no jargon. You get an answer you can act on, and the reasoning
              behind it, so you're never asked to just take our word for it.
            </p>
          </Reveal>
          <ol className="how-steps">
            {[
              ["upload", "Upload it", "A photo, a scan or a PDF. Even a slightly crooked phone picture works."],
              ["search", "We look closely", "Four separate checks look at the file's hidden details, the image itself, AI signals and the issuer."],
              ["report", "You get a plain-English report", "A score out of 100, what we found, and the next steps worth taking."],
            ].map(([icon, t, d], i) => (
              <Reveal as="li" key={t} delay={(i + 1) * 100} className="how-step">
                <span className="n">0{i + 1}</span>
                <div><h3>{t}</h3><p>{d}</p></div>
                <span className="ic"><Icon name={icon} size={28} stroke={1.5} /></span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- What we look at ---------- */}
      <section className="section paper2" id="checks">
        <div className="wrap">
          <Reveal>
            <p className="eyebrow">What gets checked</p>
            <h2>Four things, and what a red flag looks like for each</h2>
          </Reveal>
          <div className="field-notes">
            {[
              ["tag", "Hidden file details", "Every image or PDF carries notes about itself: which app saved it, and when.", "Last saved in an image editor, long after the date on the document."],
              ["layers", "Edit traces in the image", "A photo is saved as one piece. If a name or date was pasted in, that patch is compressed differently from the rest.", "One field, like a year, looks newer than everything around it."],
              ["spark", "AI-generation signals", "AI-made images leave statistical fingerprints. We estimate how likely they are, without guessing.", "A flawless page with no trace of a camera or scanner."],
              ["bank", "Issuer confirmation", "The only check that can say a document is real: asking the people who issued it. (Simulated in this prototype.)", "No record under that certificate number, or no way to reach the issuer."],
            ].map(([icon, t, d, flag], i) => (
              <Reveal key={t} delay={(i % 2) * 80} className="note-row">
                <span className="idx">0{i + 1}</span>
                <div className="note-main">
                  <h3><Icon name={icon} size={20} stroke={1.7} /> {t}</h3>
                  <p>{d}</p>
                </div>
                <p className="flag"><small>A flag looks like</small>{flag}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Two tiers ---------- */}
      <section className="section" id="tiers">
        <div className="wrap">
          <Reveal>
            <p className="eyebrow">Two levels of certainty</p>
            <h2>Two different questions, so two different kinds of answer</h2>
          </Reveal>
          <div className="tiers2">
            <Reveal className="tier2 light">
              <span className="tag">Tier 1 · Instant Check</span>
              <p className="q">Does this file show signs of being changed?</p>
              <p><strong>What you get.</strong> A fast read on editing and AI generation. Works on any file, no registration.</p>
              <p><strong>What it can't do.</strong> Prove that a certificate was truly issued. For that you need the issuer.</p>
            </Reveal>
            <Reveal delay={120} className="tier2 dark">
              <span className="tag">Tier 2 · Verified Source</span>
              <p className="q">Can the issuer confirm it's real?</p>
              <p><strong>What you get.</strong> A match against the issuer's own record, on top of everything in Tier 1.</p>
              <p><strong>What it can't do.</strong> Say anything if the issuer has no verification service. That is never a sign of forgery.</p>
              <button className="link-light" onClick={onRegister}>Issuers: register an original <Icon name="arrow" size={16} /></button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Analysis Results Section ---------- */}
      <section className="section" id="results">
        <div className="wrap">
          <div className="card-box" style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "2rem", margin: "2rem 0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <p className="eyebrow">Output</p>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.75rem" }}>Analysis Results</h3>
            <div style={{ color: "var(--text-muted, #64748b)", padding: "1.5rem 0", textAlign: "center" }}>
              {resultData ? (
                <p style={{ color: "var(--text-main, #1e293b)", textAlign: "left", lineHeight: "1.6" }}>{resultData}</p>
              ) : (
                <p style={{ fontStyle: "italic" }}>Results will appear here once processed.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Platform Goals Section ---------- */}
      <section className="section paper2" id="goals">
        <div className="wrap">
          <Reveal>
            <p className="eyebrow">Our Vision</p>
            <h2>Platform Goals & Commitments</h2>
            <div className="field-notes" style={{ marginTop: "1.5rem" }}>
              <div className="note-row">
                <span className="idx">01</span>
                <div className="note-main">
                  <h3>Seamless Verification</h3>
                  <p>Delivering fast, intuitive, and accessible digital trust solutions for everyday users and institutions alike.</p>
                </div>
              </div>
              <div className="note-row">
                <span className="idx">02</span>
                <div className="note-main">
                  <h3>User Empowerment</h3>
                  <p>Providing clear, jargon-free reasoning behind every analysis so you always understand the facts.</p>
                </div>
              </div>
              <div className="note-row">
                <span className="idx">03</span>
                <div className="note-main">
                  <h3>Reliable Security</h3>
                  <p>Ensuring zero data retention post-analysis and maintaining a dependable, private verification workflow.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}