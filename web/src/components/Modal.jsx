export default function Modal({ onClose, maxWidth = 560, children, header }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        {header && (
          <div className="modal-header">
            <button className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
            {header.kicker && (
              <div className="kicker on-dark" style={{ fontSize: 11, letterSpacing: '.12em', marginBottom: 6 }}>
                {header.kicker}
              </div>
            )}
            {header.title && (
              <h3 className="serif" style={{ fontSize: 23, fontWeight: 600, lineHeight: 1.15 }}>{header.title}</h3>
            )}
            {header.meta && <div style={{ fontSize: 13, color: '#B7AFA6', marginTop: 8 }}>{header.meta}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
