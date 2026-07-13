import { useCallback, useEffect, useRef, useState } from 'react';

// Full-screen photo carousel for a past event. `photos` is an array of
// { id, path }. Scrollable with arrows, keyboard (←/→/Esc), a counter and
// a thumbnail strip.
export default function Carousel({ photos, title, startIndex = 0, onClose }) {
  const [i, setI] = useState(startIndex);
  const n = photos.length;
  const stripRef = useRef(null);

  const go = useCallback((d) => setI((prev) => (prev + d + n) % n), [n]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  useEffect(() => {
    stripRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [i]);

  if (n === 0) return null;

  const arrow = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,.14)', color: '#fff', fontSize: 24, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div
      onClick={onClose}
      className="carousel-overlay"
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#0A0908', display: 'flex', flexDirection: 'column', padding: '24px 24px 18px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div className="serif carousel-title" style={{ fontSize: 20, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <div style={{ fontSize: 13, color: '#B7AFA6', marginTop: 2 }}>{i + 1} / {n}</div>
        </div>
        <button onClick={onClose} aria-label="Fermer" style={{ flexShrink: 0, marginLeft: 14, background: 'rgba(255,255,255,.14)', border: 'none', cursor: 'pointer', width: 40, height: 40, borderRadius: '50%', fontSize: 20, color: '#fff' }}>×</button>
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, margin: '14px 0' }}>
        <img src={photos[i].path} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4 }} />
        {n > 1 && (
          <>
            <button className="carousel-arrow" onClick={() => go(-1)} aria-label="Précédente" style={{ ...arrow, left: 8 }}>‹</button>
            <button className="carousel-arrow" onClick={() => go(1)} aria-label="Suivante" style={{ ...arrow, right: 8 }}>›</button>
          </>
        )}
      </div>

      {n > 1 && (
        <div ref={stripRef} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0, padding: '4px 2px' }}>
          {photos.map((p, idx) => (
            <button
              key={p.id ?? idx}
              className="carousel-thumb"
              onClick={() => setI(idx)}
              style={{ flexShrink: 0, width: 76, height: 54, borderRadius: 4, overflow: 'hidden', border: idx === i ? '2px solid #fff' : '2px solid transparent', padding: 0, cursor: 'pointer', background: 'none', opacity: idx === i ? 1 : 0.55 }}
            >
              <img src={p.path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
