import { Link } from 'react-router-dom';
import { usePublicData } from '../lib/usePublic.js';
import { associationSettings } from '../lib/siteSettings.js';

// Shared bits for the two legal pages. Values come from the association
// parameters maintained in the admin backend (Paramètres) ; an empty
// value renders a visible "à compléter" marker so a missing legal mention
// never fails silently.
export function LegalValue({ value, label, multiline = false }) {
  if (value) {
    return multiline ? <span style={{ whiteSpace: 'pre-line' }}>{value}</span> : <>{value}</>;
  }
  return (
    <span style={{ background: '#FBEFD9', color: '#8A5A22', padding: '1px 8px', borderRadius: 3, fontSize: '.88em', fontWeight: 600 }}>
      à compléter — {label}
    </span>
  );
}

export function LegalLayout({ kicker, title, updated, children }) {
  return (
    <main>
      <section style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 880, padding: '64px 32px 46px' }}>
          <div className="kicker" style={{ marginBottom: 14 }}>{kicker}</div>
          <h1 className="serif" style={{ fontWeight: 500, fontSize: 'clamp(32px, 4.5vw, 46px)', lineHeight: 1.08 }}>{title}</h1>
          {updated && (
            <div style={{ fontSize: 13, color: 'var(--gray-light)', marginTop: 14 }}>Dernière mise à jour : {updated}</div>
          )}
        </div>
      </section>
      <section style={{ background: 'var(--bg)', padding: '52px 0 96px' }}>
        <div className="container" style={{ maxWidth: 880 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>{children}</div>
        </div>
      </section>
    </main>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 14 }}>{title}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--gray)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

export default function MentionsLegales() {
  const { data } = usePublicData();
  const s = associationSettings(data?.content);

  return (
    <LegalLayout kicker="Informations légales" title="Mentions légales" updated={s.legal_updated}>
      <LegalSection title="Éditeur du site">
        <p>
          Le présent site est édité par <strong><LegalValue value={s.association_name} label="nom de l'association" /></strong>,
          association régie par la loi du 1<sup>er</sup> juillet 1901 et le décret du 16 août 1901.
        </p>
        <p>
          Siège social : <LegalValue value={s.association_address} label="adresse du siège" multiline />
          <br />
          Numéro RNA : <LegalValue value={s.association_rna} label="numéro RNA" />
          {s.association_siret && (<><br />SIRET : {s.association_siret}</>)}
          <br />
          Email : <LegalValue value={s.association_email} label="email de contact" />
          <br />
          Téléphone : <LegalValue value={s.association_phone} label="téléphone" />
        </p>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>
          Le directeur de la publication est <LegalValue value={s.association_president} label="nom du président" />,
          en qualité de président·e de l'association.
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Le site est hébergé par <LegalValue value={s.association_host_name} label="nom de l'hébergeur" />
          <br />
          Adresse : <LegalValue value={s.association_host_address} label="adresse de l'hébergeur" />
          <br />
          Téléphone : <LegalValue value={s.association_host_tel} label="téléphone de l'hébergeur" />
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L'ensemble des contenus du site (textes, photographies, logos, identité visuelle) est la
          propriété de l'association ou de ses partenaires, et est protégé par le droit de la propriété
          intellectuelle. Toute reproduction, représentation ou diffusion, totale ou partielle, sans
          autorisation écrite préalable est interdite. Les logos et marques des entreprises membres
          demeurent la propriété de leurs titulaires respectifs.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Le traitement des données personnelles collectées sur ce site est décrit dans la{' '}
          <Link to="/confidentialite" className="btn-link" style={{ fontSize: 'inherit' }}>politique de confidentialité</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Le présent site est soumis au droit français. En cas de litige et à défaut de résolution
          amiable, les tribunaux français seront seuls compétents.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
