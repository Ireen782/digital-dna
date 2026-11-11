import hashlib
import html
import json
import re
import secrets
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

router = APIRouter()
DB = "digitaldna.db"
REF_PATTERN = re.compile(r"VR-[0-9A-F]{8}")


def init_requests_db():
    conn = sqlite3.connect(DB)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS verification_requests (
            reference TEXT PRIMARY KEY,
            token TEXT,
            institution TEXT,
            graduate_name TEXT,
            certificate_number TEXT,
            degree TEXT,
            classification TEXT,
            graduation_year INTEGER,
            requester TEXT,
            status TEXT,
            created_at TEXT,
            responded_at TEXT,
            institution_note TEXT,
            report_reference TEXT
        )"""
    )
    conn.execute(
        """CREATE TABLE IF NOT EXISTS reports (
            reference TEXT PRIMARY KEY,
            filename TEXT,
            sha256 TEXT,
            result TEXT,
            summary TEXT,
            checks TEXT,
            created_at TEXT
        )"""
    )
    conn.commit()
    conn.close()


init_requests_db()


class RequestIn(BaseModel):
    institution: str
    graduate_name: str
    certificate_number: str
    degree: str | None = None
    classification: str | None = None
    graduation_year: int | None = None
    requester: str | None = None


class RespondIn(BaseModel):
    token: str
    decision: Literal["confirm", "reject"]
    note: str | None = None


def now():
    return datetime.now(timezone.utc).isoformat()


def check_reference(reference):
    if not REF_PATTERN.fullmatch(reference):
        raise HTTPException(status_code=404, detail="Request not found")


@router.post("/request-verification")
def request_verification(body: RequestIn):
    reference = "VR-" + uuid.uuid4().hex[:8].upper()
    token = secrets.token_hex(16)
    conn = sqlite3.connect(DB)
    conn.execute(
        "INSERT INTO verification_requests (reference, token, institution, graduate_name, "
        "certificate_number, degree, classification, graduation_year, requester, status, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)",
        (
            reference, token, body.institution.strip(), body.graduate_name.strip(),
            body.certificate_number.strip(), body.degree, body.classification,
            body.graduation_year, body.requester, now(),
        ),
    )
    conn.commit()
    conn.close()
    return {
        "reference": reference,
        "status": "Pending",
        "status_url": f"/request-status/{reference}",
        "institution_url": f"/institution/{reference}?token={token}",
        "note": "In a real deployment the institution link is sent to the institution's verification office. For the demo it is shown here.",
    }


@router.get("/verification-request/{reference}")
def verification_request(reference: str):
    check_reference(reference)
    conn = sqlite3.connect(DB)
    row = conn.execute(
        "SELECT institution, graduate_name, certificate_number, status, created_at, "
        "responded_at, institution_note, report_reference "
        "FROM verification_requests WHERE reference = ?",
        (reference,),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    institution, name, number, status, created_at, responded_at, note, report_ref = row
    return {
        "reference": reference,
        "institution": institution,
        "graduate_name": name,
        "certificate_number": number,
        "status": status,
        "created_at": created_at,
        "responded_at": responded_at,
        "institution_note": note,
        "report_reference": report_ref,
        "report_url": f"/report/{report_ref}" if report_ref else None,
    }


@router.post("/respond-verification/{reference}")
def respond_verification(reference: str, body: RespondIn):
    check_reference(reference)
    conn = sqlite3.connect(DB)
    row = conn.execute(
        "SELECT token, institution, graduate_name, certificate_number, degree, "
        "classification, graduation_year, status FROM verification_requests WHERE reference = ?",
        (reference,),
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    token, institution, name, number, degree, classification, year, status = row
    if not secrets.compare_digest(token, body.token):
        conn.close()
        raise HTTPException(status_code=403, detail="Invalid token")
    if status != "Pending":
        conn.close()
        raise HTTPException(status_code=409, detail="This request has already been answered")

    responded_at = now()
    note_text = f" Institution's note: {body.note.strip()}" if body.note and body.note.strip() else ""

    if body.decision == "confirm":
        new_status = "Confirmed"
        result = "Institutionally Verified"
        summary = f"{institution} confirmed these certificate details through a verification request."
        check = {
            "name": "Institutional confirmation (verification request)",
            "status": "pass",
            "detail": f"{institution} confirmed the submitted details on {responded_at}.{note_text}",
        }
    else:
        new_status = "Rejected"
        result = "Verification Failed"
        summary = f"{institution} did not confirm these certificate details."
        check = {
            "name": "Institutional confirmation (verification request)",
            "status": "fail",
            "detail": (
                f"{institution} rejected the submitted details on {responded_at}. "
                f"This is the institution's own response.{note_text}"
            ),
        }

    canonical = json.dumps(
        {
            "institution": institution, "graduate_name": name, "certificate_number": number,
            "degree": degree, "classification": classification, "graduation_year": year,
        },
        sort_keys=True,
    )
    detail_hash = hashlib.sha256(canonical.encode()).hexdigest()
    report_reference = "DDNA-" + uuid.uuid4().hex[:8].upper()
    conn.execute(
        "INSERT INTO reports VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            report_reference, f"Certificate check: {number}", detail_hash, result,
            summary, json.dumps([check]), responded_at,
        ),
    )
    conn.execute(
        "UPDATE verification_requests SET status = ?, responded_at = ?, institution_note = ?, "
        "report_reference = ? WHERE reference = ?",
        (new_status, responded_at, body.note, report_reference, reference),
    )
    conn.commit()
    conn.close()
    return {
        "reference": reference,
        "status": new_status,
        "result": result,
        "report_reference": report_reference,
        "report_url": f"/report/{report_reference}",
    }


STYLE = """
<style>
  body { font-family: Arial, sans-serif; background: #f4f1fa; margin: 0; padding: 24px; color: #1b2433; }
  .card { max-width: 560px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,.08); }
  h1 { margin-top: 0; font-size: 22px; color: #3a1a66; }
  label { display: block; margin-top: 14px; font-weight: bold; font-size: 14px; }
  input, textarea { width: 100%; padding: 10px; margin-top: 4px; border: 1px solid #c5cbd8; border-radius: 8px; box-sizing: border-box; font-size: 15px; font-family: Arial, sans-serif; }
  .hint { font-size: 12px; color: #667; font-weight: normal; }
  button { margin-top: 18px; padding: 11px 18px; border: 0; border-radius: 8px; font-size: 15px; cursor: pointer; color: #fff; background: #5b2a9e; }
  button.green { background: #1f8a3b; }
  button.red { background: #c0392b; margin-left: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  td { padding: 8px; border-bottom: 1px solid #e3e7f0; font-size: 14px; }
  td:first-child { font-weight: bold; width: 40%; }
  .result { padding: 14px; border-radius: 8px; font-size: 18px; font-weight: bold; margin-top: 14px; }
  .good { background: #dff5e3; color: #17692b; }
  .bad { background: #fde2e2; color: #a12222; }
  .unsure { background: #fff3d6; color: #8a5a00; }
  .note { font-size: 12px; color: #667; margin-top: 16px; }
  .box { background: #efe9f9; padding: 10px; border-radius: 8px; margin-top: 12px; font-size: 14px; word-break: break-all; }
</style>
"""

REQUEST_PAGE = """
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Digital DNA - Request Verification</title>""" + STYLE + """</head>
<body><div class="card">
  <h1>Request verification from an institution</h1>
  <p class="note">Use this when the institution is not connected to Digital DNA. The institution is asked to confirm or reject the details below.</p>

  <label>Institution <input id="institution" placeholder="e.g. Richard University"></label>
  <label>Graduate name <input id="graduate_name"></label>
  <label>Certificate number <input id="certificate_number"></label>
  <label>Degree <span class="hint">(optional)</span> <input id="degree"></label>
  <label>Classification <span class="hint">(optional)</span> <input id="classification"></label>
  <label>Graduation year <span class="hint">(optional)</span> <input id="graduation_year" type="number"></label>
  <label>Your name or email <span class="hint">(optional)</span> <input id="requester"></label>

  <button id="send">Send request</button>
  <div id="out"></div>
</div>
<script>
const ids = ["institution", "graduate_name", "certificate_number", "degree", "classification", "graduation_year", "requester"];
const params = new URLSearchParams(window.location.search);
ids.forEach(function (id) { if (params.get(id)) { document.getElementById(id).value = params.get(id); } });

document.getElementById("send").onclick = async function () {
  const out = document.getElementById("out");
  const payload = {};
  ids.forEach(function (id) {
    const v = document.getElementById(id).value.trim();
    if (v !== "") { payload[id] = (id === "graduation_year") ? Number(v) : v; }
  });
  if (!payload.institution || !payload.graduate_name || !payload.certificate_number) {
    out.textContent = "Please fill in institution, graduate name and certificate number.";
    return;
  }
  out.textContent = "Sending...";
  try {
    const res = await fetch("/request-verification", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) { out.textContent = "Error: " + JSON.stringify(data); return; }
    out.innerHTML = "";
    const ok = document.createElement("div");
    ok.className = "result unsure";
    ok.textContent = "Request sent. Status: Pending";
    out.appendChild(ok);
    const p1 = document.createElement("p");
    const a1 = document.createElement("a");
    a1.href = data.status_url; a1.textContent = "Track this request (" + data.reference + ")";
    p1.appendChild(a1); out.appendChild(p1);
    const demo = document.createElement("div");
    demo.className = "box";
    demo.appendChild(document.createTextNode("Demo only: the institution would receive this link by email. "));
    const a2 = document.createElement("a");
    a2.href = data.institution_url; a2.target = "_blank"; a2.textContent = "Open the institution's page";
    demo.appendChild(a2); out.appendChild(demo);
  } catch (e) { out.textContent = "Could not reach the server: " + e; }
};
</script></body></html>
"""

INSTITUTION_PAGE = """
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Digital DNA - Institution Verification</title>""" + STYLE + """</head>
<body><div class="card">
  <h1>Certificate verification request</h1>
  <p>Someone has asked you to confirm whether the certificate below was issued by your institution.</p>
  <table>__DETAILS__</table>
  <label>Note <span class="hint">(optional)</span><textarea id="note" rows="3"></textarea></label>
  <button class="green" id="yes">Confirm these details</button>
  <button class="red" id="no">Reject</button>
  <div id="out"></div>
  <p class="note">Only confirm if these details match your official records.</p>
</div>
<script>
async function send(decision) {
  const out = document.getElementById("out");
  out.textContent = "Sending...";
  try {
    const res = await fetch("/respond-verification/__REF__", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "__TOKEN__", decision: decision, note: document.getElementById("note").value })
    });
    const data = await res.json();
    if (!res.ok) { out.textContent = "Error: " + (data.detail || JSON.stringify(data)); return; }
    out.innerHTML = "";
    const r = document.createElement("div");
    r.className = "result " + (decision === "confirm" ? "good" : "bad");
    r.textContent = decision === "confirm" ? "Thank you. You confirmed these details." : "Thank you. You rejected these details.";
    out.appendChild(r);
  } catch (e) { out.textContent = "Could not reach the server: " + e; }
}
document.getElementById("yes").onclick = function () { send("confirm"); };
document.getElementById("no").onclick = function () { send("reject"); };
</script></body></html>
"""

STATUS_PAGE = """
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Digital DNA - Request Status</title>""" + STYLE + """</head>
<body><div class="card">
  <h1>Verification request status</h1>
  <div id="out">Loading...</div>
  <p class="note">This page refreshes automatically every few seconds.</p>
</div>
<script>
let timer = null;
async function load() {
  const out = document.getElementById("out");
  try {
    const res = await fetch("/verification-request/__REF__");
    const d = await res.json();
    if (!res.ok) { out.textContent = "Request not found."; return; }
    out.innerHTML = "";
    const info = document.createElement("p");
    info.textContent = d.institution + " | " + d.graduate_name + " | " + d.certificate_number + " (ref " + d.reference + ")";
    out.appendChild(info);
    const s = document.createElement("div");
    if (d.status === "Pending") {
      s.className = "result unsure"; s.textContent = "Pending: waiting for " + d.institution + " to respond";
    } else if (d.status === "Confirmed") {
      s.className = "result good"; s.textContent = "Confirmed by " + d.institution;
    } else {
      s.className = "result bad"; s.textContent = "Rejected by " + d.institution;
    }
    out.appendChild(s);
    if (d.institution_note) {
      const n = document.createElement("p"); n.textContent = "Institution's note: " + d.institution_note; out.appendChild(n);
    }
    if (d.report_url) {
      clearInterval(timer);
      const p = document.createElement("p");
      p.appendChild(document.createTextNode("Download report: "));
      ["pdf", "docx", "json", "txt"].forEach(function (f) {
        const a = document.createElement("a");
        a.href = d.report_url + "?format=" + f; a.textContent = f.toUpperCase(); a.style.marginRight = "12px";
        p.appendChild(a);
      });
      out.appendChild(p);
    }
  } catch (e) { out.textContent = "Could not reach the server: " + e; }
}
load();
timer = setInterval(load, 4000);
</script></body></html>
"""


@router.get("/request", response_class=HTMLResponse)
def request_page():
    return REQUEST_PAGE


@router.get("/request-status/{reference}", response_class=HTMLResponse)
def request_status_page(reference: str):
    check_reference(reference)
    return STATUS_PAGE.replace("__REF__", reference)


@router.get("/institution/{reference}", response_class=HTMLResponse)
def institution_page(reference: str, token: str = ""):
    check_reference(reference)
    conn = sqlite3.connect(DB)
    row = conn.execute(
        "SELECT token, institution, graduate_name, certificate_number, degree, "
        "classification, graduation_year, status FROM verification_requests WHERE reference = ?",
        (reference,),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    real_token, institution, name, number, degree, classification, year, status = row
    if not secrets.compare_digest(real_token, token):
        return HTMLResponse("<h2>This link is not valid.</h2>", status_code=403)
    if status != "Pending":
        return HTMLResponse(
            f"<h2>This request has already been answered ({html.escape(status)}).</h2>"
        )

    rows = [
        ("Institution", institution),
        ("Graduate name", name),
        ("Certificate number", number),
        ("Degree", degree or "Not provided"),
        ("Classification", classification or "Not provided"),
        ("Graduation year", str(year) if year else "Not provided"),
    ]
    details = "".join(
        f"<tr><td>{html.escape(label)}</td><td>{html.escape(str(value))}</td></tr>"
        for label, value in rows
    )
    page = INSTITUTION_PAGE.replace("__DETAILS__", details)
    page = page.replace("__REF__", reference).replace("__TOKEN__", real_token)
    return HTMLResponse(page)