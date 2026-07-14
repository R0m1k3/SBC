import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { copyRichEmail } from '../../lib/emailClipboard.js';

const INITIAL = {
  subject: 'Actualités du Business Club SLUC Nancy',
  kicker: 'Business Club · SLUC Nancy',
  title: 'Votre titre ici',
  body: "Bonjour,\n\nRédigez ici votre message. Vous pouvez créer plusieurs paragraphes en laissant une ligne vide.\n\nLe modèle conserve automatiquement l'identité visuelle du Business Club.",
  buttonLabel: 'Découvrir',
  buttonUrl: window.location.origin,
  signature: "À très bientôt,\nL'équipe du Business Club SLUC Nancy",
};

export function EmailCreatorTab() {
  const [form, setForm] = useState(INITIAL);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      const completeButton = Boolean(form.buttonLabel && form.buttonUrl);
      api.post('/api/admin/emails/preview', {
        ...form,
        base: window.location.origin,
        buttonLabel: completeButton ? form.buttonLabel : '',
        buttonUrl: completeButton ? form.buttonUrl : '',
      })
        .then((result) => {
          if (requestId.current !== id) return;
          setData(result);
          setError('');
        })
        .catch((err) => {
          if (requestId.current === id) setError(err.message);
        });
    }, 350);
    return () => clearTimeout(timer);
  }, [form]);

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const flash = (key) => {
    setCopied(key);
    setTimeout(() => setCopied(''), 1800);
  };

  const copyEmail = async () => {
    try {
      await copyRichEmail(data.html, `${form.subject}\n\n${form.body}`);
      flash('email');
    } catch {
      setError('La copie enrichie a échoué dans ce navigateur. Utilisez le téléchargement HTML.');
    }
  };

  const copySubject = async () => {
    try {
      await navigator.clipboard.writeText(form.subject);
      flash('subject');
    } catch {
      setError("Impossible de copier l'objet.");
    }
  };

  const download = () => {
    const blob = new Blob([data.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const slug = form.subject.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'email';
    anchor.href = url;
    anchor.download = `${slug}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 26, alignItems: 'start' }}>
      <div className="card" style={{ padding: 24, borderRadius: 6 }}>
        <h2 className="serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Composer un e-mail</h2>
        <p style={{ fontSize: 13, color: 'var(--gray-light)', lineHeight: 1.55, marginBottom: 20 }}>
          Le logo, les couleurs et le pied de page sont ajoutés automatiquement.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <label className="field">Objet
            <input name="subject" value={form.subject} onChange={onChange} required maxLength={200} />
          </label>
          <label className="field">Surtitre
            <input name="kicker" value={form.kicker} onChange={onChange} maxLength={120} placeholder="Facultatif" />
          </label>
          <label className="field">Titre
            <input name="title" value={form.title} onChange={onChange} required maxLength={200} />
          </label>
          <label className="field">Message
            <textarea name="body" value={form.body} onChange={onChange} rows={9} required maxLength={6000} />
          </label>
          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Bouton facultatif</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label className="field">Texte du bouton
                <input name="buttonLabel" value={form.buttonLabel} onChange={onChange} maxLength={100} />
              </label>
              <label className="field">Lien du bouton
                <input name="buttonUrl" type="url" value={form.buttonUrl} onChange={onChange} maxLength={500} placeholder="https://…" />
              </label>
            </div>
          </div>
          <label className="field">Signature
            <textarea name="signature" value={form.signature} onChange={onChange} rows={3} maxLength={500} />
          </label>
        </div>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
          <button className="btn btn-red" onClick={copyEmail} disabled={!data}>{copied === 'email' ? '✓ E-mail copié' : "Copier l'e-mail"}</button>
          <button className="btn btn-outline-soft btn-sm" style={{ padding: 12 }} onClick={copySubject}>{copied === 'subject' ? '✓ Objet copié' : "Copier l'objet"}</button>
          <button className="btn btn-outline-soft btn-sm" style={{ padding: 12 }} onClick={download} disabled={!data}>Télécharger le HTML</button>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--gray-light)', lineHeight: 1.5, marginTop: 14 }}>
          Dans un brouillon Outlook, utilisez Ctrl + clic pour tester un lien. Après envoi, un clic normal suffit.
        </p>
      </div>

      <div>
        <div style={{ fontSize: 12.5, color: 'var(--gray-light)', marginBottom: 10 }}><strong style={{ color: 'var(--gray)' }}>Objet :</strong> {form.subject}</div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: '#F2EEE8' }}>
          {data
            ? <iframe title="Aperçu de l'e-mail" srcDoc={data.html} sandbox="" style={{ display: 'block', width: '100%', height: 720, border: 'none', background: '#F2EEE8' }} />
            : <div style={{ height: 300, padding: 30, color: 'var(--gray-light)' }}>Génération de l'aperçu…</div>}
        </div>
      </div>
    </div>
  );
}
