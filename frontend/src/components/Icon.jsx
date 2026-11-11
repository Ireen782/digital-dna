// const P = {
//   upload: "M12 16V5m0 0L8 9m4-4 4 4M5 19h14",
//   search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16.5 16.5 21 21",
//   report: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
//   tag: "M3 12V4h8l10 10-8 8zM7.5 7.5h.01",
//   layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
//   spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
//   bank: "M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18",
//   shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
//   alert: "M12 4l9 16H3zM12 10v4M12 17h.01",
//   help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 17h.01",
//   lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
//   eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
//   heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
//   check: "M5 12.5l4.5 4.5L19 7.5",
//   user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.5-6 8-6s8 2 8 6",
//   copy: "M9 9h10v11H9zM5 15V4h10",
//   download: "M12 4v11m0 0-4-4m4 4 4-4M5 20h14",
//   back: "M10 6l-6 6 6 6M4 12h16",
// };

// export default function Icon({ name, size = 22, stroke = 1.8 }) {
//   return (
//     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
//       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//       <path d={P[name] || P.search} />
//     </svg>
//   );
// }



// Real icons from the Lucide library (https://lucide.dev). Install with: npm install lucide-react
import {
  Upload, ScanSearch, FileCheck2, FileSearch, Layers, Bot, Landmark, ShieldCheck,
  TriangleAlert, CircleHelp, Lock, Eye, Heart, Check, User, Download, ArrowLeft,
  ArrowRight, HeartHandshake, Scale, Search, Copy,
} from "lucide-react";

const MAP = {
  upload: Upload, search: ScanSearch, report: FileCheck2, tag: FileSearch, layers: Layers,
  spark: Bot, bank: Landmark, shield: ShieldCheck, alert: TriangleAlert, help: CircleHelp,
  lock: Lock, eye: Eye, heart: Heart, check: Check, user: User, download: Download,
  back: ArrowLeft, arrow: ArrowRight, care: HeartHandshake, scale: Scale, copy: Copy,
};

export default function Icon({ name, size = 22, stroke = 1.8 }) {
  const Cmp = MAP[name] || Search;
  return <Cmp size={size} strokeWidth={stroke} aria-hidden="true" />;
}
