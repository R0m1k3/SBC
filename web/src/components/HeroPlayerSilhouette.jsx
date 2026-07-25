// Purely decorative basketball-player silhouette animated behind the hero
// stats row. An original flat-illustration silhouette (not a photo/video),
// built from rounded-capsule limb segments — the same construction as
// classic flat sports pictograms (NBA/Jordan-style marks) — in a duotone
// matching the site theme. Avoids any droit-à-l'image concern since it
// does not depict a real identifiable person.
export default function HeroPlayerSilhouette({ className = '' }) {
  return (
    <svg
      className={`hero-stats-silhouette ${className}`.trim()}
      viewBox="0 0 360 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      focusable="false"
    >
      <g className="hspl-figure" fill="var(--ink)">
        <g fill="none" stroke="var(--ink)" strokeLinecap="round">
          {/* trailing arm, swung back for balance */}
          <line x1="222" y1="88" x2="192" y2="64" strokeWidth="15" />
          <line x1="192" y1="64" x2="164" y2="50" strokeWidth="10" />
          {/* dribbling arm, reaching down to the ball */}
          <line x1="230" y1="96" x2="262" y2="136" strokeWidth="16" />
          <line x1="262" y1="136" x2="290" y2="186" strokeWidth="10" />
          {/* torso */}
          <line x1="240" y1="80" x2="215" y2="130" strokeWidth="34" />
          <line x1="215" y1="130" x2="198" y2="168" strokeWidth="24" />
          {/* planted / front leg */}
          <line x1="205" y1="168" x2="224" y2="220" strokeWidth="22" />
          <line x1="224" y1="220" x2="218" y2="272" strokeWidth="14" />
          <line x1="218" y1="272" x2="240" y2="280" strokeWidth="12" />
          {/* trailing leg, extended back */}
          <line x1="196" y1="170" x2="150" y2="196" strokeWidth="22" />
          <line x1="150" y1="196" x2="108" y2="204" strokeWidth="13" />
          <line x1="108" y1="204" x2="84" y2="212" strokeWidth="11" />
        </g>
        {/* joint fillers smoothing the width change between segments */}
        <circle cx="192" cy="64" r="7.5" />
        <circle cx="262" cy="136" r="8" />
        <circle cx="215" cy="130" r="17" />
        <circle cx="201" cy="169" r="13" />
        <circle cx="224" cy="220" r="11" />
        <circle cx="150" cy="196" r="11" />
        <circle cx="248" cy="54" r="23" />
      </g>

      <g className="hspl-ball" fill="var(--ink)">
        <circle cx="300" cy="208" r="22" />
        <path d="M280,196 C293,203 307,203 320,196" fill="none" stroke="var(--bg)" strokeWidth="2" />
        <path d="M300,187 C293,197 293,220 300,231" fill="none" stroke="var(--bg)" strokeWidth="2" />
      </g>

      <g className="hspl-speedlines" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none">
        <path className="hspl-speedline" d="M42,196 L78,201" />
        <path className="hspl-speedline" d="M34,214 L72,214" />
        <path className="hspl-speedline" d="M40,232 L76,226" />
      </g>
    </svg>
  );
}
