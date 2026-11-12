// Plain-language copy for the report screens. The data itself always comes from the backend.

export const STATUS = {
  pass: { cls: "ok", label: "Passed" },
  warn: { cls: "warn", label: "Worth a closer look" },
  fail: { cls: "bad", label: "Strong concern" },
  unverified: { cls: "neutral", label: "Couldn't confirm" },
};

// Static explainers per check type (icon + what the check is). Matched by the check's name.
const CHECKS = [
  { match: /institution/i, icon: "bank", what: "Compares the details you entered with the issuing institution's records.", todo: "Check the details for typing mistakes, then contact the institution's registrar." },
  { match: /meta/i, icon: "tag", what: "Every file carries hidden details, such as which software last saved it.", todo: "Ask the issuer for the original file, sent straight from them." },
  { match: /^ela\b|error level/i, icon: "layers", what: "Error Level Analysis looks for areas of the image saved differently from the rest, which can reveal edits.", todo: "Ask the issuer for the original file and compare the two." },
  { match: /\bai\b/i, icon: "spark", what: "Looks for signatures left in the file by AI image generators.", todo: "Ask where the file came from and request the original from the issuer." },
  { match: /source|registered|verif/i, icon: "shield", what: "Compares this file's fingerprint with originals registered by issuers.", todo: "Contact the issuer using details from their official website, not from the document." },
];

export function describeCheck(name) {
  return CHECKS.find((c) => c.match.test(name)) || { icon: "search", what: "", todo: "" };
}

export const RESULTS = {
  "Verified Source": {
    cls: "ok", icon: "shield",
    headline: "This file matches a registered original.",
    empathy: "Good news, and thank you for taking the time to check.",
    steps: ["The file is identical to an original registered by its issuer.", "Download the report and keep it with your records."],
  },
  "Potentially Manipulated": {
    cls: "warn", icon: "alert",
    headline: "Something here needs a closer look.",
    empathy: "This is not an accusation. Scanning, re-saving or compressing a genuine document can leave similar traces.",
    steps: ["Ask for the original file, sent straight from the issuer.", "Contact the issuing institution and quote the certificate details.", "Hold off on any high-stakes decision until it is confirmed."],
  },
  "Likely AI-Generated": {
    cls: "bad", icon: "alert",
    headline: "This looks computer-generated.",
    empathy: "Detectors can be wrong. Treat this as a reason to ask, not a conclusion.",
    steps: ["Ask where the file came from and request the original from the issuer.", "Verify with the institution directly, using contact details from its official website."],
  },
  Unverified: {
    cls: "neutral", icon: "help",
    headline: "We couldn't confirm this one either way.",
    empathy: "Not being able to confirm is not a sign of forgery. A document that passes these checks is not automatically authentic.",
    steps: ["Continue to institutional verification to check the certificate details.", "Or contact the issuer directly, using details from their official website."],
  },
  "Institutionally Verified": {
    cls: "ok", icon: "shield",
    headline: "The institution's record matches.",
    empathy: "The submitted details match the institution's (demo) records.",
    steps: ["Download the report and keep it with your records."],
  },
  "Verification Failed": {
    cls: "bad", icon: "alert",
    headline: "The details don't match the institution's record.",
    empathy: "A failed match alone does not prove forgery. A typing mistake is the most common cause.",
    steps: ["Re-check how each detail was entered.", "Contact the institution's registrar to confirm."],
  },
  "Cannot Confirm": {
    cls: "neutral", icon: "help",
    headline: "We can't confirm this with the institution.",
    empathy: "This institution isn't connected to Digital DNA. That is not proof the certificate is forged.",
    steps: ["Ask the institution to confirm, using the request button below.", "Or contact its registrar directly."],
  },
};

export const OVERALL = {
  "Institutionally Verified": { label: "INSTITUTIONALLY VERIFIED", cls: "ok" },
  "Verification Failed": { label: "NOT VERIFIED", cls: "bad" },
  "Cannot Confirm": { label: "CANNOT CONFIRM", cls: "neutral" },
};
