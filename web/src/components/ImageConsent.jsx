import { useState } from 'react';
import { api } from '../lib/api.js';
import SignaturePad from './SignaturePad.jsx';

// Blanket authorization: one signature covers any photo of the member, on
// all of the association's media. Recorded server-side with the full scope
// list so the record stays explicit.
const ALL_SCOPES = ['site', 'social', 'print'];

const CONSENT_TEXT =
  "J'autorise l'association à photographier, reproduire et diffuser mon image — toute photographie de moi " +
  "prise lors des rencontres et manifestations du club, ainsi que ma photographie de profil — sur l'ensemble " +
  "de ses supports de communication (site internet, réseaux sociaux, supports imprimés). Cette autorisation " +
  "générale est consentie à titre gratuit, pour une durée de 5 ans, pour une diffusion en France et à " +
  "l'étranger. Les images ne seront ni cédées à des tiers ni utilisées à des fins commerciales. Je peux " +
  "retirer mon consentement à tout moment depuis mon espace membre.";

// Interactive image-rights consent form. Records a single blanket
// electronic authorization (or a refusal), then calls onDone.
export function ImageConsentForm({ dirigeant, onDone, compact = false }) {
  const [name, setName] = useState(dirigeant || '');
  const [signature, setSignature] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (decision) => {
    setError('');
    if (!name.trim()) return setError('Indiquez votre nom et prénom.');
    if (decision === 'accepted' && !signature) return setError('Signez dans le cadre pour autoriser.');
    setBusy(true);
    try {
      await api.post('/api/member/image-consent', {
        decision,
        scopes: decision === 'accepted' ? ALL_SCOPES : [],
        signatoryName: name.trim(),
        signaturePng: decision === 'accepted' ? signature : '',
      });
      onDone?.(decision);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--gray)' }}>{CONSENT_TEXT}</p>

      <label className="field">Nom et prénom du signataire
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Votre nom et prénom" />
      </label>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--gray-mid)', marginBottom: 8 }}>
          Signature
        </div>
        <SignaturePad onChange={setSignature} />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn btn-red btn-sm" style={{ fontSize: 14.5, padding: '13px 26px' }} disabled={busy} onClick={() => submit('accepted')}>
          {busy ? 'Enregistrement…' : "J'autorise et je signe"}
        </button>
        <button type="button" className="btn btn-outline-soft btn-sm" style={{ fontSize: 14, padding: '13px 22px' }} disabled={busy} onClick={() => submit('refused')}>
          Je n'autorise pas
        </button>
      </div>
      {!compact && (
        <p style={{ fontSize: 11.5, color: 'var(--gray-light)', lineHeight: 1.55 }}>
          Votre choix, la date et votre signature sont enregistrés comme preuve de consentement (art. 7 RGPD),
          et modifiables à tout moment. Refuser n'a aucune conséquence sur votre adhésion.
        </p>
      )}
    </div>
  );
}
