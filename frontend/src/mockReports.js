// The 4 demo cases from the project document, in the exact API contract shape.
export const DEMO_CASES = [
  {
    key: "genuine",
    label: "Genuine certificate",
    report: {
      filename: "genuine_certificate.png",
      tier: 2,
      sha256: "9f2c1a7be04d58c3a1d6e7f08b49c2d5e31a6f70b8c4d9e2a5f1038c7b6d4e21",
      result: "Verified Source",
      summary: "Matched against the (simulated) university record. No manipulation indicators found.",
      checks: [
        { name: "Metadata", status: "pass", detail: "No editing software traces found in the file metadata." },
        { name: "ELA", status: "pass", detail: "Compression levels are consistent across the document." },
        { name: "AI-generated", status: "pass", detail: "Low likelihood of AI generation.", score: 0.04 },
        { name: "Source verification", status: "pass", detail: "Certificate number matched a record in the simulated university database." },
      ],
    },
  },
  {
    key: "edited",
    label: "Edited year",
    report: {
      filename: "certificate_edited.png",
      tier: 1,
      sha256: "ab12cd34e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
      result: "Potentially Manipulated",
      summary: "Possible edit detected around the graduation year.",
      checks: [
        { name: "Metadata", status: "warn", detail: "File was last saved by an image editor." },
        { name: "ELA", status: "warn", detail: "Inconsistent compression around the year field." },
        { name: "AI-generated", status: "pass", detail: "Low likelihood of AI generation.", score: 0.08 },
        { name: "Source verification", status: "unverified", detail: "No issuer record found." },
      ],
    },
  },
  {
    key: "ai",
    label: "AI-generated",
    report: {
      filename: "ai_certificate.png",
      tier: 1,
      sha256: "5d41402abc4b2a76b9719d911017c5925d41402abc4b2a76b9719d911017c592",
      result: "Likely AI-Generated",
      summary: "Strong indicators that this image was synthetically generated.",
      checks: [
        { name: "Metadata", status: "warn", detail: "No camera or scanner information present." },
        { name: "ELA", status: "pass", detail: "No local compression inconsistencies found." },
        { name: "AI-generated", status: "fail", detail: "High likelihood of AI generation.", score: 0.94 },
        { name: "Source verification", status: "unverified", detail: "No issuer record found." },
      ],
    },
  },
  {
    key: "unknown",
    label: "Unknown issuer",
    report: {
      filename: "unknown_issuer.pdf",
      tier: 1,
      sha256: "c4ca4238a0b923820dcc509a6f75849bc81e728d9d4c2f636f067f89cc14862c",
      result: "Unverified",
      summary: "Not enough evidence either way. The issuer could not be confirmed.",
      checks: [
        { name: "Metadata", status: "pass", detail: "No signs of editing in the metadata." },
        { name: "ELA", status: "pass", detail: "No inconsistencies detected." },
        { name: "AI-generated", status: "pass", detail: "Low likelihood of AI generation.", score: 0.11 },
        { name: "Source verification", status: "unverified", detail: "This issuer does not offer a verification service, so authenticity could not be confirmed." },
      ],
    },
  },
];
