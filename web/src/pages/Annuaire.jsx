import { useMemo, useState } from 'react';
import { usePublicData } from '../lib/usePublic.js';
import MemberModal from '../components/MemberModal.jsx';
import { associationSettings } from '../lib/siteSettings.js';

export default function Annuaire() {
  const { data } = usePublicData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Toutes');
  const [detail, setDetail] = useState(null);

  const members = data?.members ?? [];
  const categories = data?.categories ?? [];
  const settings = associationSettings(data?.content);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchCat = category === 'Toutes' || (m.categorie || 'Non classée') === category;
      const matchText = !q || `${m.nom} ${m.dirigeant} ${m.secteur} ${m.categorie || ''} ${m.adresse || ''}`.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [members, search, category]);

  const chips = ['Toutes', ...categories.map((c) => c.name)];

  return (
    <main>
      <section style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '70px 32px 60px' }}>
          <div className="kicker" style={{ marginBottom: 16 }}>Annuaire des membres</div>
          <h1 className="serif" style={{ fontWeight: 500, fontSize: 'clamp(36px, 5vw, 54px)', lineHeight: 1.05, marginBottom: 18 }}>
            {members.length} entreprises, un réseau.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--gray)', maxWidth: 600 }}>
            Découvrez les entreprises membres de {settings.association_name} et prenez contact directement avec leurs dirigeants.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: '44px 32px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-light)', fontSize: 15 }}>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une entreprise, un dirigeant, un secteur…"
              maxLength={120}
              style={{ width: '100%', padding: '14px 16px 14px 42px', border: '1px solid var(--input-border)', borderRadius: 3, background: '#fff' }}
            />
          </div>
          <span style={{ fontSize: 13.5, color: 'var(--gray-light)', whiteSpace: 'nowrap' }}>
            {filtered.length} entreprise{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
          {chips.map((c) => (
            <button key={c} className={`chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="grid-3">
          {filtered.map((m) => (
            <div key={m.id} className="card" style={{ padding: 26, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div className={m.logo_path ? '' : 'placeholder-pattern'} style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 9, color: '#a8a099', overflow: 'hidden', background: m.logo_path ? '#fff' : undefined }}>
                  {m.logo_path ? <img src={m.logo_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'logo'}
                </div>
                <div>
                  <div className="serif" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.15 }}>{m.nom}</div>
                  <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--red)', fontWeight: 600, marginTop: 5 }}>{m.secteur}</div>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span className="badge-cat">{m.categorie || 'Non classée'}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gray)', flex: 1, marginBottom: 20 }}>{m.presentation}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, borderTop: '1px solid var(--border-soft)' }}>
                <span style={{ fontSize: 13, color: 'var(--gray-light)' }}>{m.dirigeant}</span>
                <button className="btn-link" onClick={() => setDetail(m)}>Voir la fiche →</button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--gray-light)' }}>
            <div className="serif" style={{ fontSize: 26, color: 'var(--ink)', marginBottom: 10 }}>Aucune entreprise trouvée</div>
            <p style={{ fontSize: 15, marginBottom: 24 }}>Essayez d'autres mots-clés ou réinitialisez les filtres.</p>
            <button className="btn btn-dark btn-sm" style={{ fontSize: 14, padding: '12px 24px' }} onClick={() => { setSearch(''); setCategory('Toutes'); }}>
              Réinitialiser
            </button>
          </div>
        )}
      </section>

      <MemberModal member={detail} onClose={() => setDetail(null)} />
    </main>
  );
}
