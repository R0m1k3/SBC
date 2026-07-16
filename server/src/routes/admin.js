import { Router } from 'express';
import { pool, query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  adminMemberSchema,
  rencontreSchema,
  inscriptionAdminSchema,
  categorySchema,
  contentSchema,
  staffUserSchema,
  roleChangeSchema,
  rencontrePasseeSchema,
  pastPhotoParam,
  emailComposeSchema,
  customEmailSchema,
  idParam,
} from '../schemas.js';
import { imageUpload, saveImage, deleteImage } from '../uploads.js';
import { ensureMemberAccess } from '../memberAccess.js';
import { createStaffUser, resetStaffAccess } from '../userAccess.js';
import { AccessError } from '../errors.js';
import { buildInvitationEmail } from '../emailTemplate.js';
import { buildCustomEmail } from '../customEmailTemplate.js';
import { buildProcessingRegister, buildImageConsentForm } from '../complianceDocuments.js';
import { billingRouter } from './billing.js';

export const adminRouter = Router();

// Every route below requires at least an authenticated staff session
// (admin or moderator); individual routes further restrict to admin-only
// where noted.
adminRouter.use(requireAuth(['admin', 'moderator', 'treasurer']));
adminRouter.use('/billing', billingRouter);
const adminOnly = requireAuth('admin');

const MEMBER_SQL = `
  SELECT m.id, m.nom, m.secteur, m.categorie_id, c.name AS categorie, m.dirigeant,
         m.adhesion, m.email, m.tel, m.site, m.adresse, m.presentation, m.valide,
         m.logo_path, m.photo_path,
         (u.id IS NOT NULL) AS has_login,
         COALESCE(u.must_change_password, false) AS must_change_password,
         CASE WHEN u.must_change_password THEN u.temp_password ELSE NULL END AS temp_password,
         ic.decision AS image_consent, ic.created_at AS image_consent_at
    FROM members m
    LEFT JOIN categories c ON c.id = m.categorie_id
    LEFT JOIN users u ON u.member_id = m.id
    LEFT JOIN LATERAL (
      SELECT decision, created_at FROM image_consents
       WHERE member_id = m.id ORDER BY created_at DESC LIMIT 1
    ) ic ON true`;

const RENC_SQL = `
  SELECT r.id, r.titre, r.date_renc, r.heure, r.lieu, r.description, r.places,
         r.participants_par_compte, r.image_path,
         COUNT(i.id)::int AS inscrits
    FROM rencontres r LEFT JOIN inscriptions i ON i.rencontre_id = r.id`;

const INSCR_SQL = `
  SELECT i.id, i.nom, i.entreprise, i.email, i.tel, i.statut, i.created_at,
         i.rencontre_id, i.image_consent, r.titre AS rencontre
    FROM inscriptions i JOIN rencontres r ON r.id = i.rencontre_id`;

async function loadAssociationSettings() {
  const result = await query(`SELECT key, value FROM site_content WHERE key LIKE 'association_%'`);
  return Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
}

