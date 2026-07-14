import { useState } from 'react';
import Carousel from './Carousel.jsx';
import Modal from './Modal.jsx';

// Editorial summary for one past event. The list keeps a controlled excerpt;
// clicking the card opens the complete story and gallery, then a photo can be
// enlarged in the full-screen carousel.
export default function PastEventCard({ event, excerptLines = 2 }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [carouselAt, setCarouselAt] = useState(null); // null | index
  const photos = event.photos || [];
  const hasPhotos = photos.length > 0;

  const cell = (idx, extra = {}) => {
    const photo = photos[idx];
    return (
      <div
        className={photo ? '' : 'placeholder-pattern'}
        style={{ borderRadius: 3, overflow: 'hidden', ...extra }}
      >
        {photo && <img src={photo.path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
    );
  };

  return (
    <>
      <article
        className="card hero-grid past-event-card"
        style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 40, alignItems: 'center', padding: 36, cursor: 'pointer' }}
        onClick={() => setDetailOpen(true)}
      >
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--gray-light)', fontWeight: 600, marginBottom: 12 }}>
            {event.date_label} · {event.lieu}
          </div>
          <h3 className="serif" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.12, marginBottom: 16 }}>{event.titre}</h3>
          <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--gray)', marginBottom: 20, display: '-webkit-box', WebkitLineClamp: excerptLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.texte}</p>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--gray-light)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>👥 {event.participants} participants</span>
            <span>📷 {event.nb_photos} photo{event.nb_photos > 1 ? 's' : ''}</span>
            <button className="btn-link" style={{ fontSize: 13 }} onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}>
              Voir la soirée →
            </button>
          </div>
        </div>
        <div className="past-event-photos" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10, height: 240 }}>
          {cell(0, { gridRow: 'span 2' })}
          {cell(1)}
          {photos.length > 3 ? (
            <div
              style={{ borderRadius: 3, overflow: 'hidden', position: 'relative' }}
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

      {detailOpen && (
        <Modal
          onClose={() => setDetailOpen(false)}
          maxWidth={920}
          header={{
            kicker: 'Rencontre passée',
            title: event.titre,
            meta: `${event.date_label} · ${event.lieu}`,
          }}
        >
          <div style={{ padding: '30px 32px 36px' }}>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', fontSize: 13, color: 'var(--gray-light)', marginBottom: 22 }}>
              <span>👥 {event.participants} participants</span>
              <span>📷 {event.nb_photos} photo{event.nb_photos > 1 ? 's' : ''}</span>
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--gray)', whiteSpace: 'pre-line' }}>
              {event.texte}
            </div>

            {hasPhotos ? (
              <div style={{ marginTop: 30 }}>
                <h4 className="serif" style={{ fontSize: 21, fontWeight: 600, marginBottom: 16 }}>Toutes les photos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id ?? index}
                      type="button"
                      onClick={() => setCarouselAt(index)}
                      aria-label={`Ouvrir la photo ${index + 1}`}
                      style={{ height: 140, padding: 0, border: 'none', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', background: 'var(--beige)' }}
                    >
                      <img src={photo.path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ marginTop: 26, padding: '16px 18px', background: 'var(--beige)', color: 'var(--gray-light)', fontSize: 13.5 }}>
                Aucune photo n'a encore été ajoutée à cette soirée.
              </p>
            )}
          </div>
        </Modal>
      )}

      {carouselAt !== null && (
        <Carousel photos={photos} title={event.titre} startIndex={carouselAt} onClose={() => setCarouselAt(null)} />
      )}
    </>
  );
}
