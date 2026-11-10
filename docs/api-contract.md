# Report format (API contract)

Every check returns a report in this exact shape.

```json
{
  "filename": "certificate.png",
  "tier": 1,
  "sha256": "ab12cd34...",
  "result": "Potentially Manipulated",
  "summary": "Possible edit detected around the graduation year.",
  "checks": [
    {
      "name": "Metadata",
      "status": "warn",
      "detail": "File was last saved by an image editor."
    },
    {
      "name": "ELA",
      "status": "warn",
      "detail": "Inconsistent compression around the year field."
    },
    {
      "name": "AI-generated",
      "status": "pass",
      "detail": "Low likelihood of AI generation.",
      "score": 0.08
    },
    {
      "name": "Source verification",
      "status": "unverified",
      "detail": "No issuer record found."
    }
  ]
}
```

## Allowed values

- **tier:** 1 (Instant Check) or 2 (Verified Source)
- **result:** Verified Source, Likely Authentic, Potentially Manipulated, Likely AI-Generated, Unverified
- **status** (for each check): pass, warn, fail, unverified
- **score:** optional, a number from 0 to 1

## Rule for check functions

Each check is a Python function that takes a file path and returns ONE check in the shape above, for example:

```python
{"name": "ELA", "status": "warn", "detail": "..."}
```