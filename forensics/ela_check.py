import io
import os
import numpy as np
from PIL import Image, ImageChops

BLOCK = 32
WARN_RATIO = 4.0  # placeholder, we calibrate it from your demo files


def ela_ratio(file_path, quality=90):
    with Image.open(file_path) as img:
        original = img.convert("RGB")
    buf = io.BytesIO()
    original.save(buf, "JPEG", quality=quality)
    buf.seek(0)
    resaved = Image.open(buf).convert("RGB")
    diff = np.asarray(ImageChops.difference(original, resaved)).astype(float).mean(axis=2)
    h, w = diff.shape
    hb, wb = h // BLOCK, w // BLOCK
    if hb < 2 or wb < 2:
        raise ValueError("too small")
    blocks = diff[:hb * BLOCK, :wb * BLOCK].reshape(hb, BLOCK, wb, BLOCK).mean(axis=(1, 3))
    median = float(np.median(blocks))
    top = float(np.percentile(blocks, 99))
    return top / (median + 1.0), top, median


def check_ela(file_path):
    name = "ELA"
    if not os.path.exists(file_path):
        return {"name": name, "status": "unverified",
                "detail": "File not found, so ELA could not be run."}
    try:
        ratio, top, median = ela_ratio(file_path)
    except Exception:
        return {"name": name, "status": "unverified",
                "detail": "File could not be analysed as an image."}
    if ratio >= WARN_RATIO:
        return {"name": name, "status": "warn",
                "detail": "Some regions show compression error levels that differ sharply from the rest of the image, which can indicate editing. This is an indicator, not proof."}
    return {"name": name, "status": "pass",
            "detail": "Error levels are consistent across the image."}