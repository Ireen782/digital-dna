import SampleCertificate from "./SampleCertificate";

// Shows the uploaded image, a PDF placeholder, or the sample certificate (demo cases).
export default function DocPreview({ previewUrl, isPdf, highlight, scanning }) {
  return (
    <div className={`doc-frame ${scanning ? "scanning" : ""}`}>
      {previewUrl && !isPdf ? (
        <img src={previewUrl} alt="The file you uploaded" />
      ) : isPdf ? (
        <div className="pdf-ph"><strong>PDF</strong><span>Document</span></div>
      ) : (
        <SampleCertificate highlight={highlight} />
      )}
      {scanning && <div className="scan-line" />}
    </div>
  );
}
