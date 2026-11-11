// ---- Backend connection settings -------------------------------------------
// In frontend/.env:   VITE_API_URL=http://localhost:8000
//                     VITE_DEMO_MODE=true   (simulated results, no backend needed)
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

// ASSUMED endpoints. Confirm with the backend team and edit here if different.
const PATHS = {
  analyze: "/analyze",   // POST multipart, field "file" -> report (docs/api-contract.md)
  register: "/register", // POST multipart, fields "file" + "issuer"
};
// -----------------------------------------------------------------------------
import { DEMO_CASES } from "./mockReports";

async function sha256(file) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function post(path, formData) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method: "POST", body: formData });
  } catch {
    throw new Error(
      `We couldn't reach the analysis service at ${API_URL}. Check that it is running and that CORS allows this site.`
    );
  }
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).detail || ""; } catch { /* not JSON */ }
    throw new Error(`The analysis service returned ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

export async function analyzeFile(file) {
  if (DEMO_MODE) {
    // Simulated: the real fingerprint of the real file, with a canned result.
    // The same file always gets the same result.
    const hash = await sha256(file);
    const pick = DEMO_CASES[parseInt(hash.slice(0, 2), 16) % DEMO_CASES.length];
    return { ...pick.report, filename: file.name, sha256: hash };
  }
  const body = new FormData();
  body.append("file", file);
  return post(PATHS.analyze, body);
}

export async function registerFile(file, issuer) {
  if (DEMO_MODE) {
    return { filename: file.name, issuer, sha256: await sha256(file), registered_at: new Date().toLocaleString() };
  }
  const body = new FormData();
  body.append("file", file);
  if (issuer) body.append("issuer", issuer);
  return post(PATHS.register, body);
}
