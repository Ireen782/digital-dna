// A made-up certificate used as an illustration and as the preview for demo cases.
export default function SampleCertificate({ highlight }) {
  const serif = "Georgia, 'Times New Roman', serif";
  return (
    <svg viewBox="0 0 360 260" className="cert" role="img" aria-label="Sample graduation certificate">
      <rect x="6" y="6" width="348" height="248" rx="5" fill="#fffdf8" stroke="#d9cde9" />
      <rect x="16" y="16" width="328" height="228" rx="3" fill="none" stroke="#5b2a9e" strokeWidth="1.5" />
      <rect x="21" y="21" width="318" height="218" rx="2" fill="none" stroke="#cdb9ec" strokeWidth=".8" />
      <text x="180" y="58" textAnchor="middle" fontFamily={serif} fontSize="10" letterSpacing="3" fill="#5b2a9e">BINGHAM UNIVERSITY</text>
      <text x="180" y="88" textAnchor="middle" fontFamily={serif} fontSize="22" fill="#241833">Certificate of Graduation</text>
      <text x="180" y="112" textAnchor="middle" fontFamily={serif} fontSize="10" fontStyle="italic" fill="#6a5f78">This is to certify that</text>
      <text x="180" y="136" textAnchor="middle" fontFamily={serif} fontSize="17" fill="#241833">Adaeze Okafor</text>
      <line x1="105" y1="144" x2="255" y2="144" stroke="#cdb9ec" />
      <text x="180" y="163" textAnchor="middle" fontFamily={serif} fontSize="9.5" fill="#6a5f78">has completed the degree of B.Sc. Computer Science</text>
      {highlight === "year" && (
        <rect className="cert-flag" x="136" y="171" width="88" height="19" rx="3" fill="#e8a33d" fillOpacity=".25" stroke="#c98a1f" strokeWidth="1.4" strokeDasharray="4 3" />
      )}
      <text x="180" y="184" textAnchor="middle" fontFamily={serif} fontSize="11" fill="#241833">Class of 2022</text>
      <circle cx="84" cy="216" r="14" fill="#5b2a9e" />
      <circle cx="84" cy="216" r="10.5" fill="none" stroke="#e6dcf7" strokeWidth=".9" />
      <path d="M84 209l2 4.4 4.8.5-3.6 3.2 1 4.7-4.2-2.5-4.2 2.5 1-4.7-3.6-3.2 4.8-.5z" fill="#e6dcf7" />
      <path d="M236 217c8-14 15-2 22-6s10 4 18-3" fill="none" stroke="#241833" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="232" y1="222" x2="282" y2="222" stroke="#cdb9ec" />
      <text x="257" y="232" textAnchor="middle" fontFamily={serif} fontSize="6.5" fill="#6a5f78">REGISTRAR</text>
    </svg>
  );
}
