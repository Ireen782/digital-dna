import Icon from "./Icon";
import { STATUS, RESULTS, describeCheck } from "../lib/info";

export function Verdict({ data, eyebrow }) {
  const info = RESULTS[data.result] || RESULTS.Unverified;
  return (
    <div className={`verdict ${info.cls}`}>
      <div className="verdict-score">
        <span className="verdict-badge"><Icon name={info.icon} size={52} stroke={1.6} /></span>
        <span className={`pill ${info.cls}`}>{data.result}</span>
      </div>
      <div className="verdict-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{info.headline}</h2>
        <p className="kind">{data.summary}</p>
        <p className="empathy"><Icon name="heart" size={18} /> {info.empathy}</p>
      </div>
    </div>
  );
}

export function NextSteps({ data }) {
  const info = RESULTS[data.result] || RESULTS.Unverified;
  return (
    <div className="card next">
      <h3>What to do next</h3>
      {data.next_step ? (
        <p>{data.next_step}</p>
      ) : (
        <ol>{info.steps.map((s, i) => (<li key={i}><span>{i + 1}</span>{s}</li>))}</ol>
      )}
    </div>
  );
}

// Shows each check's name, status pill and detail exactly as the backend returned them.
export function Evidence({ checks }) {
  return (
    <div className="evidence">
      {checks.map((c, i) => {
        const st = STATUS[c.status] || STATUS.unverified;
        const ci = describeCheck(c.name);
        return (
          <article key={c.name} className={`ev ${st.cls}`} style={{ "--i": i }}>
            <span className={`ev-ico ${st.cls}`}><Icon name={ci.icon} size={22} /></span>
            <div className="ev-body">
              <div className="ev-head"><h4>{c.name}</h4><span className={`pill ${st.cls}`}>{st.label}</span></div>
              {ci.what && <p className="what">{ci.what}</p>}
              <p className="found"><strong>What we found:</strong> {c.detail}</p>
              {c.status !== "pass" && ci.todo && <p className="todo">→ {ci.todo}</p>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
