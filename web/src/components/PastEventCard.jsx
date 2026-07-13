import { useState } from 'react';
import Carousel from './Carousel.jsx';

// Editorial card for one past event: text on the left, a 1-large-+-2-small
// photo grid on the right. Clicking any photo (or "voir les N photos")
// opens the full carousel with every photo.
export default function PastEventCard({ event }) {
  const [carouselAt, setCarouselAt] = useState(null); // null | index
  const photos = event.photos || [];
  const hasPhotos = photos.length > 0;

  const cell = (idx, extra = {}) => {
    const photo = photos[idx];
    return (
      <div
        className={photo ? '' : 'placeholder-pattern'}
        style={{ borderRadius: 3, overflow: 'hidden', cursor: photo ? 'pointer' : 'default', ...extra }}
        onClick={photo ? () => setCarouselAt(idx) : undefined}
      >
        {photo && <img src={photo.path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
    );
  };

  return (
    <>
      <article className="card hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 40, alignItems: 'center', padding: 36 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--gray-light)', fontWeight: 600, marginBottom: 12 }}>
            {event.date_label} · {event.lieu}
          </div>
          <h3 className="serif" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.12, marginBottom: 16 }}>{event.titre}</h3>
          <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--gray)', marginBottom: 20 }}>{event.texte}</p>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--gray-light)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>👥 {event.participants} participants</span>
            <span>📷 {event.nb_photos} photo{event.nb_photos > 1 ? 's' : ''}</span>
            {hasPhotos && (
              <button className="btn-link" style={{ fontSize: 13 }} onClick={() => setCarouselAt(0)}>
                Voir les photos →
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10, height: 240 }}>
          {cell(0, { gridRow: 'span 2' })}
          {cell(1)}
          {photos.length > 3 ? (
            <div
              style={{ borderRadius: 3, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
              onClick={() => setCarouselAt(2)}
            >
              <img src={photos[2].path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,14,13,.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontSize: 22, fontWeight: 600 }}>
                +{photos.length - 3}
              </div>
            </div>
          ) : (
            cell(2)
          )}
        </div>
      </article>

      {carouselAt !== null && (
        <Carousel photos={photos} title={event.titre} startIndex={carouselAt} onClose={() => setCarouselAt(null)} />
      )}
    </>
  );
}
