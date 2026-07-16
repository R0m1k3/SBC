import Modal from './Modal.jsx';

export default function MemberModal({ member, onClose }) {
  if (!member) return null;
  const encodedAddress = member.adresse ? encodeURIComponent(member.adresse) : '';
  const mapUrl = encodedAddress ? `https://www.google.com/maps?q=${encodedAddress}&output=embed` : '';
  const mapLink = encodedAddress ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}` : '';
  return (
    <Modal onClose={onClose} maxWidth={760}>
      <div style={{ position: 'relative', background: 'var(--dark)', color: '#fff', padding: '32px 36px', display: 'flex', alignItems: 'center', gap: 22 }}>
        <button className="modal-close" onClick={onClose} style={{ top: 18, right: 18, width: 32, height: 32 }} aria-label="Fermer">×</button>
        <div style={{ width: 76, height: 76, flexShrink: 0, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: 'monospace', fontSize: 10, color: '#a8a099' }}>
          {member.logo_path ? (
            <img src={member.logo_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : ('logo')}
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--red-soft)', fontWeight: 600, marginBottom: 6 }}>
            {member.secteur}
          </div>
          <h2 className="serif" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.05 }}>{member.nom}</h2>
          <div style={{ marginTop: 10 }}>
            <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 600, color: '#E7E1D9', background: 'rgba(255,255,255,.12)', borderRadius: 20, padding: '5px 12px' }}>
              {member.categorie || 'Non classée'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'var(--beige)', borderRadius: 8, padding: '20px 22px', marginBottom: 26 }}>
          <div className={member.photo_path ? '' : 'placeholder-pattern'} style={{ width: 88, height: 88, flexShrink: 0, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 9, color: '#a8a099' }}>
            {member.photo_path ? (
              <img src={member.photo_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : ('photo')}
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gray-light)', fontWeight: 600, marginBottom: 5 }}>
              Dirigeant·e
            </div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>{member.dirigeant}</div>
            {member.adhesion && (
              <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4 }}>Membre depuis {member.adhesion}</div>
            )}
          </div>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--gray)', marginBottom: 26 }}>{member.presentation}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border-soft)', paddingTop: 22 }}>
          {[['Adresse', member.adresse], ['Email', member.email], ['Tél', member.tel], ['Site', member.site]].map(([label, value]) =>
            value ? (
              <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14 }}>
                <span style={{ width: 64, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gray-light)', fontWeight: 600 }}>
                  {label}
                </span>
                <span style={{ color: label === 'Site' ? 'var(--red)' : 'var(--ink)' }}>{value}</span>
              </div>
            ) : null
          )}
        </div>
        {member.adresse && (
          <div style={{ marginTop: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
              <h3 className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Situation géographique</h3>
              <a href={mapLink} target="_blank" rel="noreferrer" className="btn-link" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                Ouvrir la carte →
              </a>
            </div>
            <iframe
              title={`Carte de ${member.nom}`}
              src={mapUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ width: '100%', height: 280, border: 0, borderRadius: 6, display: 'block' }}
              allowFullScreen
            />
          </div>
        )}
        {member.email && (
          <a href={`mailto:${member.email}`} style={{ textDecoration: 'none' }}>
            <button className="btn btn-dark btn-sm" style={{ marginTop: 26, padding: '13px 24px', fontSize: 14 }}>
              Contacter cette entreprise
            </button>
          </a>
        )}
      </div>
    </Modal>
  );
}
