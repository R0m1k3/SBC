export const ASSOCIATION_DEFAULTS = {
  association_name: 'Business Club SLUC Nancy',
  association_address: 'Palais des Sports Jean Weille\nNancy (54)',
  association_email: 'contact@sluc-businessclub.fr',
  association_phone: '+33 3 83 00 00 00',
  association_siret: '',
  association_contact: '',
  association_website: '',
  association_facebook_url: 'https://www.facebook.com/search/top?q=sluc%20business%20club',
  association_linkedin_url: 'https://www.linkedin.com/company/club-affaires-stanislas/posts/?feedView=all',
  association_president: 'Jean-Marc Lefèvre',
  association_vice_president: '',
  association_treasurer: '',
  association_secretary: '',
  association_board_members: '',
  // Legal pages (mentions légales & politique de confidentialité)
  association_rna: '',
  association_host_name: '',
  association_host_address: '',
  association_host_tel: '',
  legal_updated: 'Juillet 2026',
};

export function associationSettings(content = {}) {
  return { ...ASSOCIATION_DEFAULTS, ...content };
}
