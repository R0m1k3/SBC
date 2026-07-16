import { z } from 'zod';

const trimmed = (max, min = 0) => z.string().trim().min(min).max(max);
const siret = z.string().trim().max(20).refine(
  (value) => !value || /^\d{14}$/.test(value.replace(/\s/g, '')),
  'doit contenir exactement 14 chiffres'
);

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const loginSchema = z.object({
  email: trimmed(254, 3).toLowerCase(),
  password: z.string().min(1).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z
    .string()
    .min(10, 'au moins 10 caractères')
    .max(200)
    .regex(/[a-zA-Z]/, 'doit contenir une lettre')
    .regex(/[0-9]/, 'doit contenir un chiffre'),
});

export const demandeSchema = z.object({
  nom: trimmed(120, 1),
  fonction: trimmed(120).optional().default(''),
  entreprise: trimmed(120, 1),
  email: trimmed(254, 3).email(),
  tel: trimmed(30, 6),
});

export const inscriptionPublicSchema = z.object({
  participants: z.array(trimmed(120, 1)).min(1).max(100),
});

export const memberProfileSchema = z.object({
  nom: trimmed(120, 1),
  secteur: trimmed(120, 1),
  categorie_id: z.coerce.number().int().positive().nullable().optional(),
  dirigeant: trimmed(120, 1),
  email: trimmed(254).email().or(z.literal('')).optional().default(''),
  tel: trimmed(30).optional().default(''),
  site: trimmed(200).optional().default(''),
  adresse: trimmed(300).optional().default(''),
  presentation: trimmed(2000).optional().default(''),
});

export const adminMemberSchema = memberProfileSchema.extend({
  valide: z.boolean().optional(),
});

export const rencontreSchema = z.object({
  titre: trimmed(200, 1),
  date_renc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'format AAAA-MM-JJ'),
  heure: trimmed(20).optional().default(''),
  lieu: trimmed(200).optional().default(''),
  description: trimmed(2000).optional().default(''),
  places: z.coerce.number().int().min(0).max(100000),
  participants_par_compte: z.coerce.number().int().min(1).max(100).optional().default(1),
});

export const inscriptionAdminSchema = z.object({
  nom: trimmed(120, 1),
  entreprise: trimmed(120, 1),
  email: trimmed(254).email().or(z.literal('')).optional().default(''),
  tel: trimmed(30).optional().default(''),
  rencontre_id: z.coerce.number().int().positive(),
  statut: z.enum(['confirmee', 'en_attente']),
});

export const rencontrePasseeSchema = z.object({
  date_label: trimmed(60, 1),
  lieu: trimmed(200, 1),
  titre: trimmed(200, 1),
  texte: trimmed(2000, 1),
  // Manual fallback participant count; ignored when rencontre_id is set.
  participants: z.coerce.number().int().min(0).max(100000).optional().default(0),
  rencontre_id: z.coerce.number().int().positive().nullable().optional(),
});

export const pastPhotoParam = z.object({
  id: z.coerce.number().int().positive(),
  photoId: z.coerce.number().int().positive(),
});

export const categorySchema = z.object({ name: trimmed(80, 1) });

export const staffRoleEnum = z.enum(['admin', 'moderator']);

export const staffUserSchema = z.object({
  fullName: trimmed(120, 1),
  email: trimmed(254, 3).email(),
  role: staffRoleEnum,
});

export const roleChangeSchema = z.object({ role: staffRoleEnum });

export const contentSchema = z.object({
  hero_quote_text: trimmed(300).optional(),
  hero_quote_author: trimmed(120).optional(),
  association_name: trimmed(160, 1).optional(),
  association_address: trimmed(500).optional(),
  association_email: trimmed(254).email().or(z.literal('')).optional(),
  association_phone: trimmed(40).optional(),
  association_siret: siret.optional(),
  association_contact: trimmed(160).optional(),
  association_website: z.string().trim().url().max(300).or(z.literal('')).optional(),
  association_facebook_url: z.string().trim().url().max(500).or(z.literal('')).optional(),
  association_linkedin_url: z.string().trim().url().max(500).or(z.literal('')).optional(),
  association_president: trimmed(160).optional(),
  association_vice_president: trimmed(160).optional(),
  association_treasurer: trimmed(160).optional(),
  association_secretary: trimmed(160).optional(),
  association_board_members: trimmed(3000).optional(),
});

// Invitation email composer: every text zone is optional — absent fields
// fall back to the default wording, an empty string hides the block.
export const emailComposeSchema = z.object({
  base: z.string().trim().url().max(300).optional(),
  greeting: z.string().trim().max(300).optional(),
  intro: z.string().trim().max(2000).optional(),
  outro: z.string().trim().max(2000).optional(),
  signature: z.string().trim().max(500).optional(),
});

export const customEmailSchema = z.object({
  base: z.string().trim().url().max(300).optional(),
  subject: trimmed(200, 1),
  kicker: trimmed(120).optional().default(''),
  title: trimmed(200, 1),
  body: trimmed(6000, 1),
  buttonLabel: trimmed(100).optional().default(''),
  buttonUrl: z.string().trim().url().max(500).or(z.literal('')).optional().default(''),
  signature: trimmed(500).optional().default(''),
}).refine((data) => Boolean(data.buttonLabel) === Boolean(data.buttonUrl), {
  message: 'le texte et le lien du bouton doivent être renseignés ensemble',
  path: ['buttonUrl'],
});
