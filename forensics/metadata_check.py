import os
from PIL import Image

EDITORS = ["photoshop", "gimp", "canva", "lightroom", "illustrator",
           "paint.net", "pixlr", "photopea", "affinity", "snapseed"]


def check_metadata(file_path):
    name = "Metadata"

    if not os.path.exists(file_path):
        return {"name": name, "status": "unverified",
                "detail": "File not found, so metadata could not be checked."}

    try:
        with Image.open(file_path) as img:
            software = img.getexif().get(0x0131) or img.info.get("Software")
    except Exception:
        return {"name": name, "status": "unverified",
                "detail": "File could not be read as an image, so metadata was not checked."}

    if not software:
        return {"name": name, "status": "unverified",
                "detail": "No software information found. Metadata may be absent or stripped, so this is not evidence either way."}

    software = str(software)
    if any(e in software.lower() for e in EDITORS):
        return {"name": name, "status": "warn",
                "detail": f"File was last saved using: {software}."}

    return {"name": name, "status": "pass",
            "detail": f"Software tag ({software}) is not a known editing tool."}