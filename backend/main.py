import hashlib
import io
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Literal
from xml.sax.saxutils import escape

from docx import Document
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response, StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from backend.ai_detection import analyze_image as ai_checks

app = FastAPI()
DB = "digitaldna.db"

NOTE = (
    "Note: this report is an evidence-based assessment, not absolute proof. "
    "A failed or unverified result does not by itself prove forgery."
)


def init_db():
    conn = sqlite3.connect(DB)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS registered_files (
            sha256 TEXT PRIMARY KEY,
            filename TEXT,
            registered_at TEXT
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


init_db()


def save_report(filename, sha256, result, summary, checks):
    reference = "DDNA-" + uuid.uuid4().hex[:8].upper()
    created_at = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(DB)
    conn.execute(
        "INSERT INTO reports VALUES (?, ?, ?, ?, ?, ?, ?)",
        (reference, filename, sha256, result, summary, json.dumps(checks), created_at),
    )
    conn.commit()
    conn.close()
    return reference


@app.get("/")
def root():
    return {"message": "Digital DNA backend is alive"}


@app.post("/register")
async def register(file: UploadFile = File(...)):
    data = await file.read()
    sha256 = hashlib.sha256(data).hexdigest()
    registered_at = datetime.now(timezone.utc).isoformat()

    conn = sqlite3.connect(DB)
    conn.execute(
        "INSERT OR IGNORE INTO registered_files VALUES (?, ?, ?)",
        (sha256, file.filename, registered_at),
    )
    conn.commit()
    conn.close()

    return {
        "filename": file.filename,
        "sha256": sha256,
        "registered_at": registered_at,
        "message": "File registered",
    }


@app.post("/verify")
async def verify(file: UploadFile = File(...)):
    data = await file.read()
    sha256 = hashlib.sha256(data).hexdigest()

    conn = sqlite3.connect(DB)
    exact = conn.execute(
        "SELECT registered_at FROM registered_files WHERE sha256 = ?",
        (sha256,),
    ).fetchone()
    same_name = conn.execute(
        "SELECT registered_at FROM registered_files WHERE filename = ?",
        (file.filename,),
    ).fetchone()
    conn.close()

    if exact:
        result = "Verified Source"
        summary = "File matches the registered original."
        check = {
            "name": "Source verification",
            "status": "pass",
            "detail": f"Fingerprint matches a file registered on {exact[0]}.",
        }
    elif same_name:
        result = "Potentially Manipulated"
        summary = "A file with this name was registered, but this copy is different."
        check = {
            "name": "Source verification",
            "status": "fail",
            "detail": "Fingerprint does not match the registered original.",
        }
    else:
        result = "Unverified"
        summary = "No registered original was found for this file."
        check = {
            "name": "Source verification",
            "status": "unverified",
            "detail": "No matching registration exists.",
        }

    # Each module adds its own checks to this list. Forensics (ELA, metadata)
    # will be added here later in the same format.
    checks = [check] + ai_checks(data)

    if result != "Verified Source":
        ai_fail = any(
            c["name"] == "AI generator signature" and c["status"] == "fail"
            for c in checks
        )
        any_warn = any(c["status"] == "warn" for c in checks)
        if ai_fail:
            result = "Likely AI-Generated"
            summary = "The image data contains signs of an AI image generator."
        elif any_warn and result == "Unverified":
            result = "Potentially Manipulated"
            summary = "No registered original was found, and forensic checks found possible signs of editing."

    reference = save_report(file.filename, sha256, result, summary, checks)

    return {
        "reference": reference,
        "report_url": f"/report/{reference}",
        "filename": file.filename,
        "tier": 2,
        "sha256": sha256,
        "result": result,
        "summary": summary,
        "checks": checks,
    }


@app.get("/report/{reference}")
def report(reference: str, format: Literal["pdf", "docx", "json", "txt"] = "pdf"):
    conn = sqlite3.connect(DB)
    row = conn.execute(
        "SELECT filename, sha256, result, summary, checks, created_at "
        "FROM reports WHERE reference = ?",
        (reference,),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")

    filename, sha256, result, summary, checks_json, created_at = row
    checks = json.loads(checks_json)
    headers = {"Content-Disposition": f"attachment; filename={reference}.{format}"}

    if format == "json":
        payload = {
            "reference": reference,
            "created_at": created_at,
            "filename": filename,
            "sha256": sha256,
            "result": result,
            "summary": summary,
            "checks": checks,
            "note": NOTE,
        }
        return Response(
            json.dumps(payload, indent=2),
            media_type="application/json",
            headers=headers,
        )

    if format == "txt":
        lines = [
            "DIGITAL DNA VERIFICATION REPORT",
            f"Reference: {reference}",
            f"Date of analysis (UTC): {created_at}",
            f"File name: {filename}",
            f"SHA-256: {sha256}",
            f"Result: {result}",
            f"Summary: {summary}",
            "Checks performed:",
        ]
        for c in checks:
            lines.append(f"- {c['name']} [{c['status']}]: {c['detail']}")
        lines.append(NOTE)
        return Response("\n".join(lines), media_type="text/plain", headers=headers)

    if format == "docx":
        d = Document()
        d.add_heading("Digital DNA Verification Report", 0)
        d.add_paragraph(f"Reference: {reference}")
        d.add_paragraph(f"Date of analysis (UTC): {created_at}")
        d.add_paragraph(f"File name: {filename}")
        d.add_paragraph(f"SHA-256 fingerprint: {sha256}")
        d.add_heading(f"Result: {result}", level=2)
        d.add_paragraph(summary)
        d.add_heading("Checks performed", level=2)
        for c in checks:
            d.add_paragraph(f"{c['name']} [{c['status']}]: {c['detail']}")
        d.add_paragraph(NOTE)
        buf = io.BytesIO()
        d.save(buf)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers=headers,
        )

    styles = getSampleStyleSheet()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, title=f"Digital DNA Report {reference}")
    story = [
        Paragraph("Digital DNA Verification Report", styles["Title"]),
        Paragraph(f"<b>Reference:</b> {escape(reference)}", styles["Normal"]),
        Paragraph(f"<b>Date of analysis (UTC):</b> {escape(created_at)}", styles["Normal"]),
        Paragraph(f"<b>File name:</b> {escape(filename)}", styles["Normal"]),
        Paragraph(f"<b>SHA-256 fingerprint:</b><br/>{escape(sha256)}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph(f"Result: {escape(result)}", styles["Heading2"]),
        Paragraph(escape(summary), styles["Normal"]),
        Spacer(1, 12),
        Paragraph("Checks performed", styles["Heading2"]),
    ]
    for c in checks:
        story.append(
            Paragraph(
                f"<b>{escape(c['name'])}</b> [{escape(c['status'])}]: {escape(c['detail'])}",
                styles["Normal"],
            )
        )
        story.append(Spacer(1, 6))
    story.append(Spacer(1, 12))
    story.append(Paragraph(escape(NOTE), styles["Italic"]))
    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers=headers)