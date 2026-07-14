import { Link } from 'react-router-dom';
import { usePublicData } from '../lib/usePublic.js';

const linkStyle = { color: '#B7AFA6', fontSize: 14, textDecoration: 'none' };

export default function Footer() {
  const { data } = usePublicData();
  const memberCount = data?.members?.length ?? 0;

  return (
    <footer style={{ background: 'var(--footer)', color: '#B7AFA6', padding: '64px 0 34px' }}>
      <div className="container grid-4" style={{ gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <img
              src="/assets/logo.jpg"
              alt="SLUC Business Club"
              style={{ height: 48, width: 48, objectFit: 'cover', borderRadius: 4, background: '#fff' }}
            />
            <span className="serif" style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>
              Business Club SLUC Nancy
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.65, maxWidth: 320 }}>
            Le réseau d'affaires des partenaires du SLUC Nancy Basket. Le business se joue en équipe.
          </p>
          <div style={{ marginTop: 16, fontSize: 14 }}>
            <strong style={{ color: '#fff' }}>{memberCount}</strong> entreprises membres
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: '#6E675F', fontWeight: 600, marginBottom: 16 }}>
            Navigation
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
            <Link to="/" style={linkStyle}>Accueil</Link>
            <Link to="/annuaire" style={linkStyle}>Annuaire</Link>
            <Link to="/association" style={linkStyle}>L'association</Link>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: '#6E675F', fontWeight: 600, marginBottom: 16 }}>
            Contact
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, lineHeight: 1.5 }}>
            <span>Palais des Sports J. Weille<br />Nancy (54)</span>
            <span>contact@sluc-businessclub.fr</span>
            <span>+33 3 83 00 00 00</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: '#6E675F', fontWeight: 600, marginBottom: 16 }}>
            Suivez-nous
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
            <a
              href="https://www.facebook.com/search/top?q=sluc%20business%20club"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              Facebook
            </a>
            <a
              href="https://www.linkedin.com/company/club-affaires-stanislas/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
      <div
        className="container"
        style={{
          marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.08)',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          fontSize: 12.5, color: '#6E675F',
        }}
      >
        <span>© {new Date().getFullYear()} Business Club SLUC Nancy</span>
        <span>Mentions légales · Confidentialité</span>
      </div>
    </footer>
  );
}
