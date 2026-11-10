import hashlib
import sqlite3
from datetime import datetime, timezone

from fastapi import FastAPI, File, UploadFile

app = FastAPI()
DB = "digitaldna.db"


def init_db():
    conn = sqlite3.connect(DB)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS registered_files (
            sha256 TEXT PRIMARY KEY,
            filename TEXT,
            registered_at TEXT
        )"""
    )
    conn.commit()
    conn.close()


init_db()


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

    return {
        "filename": file.filename,
        "tier": 2,
        "sha256": sha256,
        "result": result,
        "summary": summary,
        "checks": [check],
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

    return {
        "filename": file.filename,
        "tier": 2,
        "sha256": sha256,
        "result": result,
        "summary": summary,
        "checks": [check],
    }