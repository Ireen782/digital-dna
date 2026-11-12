// Backend connection. Change the address in frontend/.env if the backend moves:
//   VITE_API_URL=http://127.0.0.1:8000
export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(
      `Can't reach the Digital DNA backend at ${API_URL}. Start it from the project root with: uvicorn backend.main:app --reload`
    );
  }
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      if (typeof j.detail === "string") detail = j.detail;
    } catch { /* not JSON */ }
    throw new Error(`Server error ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

// Tier 1: upload a document. The field name must be exactly "file".
// Do not set Content-Type yourself: the browser does it for FormData.
export function verifyFile(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/verify", { method: "POST", body: form });
}

// Tier 2: certificate details -> Institutionally Verified / Verification Failed / Cannot Confirm
export function verifyCertificate(details) {
  return request("/verify-certificate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });
}

// Issuers: register an original file's fingerprint.
export function registerFile(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/register", { method: "POST", body: form });
}

export const reportUrl = (reference, format = "pdf") =>
  `${API_URL}/report/${reference}?format=${format}`; // pdf, docx, json or txt

// The backend's own page for asking an institution to confirm a certificate.
export function requestUrl(details) {
  const p = new URLSearchParams();
  Object.entries(details).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  return `${API_URL}/request?${p.toString()}`;
}
