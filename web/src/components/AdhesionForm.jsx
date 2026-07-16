import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import Modal from './Modal.jsx';

const EMPTY_FORM = { nom: '', fonction: '', entreprise: '', email: '', tel: '' };

export function AdhesionForm({ showTitle = true }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/api/public/demandes-adhesion', form);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px' }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#FBEDEC', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>✓</div>
        <h3 className="serif" style={{ fontSize: 26, fontWeight: 600, marginBottom: 10 }}>Demande envoyée !</h3>
        <p style={{ fontSize: 15, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 24 }}>
          Merci pour votre intérêt. Notre équipe vous recontacte sous 48h.
        </p>
        <button className="btn btn-outline btn-sm" style={{ fontSize: 14, padding: '12px 24px' }} onClick={() => { setDone(false); setForm(EMPTY_FORM); }}>
          Nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {showTitle && <h3 className="serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 22 }}>Demande d'adhésion</h3>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="field-plain">Nom & prénom
            <input name="nom" value={form.nom} onChange={onChange} required maxLength={120} autoComplete="name" />
          </label>
          <label className="field-plain">Fonction
            <input name="fonction" value={form.fonction} onChange={onChange} maxLength={120} autoComplete="organization-title" />
          </label>
        </div>
        <label className="field-plain">Entreprise
          <input name="entreprise" value={form.entreprise} onChange={onChange} required maxLength={120} autoComplete="organization" />
        </label>
        <label className="field-plain">Email professionnel
          <input name="email" type="email" value={form.email} onChange={onChange} required maxLength={254} autoComplete="email" />
        </label>
        <label className="field-plain">Numéro de téléphone
          <input name="tel" type="tel" value={form.tel} onChange={onChange} required minLength={6} maxLength={30} autoComplete="tel" placeholder="+33 6 12 34 56 78" />
        </label>
      </div>
      {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
      <button type="submit" className="btn btn-red" style={{ width: '100%', marginTop: 24, padding: 15 }} disabled={busy}>
        {busy ? 'Envoi…' : 'Envoyer ma demande'}
      </button>
      <p style={{ fontSize: 11, color: 'var(--gray-light)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
        Les informations recueillies servent uniquement à instruire votre demande d'adhésion.
        Pour en savoir plus et exercer vos droits, consultez notre{' '}
        <Link to="/confidentialite" style={{ color: 'var(--red)' }}>politique de confidentialité</Link>.
      </p>
    </form>
  );
}

export function AdhesionModal({ onClose }) {
  return (
    <Modal onClose={onClose} maxWidth={560}>
      <div style={{ position: 'relative', padding: '34px 38px 38px' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--beige)', color: 'var(--gray)', cursor: 'pointer', fontSize: 18 }}
        >×</button>
        <h2 className="serif" style={{ fontSize: 27, fontWeight: 600, marginBottom: 24, paddingRight: 28 }}>Demande d'adhésion</h2>
        <AdhesionForm showTitle={false} />
      </div>
    </Modal>
  );
}
