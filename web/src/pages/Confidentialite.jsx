import { usePublicData } from '../lib/usePublic.js';
import { associationSettings } from '../lib/siteSettings.js';
import { LegalLayout, LegalSection, LegalValue } from './MentionsLegales.jsx';

// Privacy policy (art. 13 RGPD). The described processing matches exactly
// what this application actually does — update this page if a new
// collection or a third-party service (analytics, newsletter…) is added.
export default function Confidentialite() {
  const { data } = usePublicData();
  const s = associationSettings(data?.content);
  const email = s.association_email;

  const row = { display: 'grid', gridTemplateColumns: '190px 1fr', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 14.5, lineHeight: 1.6 };
  const cellTitle = { fontWeight: 600, color: 'var(--ink)' };

  return (
    <LegalLayout kicker="Informations légales" title="Politique de confidentialité" updated={s.legal_updated}>
      <LegalSection title="Responsable de traitement">
        <p>
          Le responsable du traitement des données personnelles collectées sur ce site est{' '}
          <strong><LegalValue value={s.association_name} label="nom de l'association" /></strong>, association loi 1901,{' '}
          <LegalValue value={s.association_address} label="adresse du siège" multiline />.
          <br />
          Contact : <LegalValue value={email} label="email de contact" />
          {s.association_phone && <> · {s.association_phone}</>}
        </p>
      </LegalSection>

      <LegalSection title="Données collectées et finalités">
        <p>Nous ne collectons que les données strictement nécessaires au fonctionnement du club :</p>
        <div className="card" style={{ borderRadius: 6, padding: '6px 22px', marginTop: 4 }}>
          <div style={row}>
            <span style={cellTitle}>Demande d'adhésion</span>
            <span>
              Nom et prénom, fonction, entreprise, email professionnel, téléphone.
              <br /><em>Finalité :</em> instruire votre demande et vous recontacter. <em>Base légale :</em> mesures précontractuelles à votre demande.
            </span>
          </div>
          <div style={row}>
            <span style={cellTitle}>Inscription à une rencontre</span>
            <span>
              Noms et prénoms des participants, rattachés au compte membre qui les inscrit.
              <br /><em>Finalité :</em> gérer les inscriptions et l'accueil des participants. <em>Base légale :</em> exécution de l'adhésion.
            </span>
          </div>
          <div style={row}>
            <span style={cellTitle}>Annuaire des membres</span>
            <span>
              Fiche entreprise : nom, secteur, dirigeant·e, coordonnées professionnelles, présentation, logo, photo du dirigeant·e.
              <br /><em>Finalité :</em> annuaire public des entreprises membres. <em>Base légale :</em> exécution de l'adhésion ; la photo est publiée avec le consentement de la personne, qui peut la retirer à tout moment depuis son espace membre.
            </span>
          </div>
          <div style={{ ...row, borderBottom: 'none' }}>
            <span style={cellTitle}>Espace membre</span>
            <span>
              Email de connexion et mot de passe (stocké haché, jamais en clair).
              <br /><em>Finalité :</em> accès sécurisé à votre espace. <em>Base légale :</em> exécution de l'adhésion.
            </span>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--gray-light)' }}>
          Aucune donnée n'est utilisée à des fins publicitaires, ni cédée ou vendue à des tiers.
          Le site n'utilise aucun outil de mesure d'audience ni traceur tiers.
        </p>
      </LegalSection>

      <LegalSection title="Durées de conservation">
        <p>
          Les données des membres sont conservées pendant la durée de l'adhésion, puis au maximum
          3 ans après son terme (animation du réseau et relance d'adhésion), avant suppression.
          Les demandes d'adhésion non abouties sont supprimées au plus tard 3 ans après leur dépôt.
          Les inscriptions aux rencontres sont conservées le temps de la saison en cours puis archivées
          à des fins de statistiques de fréquentation (nombre de participants uniquement).
          Les comptes de connexion sont supprimés avec la fiche du membre.
        </p>
      </LegalSection>

      <LegalSection title="Destinataires et hébergement">
        <p>
          Les données sont accessibles aux seuls administrateurs et modérateurs habilités de
          l'association, soumis à une obligation de confidentialité. Les fiches de l'annuaire et les
          photographies des rencontres sont, elles, publiées sur le site public.
        </p>
        <p>
          Les données sont hébergées par <LegalValue value={s.association_host_name} label="nom de l'hébergeur" />,{' '}
          <LegalValue value={s.association_host_address} label="adresse de l'hébergeur" />. Aucun transfert de
          données hors de l'Union européenne n'est réalisé.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Le site dépose un unique cookie de session, strictement nécessaire à l'authentification à
          l'espace membre et à l'administration (cookie technique httpOnly, supprimé à l'expiration de la
          session). Conformément aux lignes directrices de la CNIL, ce cookie est exempté de consentement.
          Aucun cookie publicitaire, de mesure d'audience ou de réseau social n'est utilisé — c'est
          pourquoi ce site n'affiche pas de bandeau cookies.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          L'association met en œuvre des mesures techniques et organisationnelles adaptées : mots de
          passe stockés sous forme hachée, connexions chiffrées, accès à l'administration restreint et
          protégé, validation des fichiers déposés. En cas de violation de données susceptible
          d'engendrer un risque pour vos droits, vous en serez informé·e conformément à la réglementation.
        </p>
      </LegalSection>

      <LegalSection title="Droit à l'image">
        <p>
          Des photographies sont prises lors des rencontres du club et peuvent être publiées sur ce site
          (section « Rencontres passées »). Elles ne sont publiées qu'avec l'accord des personnes
          identifiables. Si vous apparaissez sur une photographie et souhaitez son retrait, écrivez à{' '}
          <LegalValue value={email} label="email de contact" /> : elle sera retirée dans les meilleurs délais.
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Conformément au Règlement général sur la protection des données (RGPD) et à la loi
          Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, d'effacement,
          de limitation, d'opposition et de portabilité sur vos données.
        </p>
        <p>
          Pour exercer ces droits, contactez-nous à <LegalValue value={email} label="email de contact" />.
          Une réponse vous sera apportée dans un délai d'un mois. Si vous estimez, après nous avoir
          contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la
          CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="btn-link" style={{ fontSize: 'inherit' }}>www.cnil.fr</a> —
          3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07).
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
