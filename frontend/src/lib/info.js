// All the plain-language copy and the scoring rubric live here, so it is easy to edit.

export const STATUS = {
  pass: { cls: "ok", label: "Looks consistent" },
  warn: { cls: "warn", label: "Worth a closer look" },
  fail: { cls: "bad", label: "Strong concern" },
  unverified: { cls: "neutral", label: "Couldn't confirm" },
};

// weight = how many of the 100 points each check is worth
const CHECKS = [
  {
    key: "meta", match: /meta/i, weight: 25, icon: "tag", title: "Hidden file details",
    what: "Every file carries hidden details, such as which software last saved it.",
    todo: "Ask the issuer for the original file, sent straight from them.",
  },
  {
    key: "ela", match: /^ela\b|error level/i, weight: 25, icon: "layers", title: "Edit traces in the image",
    what: "Looks for patches of the image that were saved differently from the rest, which can reveal edits.",
    todo: "Compare the highlighted area with the issuer's own record.",
  },
  {
    key: "ai", match: /\bai\b/i, weight: 30, icon: "spark", title: "AI-generation signals",
    what: "Estimates how likely it is that the image was made by an AI tool.",
    todo: "Ask where the file came from and request the original from the issuer.",
  },
  {
    key: "source", match: /source|issuer|verif/i, weight: 20, icon: "bank", title: "Issuer confirmation",
    what: "Checks whether the institution that issued the document can confirm these details.",
    todo: "Contact the issuer using details from their official website, not from the document.",
  },
];

export function describeCheck(name) {
  return (
    CHECKS.find((c) => c.match.test(name)) || {
      key: "other", weight: 15, icon: "search", title: name, what: "", todo: "",
    }
  );
}

// Integrity score: how untouched the file looks, from the checks that ran.
// pass = full points, warn = half, fail = zero, "couldn't confirm" = half (neutral).
// For the AI check, the backend's 0-1 likelihood is used directly when it is provided.
export function computeScore(report) {
  if (typeof report.trust_score === "number") {
    const s = report.trust_score <= 1 ? report.trust_score * 100 : report.trust_score;
    return { score: Math.round(s), rows: null };
  }
  let got = 0, max = 0;
  const rows = report.checks.map((c) => {
    const info = describeCheck(c.name);
    const w = info.weight;
    let pts;
    if (info.key === "ai" && typeof c.score === "number") pts = w * (1 - c.score);
    else pts = c.status === "pass" ? w : c.status === "fail" ? 0 : w * 0.5;
    got += pts; max += w;
    return { name: c.name, points: Math.round(pts * 10) / 10, max: w };
  });
  return { score: max ? Math.round((got / max) * 100) : 0, rows };
}

export function band(score) {
  if (score >= 80) return { cls: "ok", label: "No major concerns" };
  if (score >= 60) return { cls: "warn", label: "Some concerns" };
  return { cls: "bad", label: "Serious concerns" };
}

export const TIERS = { 1: "Tier 1 · Instant Check", 2: "Tier 2 · Verified Source" };

export const RESULTS = {
  "Verified Source": {
    cls: "ok", icon: "shield",
    headline: "This document checks out.",
    kind: "The issuer confirmed the details, and we found no signs of tampering.",
    empathy: "Good news, and thank you for taking the time to check.",
    steps: [
      "You can rely on this result. The issuing source confirmed the details.",
      "Download the report and keep it with your records.",
      "If someone asks for proof you checked, share the report PDF.",
    ],
  },
  "Likely Authentic": {
    cls: "ok", icon: "shield",
    headline: "Nothing here raises concern.",
    kind: "We found no signs of editing or AI generation.",
    empathy: "That's reassuring. One limit to keep in mind: this check can't confirm who issued it.",
    steps: [
      "No signs of tampering were found, so you can continue with confidence.",
      "For an important decision, ask the issuer to confirm it directly.",
      "Download the report to keep a record of this check.",
    ],
  },
  "Potentially Manipulated": {
    cls: "warn", icon: "alert",
    headline: "Something here needs a closer look.",
    kind: "Parts of this file look like they were saved or changed differently from the rest.",
    empathy: "This is not an accusation. Scanning, re-saving or compressing a genuine document can leave similar traces.",
    steps: [
      "Ask for the original file or a verified copy, sent straight from the issuer.",
      "Contact the issuing institution and quote the certificate details.",
      "Compare the flagged area below with the issuer's record.",
      "Hold off on any high-stakes decision until it is confirmed.",
    ],
    own: "If this is your own document, asking the issuer for a certified copy is routine and quick.",
  },
  "Likely AI-Generated": {
    cls: "bad", icon: "alert",
    headline: "This looks computer-generated.",
    kind: "The image shows strong signs of having been made by an AI tool.",
    empathy: "Detectors can be wrong, and some genuine designs score high. Treat this as a reason to ask, not a conclusion.",
    steps: [
      "Ask where the file came from and request the original from the issuer.",
      "Verify with the issuing institution directly, using contact details from their official website.",
      "Don't rely on this file for decisions until it is confirmed.",
    ],
    own: "If this is your own document, ask the issuer for a certified copy. It is a simple request.",
  },
  Unverified: {
    cls: "neutral", icon: "help",
    headline: "We couldn't confirm this one either way.",
    kind: "We found no signs of tampering, but nobody could confirm the issuer.",
    empathy: "Not being able to confirm is not a sign of forgery. Many institutions don't offer an online check yet.",
    steps: [
      "Contact the issuer directly, using details from their official website.",
      "Ask whether they can send you a verified copy.",
      "If it matters, check again later, or ask the issuer to register the original.",
    ],
  },
};
RESULTS.Suspicious = { ...RESULTS["Potentially Manipulated"], headline: "Some things here don't add up." };
RESULTS.Inconclusive = { ...RESULTS.Unverified, headline: "The evidence isn't conclusive." };
