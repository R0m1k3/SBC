import { z } from 'zod';

const trimmed = (max, min = 0) => z.string().trim().min(min).max(max);

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
});

export const inscriptionPublicSchema = z.object({
  nom: trimmed(120, 1),
  entreprise: trimmed(120, 1),
  email: trimmed(254, 3).email(),
  tel: trimmed(30).optional().default(''),
});

export const memberProfileSchema = z.object({
  nom: trimmed(120, 1),
  secteur: trimmed(120, 1),
  categorie_id: z.coerce.number().int().positive().nullable().optional(),
  dirigeant: trimmed(120, 1),
  email: trimmed(254).email().or(z.literal('')).optional().default(''),
  tel: trimmed(30).optional().default(''),
  site: trimmed(200).optional().default(''),
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
  participants: z.coerce.number().int().min(0).max(100000),
  nb_photos: z.coerce.number().int().min(0).max(100000),
});

export const pastEventImageParam = z.object({
  id: z.coerce.number().int().positive(),
  slot: z.coerce.number().int().min(1).max(3),
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
});
