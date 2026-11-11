import { useRef, useState } from "react";
import Icon from "./Icon";

export const ACCEPT = ["image/png", "image/jpeg", "application/pdf"];

export function validate(file) {
  if (!file) return "Please choose a file.";
  if (!ACCEPT.includes(file.type)) return "Please use a PNG, JPG or PDF file.";
  if (file.size > 15 * 1024 * 1024) return "That file is over 15 MB. Please use a smaller one.";
  return "";
}

export default function DropZone({ onPick, file, compact }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className={`dropzone ${dragging ? "dragging" : ""} ${compact ? "compact" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); onPick(e.dataTransfer.files[0]); }}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
    >
      <span className="dz-icon"><Icon name="upload" size={26} /></span>
      <strong>{file ? file.name : "Drop a certificate or document here"}</strong>
      <span className="dz-btn">{file ? "Choose a different file" : "or choose a file"}</span>
      <span className="dz-hint">PNG, JPG or PDF · up to 15 MB</span>
      <input ref={inputRef} type="file" accept={ACCEPT.join(",")} hidden onChange={(e) => onPick(e.target.files[0])} />
    </div>
  );
}
