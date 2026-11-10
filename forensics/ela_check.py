from PIL import Image, ImageChops, ImageEnhance
import os


def check_ela(file_path):
    try:
        original = Image.open(file_path).convert("RGB")

        temp_path = "ela_temp.jpg"
        original.save(temp_path, "JPEG", quality=90)

        compressed = Image.open(temp_path)
        difference = ImageChops.difference(original, compressed)

        extrema = difference.getextrema()
        max_difference = max([value[1] for value in extrema])

        if max_difference == 0:
            status = "unverified"
            detail = "No measurable compression differences detected."

        else:
            status = "warn"
            detail = "Compression differences detected; further examination is needed."

        os.remove(temp_path)

        return {
            "name": "ELA",
            "status": status,
            "detail": detail
        }

    except Exception as error:
        return {
            "name": "ELA",
            "status": "unverified",
            "detail": f"ELA analysis could not be completed: {error}"
        }