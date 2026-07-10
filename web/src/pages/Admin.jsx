import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { api, dateParts, statutLabel } from '../lib/api.js';
import { LoginSection } from './Espace.jsx';
import { MembersTab, RencontresTab, InscriptionsTab } from '../components/admin/AdminTabs.jsx';
import { CategoriesTab, ContenuTab } from '../components/admin/AdminContent.jsx';

const TABS = [
  { key: 'dashboard', icon: '◧', label: 'Tableau de bord', title: 'Tableau de bord' },
  { key: 'membres', icon: '▤', label: 'Membres', title: 'Gestion des membres' },
  { key: 'rencontres', icon: '◈', label: 'Rencontres', title: 'Rencontres' },
  { key: 'inscriptions', icon: '✎', label: 'Inscriptions', title: 'Inscriptions' },
  { key: 'categories', icon: '☲', label: 'Catégories', title: 'Catégories' },
  { key: 'contenu', icon: '▧', label: 'Contenu du site', title: 'Contenu du site' },
];

function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/api/admin/dashboard').then(setData).catch(() => {});
  }, []);
  if (!data) return <p style={{ color: 'var(--gray-light)' }}>Chargement…</p>;

  const k = data.kpis;
  const daysToNext = k.prochaine_date
    ? Math.max(0, Math.round((new Date(k.prochaine_date) - Date.now()) / 86400000))
    : null;
  const kpis = [
    { n: k.membres_valides, l: 'Membres validés', d: 'saison en cours' },
    { n: k.a_renouveler, l: 'À renouveler', d: 'non validés' },
    { n: k.rencontres_a_venir, l: 'Rencontres à venir', d: daysToNext != null ? `prochaine dans ${daysToNext} j` : '—' },
    { n: k.inscriptions_attente, l: 'Inscriptions en attente', d: 'à valider' },
  ];

  return (
    <>
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {kpis.map((x) => (
          <div key={x.l} className="card" style={{ borderRadius: 6, padding: 24 }}>
            <div style={{ fontSize: 12.5, color: 'var(--gray-light)', marginBottom: 12 }}>{x.l}</div>
            <div className="serif" style={{ fontSize: 38, fontWeight: 600, lineHeight: 1 }}>{x.n}</div>
            <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, marginTop: 10 }}>{x.d}</div>
          </div>
        ))}
      </div>
      <div className="grid-2" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div className="card" style={{ borderRadius: 6, padding: 26 }}>
          <h3 className="serif" style={{ fontSize: 19, fontWeight: 600, marginBottom: 18 }}>Dernières inscriptions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {data.latestInscriptions.map((i) => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{i.nom}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--gray-light)' }}>{i.entreprise} · {i.rencontre}</div>
                </div>
                <span className={`badge ${i.statut === 'confirmee' ? 'badge-green' : 'badge-amber'}`}>{statutLabel(i.statut)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ borderRadius: 6, padding: 26 }}>
          <h3 className="serif" style={{ fontSize: 19, fontWeight: 600, marginBottom: 18 }}>Prochaines rencontres</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.upcoming.map((e) => {
              const { jour, mois } = dateParts(e.date_renc);
              return (
                <div key={e.id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 46, flexShrink: 0, textAlign: 'center', background: 'var(--admin-bg)', borderRadius: 4, padding: '8px 0', lineHeight: 1 }}>
                    <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{jour}</div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--gray-light)', letterSpacing: '.1em' }}>{mois}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{e.titre}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-light)', marginTop: 3 }}>
                      {Math.max(0, e.places - e.inscrits)} places restantes
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');

  if (loading) return <main style={{ minHeight: '60vh' }} />;
  if (!user || user.role !== 'admin') {
    return (
      <main>
        <LoginSection kicker="Espace admin" title="Administration du Business Club" />
      </main>
    );
  }

  const current = TABS.find((t) => t.key === tab);
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--admin-bg)' }}>
      <aside style={{ width: 250, flexShrink: 0, background: 'var(--dark)', color: '#fff', display: 'flex', flexDirection: 'column', padding: '26px 0', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '0 24px 26px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/assets/logo.jpg" alt="SLUC" style={{ height: 40, width: 40, objectFit: 'cover', borderRadius: 4, background: '#fff' }} />
          <div style={{ lineHeight: 1.1 }}>
            <div className="serif" style={{ fontSize: 16, fontWeight: 600 }}>Admin</div>
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#8A8279' }}>Business Club</div>
          </div>
        </div>
        <nav style={{ padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {TABS.map((t) => (
            <button key={t.key} className={`admin-nav-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '14px 24px 0', borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link to="/" style={{ color: '#B7AFA6', fontSize: 13.5, fontWeight: 500, padding: '6px 0', textDecoration: 'none' }}>← Retour au site</Link>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#B7AFA6', fontSize: 13.5, fontWeight: 500, padding: '6px 0', textAlign: 'left' }}>
            Se déconnecter
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="serif" style={{ fontSize: 24, fontWeight: 600 }}>{current.title}</h1>
            <div style={{ fontSize: 13, color: 'var(--gray-light)', marginTop: 2, textTransform: 'capitalize' }}>{today}</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FBEDEC', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
            {(user.email || 'AD').slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div style={{ padding: '36px 40px' }}>
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'membres' && <MembersTab />}
          {tab === 'rencontres' && <RencontresTab />}
          {tab === 'inscriptions' && <InscriptionsTab />}
          {tab === 'categories' && <CategoriesTab />}
          {tab === 'contenu' && <ContenuTab />}
        </div>
      </div>
    </div>
  );
}
