import { Link, NavLink } from 'react-router-dom';

const navLinkClass = ({ isActive }) => `nav-btn${isActive ? ' active' : ''}`;

export default function Header() {
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
          <img src="/assets/logo.jpg" alt="SLUC Business Club Nancy" style={{ height: 50, width: 'auto', display: 'block' }} />
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.05 }}>
            <span className="serif" style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)' }}>Business Club</span>
            <span style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--red-dark)', fontWeight: 600 }}>
              SLUC Nancy
            </span>
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
