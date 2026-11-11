import hashlib
import io
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Literal
from xml.sax.saxutils import escape

from docx import Document
from docx.shared import Inches
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from backend.ai_detection import analyze_image as ai_checks
from backend.branding import BRAND_NAME, LOGO_PATH, TAGLINE, draw_pdf_page, logo_exists
from backend.certificate_page import router as certificate_page_router
from backend.verification_requests import router as verification_requests_router

app = FastAPI()
app.include_router(certificate_page_router)
app.include_router(verification_requests_router)
DB = "digitaldna.db"

NOTE = (
    "Note: this report is an evidence-based assessment, not absolute proof. "
    "A failed or unverified result does not by itself prove forgery."
)

# Guidance shown in reports, chosen from the result.
NEXT_STEPS = {
    "Cannot Confirm": (
        "This institution is not connected to Digital DNA. Contact the institution's "
        "registrar or verification office directly, or submit a verification request "
        "at /request so the institution can confirm or reject the details."
    ),
    "Verification Failed": (
        "Check that the details were entered correctly, then contact the institution's "
        "registrar to confirm. A failed match alone does not prove forgery."
    ),
    "Unverified": (
        "Ask the sender for the original file, or confirm the document through the "
        "issuing institution's official channel."
    ),
    "Potentially Manipulated": (
        "Ask the source for the original and compare the two. For important decisions, "
        "seek expert review."
    ),
    "Likely AI-Generated": (
        "Do not rely on this file without independent confirmation. Ask for the "
        "original source."
    ),
}


def next_step(result):
    return NEXT_STEPS.get(result)


# FICTIONAL demo records. They do not describe real people or real institutions.
DEMO_RECORDS = [
    ("Demo University", "Amina Yusuf", "DU/2022/00123", "B.Sc. Computer Science", "Second Class Upper", 2022),
    ("Demo University", "Chinedu Okafor", "DU/2023/00456", "B.Sc. Cyber Security", "First Class", 2023),
    ("Demo University", "Fatima Bello", "DU/2021/00789", "B.Eng. Electrical Engineering", "Second Class Lower", 2021),
    ("Sample Polytechnic", "Tunde Adeyemi", "SP/ND/2020/0042", "ND Computer Science", "Distinction", 2020),
    ("Sample Polytechnic", "Grace Ibrahim", "SP/HND/2022/0107", "HND Software Engineering", "Upper Credit", 2022),
]


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
    conn.execute(
        """CREATE TABLE IF NOT EXISTS university_records (
            institution TEXT,
            graduate_name TEXT,
            certificate_number TEXT,
            degree TEXT,
            classification TEXT,
            graduation_year INTEGER,
            PRIMARY KEY (institution, certificate_number)
        )"""
    )
    count = conn.execute("SELECT COUNT(*) FROM university_records").fetchone()[0]
    if count == 0:
        conn.executemany(
            "INSERT INTO university_records VALUES (?, ?, ?, ?, ?, ?)", DEMO_RECORDS
        )
    conn.commit()
    conn.close()


init_db()


def norm(value):
    return " ".join(str(value).lower().split())


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
        "next_step": next_step(result),
        "checks": checks,
    }


class CertificateDetails(BaseModel):
    institution: str
    graduate_name: str
    certificate_number: str
    degree: str | None = None
    classification: str | None = None
    graduation_year: int | None = None


@app.get("/demo-records")
def demo_records():
    """Lists the FICTIONAL demo records so the team can test /verify-certificate."""
    conn = sqlite3.connect(DB)
    rows = conn.execute(
        "SELECT institution, graduate_name, certificate_number, degree, "
        "classification, graduation_year FROM university_records"
    ).fetchall()
    conn.close()
    keys = ["institution", "graduate_name", "certificate_number", "degree", "classification", "graduation_year"]
    return {"note": "Fictional demo data only.", "records": [dict(zip(keys, r)) for r in rows]}


