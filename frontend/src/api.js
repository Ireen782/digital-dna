// ---- Backend connection settings -------------------------------------------
// Set the backend address in frontend/.env  ->  VITE_API_URL=http://localhost:8000
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ASSUMED endpoints. Ask the backend team to confirm these and edit here if different.
const PATHS = {
  analyze: "/analyze",   // Tier 1: POST multipart, field "file"  -> report (see docs/api-contract.md)
  register: "/register", // Tier 2: POST multipart, fields "file" + "issuer" -> { sha256, ... }
};
// -----------------------------------------------------------------------------

async function post(path, formData) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method: "POST", body: formData });
  } catch {
    throw new Error(
      `Could not reach the backend at ${API_URL}. Check that it is running and that CORS allows this site.`
    );
  }
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).detail || ""; } catch { /* not JSON */ }
    throw new Error(`The backend returned ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

export function analyzeFile(file) {
  const body = new FormData();
  body.append("file", file);
  return post(PATHS.analyze, body);
}

export function registerFile(file, issuer) {
  const body = new FormData();
  body.append("file", file);
  if (issuer) body.append("issuer", issuer);
  return post(PATHS.register, body);
}