// ---------- Dashboard (admin only) ----------
adminRouter.get('/dashboard', adminOnly, async (_req, res, next) => {
  try {
    const [kpis, latest, upcoming] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*)::int FROM members WHERE valide) AS membres_valides,
          (SELECT COUNT(*)::int FROM members WHERE NOT valide) AS a_renouveler,
          (SELECT COUNT(*)::int FROM rencontres WHERE date_renc >= CURRENT_DATE) AS rencontres_a_venir,
          (SELECT COUNT(*)::int FROM inscriptions WHERE statut = 'en_attente') AS inscriptions_attente,
          (SELECT COUNT(*)::int FROM demandes_adhesion WHERE statut = 'nouvelle') AS demandes_nouvelles,
          (SELECT MIN(date_renc) FROM rencontres WHERE date_renc >= CURRENT_DATE) AS prochaine_date
      `),
      query(`${INSCR_SQL} ORDER BY i.created_at DESC, i.id DESC LIMIT 5`),
      query(`${RENC_SQL} WHERE r.date_renc >= CURRENT_DATE GROUP BY r.id ORDER BY r.date_renc LIMIT 5`),
    ]);
    res.json({ kpis: kpis.rows[0], latestInscriptions: latest.rows, upcoming: upcoming.rows });
  } catch (err) {
    next(err);
  }
});

// ---------- Members (admin + moderator) ----------
adminRouter.get('/members', async (_req, res, next) => {
  try {
    const result = await query(`${MEMBER_SQL} ORDER BY m.nom`);
    res.json({ members: result.rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/members', validate(adminMemberSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const result = await query(
      `INSERT INTO members (nom, secteur, categorie_id, dirigeant, adhesion, email, tel, site, adresse, presentation, valide)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [d.nom, d.secteur, d.categorie_id ?? null, d.dirigeant, new Date().getFullYear(),
       d.email || null, d.tel, d.site, d.adresse, d.presentation, d.valide ?? true]
    );
    const id = result.rows[0].id;
    // A login account (with a temporary password) is only created when an
    // email is provided — it's the login identifier.
    let tempPassword = null;
    let accessError = null;
    if (d.email) {
      try {
        tempPassword = await ensureMemberAccess(id, d.email);
      } catch (err) {
        if (!(err instanceof AccessError)) throw err;
        // Member created, but the email already belongs to another login —
        // surface it without failing the whole creation.
        accessError = err.message;
      }
    }
    res.status(201).json({ id, tempPassword, accessError });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/members/:id', validate(idParam, 'params'), validate(adminMemberSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const result = await query(
      `UPDATE members SET nom=$1, secteur=$2, categorie_id=$3, dirigeant=$4, email=$5,
              tel=$6, site=$7, adresse=$8, presentation=$9, valide=COALESCE($10, valide), updated_at=now()
        WHERE id=$11 RETURNING id`,
      [d.nom, d.secteur, d.categorie_id ?? null, d.dirigeant, d.email || null,
       d.tel, d.site, d.adresse, d.presentation, d.valide ?? null, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Membre introuvable' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Suspending/validating a member's membership is a moderation decision
// reserved to admins — moderators can create and edit members but not
// block them.
adminRouter.post('/members/:id/toggle-valide', adminOnly, validate(idParam, 'params'), async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE members SET valide = NOT valide, updated_at = now() WHERE id = $1 RETURNING valide',
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Membre introuvable' });
    res.json({ valide: result.rows[0].valide });
  } catch (err) {
    next(err);
  }
});

