from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter()

PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Digital DNA - Certificate Check</title>
<style>
  body { font-family: Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 24px; color: #1b2433; }
  .card { max-width: 560px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,.08); }
  h1 { margin-top: 0; font-size: 22px; }
  label { display: block; margin-top: 14px; font-weight: bold; font-size: 14px; }
  input { width: 100%; padding: 10px; margin-top: 4px; border: 1px solid #c5cbd8; border-radius: 8px; box-sizing: border-box; font-size: 15px; }
  .hint { font-size: 12px; color: #667; font-weight: normal; }
  button { margin-top: 18px; padding: 11px 18px; border: 0; border-radius: 8px; font-size: 15px; cursor: pointer; }
  #check { background: #2f5bea; color: #fff; }
  #demo { background: #e4e8f3; color: #1b2433; margin-left: 8px; }
  #out { margin-top: 22px; }
  .result { padding: 14px; border-radius: 8px; font-size: 18px; font-weight: bold; }
  .good { background: #dff5e3; color: #17692b; }
  .bad { background: #fde2e2; color: #a12222; }
  .unsure { background: #fff3d6; color: #8a5a00; }
  .check { border-left: 4px solid #c5cbd8; padding: 6px 10px; margin-top: 10px; font-size: 14px; }
  .links a { margin-right: 12px; }
  .note { font-size: 12px; color: #667; margin-top: 16px; }
</style>
</head>
<body>
<div class="card">
  <h1>Certificate Check</h1>
  <p class="note">Demo records are fictional. Click "Fill demo example" to try one.</p>

  <label>Institution
    <input id="institution" list="insts" placeholder="e.g. Demo University">
  </label>
  <datalist id="insts">
    <option value="Demo University">
    <option value="Sample Polytechnic">
  </datalist>

  <label>Graduate name
    <input id="graduate_name" placeholder="e.g. Amina Yusuf">
  </label>

  <label>Certificate number
    <input id="certificate_number" placeholder="e.g. DU/2022/00123">
  </label>

  <label>Degree <span class="hint">(optional)</span>
    <input id="degree" placeholder="e.g. B.Sc. Computer Science">
  </label>

  <label>Classification <span class="hint">(optional)</span>
    <input id="classification" placeholder="e.g. Second Class Upper">
  </label>

  <label>Graduation year <span class="hint">(optional)</span>
    <input id="graduation_year" type="number" placeholder="e.g. 2022">
  </label>

  <button id="check">Check certificate</button>
  <button id="demo" type="button">Fill demo example</button>

  <div id="out"></div>
</div>

<script>
const ids = ["institution", "graduate_name", "certificate_number", "degree", "classification", "graduation_year"];

document.getElementById("demo").onclick = function () {
  const demo = {
    institution: "Demo University",
    graduate_name: "Amina Yusuf",
    certificate_number: "DU/2022/00123",
    degree: "B.Sc. Computer Science",
    classification: "Second Class Upper",
    graduation_year: "2022"
  };
  ids.forEach(function (id) { document.getElementById(id).value = demo[id]; });
};

document.getElementById("check").onclick = async function () {
  const out = document.getElementById("out");
  out.textContent = "Checking...";
  const payload = {};
  ids.forEach(function (id) {
    const v = document.getElementById(id).value.trim();
    if (v !== "") { payload[id] = (id === "graduation_year") ? Number(v) : v; }
  });
  if (!payload.institution || !payload.graduate_name || !payload.certificate_number) {
    out.textContent = "Please fill in institution, graduate name and certificate number.";
    return;
  }
  try {
    const res = await fetch("/verify-certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) { out.textContent = "Error: " + JSON.stringify(data); return; }
    render(data);
  } catch (e) {
    out.textContent = "Could not reach the server: " + e;
  }
};

function render(data) {
  const out = document.getElementById("out");
  out.innerHTML = "";

  const r = document.createElement("div");
  r.className = "result " + (data.result === "Institutionally Verified" ? "good" :
                             data.result === "Verification Failed" ? "bad" : "unsure");
  r.textContent = data.result;
  out.appendChild(r);

  const s = document.createElement("p");
  s.textContent = data.summary;
  out.appendChild(s);

  data.checks.forEach(function (c) {
    const d = document.createElement("div");
    d.className = "check";
    d.textContent = c.name + " [" + c.status + "]: " + c.detail;
    out.appendChild(d);
  });

  const links = document.createElement("p");
  links.className = "links";
  links.appendChild(document.createTextNode("Download report: "));
  ["pdf", "docx", "json", "txt"].forEach(function (f) {
    const a = document.createElement("a");
    a.href = data.report_url + "?format=" + f;
    a.textContent = f.toUpperCase();
    links.appendChild(a);
  });
  out.appendChild(links);

  const ref = document.createElement("p");
  ref.className = "note";
  ref.textContent = "Reference: " + data.reference + ". An unverified or failed result is not proof of forgery.";
  out.appendChild(ref);
}
</script>
</body>
</html>
"""


@router.get("/certificate", response_class=HTMLResponse)
def certificate_page():
    return PAGE