@app.post("/verify-certificate")
def verify_certificate(details: CertificateDetails):
    conn = sqlite3.connect(DB)
    institutions = [r[0] for r in conn.execute("SELECT DISTINCT institution FROM university_records")]
    institution_match = next((i for i in institutions if norm(i) == norm(details.institution)), None)

    record = None
    if institution_match:
        record = conn.execute(
            "SELECT graduate_name, degree, classification, graduation_year "
            "FROM university_records WHERE institution = ? AND certificate_number = ?",
            (institution_match, details.certificate_number.strip()),
        ).fetchone()
    conn.close()

    if not institution_match:
        result = "Cannot Confirm"
        summary = "This institution has no verification service connected to Digital DNA."
        check = {
            "name": "Institutional record check",
            "status": "unverified",
            "detail": (
                f"No verification service is connected for '{details.institution}'. "
                "This is not proof that the certificate is forged."
            ),
        }
    elif record is None:
        result = "Verification Failed"
        summary = "The institution has no record matching this certificate number."
        check = {
            "name": "Institutional record check",
            "status": "fail",
            "detail": (
                f"{institution_match} could not confirm certificate number "
                f"'{details.certificate_number}'. This alone does not prove forgery; "
                "the number may have been entered incorrectly."
            ),
        }
    else:
        stored_name, stored_degree, stored_class, stored_year = record
        mismatches = []
        if norm(details.graduate_name) != norm(stored_name):
            mismatches.append("graduate name")
        if details.degree and norm(details.degree) != norm(stored_degree):
            mismatches.append("degree")
        if details.classification and norm(details.classification) != norm(stored_class):
            mismatches.append("classification")
        if details.graduation_year and details.graduation_year != stored_year:
            mismatches.append("graduation year")

        if mismatches:
            result = "Verification Failed"
            summary = "A record exists for this certificate number, but some details do not match."
            check = {
                "name": "Institutional record check",
                "status": "fail",
                "detail": (
                    f"{institution_match} has a record for this certificate number, but "
                    f"these details differ: {', '.join(mismatches)}."
                ),
            }
        else:
            result = "Institutionally Verified"
            summary = "The certificate details match an authorised institutional record."
            check = {
                "name": "Institutional record check",
                "status": "pass",
                "detail": f"{institution_match} confirmed a matching record for this certificate.",
            }

    checks = [check]
    canonical = json.dumps(details.model_dump(), sort_keys=True)
    detail_hash = hashlib.sha256(canonical.encode()).hexdigest()
    reference = save_report(
        f"Certificate check: {details.certificate_number}",
        detail_hash,
        result,
        summary,
        checks,
    )

    return {
        "reference": reference,
        "report_url": f"/report/{reference}",
        "tier": 2,
        "result": result,
        "summary": summary,
        "next_step": next_step(result),
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
    guidance = next_step(result)
    headers = {"Content-Disposition": f"attachment; filename={reference}.{format}"}

    if format == "json":
        payload = {
            "reference": reference,
            "created_at": created_at,
            "filename": filename,
            "sha256": sha256,
            "result": result,
            "summary": summary,
            "next_step": guidance,
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
            f"{BRAND_NAME.upper()} VERIFICATION REPORT",
            TAGLINE,
            "",
            f"Reference: {reference}",
            f"Date of analysis (UTC): {created_at}",
            f"Subject: {filename}",
            f"SHA-256: {sha256}",
            f"Result: {result}",
            f"Summary: {summary}",
        ]
        if guidance:
            lines.append(f"What to do next: {guidance}")
        lines.append("Checks performed:")
        for c in checks:
            lines.append(f"- {c['name']} [{c['status']}]: {c['detail']}")
        lines.append("")
        lines.append(NOTE)
        return Response("\n".join(lines), media_type="text/plain", headers=headers)

    if format == "docx":
        d = Document()

        section = d.sections[0]
        header_par = section.header.paragraphs[0]
        if logo_exists():
            header_par.add_run().add_picture(LOGO_PATH, width=Inches(0.6))
        header_run = header_par.add_run(f"  {BRAND_NAME}  |  {TAGLINE}")
        header_run.bold = True
        section.footer.paragraphs[0].text = (
            "Generated by Digital DNA. Evidence-based assessment, not absolute proof."
        )

        d.add_heading("Verification Report", 0)
        d.add_paragraph(f"Reference: {reference}")
        d.add_paragraph(f"Date of analysis (UTC): {created_at}")
        d.add_paragraph(f"Subject: {filename}")
        d.add_paragraph(f"SHA-256 fingerprint: {sha256}")
        d.add_heading(f"Result: {result}", level=2)
        d.add_paragraph(summary)
        if guidance:
            d.add_heading("What to do next", level=2)
            d.add_paragraph(guidance)
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
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        title=f"Digital DNA Report {reference}",
        topMargin=95,
        bottomMargin=60,
    )
    story = [
        Paragraph("Verification Report", styles["Title"]),
        Paragraph(f"<b>Reference:</b> {escape(reference)}", styles["Normal"]),
        Paragraph(f"<b>Date of analysis (UTC):</b> {escape(created_at)}", styles["Normal"]),
        Paragraph(f"<b>Subject:</b> {escape(filename)}", styles["Normal"]),
        Paragraph(f"<b>SHA-256 fingerprint:</b><br/>{escape(sha256)}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph(f"Result: {escape(result)}", styles["Heading2"]),
        Paragraph(escape(summary), styles["Normal"]),
    ]
    if guidance:
        story.append(Spacer(1, 10))
        story.append(Paragraph("What to do next", styles["Heading2"]))
        story.append(Paragraph(escape(guidance), styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Checks performed", styles["Heading2"]))
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
    doc.build(story, onFirstPage=draw_pdf_page, onLaterPages=draw_pdf_page)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers=headers)