import { useState } from 'react';
import Modal from '../Modal.jsx';

// Shows a just-generated temporary password so the admin can relay it
// (copy button). It also stays readable inline (via AccessCell below)
// until the account holder changes it.
export function CredentialsModal({ recipient, tempPassword, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (non-HTTPS, older browser) — password stays selectable */
    }
  };
  return (
    <Modal onClose={onClose} maxWidth={440} header={{ kicker: 'Accès', title: 'Mot de passe temporaire généré' }}>
      <div style={{ padding: '26px 30px' }}>
        <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 18 }}>
          Communiquez ces identifiants à <strong>{recipient}</strong>. Ce mot de passe devra être
          changé dès la première connexion.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--admin-bg)', borderRadius: 6, padding: '14px 16px' }}>
          <code style={{ fontSize: 18, fontWeight: 700, letterSpacing: '.02em', flex: 1, userSelect: 'all' }}>{tempPassword}</code>
          <button type="button" className="btn btn-outline-soft btn-sm" style={{ fontSize: 13, padding: '8px 14px' }} onClick={copy}>
            {copied ? '✓ Copié' : 'Copier'}
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--gray-light)', lineHeight: 1.55, marginTop: 12 }}>
          Ce mot de passe reste visible dans la liste tant qu'il n'a pas été changé.
        </p>
        <button type="button" className="btn btn-dark btn-sm" style={{ width: '100%', marginTop: 20, fontSize: 14 }} onClick={onClose}>
          Fermer
        </button>
      </div>
    </Modal>
  );
}

// Compact cell for a table row: shows the live temp password (+ copy +
// reset), a "Défini" badge once changed, or a "Créer l'accès" action when
// there's no login yet.
export function AccessCell({ hasEmail = true, hasLogin, mustChangePassword, tempPassword, onGenerate, createLabel = "Créer l'accès" }) {
  const [copied, setCopied] = useState(false);
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (!hasEmail) {
    return (
      <span style={{ fontSize: 12.5, color: 'var(--gray-light)' }} title="Ajoutez un email pour créer un accès">
        —
      </span>
    );
  }
  if (!hasLogin) {
    return (
      <button type="button" className="btn-link" style={{ fontSize: 12.5 }} onClick={onGenerate}>
        {createLabel}
      </button>
    );
  }
  if (mustChangePassword && tempPassword) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <code style={{ fontSize: 12, background: 'var(--admin-bg)', padding: '4px 8px', borderRadius: 3, fontWeight: 600 }}>
          {tempPassword}
        </code>
        <button type="button" className="btn-link-gray" style={{ fontSize: 11.5 }} onClick={() => copy(tempPassword)}>
          {copied ? '✓' : 'copier'}
        </button>
        <button type="button" className="btn-link-gray" style={{ fontSize: 11.5 }} onClick={onGenerate}>
          réinitialiser
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="badge badge-green">Défini</span>
      <button type="button" className="btn-link-gray" style={{ fontSize: 11.5 }} onClick={onGenerate}>
        réinitialiser
      </button>
    </div>
  );
}
