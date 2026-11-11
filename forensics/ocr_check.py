import os
import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
os.environ["TESSDATA_PREFIX"] = r"C:\Users\Hp\tessdata"

# Simulated issuer database
MOCK_DB = {
    "2030-ILLUS": {
        "name": "CLAUDIA ALVES",
        "year": "2030"
    },
}


def extract_text(file_path):
    with Image.open(file_path) as img:
        gray = img.convert("L")
        
        # Enlarge small images
        w, h = gray.size
        if w < 1600:
            gray = gray.resize((w * 2, h * 2), Image.LANCZOS)
        
        return pytesseract.image_to_string(gray, config="--psm 6")


def check_source(file_path):
    name = "Source verification"

    if not os.path.exists(file_path):
        return {
            "name": name,
            "status": "unverified",
            "detail": "File not found, so source verification could not be run."
        }

    try:
        text = extract_text(file_path)
    except Exception:
        return {
            "name": name,
            "status": "unverified",
            "detail": "Text could not be extracted from this file, so source verification was not run."
        }

    norm = " ".join(text.upper().split())

    # Check for expected year and names that appear on the genuine certificate
    has_year = "2030" in norm
    has_name1 = "CLAUDIA ALVES" in norm
    has_name2 = "AARON LOEB" in norm

    if has_year and has_name1 and has_name2:
        return {
            "name": name,
            "status": "pass",
            "detail": "Document contains the expected year (2030) and the expected names (Claudia Alves, Aaron Loeb) from the simulated issuer record."
        }
    elif has_year or has_name1 or has_name2:
        return {
            "name": name,
            "status": "fail",
            "detail": "Some expected details were found, but not all matched the simulated issuer record."
        }
    else:
        return {
            "name": name,
            "status": "unverified",
            "detail": "Could not find matching year or names from the simulated issuer database."
        }