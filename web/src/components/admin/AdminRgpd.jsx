import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

// Admin tab grouping the association's GDPR compliance documents. Each is
// generated server-side (prefilled from the association parameters) and can
// be previewed, printed and downloaded as a standalone HTML file.
const DOCS = [
  { key: 'register', label: 'Registre des traitements', endpoint: '/api/admin/compliance/register',
    hint: "Document interne obligatoire (art. 30 RGPD) recensant tous les traitements de données. À conserver et présenter à la CNIL sur demande." },
  { key: 'consent-adult', label: 'Droit à l’image — majeur', endpoint: '/api/admin/compliance/image-consent',
    hint: 'Formulaire à faire signer aux participants avant de publier des photos les représentant.' },
  { key: 'consent-minor', label: 'Droit à l’image — mineur', endpoint: '/api/admin/compliance/image-consent?minor=1',
    hint: 'Variante à faire signer par le représentant légal pour toute personne mineure.' },
];

export function RgpdTab() {
  const [active, setActive] = useState('register');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const doc = DOCS.find((d) => d.key === active);

  useEffect(() => {
    setData(null);
    setError('');
    api.get(doc.endpoint).then(setData).catch((e) => setError(e.message));
  }, [active]);

  const print = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(data.html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 350);
  };

  const download = () => {
    const blob = new Blob([data.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h3 className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Conformité RGPD</h3>
        <div style={{ fontSize: 12.5, color: 'var(--gray-light)', marginTop: 3, lineHeight: 1.55, maxWidth: 720 }}>
          Documents générés automatiquement à partir des <strong>Paramètres de l'association</strong>.
          Complétez-y les informations manquantes (RNA, président·e, hébergeur…) pour des documents conformes.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {DOCS.map((d) => (
          <button
            key={d.key}
            className="btn btn-sm"
            onClick={() => setActive(d.key)}
            style={{
              fontSize: 13, padding: '10px 16px',
              background: active === d.key ? 'var(--red)' : 'var(--admin-bg)',
              color: active === d.key ? '#fff' : 'var(--ink)',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="btn btn-red btn-sm" style={{ fontSize: 13.5, padding: '11px 18px' }} onClick={print} disabled={!data}>
          ⎙ Imprimer
        </button>
        <button className="btn btn-outline-soft btn-sm" style={{ fontSize: 13.5, padding: '11px 18px' }} onClick={download} disabled={!data}>
          ↓ Télécharger (.html)
        </button>
        <span style={{ fontSize: 12, color: 'var(--gray-light)', lineHeight: 1.5, flex: 1, minWidth: 240 }}>{doc.hint}</span>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!data && !error && <p style={{ color: 'var(--gray-light)' }}>Génération du document…</p>}
      {data && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          <iframe title="Aperçu du document" srcDoc={data.html} style={{ display: 'block', width: '100%', height: 680, border: 'none', background: '#f0eee9' }} />
        </div>
      )}
    </div>
  );
}
