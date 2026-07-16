import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { memberProfileSchema, imageConsentSchema } from '../schemas.js';
import { imageUpload, saveImage, deleteImage } from '../uploads.js';
import { IMAGE_CONSENT_VERSION } from '../imageConsent.js';
import { requestClientIp } from '../clientIp.js';

export const memberRouter = Router();

memberRouter.use(requireAuth('member'));

// The current image-rights consent is the latest image_consents row for
// the member (append-only trail). Exposed on the profile so the espace can
// gate on it and show its status.
const PROFILE_SQL = `
  SELECT m.id, m.nom, m.secteur, m.categorie_id, c.name AS categorie, m.dirigeant,
         m.adhesion, m.email, m.tel, m.site, m.adresse, m.presentation, m.valide,
         m.logo_path, m.photo_path,
         ic.decision AS image_consent, ic.scopes AS image_consent_scopes,
         ic.created_at AS image_consent_at
    FROM members m
    LEFT JOIN categories c ON c.id = m.categorie_id
    LEFT JOIN LATERAL (
      SELECT decision, scopes, created_at FROM image_consents
       WHERE member_id = m.id ORDER BY created_at DESC LIMIT 1
    ) ic ON true
   WHERE m.id = $1`;

memberRouter.get('/profile', async (req, res, next) => {
  try {
    const result = await query(PROFILE_SQL, [req.user.memberId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Profil introuvable' });
    res.json({ member: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

memberRouter.put('/profile', validate(memberProfileSchema), async (req, res, next) => {
  try {
    const { nom, secteur, categorie_id, dirigeant, email, tel, site, adresse, presentation } = req.data;
    await query(
      `UPDATE members SET nom=$1, secteur=$2, categorie_id=$3, dirigeant=$4, email=$5,
              tel=$6, site=$7, adresse=$8, presentation=$9, updated_at=now()
        WHERE id=$10`,
      [nom, secteur, categorie_id ?? null, dirigeant, email || null, tel, site, adresse, presentation, req.user.memberId]
    );
    const result = await query(PROFILE_SQL, [req.user.memberId]);
    res.json({ member: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

memberRouter.get('/inscriptions', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT i.rencontre_id, COUNT(*)::int AS participants,
              bool_and(i.statut = 'confirmee') AS confirmee
         FROM inscriptions i
         JOIN rencontres r ON r.id = i.rencontre_id
        WHERE i.member_id = $1 AND r.date_renc >= CURRENT_DATE
        GROUP BY i.rencontre_id`,
      [req.user.memberId]
    );
    res.json({ inscriptions: result.rows });
  } catch (err) {
    next(err);
  }
});

function imageRoute(column) {
  return (req, res, next) => {
    imageUpload(req, res, async (err) => {
      if (err) return res.status(400).json({ error: 'Fichier invalide (2 Mo max).' });
      try {
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });
        const publicPath = await saveImage(req.file.buffer);
        if (!publicPath) {
          return res.status(400).json({ error: 'Format accepté : JPEG, PNG ou WebP.' });
        }
        const prev = await query(`SELECT ${column} FROM members WHERE id = $1`, [req.user.memberId]);
        await query(`UPDATE members SET ${column} = $1, updated_at = now() WHERE id = $2`, [
          publicPath,
          req.user.memberId,
        ]);
        await deleteImage(prev.rows[0]?.[column]);
        res.json({ path: publicPath });
      } catch (e) {
        next(e);
      }
    });
  };
}

memberRouter.post('/profile/logo', imageRoute('logo_path'));
memberRouter.post('/profile/photo', imageRoute('photo_path'));

// Records an electronic image-rights consent (or refusal) as a new row in
// the append-only trail — a simple electronic signature valid as proof
// under art. 7 RGPD. Captures IP and user-agent for the record.
memberRouter.post('/image-consent', validate(imageConsentSchema), async (req, res, next) => {
  try {
    const { decision, scopes, signatoryName, signaturePng } = req.data;
    await query(
      `INSERT INTO image_consents
         (member_id, decision, scopes, signatory_name, signature_png, consent_version, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.user.memberId,
        decision,
        (scopes || []).join(','),
        signatoryName,
        decision === 'accepted' ? signaturePng : null,
        IMAGE_CONSENT_VERSION,
        requestClientIp(req),
        (req.headers['user-agent'] || '').slice(0, 400),
      ]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});
