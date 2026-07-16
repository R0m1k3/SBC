import { Link, NavLink } from 'react-router-dom';
import { usePublicData } from '../lib/usePublic.js';
import { associationSettings } from '../lib/siteSettings.js';

const navLinkClass = ({ isActive }) => `nav-btn${isActive ? ' active' : ''}`;

export default function Header() {
  const { data } = usePublicData();
  const settings = associationSettings(data?.content);
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250,248,245,.86)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="container"
        style={{ minHeight: 76, paddingTop: 12, paddingBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
          <img src="/assets/logo.jpg" alt={settings.association_name} style={{ height: 50, width: 'auto', display: 'block' }} />
          <span className="serif" style={{ maxWidth: 220, fontSize: 18, fontWeight: 600, lineHeight: 1.12, color: 'var(--ink)' }}>
            {settings.association_name}
          </span>
        </Link>
        <nav className="site-nav" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <NavLink to="/" end className={navLinkClass}>Accueil</NavLink>
          <NavLink to="/annuaire" className={navLinkClass}>Annuaire</NavLink>
          <NavLink to="/rencontres-passees" className={navLinkClass}>Rencontres passées</NavLink>
          <NavLink to="/association" className={navLinkClass}>L'association</NavLink>
          <NavLink to="/espace-membre" className={navLinkClass}>Espace membre</NavLink>
          <Link to="/?adhesion=1" style={{ marginLeft: 10, textDecoration: 'none' }}>
            <button className="btn btn-red" style={{ padding: '12px 22px', fontSize: 14 }}>Devenir membre</button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
