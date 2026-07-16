// GDPR compliance documents generated on demand from the admin backend:
//  - the record of processing activities (registre des traitements, art. 30
//    RGPD) — an internal document every association must keep;
//  - the image-rights authorization form (autorisation de droit à l'image),
//    an adult and a minor variant, to collect at events before publishing
//    photographs.
// Both are print-ready A4 HTML documents styled after the site theme, and
// prefilled with the association parameters maintained in Paramètres.
import { associationSettings } from './siteSettings.js';

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escML(v) {
  return esc(v).replace(/\r?\n/g, '<br>');
}

const todayFr = () =>
  new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// Shared A4 print skeleton. `body` is trusted HTML built below.
function page({ title, body }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root { --red:#C1272D; --ink:#1B1B1B; --gray:#5A544E; --light:#F4F1EC; --border:#E7E2DB; }
  * { box-sizing: border-box; }
  body { margin:0; background:#f0eee9; color:var(--ink); font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.55; }
  .sheet { background:#fff; max-width:820px; margin:24px auto; padding:44px 48px 56px; box-shadow:0 6px 30px -12px rgba(0,0,0,.3); }
  h1 { font-family:Georgia,'Times New Roman',serif; font-size:26px; margin:0 0 4px; }
  h2 { font-size:15px; margin:26px 0 10px; padding-bottom:6px; border-bottom:2px solid var(--red); color:var(--red); text-transform:uppercase; letter-spacing:.04em; }
  .kicker { font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--red); font-weight:bold; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; border-bottom:3px solid var(--ink); padding-bottom:16px; margin-bottom:8px; }
  .head .org { font-family:Georgia,serif; font-size:18px; font-weight:bold; }
  .muted { color:var(--gray); }
  .small { font-size:11.5px; }
  table { width:100%; border-collapse:collapse; margin:8px 0 4px; }
  .reg th, .reg td { text-align:left; vertical-align:top; padding:9px 10px; border:1px solid var(--border); font-size:12px; }
  .reg th { background:var(--light); width:210px; font-weight:bold; color:var(--ink); }
  .proc { border:1px solid var(--border); border-left:3px solid var(--red); border-radius:4px; margin:0 0 16px; page-break-inside:avoid; }
  .proc > .t { background:var(--light); padding:10px 14px; font-weight:bold; font-size:13.5px; }
  .field-line { border-bottom:1px solid #9A938B; min-height:20px; display:inline-block; }
  .box { display:inline-block; width:15px; height:15px; border:1.5px solid var(--ink); vertical-align:-3px; margin-right:7px; }
  .sign { margin-top:14px; display:flex; gap:40px; }
  .sign > div { flex:1; }
  .note { background:var(--light); border-radius:4px; padding:14px 16px; font-size:11.5px; color:var(--gray); margin-top:18px; }
  ul { margin:6px 0; padding-left:20px; }
  li { margin:3px 0; }
  @media print {
    body { background:#fff; }
    .sheet { box-shadow:none; margin:0; max-width:none; padding:0 6mm; }
    @page { margin:14mm; }
  }
</style>
</head>
<body><div class="sheet">${body}</div></body>
</html>`;
}

function orgBlock(s) {
  const lines = [
    s.association_address && escML(s.association_address),
    s.association_rna && `RNA : ${esc(s.association_rna)}`,
    s.association_siret && `SIRET : ${esc(s.association_siret)}`,
    s.association_email && esc(s.association_email),
    s.association_phone && esc(s.association_phone),
  ].filter(Boolean);
  return `<div class="org">${esc(s.association_name)}</div>
    <div class="small muted" style="margin-top:4px;">${lines.join('<br>')}</div>`;
}

const missing = (label) =>
  `<span style="background:#FBEFD9;color:#8A5A22;padding:0 6px;border-radius:3px;font-weight:bold;">à compléter — ${label}</span>`;
const val = (v, label) => (v ? esc(v) : missing(label));

export function buildProcessingRegister({ association = {} } = {}) {
  const s = associationSettings(association);
  const title = `Registre des traitements — ${s.association_name}`;

  // Each entry mirrors an actual processing activity of the application.
  const processings = [
    {
      t: '1. Gestion des adhésions et des membres',
      finalite: "Instruire les demandes d'adhésion et gérer les entreprises membres du club.",
      base: "Exécution du contrat d'adhésion et mesures précontractuelles (demandes).",
      personnes: 'Dirigeants et représentants des entreprises membres et candidates.',
      donnees: "Identité (nom, prénom, fonction), entreprise et secteur, coordonnées professionnelles (email, téléphone, adresse).",
      destinataires: 'Administrateurs, modérateurs et trésoriers habilités de l’association.',
      duree: "Durée de l'adhésion, puis 3 ans maximum après son terme (relance) avant suppression. Demandes non abouties : 3 ans maximum.",
    },
    {
      t: '2. Annuaire public des membres',
      finalite: "Publier sur le site public l'annuaire des entreprises membres à jour de leur adhésion.",
      base: "Exécution de l'adhésion ; la photographie du dirigeant est publiée sur la base du consentement.",
      personnes: 'Dirigeants des entreprises membres validées.',
      donnees: 'Entreprise, secteur, dirigeant, coordonnées professionnelles, présentation, logo, photographie.',
      destinataires: 'Public (site internet).',
      duree: "Durée de l'adhésion ; retrait de la fiche à la fin de l'adhésion ou sur demande.",
    },
    {
      t: '3. Inscriptions aux rencontres',
      finalite: "Gérer les inscriptions aux rencontres et l'accueil des participants.",
      base: "Exécution de l'adhésion.",
      personnes: 'Participants inscrits par les comptes membres.',
      donnees: 'Nom et prénom des participants, rattachement au compte membre inscripteur.',
      destinataires: 'Administrateurs, modérateurs et trésoriers habilités.',
      duree: "Saison en cours, puis archivage à des fins statistiques (nombre de participants uniquement).",
    },
    {
      t: '4. Comptabilité et facturation des adhésions',
      finalite: "Émettre les factures d'adhésion, suivre les paiements et tenir la comptabilité de l'association.",
      base: "Obligation légale (obligations comptables et fiscales) et exécution de l'adhésion.",
      personnes: 'Membres facturés.',
      donnees: "Identité et adresse de facturation, email, montants (HT, TVA, TTC), moyen et date de paiement, numéro de facture.",
      destinataires: "Trésoriers et administrateurs habilités ; expert-comptable et administration fiscale le cas échéant.",
      duree: "10 ans à compter de la clôture de l'exercice (art. L123-22 du code de commerce).",
    },
    {
      t: '5. Espace membre et authentification',
      finalite: "Fournir un accès sécurisé à l'espace personnel et à l'administration.",
      base: "Exécution de l'adhésion et intérêt légitime (sécurité des accès).",
      personnes: 'Membres, administrateurs, modérateurs et trésoriers.',
      donnees: 'Email de connexion, mot de passe (stocké haché, jamais en clair).',
      destinataires: 'Aucun (usage interne).',
      duree: "Supprimé avec le compte de la personne concernée.",
    },
    {
      t: '6. Photographies des événements',
      finalite: "Illustrer la vie du club (rubrique « Rencontres passées » du site).",
      base: 'Consentement (droit à l’image) recueilli avant publication.',
      personnes: 'Participants photographiés lors des rencontres.',
      donnees: 'Image de la personne.',
      destinataires: 'Public (site internet).',
      duree: "Jusqu'au retrait demandé par la personne ou la fin de l'utilisation.",
    },
    {
      t: "7. Communications par e-mail (invitations, actualités)",
      finalite: "Informer les membres des rencontres et de l'actualité du club.",
      base: "Exécution de l'adhésion et intérêt légitime.",
      personnes: 'Membres du club.',
      donnees: 'Nom et adresse e-mail.',
      destinataires: "Aucun ; envoi via l'outil de messagerie de l'association.",
      duree: "Durée de l'adhésion.",
    },
  ];

  const secu = `Accès à l'administration restreint aux personnes habilitées et protégé par mot de passe ; mots de passe stockés hachés (bcrypt) ; cookie de session httpOnly et SameSite ; limitation des tentatives de connexion ; connexions chiffrées (HTTPS/TLS) ; validation des fichiers déposés ; sauvegardes de la base de données.`;

  const procHtml = processings
    .map(
      (p) => `<div class="proc">
      <div class="t">${esc(p.t)}</div>
      <table class="reg">
        <tr><th>Finalité</th><td>${esc(p.finalite)}</td></tr>
        <tr><th>Base légale</th><td>${esc(p.base)}</td></tr>
        <tr><th>Personnes concernées</th><td>${esc(p.personnes)}</td></tr>
        <tr><th>Catégories de données</th><td>${esc(p.donnees)}</td></tr>
        <tr><th>Destinataires</th><td>${esc(p.destinataires)}</td></tr>
        <tr><th>Durée de conservation</th><td>${esc(p.duree)}</td></tr>
      </table>
    </div>`
    )
    .join('');

  const body = `
    <div class="head">
      <div>
        <div class="kicker">Registre des traitements &middot; Article 30 RGPD</div>
        <h1>Registre des activités de traitement</h1>
      </div>
      <div style="text-align:right;">${orgBlock(s)}</div>
    </div>
    <p class="small muted">Document interne établi le ${esc(todayFr())}. À conserver et à tenir à jour ; à présenter à la CNIL sur demande.</p>

    <h2>Responsable de traitement</h2>
    <table class="reg">
      <tr><th>Organisme</th><td>${val(s.association_name, "nom de l'association")}, association loi 1901</td></tr>
      <tr><th>Adresse</th><td>${val(s.association_address, 'adresse du siège')}</td></tr>
      <tr><th>Numéro RNA</th><td>${val(s.association_rna, 'numéro RNA')}</td></tr>
      <tr><th>Représentant légal</th><td>${val(s.association_president, 'président·e')}, président·e</td></tr>
      <tr><th>Contact</th><td>${val(s.association_email, 'email de contact')}${s.association_phone ? ' — ' + esc(s.association_phone) : ''}</td></tr>
    </table>

    <h2>Traitements mis en œuvre</h2>
    ${procHtml}

    <h2>Mesures de sécurité communes</h2>
    <p class="small">${esc(secu)}</p>

    <div class="note">
      Aucune donnée n'est cédée ou vendue à des tiers, ni utilisée à des fins de prospection commerciale.
      Aucun transfert de données hors de l'Union européenne n'est réalisé. Le site n'utilise ni outil de
      mesure d'audience ni traceur publicitaire. Les personnes concernées disposent des droits d'accès,
      de rectification, d'effacement, de limitation, d'opposition et de portabilité, exerçables auprès du
      contact ci-dessus.
    </div>`;

  return { title, html: page({ title, body }) };
}

export function buildImageConsentForm({ association = {}, minor = false } = {}) {
  const s = associationSettings(association);
  const who = minor ? "d'un mineur" : 'majeur';
  const title = `Autorisation de droit à l'image (${minor ? 'mineur' : 'majeur'}) — ${s.association_name}`;

  const line = (label, w = '100%') =>
    `<div style="margin:10px 0;"><span class="small muted">${label}</span><br><span class="field-line" style="width:${w};"></span></div>`;

  const scope = `
    <p style="margin:14px 0 6px;">J'autorise ${esc(s.association_name)} à fixer, reproduire et diffuser mon image
      ${minor ? "(ou celle de l'enfant représenté) " : ''}sur les supports suivants :</p>
    <ul style="list-style:none;padding-left:2px;">
      <li><span class="box"></span> Site internet de l'association</li>
      <li><span class="box"></span> Réseaux sociaux de l'association (Facebook, LinkedIn, Instagram…)</li>
      <li><span class="box"></span> Supports de communication imprimés (plaquettes, presse, affichage)</li>
    </ul>
    <p class="small muted" style="margin-top:4px;">
      Ces images sont réalisées lors des rencontres et manifestations du club. La présente autorisation est
      consentie à titre gratuit, pour une durée de 5 ans à compter de la signature, pour une diffusion en
      France et à l'étranger. Les images ne seront ni cédées à des tiers ni utilisées à des fins commerciales
      ou portant atteinte à la dignité de la personne.
    </p>`;

  const identity = minor
    ? `${line('Je soussigné·e (représentant légal) — nom et prénom')}
       ${line('Agissant en qualité de (père, mère, tuteur·rice)')}
       ${line("Nom et prénom de l'enfant mineur")}
       ${line("Date de naissance de l'enfant", '240px')}
       ${line('Adresse')}`
    : `${line('Je soussigné·e — nom et prénom')}
       ${line('Adresse')}`;

  const body = `
    <div class="head">
      <div>
        <div class="kicker">Protection des données &middot; Droit à l'image</div>
        <h1>Autorisation de droit à l'image${minor ? '<br><span style="font-size:16px;font-weight:normal;" class="muted">— personne mineure</span>' : ''}</h1>
      </div>
      <div style="text-align:right;">${orgBlock(s)}</div>
    </div>

    <h2>Identité</h2>
    ${identity}

    <h2>Autorisation</h2>
    ${scope}

    <div style="margin-top:8px;">
      <p><span class="box"></span> <strong>J'autorise</strong> l'utilisation de ces images dans les conditions ci-dessus.</p>
      <p><span class="box"></span> <strong>Je n'autorise pas</strong> l'utilisation de mon image${minor ? " / de celle de l'enfant" : ''}.</p>
    </div>

    <div class="sign">
      <div>${line('Fait à', '160px')}${line('Le', '160px')}</div>
      <div><div class="small muted" style="margin:10px 0 0;">Signature${minor ? ' du représentant légal' : ''} (précédée de « Lu et approuvé »)</div>
        <div style="border:1px solid var(--border);height:90px;border-radius:4px;margin-top:6px;"></div></div>
    </div>

    <div class="note">
      Les informations recueillies sont traitées par ${esc(s.association_name)}, responsable de traitement,
      aux seules fins de gestion des autorisations de droit à l'image. Base légale : votre consentement.
      Elles sont conservées pendant la durée de l'autorisation puis archivées comme preuve. Vous disposez
      d'un droit d'accès, de rectification, d'effacement et de retrait de votre consentement à tout moment,
      sans que cela ne remette en cause la licéité des diffusions antérieures, en écrivant à
      ${val(s.association_email, 'email de contact')}. Le retrait entraîne le retrait des images concernées
      dans les meilleurs délais. Réclamation possible auprès de la CNIL (www.cnil.fr).
    </div>`;

  return { title, html: page({ title, body }) };
}
