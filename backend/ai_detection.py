import io

from PIL import Image
from PIL.ExifTags import TAGS

AI_KEYWORDS = [
    "midjourney", "dall-e", "dalle", "stable diffusion", "stablediffusion",
    "firefly", "openai", "comfyui", "automatic1111", "novelai",
    "leonardo.ai", "sdxl", "flux", "imagen", "chatgpt",
]
# Metadata keys written by common AI tools (for example Stable Diffusion UIs).
AI_CHUNK_KEYS = ["parameters", "prompt", "workflow"]

# Longer markers that are safe to search for in the raw file bytes. Pillow does
# not expose C2PA / Content Credentials data, so the raw bytes are scanned too.
AI_BYTE_MARKERS = [
    b"trainedalgorithmicmedia",  # standard "AI-generated" label (IPTC / C2PA)
    b"midjourney", b"dall-e", b"openai", b"chatgpt", b"stable diffusion",
    b"adobe firefly", b"comfyui", b"automatic1111", b"novelai", b"leonardo.ai",
]
C2PA_MARKER = b"c2pa"

NAME = "AI generator signature"


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


def ai_signature_check(img, data):
    pairs = _collect_metadata(img)
    haystack = " ".join(f"{k} {v}" for k, v in pairs.items())

    for kw in AI_KEYWORDS:
        if kw in haystack:
            return {
                "name": NAME,
                "status": "fail",
                "detail": f"Image data contains a signature of an AI image generator ('{kw}').",
            }
    for key in AI_CHUNK_KEYS:
        if key in pairs:
            return {
                "name": NAME,
                "status": "fail",
                "detail": f"Image contains a '{key}' data block, which is typical of AI-generated images.",
            }

    raw = data.lower()
    for marker in AI_BYTE_MARKERS:
        if marker in raw:
            label = marker.decode()
            if label == "trainedalgorithmicmedia":
                label = "trainedAlgorithmicMedia"
            return {
                "name": NAME,
                "status": "fail",
                "detail": f"The file contains an AI-generation marker ('{label}').",
            }

    if C2PA_MARKER in raw:
        return {
            "name": NAME,
            "status": "warn",
            "detail": (
                "The file carries Content Credentials (C2PA) data, but nothing in it names an AI "
                "generator. These credentials are used by AI tools and also by some cameras and "
                "editing software, so inspect them with a C2PA reader before drawing a conclusion."
            ),
        }

    return {
        "name": NAME,
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
                "name": NAME,
                "status": "unverified",
                "detail": "File is not a supported image, so AI detection was skipped.",
            }
        ]
    checks = []
    for fn in (ai_signature_check,):
        try:
            checks.append(fn(img, data))
        except Exception as e:
            checks.append(
                {
                    "name": NAME,
                    "status": "unverified",
                    "detail": f"Check could not run: {e}",
                }
            )
    return checks