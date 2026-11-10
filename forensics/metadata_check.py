from pathlib import Path
from PIL import Image 
from PIL.ExifTags import TAGS


def check_metadata(file_path):
    try:
        image = Image.open(file_path)
        metadata = image.getexif()

        if not metadata:
            return {
                "name": "Metadata",
                "status": "unverified",
                "detail": "No metadata found in the file."
            }

        metadata_info = {
            TAGS.get(tag_id, tag_id): value
            for tag_id, value in metadata.items()
        }

        software = metadata_info.get("Software")

        if software:
            return {
                "name": "Metadata",
                "status": "warn",
                "detail": f"File was last saved using: {software}."
            }

        return {
            "name": "Metadata",
            "status": "pass",
            "detail": "No suspicious editing software information found."
        }

    except Exception as error:
        return {
            "name": "Metadata",
            "status": "unverified",
            "detail": f"Metadata could not be checked: {error}"
        }