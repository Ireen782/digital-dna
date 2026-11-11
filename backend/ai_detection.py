import io

from PIL import Image
from PIL.ExifTags import TAGS

AI_KEYWORDS = [
    "midjourney", "dall-e", "dalle", "stable diffusion", "stablediffusion",
    "firefly", "openai", "comfyui", "automatic1111", "novelai",
    "leonardo.ai", "sdxl", "flux", "imagen", "chatgpt",
]
AI_CHUNK_KEYS = ["parameters", "prompt", "workflow", "c2pa", "jumbf"]


def _collect_metadata(img):
    pairs = {}
    for key, value in img.info.items():
        if isinstance(value, bytes):
            value = value[:300].decode("latin-1", errors="ignore")
        if isinstance(value, str):
            pairs[str(key).lower()] = value[:300].lower()
    try:
        exif = img.getexif()
        for tag_id, value in exif.items():
            name = str(TAGS.get(tag_id, tag_id)).lower()
            if isinstance(value, bytes):
                value = value[:300].decode("latin-1", errors="ignore")
            pairs[name] = str(value)[:300].lower()
    except Exception:
        pass
    return pairs


def ai_signature_check(img):
    pairs = _collect_metadata(img)
    haystack = " ".join(f"{k} {v}" for k, v in pairs.items())

    for kw in AI_KEYWORDS:
        if kw in haystack:
            return {
                "name": "AI generator signature",
                "status": "fail",
                "detail": f"Image data contains a signature of an AI image generator ('{kw}').",
            }
    for key in AI_CHUNK_KEYS:
        if key in pairs:
            return {
                "name": "AI generator signature",
                "status": "fail",
                "detail": f"Image contains a '{key}' data block, which is typical of AI-generated images.",
            }
    return {
        "name": "AI generator signature",
        "status": "unverified",
        "detail": "No AI generator signature found. This does not prove the image is not AI-generated, because many platforms remove this data.",
    }


def analyze_image(data: bytes):
    """Return a list of AI-detection checks in the shared format:
    {"name": ..., "status": "pass" | "fail" | "warn" | "unverified", "detail": ...}"""
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception:
        return [
            {
                "name": "AI generator signature",
                "status": "unverified",
                "detail": "File is not a supported image, so AI detection was skipped.",
            }
        ]
    checks = []
    for fn in (ai_signature_check,):
        try:
            checks.append(fn(img))
        except Exception as e:
            checks.append(
                {
                    "name": "AI generator signature",
                    "status": "unverified",
                    "detail": f"Check could not run: {e}",
                }
            )
    return checks