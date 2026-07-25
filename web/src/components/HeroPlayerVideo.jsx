// Purely decorative real video of a basketball player dribbling, animated
// behind the hero stats row. Desaturated to black & white at runtime via
// CSS (no source video processing available in this environment). Source:
// Pexels stock footage (free commercial license, no attribution required,
// anonymous player) — see web/public/assets/hero-player.mp4.
export default function HeroPlayerVideo({ className = '' }) {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <video
      className={`hero-stats-video ${className}`.trim()}
      src="/assets/hero-player.mp4"
      autoPlay={!reduceMotion}
      loop={!reduceMotion}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