// Creates the member's login if it doesn't have one yet, or resets its
// password (e.g. the member lost it) — either way returns a fresh
// temporary password that must be changed at next login.
adminRouter.post('/members/:id/reset-access', validate(idParam, 'params'), async (req, res, next) => {
  try {
    const member = await query('SELECT email FROM members WHERE id = $1', [req.params.id]);
    if (member.rowCount === 0) return res.status(404).json({ error: 'Membre introuvable' });
    const tempPassword = await ensureMemberAccess(req.params.id, member.rows[0].email);
    res.json({ tempPassword });
  } catch (err) {
    if (err instanceof AccessError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// The full signed image-rights consent record (latest), including the
// drawn signature — the association's proof of consent.
adminRouter.get('/members/:id/image-consent', validate(idParam, 'params'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT decision, scopes, signatory_name, signature_png, consent_version, ip, created_at
         FROM image_consents WHERE member_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    res.json({ consent: result.rows[0] || null });
  } catch (err) {
    next(err);
  }
});

// ---------- Rencontres (admin + moderator) ----------
adminRouter.get('/rencontres', async (_req, res, next) => {
  try {
    const result = await query(`${RENC_SQL} GROUP BY r.id ORDER BY r.date_renc`);
    res.json({ rencontres: result.rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/rencontres', validate(rencontreSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const result = await query(
      `INSERT INTO rencontres (titre, date_renc, heure, lieu, description, places, participants_par_compte)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [d.titre, d.date_renc, d.heure, d.lieu, d.description, d.places, d.participants_par_compte]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/rencontres/:id', validate(idParam, 'params'), validate(rencontreSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const result = await query(
      `UPDATE rencontres SET titre=$1, date_renc=$2, heure=$3, lieu=$4, description=$5,
              places=$6, participants_par_compte=$7
        WHERE id=$8 RETURNING id`,
      [d.titre, d.date_renc, d.heure, d.lieu, d.description, d.places,
       d.participants_par_compte, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rencontre introuvable' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Deleting is admin-only — moderators manage rencontres but can't destroy data.
adminRouter.delete('/rencontres/:id', adminOnly, validate(idParam, 'params'), async (req, res, next) => {
  try {
    const result = await query('DELETE FROM rencontres WHERE id = $1 RETURNING image_path', [req.params.id]);
    if (result.rowCount > 0) await deleteImage(result.rows[0].image_path);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Photo shown on the "Prochaines rencontres" cards on the home page.
adminRouter.post('/rencontres/:id/image', validate(idParam, 'params'), (req, res, next) => {
  imageUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'Fichier invalide (2 Mo max).' });
    try {
      if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });
      const existing = await query('SELECT image_path FROM rencontres WHERE id = $1', [req.params.id]);
      if (existing.rowCount === 0) return res.status(404).json({ error: 'Rencontre introuvable' });
      const publicPath = await saveImage(req.file.buffer);
      if (!publicPath) return res.status(400).json({ error: 'Format accepté : JPEG, PNG ou WebP.' });
      await query('UPDATE rencontres SET image_path = $1 WHERE id = $2', [publicPath, req.params.id]);
      await deleteImage(existing.rows[0].image_path);
      res.json({ path: publicPath });
    } catch (e) {
      next(e);
    }
  });
});

// Ready-to-send HTML invitation email for a rencontre (admin + moderator).
// The registration link opens the public site with the inscription modal
// pre-opened (/?inscription=<id>). The body carries the editable text
// zones (greeting/intro/outro/signature — omitted = default wording,
// empty = block hidden) plus `base`: URLs must be absolute for email
// clients, and the frontend's window.location.origin is exactly the
// public address the admin is browsing — reliable even behind a
// TLS-terminating reverse proxy where req.protocol would say "http".
// The request's host is only a fallback.
adminRouter.post('/rencontres/:id/email', validate(idParam, 'params'), validate(emailComposeSchema), async (req, res, next) => {
  try {
    const result = await query(`${RENC_SQL} WHERE r.id = $1 GROUP BY r.id`, [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rencontre introuvable' });
    const { base, ...texts } = req.data;
    let baseUrl = `${req.protocol}://${req.get('host')}`;
    if (base) {
      try {
        const u = new URL(base);
        if (u.protocol === 'http:' || u.protocol === 'https:') baseUrl = u.origin;
      } catch {
        // invalid base — keep the fallback
      }
    }
    const association = await loadAssociationSettings();
    res.json(buildInvitationEmail({ rencontre: result.rows[0], baseUrl, texts, association }));
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/rencontres/:id/inscriptions', validate(idParam, 'params'), async (req, res, next) => {
  try {
    const result = await query(`${INSCR_SQL} WHERE i.rencontre_id = $1 ORDER BY i.nom`, [req.params.id]);
    res.json({ inscriptions: result.rows });
  } catch (err) {
    next(err);
  }
});

// General-purpose branded email composer, reserved to administrators.
adminRouter.post('/emails/preview', adminOnly, validate(customEmailSchema), async (req, res, next) => {
  try {
    const { base, ...content } = req.data;
    let baseUrl = `${req.protocol}://${req.get('host')}`;
    if (base) {
      const parsed = new URL(base);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') baseUrl = parsed.origin;
    }
    const association = await loadAssociationSettings();
    res.json(buildCustomEmail({ content, baseUrl, association }));
  } catch (err) {
    next(err);
  }
});

// ---------- GDPR compliance documents (admin only) ----------
// Print-ready HTML documents prefilled from the association parameters:
// the record of processing activities (art. 30 RGPD) and the image-rights
// authorization form (adult / minor variant).
adminRouter.get('/compliance/register', adminOnly, async (_req, res, next) => {
  try {
    const association = await loadAssociationSettings();
    res.json(buildProcessingRegister({ association }));
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/compliance/image-consent', adminOnly, async (req, res, next) => {
  try {
    const association = await loadAssociationSettings();
    res.json(buildImageConsentForm({ association, minor: req.query.minor === '1' }));
  } catch (err) {
    next(err);
  }
});

// ---------- Rencontres passées (admin + moderator manage; admin-only delete) ----------
// Powers the "Rencontres passées" section on the home page and its dedicated
// public page. Participant count is derived from the linked rencontre's
// inscriptions when set, otherwise the manual fallback. Photo count and the
// photo list come from the rencontre_passee_photos gallery.
const PAST_SQL = `
  SELECT rp.id, rp.date_label, rp.lieu, rp.titre, rp.texte, rp.participants, rp.rencontre_id,
         CASE WHEN rp.rencontre_id IS NOT NULL THEN COALESCE(rc.inscrits, 0) ELSE rp.participants END AS participants_display,
         COALESCE(ph.n, 0) AS nb_photos,
         COALESCE(ph.photos, '[]'::json) AS photos
    FROM rencontres_passees rp
    LEFT JOIN (
      SELECT rencontre_passee_id, COUNT(*)::int AS n,
             json_agg(json_build_object('id', id, 'path', image_path) ORDER BY position, id) AS photos
        FROM rencontre_passee_photos GROUP BY rencontre_passee_id
    ) ph ON ph.rencontre_passee_id = rp.id
    LEFT JOIN (
      SELECT rencontre_id, COUNT(*)::int AS inscrits FROM inscriptions GROUP BY rencontre_id
    ) rc ON rc.rencontre_id = rp.rencontre_id`;

adminRouter.get('/rencontres-passees', async (_req, res, next) => {
  try {
    const result = await query(`${PAST_SQL} ORDER BY rp.id DESC`);
    res.json({ rencontresPassees: result.rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/rencontres-passees', validate(rencontrePasseeSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const result = await query(
      `INSERT INTO rencontres_passees (date_label, lieu, titre, texte, participants, rencontre_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [d.date_label, d.lieu, d.titre, d.texte, d.participants ?? 0, d.rencontre_id ?? null]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/rencontres-passees/:id', validate(idParam, 'params'), validate(rencontrePasseeSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const result = await query(
      `UPDATE rencontres_passees SET date_label=$1, lieu=$2, titre=$3, texte=$4, participants=$5, rencontre_id=$6
        WHERE id=$7 RETURNING id`,
      [d.date_label, d.lieu, d.titre, d.texte, d.participants ?? 0, d.rencontre_id ?? null, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rencontre passée introuvable' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Deleting is admin-only, same reasoning as rencontres/inscriptions above.
// ON DELETE CASCADE removes the photo rows; we delete their files first.
adminRouter.delete('/rencontres-passees/:id', adminOnly, validate(idParam, 'params'), async (req, res, next) => {
  try {
    const photos = await query('SELECT image_path FROM rencontre_passee_photos WHERE rencontre_passee_id = $1', [req.params.id]);
    await query('DELETE FROM rencontres_passees WHERE id = $1', [req.params.id]);
    await Promise.all(photos.rows.map((p) => deleteImage(p.image_path)));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Add a photo to a past event's gallery (unlimited). Admin + moderator.
adminRouter.post('/rencontres-passees/:id/photos', validate(idParam, 'params'), (req, res, next) => {
  imageUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'Fichier invalide (2 Mo max).' });
    try {
      if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });
      const event = await query('SELECT 1 FROM rencontres_passees WHERE id = $1', [req.params.id]);
      if (event.rowCount === 0) return res.status(404).json({ error: 'Rencontre passée introuvable' });
      const publicPath = await saveImage(req.file.buffer);
      if (!publicPath) return res.status(400).json({ error: 'Format accepté : JPEG, PNG ou WebP.' });
      const result = await query(
        `INSERT INTO rencontre_passee_photos (rencontre_passee_id, image_path, position)
         VALUES ($1, $2, COALESCE((SELECT MAX(position) + 1 FROM rencontre_passee_photos WHERE rencontre_passee_id = $1), 0))
         RETURNING id`,
        [req.params.id, publicPath]
      );
      res.status(201).json({ id: result.rows[0].id, path: publicPath });
    } catch (e) {
      next(e);
    }
  });
});

// Promote a photo to first position (the large one on the home page). Admin + moderator.
adminRouter.post('/rencontres-passees/:id/photos/:photoId/principale', validate(pastPhotoParam, 'params'), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE rencontre_passee_photos
          SET position = COALESCE((SELECT MIN(position) FROM rencontre_passee_photos WHERE rencontre_passee_id = $1), 0) - 1
        WHERE id = $2 AND rencontre_passee_id = $1 RETURNING id`,
      [req.params.id, req.params.photoId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Photo introuvable' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Removing a photo is a deletion — admin only.
adminRouter.delete('/rencontres-passees/:id/photos/:photoId', adminOnly, validate(pastPhotoParam, 'params'), async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM rencontre_passee_photos WHERE id = $1 AND rencontre_passee_id = $2 RETURNING image_path',
      [req.params.photoId, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Photo introuvable' });
    await deleteImage(result.rows[0].image_path);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Inscriptions (admin + moderator) ----------
adminRouter.get('/inscriptions', async (_req, res, next) => {
  try {
    const result = await query(`${INSCR_SQL} ORDER BY i.created_at DESC, i.id DESC`);
    res.json({ inscriptions: result.rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/inscriptions/:id', validate(idParam, 'params'), validate(inscriptionAdminSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const result = await query(
      `UPDATE inscriptions SET nom=$1, entreprise=$2, email=$3, tel=$4, rencontre_id=$5, statut=$6
        WHERE id=$7 RETURNING id`,
      [d.nom, d.entreprise, d.email || null, d.tel, d.rencontre_id, d.statut, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Inscription introuvable' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/inscriptions/:id/confirm', validate(idParam, 'params'), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE inscriptions SET statut = 'confirmee' WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Inscription introuvable' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Deleting (cancelling) an inscription is admin-only, same reasoning as
// above — moderators edit and confirm, they don't destroy data.
adminRouter.delete('/inscriptions/:id', adminOnly, validate(idParam, 'params'), async (req, res, next) => {
  try {
    await query('DELETE FROM inscriptions WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Categories ----------
// Read access is shared with moderators: the member form's category
// dropdown needs it. Managing categories (create/rename/delete) stays
// admin-only.
adminRouter.get('/categories', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT c.id, c.name, COUNT(m.id)::int AS count
        FROM categories c LEFT JOIN members m ON m.categorie_id = c.id
       GROUP BY c.id ORDER BY c.id`);
    res.json({ categories: result.rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/categories', adminOnly, validate(categorySchema), async (req, res, next) => {
  try {
    const result = await query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
      [req.data.name]
    );
    if (result.rowCount === 0) return res.status(409).json({ error: 'Cette catégorie existe déjà.' });
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/categories/:id', adminOnly, validate(idParam, 'params'), validate(categorySchema), async (req, res, next) => {
  try {
    const result = await query('UPDATE categories SET name = $1 WHERE id = $2 RETURNING id', [
      req.data.name,
      req.params.id,
    ]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ce nom existe déjà.' });
    next(err);
  }
});

adminRouter.delete('/categories/:id', adminOnly, validate(idParam, 'params'), async (req, res, next) => {
  try {
    // members.categorie_id has ON DELETE SET NULL: they become "Non classée"
    await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Site content (admin only) ----------
adminRouter.put('/content', adminOnly, validate(contentSchema), async (req, res, next) => {
  try {
    const entries = Object.entries(req.data).filter(([, v]) => v !== undefined);
    for (const [key, value] of entries) {
      await query(
        `INSERT INTO site_content (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/content/hero-photo', adminOnly, (req, res, next) => {
  imageUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'Fichier invalide (2 Mo max).' });
    try {
      if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });
      const publicPath = await saveImage(req.file.buffer);
      if (!publicPath) return res.status(400).json({ error: 'Format accepté : JPEG, PNG ou WebP.' });
      const prev = await query(`SELECT value FROM site_content WHERE key = 'hero_photo'`);
      await query(
        `INSERT INTO site_content (key, value) VALUES ('hero_photo', $1)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [publicPath]
      );
      await deleteImage(prev.rows[0]?.value);
      res.json({ path: publicPath });
    } catch (e) {
      next(e);
    }
  });
});

// ---------- Demandes d'adhésion (admin + moderator) ----------
adminRouter.get('/demandes', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT d.*, m.nom AS membre_nom
        FROM demandes_adhesion d
        LEFT JOIN members m ON m.id = d.member_id
       ORDER BY CASE d.statut WHEN 'nouvelle' THEN 0 WHEN 'contactee' THEN 1 ELSE 2 END,
                d.created_at DESC`);
    res.json({ demandes: result.rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/demandes/:id/contact', validate(idParam, 'params'), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE demandes_adhesion
          SET statut = 'contactee', contacted_at = COALESCE(contacted_at, now())
        WHERE id = $1 AND statut = 'nouvelle'
        RETURNING *`,
      [req.params.id]
    );
    if (result.rowCount === 0) {
      const existing = await query('SELECT statut FROM demandes_adhesion WHERE id = $1', [req.params.id]);
      if (existing.rowCount === 0) return res.status(404).json({ error: 'Demande introuvable' });
      return res.status(409).json({ error: 'Cette demande a déjà été prise en charge.' });
    }
    res.json({ demande: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/demandes/:id/validate', validate(idParam, 'params'), async (req, res, next) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const request = await client.query(
      'SELECT * FROM demandes_adhesion WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (request.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Demande introuvable' });
    }
    const d = request.rows[0];
    if (d.statut !== 'contactee') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: d.statut === 'validee'
          ? 'Cette demande a déjà été validée.'
          : "Validez d'abord la prise de contact.",
      });
    }
    if (!d.email) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Une adresse email est nécessaire pour créer le compte membre.' });
    }

    let member = await client.query(
      'SELECT id FROM members WHERE email = $1 ORDER BY id LIMIT 1 FOR UPDATE',
      [d.email]
    );
    let memberId;
    if (member.rowCount > 0) {
      memberId = member.rows[0].id;
      await client.query(
        `UPDATE members
            SET valide = true, adhesion = $1, dirigeant = CASE WHEN dirigeant = '' THEN $2 ELSE dirigeant END,
                tel = COALESCE(tel, $3), updated_at = now()
          WHERE id = $4`,
        [new Date().getFullYear(), d.nom, d.tel, memberId]
      );
    } else {
      member = await client.query(
        `INSERT INTO members (nom, secteur, dirigeant, adhesion, email, tel, presentation, valide)
         VALUES ($1, '', $2, $3, $4, $5, '', true) RETURNING id`,
        [d.entreprise, d.nom, new Date().getFullYear(), d.email, d.tel]
      );
      memberId = member.rows[0].id;
    }

    const login = await client.query('SELECT id FROM users WHERE member_id = $1', [memberId]);
    await client.query(
      `UPDATE demandes_adhesion
          SET statut = 'validee', contacted_at = COALESCE(contacted_at, now()),
              validated_at = now(), member_id = $1
        WHERE id = $2`,
      [memberId, d.id]
    );
    await client.query('COMMIT');

    let tempPassword = null;
    let accessError = null;
    if (login.rowCount === 0) {
      try {
        tempPassword = await ensureMemberAccess(memberId, d.email);
      } catch (err) {
        if (!(err instanceof AccessError)) throw err;
        accessError = err.message;
      }
    }
    res.json({ memberId, email: d.email, tempPassword, accessError });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client?.release();
  }
});

// ---------- Admin & moderator accounts (admin only) ----------
adminRouter.get('/users', adminOnly, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, email, full_name, role, must_change_password,
             CASE WHEN must_change_password THEN temp_password ELSE NULL END AS temp_password,
             created_at
        FROM users WHERE role IN ('admin', 'moderator', 'treasurer')
       ORDER BY role, full_name, email`);
    res.json({ users: result.rows.map((u) => ({ ...u, is_self: u.id === req.user.sub })) });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/users', adminOnly, validate(staffUserSchema), async (req, res, next) => {
  try {
    const { fullName, email, role } = req.data;
    const { id, tempPassword } = await createStaffUser({ fullName, email, role });
    res.status(201).json({ id, tempPassword });
  } catch (err) {
    if (err instanceof AccessError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

adminRouter.post('/users/:id/reset-access', adminOnly, validate(idParam, 'params'), async (req, res, next) => {
  try {
    const tempPassword = await resetStaffAccess(req.params.id);
    res.json({ tempPassword });
  } catch (err) {
    if (err instanceof AccessError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

adminRouter.put('/users/:id/role', adminOnly, validate(idParam, 'params'), validate(roleChangeSchema), async (req, res, next) => {
  try {
    if (req.params.id === req.user.sub) {
      return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle.' });
    }
    const target = await query(`SELECT role FROM users WHERE id = $1 AND role IN ('admin', 'moderator', 'treasurer')`, [req.params.id]);
    if (target.rowCount === 0) return res.status(404).json({ error: 'Compte introuvable' });
    if (target.rows[0].role === 'admin' && req.data.role !== 'admin') {
      const adminCount = await query(`SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'`);
      if (adminCount.rows[0].n <= 1) {
        return res.status(400).json({ error: 'Impossible : il doit rester au moins un administrateur.' });
      }
    }
    await query('UPDATE users SET role = $1 WHERE id = $2', [req.data.role, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/users/:id', adminOnly, validate(idParam, 'params'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.sub) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }
    const target = await query(`SELECT role FROM users WHERE id = $1 AND role IN ('admin', 'moderator', 'treasurer')`, [req.params.id]);
    if (target.rowCount === 0) return res.status(404).json({ error: 'Compte introuvable' });
    if (target.rows[0].role === 'admin') {
      const adminCount = await query(`SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'`);
      if (adminCount.rows[0].n <= 1) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier compte administrateur.' });
      }
    }
    await query(`DELETE FROM users WHERE id = $1 AND role IN ('admin', 'moderator', 'treasurer')`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
