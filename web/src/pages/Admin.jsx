import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Mail,
  PanelsTopLeft,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Tags,
  UserCog,
  UserRoundPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext.jsx';
import { api, dateParts, statutLabel } from '../lib/api.js';
import { MembersTab, RencontresTab, InscriptionsTab } from '../components/admin/AdminTabs.jsx';
import { CategoriesTab, ContenuTab, ParametresTab } from '../components/admin/AdminContent.jsx';
import { PastEventsTab } from '../components/admin/AdminPast.jsx';
import { UsersTab } from '../components/admin/AdminUsers.jsx';
import { EmailCreatorTab } from '../components/admin/AdminEmail.jsx';
import { RequestsTab } from '../components/admin/AdminRequests.jsx';
import { BillingTab } from '../components/admin/AdminBilling.jsx';
import { RgpdTab } from '../components/admin/AdminRgpd.jsx';

// Staff members share the operational sections. Administrators also manage
// content and settings, while treasurers additionally access billing. The
// same permissions are enforced here and by the server routes.
const TABS = [
  { key: 'dashboard', group: 'overview', icon: LayoutDashboard, label: 'Tableau de bord', title: 'Tableau de bord', roles: ['admin'] },
  { key: 'demandes', group: 'members', icon: UserRoundPlus, label: 'Demandes', title: "Demandes d’adhésion", roles: ['admin', 'moderator', 'treasurer'] },
  { key: 'membres', group: 'members', icon: Users, label: 'Membres', title: 'Gestion des membres', roles: ['admin', 'moderator', 'treasurer'] },
  { key: 'facturation', group: 'members', icon: ReceiptText, label: 'Facturation', title: 'Facturation des adhésions', roles: ['admin', 'treasurer'] },
  { key: 'rencontres', group: 'events', icon: CalendarDays, label: 'Rencontres', title: 'Rencontres', roles: ['admin', 'moderator', 'treasurer'] },
  { key: 'inscriptions', group: 'events', icon: ClipboardList, label: 'Inscriptions', title: 'Inscriptions', roles: ['admin', 'moderator', 'treasurer'] },
  { key: 'passees', group: 'events', icon: CalendarCheck2, label: 'Rencontres passées', title: 'Rencontres passées', roles: ['admin', 'moderator', 'treasurer'] },
  { key: 'emails', group: 'communication', icon: Mail, label: "Créateur d'e-mail", title: "Créateur d'e-mail", roles: ['admin'] },
  { key: 'contenu', group: 'communication', icon: PanelsTopLeft, label: 'Contenu du site', title: 'Contenu du site', roles: ['admin'] },
  { key: 'categories', group: 'communication', icon: Tags, label: 'Catégories', title: 'Catégories', roles: ['admin'] },
  { key: 'parametres', group: 'settings', icon: Settings2, label: 'Association', title: "Paramètres de l'association", roles: ['admin'] },
  { key: 'utilisateurs', group: 'settings', icon: UserCog, label: 'Utilisateurs', title: 'Administrateurs, trésoriers & modérateurs', roles: ['admin'] },
  { key: 'rgpd', group: 'settings', icon: ShieldCheck, label: 'RGPD', title: 'Conformité RGPD', roles: ['admin'] },
];

const NAV_GROUPS = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'members', label: 'Adhérents' },
  { key: 'events', label: 'Rencontres' },
  { key: 'communication', label: 'Communication' },
  { key: 'settings', label: 'Configuration' },
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

// Rendered inside /espace-membre once a logged-in user is confirmed as
// admin or moderator (see Espace.jsx). Assumes an authenticated staff
// user — no auth gate here, the caller already checked it.
export function AdminShell() {
  const { user, logout } = useAuth();
  const tabs = TABS.filter((t) => t.roles.includes(user.role));
  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    tabs: tabs.filter((item) => item.group === group.key),
  })).filter((group) => group.tabs.length > 0);
  const [tab, setTab] = useState(tabs[0].key);

  const current = tabs.find((t) => t.key === tab) || tabs[0];
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const roleLabel = { admin: 'Admin', moderator: 'Modérateur', treasurer: 'Trésorier' }[user.role];

  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--admin-bg)' }}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img src="/assets/logo.jpg" alt="SLUC" className="admin-sidebar-logo" />
          <div className="admin-sidebar-brand">
            <div className="serif">Administration</div>
            <span>{roleLabel}</span>
          </div>
        </div>
        <nav className="admin-nav" aria-label="Navigation de l'administration">
          {navGroups.map((group) => (
            <div className="admin-nav-group" key={group.key}>
              <div className="admin-nav-group-label">{group.label}</div>
              <div className="admin-nav-group-items">
                {group.tabs.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      className={`admin-nav-btn${tab === item.key ? ' active' : ''}`}
                      onClick={() => setTab(item.key)}
                      aria-current={tab === item.key ? 'page' : undefined}
                    >
                      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-action">
            <ArrowLeft size={17} aria-hidden="true" />
            <span>Retour au site</span>
          </Link>
          <button onClick={logout} className="admin-sidebar-action">
            <LogOut size={17} aria-hidden="true" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="admin-content-header" style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="serif" style={{ fontSize: 24, fontWeight: 600 }}>{current.title}</h1>
            <div style={{ fontSize: 13, color: 'var(--gray-light)', marginTop: 2, textTransform: 'capitalize' }}>{today}</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FBEDEC', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {(user.email || 'AD').slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="admin-content-body" style={{ padding: '36px 40px' }}>
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'membres' && <MembersTab />}
          {tab === 'demandes' && <RequestsTab />}
          {tab === 'rencontres' && <RencontresTab />}
          {tab === 'passees' && <PastEventsTab />}
          {tab === 'inscriptions' && <InscriptionsTab />}
          {tab === 'facturation' && <BillingTab />}
          {tab === 'categories' && <CategoriesTab />}
          {tab === 'contenu' && <ContenuTab />}
          {tab === 'parametres' && <ParametresTab />}
          {tab === 'rgpd' && <RgpdTab />}
          {tab === 'emails' && <EmailCreatorTab />}
          {tab === 'utilisateurs' && <UsersTab />}
        </div>
      </div>
    </div>
  );
}

// Legacy /admin bookmarks: everyone now logs in from a single entry point.
export default function Admin() {
  return <Navigate to="/espace-membre" replace />;
}
