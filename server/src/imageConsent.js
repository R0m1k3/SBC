// Canonical version + wording of the image-rights consent captured
// electronically from members. Bump the version whenever the wording
// changes so past signatures stay tied to the exact text they agreed to.
export const IMAGE_CONSENT_VERSION = '2026-07-v1';

export const IMAGE_CONSENT_SCOPES = [
  { key: 'site', label: "Site internet de l'association" },
  { key: 'social', label: 'Réseaux sociaux de l’association' },
  { key: 'print', label: 'Supports de communication imprimés' },
];

// The reference text shown to the member and recorded alongside the
// version. Kept short and clear.
export const IMAGE_CONSENT_TEXT =
  "J'autorise l'association à fixer, reproduire et diffuser mon image (photographies " +
  "prises lors des rencontres et manifestations du club, et photographie de profil de " +
  "l'annuaire) sur les supports que je sélectionne ci-dessous. Cette autorisation est " +
  "consentie à titre gratuit, pour une durée de 5 ans, pour une diffusion en France et à " +
  "l'étranger. Les images ne seront ni cédées à des tiers ni utilisées à des fins " +
  "commerciales. Je peux retirer mon consentement à tout moment depuis mon espace membre, " +
  "ce qui entraînera le retrait des images concernées dans les meilleurs délais.";
