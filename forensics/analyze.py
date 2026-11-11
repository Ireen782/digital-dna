import hashlib
import json
import os
import sys
from metadata_check import check_metadata
from ela_check import check_ela


def sha256_of(file_path):
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def analyze_file(file_path):
    checks = [check_metadata(file_path), check_ela(file_path)]
    statuses = [c["status"] for c in checks]

    if "fail" in statuses or "warn" in statuses:
        result = "Potentially Manipulated"
        summary = "One or more forensic checks found possible signs of editing. Human review is recommended."
    elif "pass" in statuses:
        result = "Likely Authentic"
        summary = "No significant manipulation indicators found by the available checks. This does not prove the content is true."
    else:
        result = "Unverified"
        summary = "Not enough evidence either way."

    return {
        "filename": os.path.basename(file_path),
        "tier": 1,
        "sha256": sha256_of(file_path),
        "result": result,
        "summary": summary,
        "checks": checks,
    }


if __name__ == "__main__":
    print(json.dumps(analyze_file(sys.argv[1]), indent=2))