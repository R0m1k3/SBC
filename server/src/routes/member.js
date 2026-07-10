import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { memberProfileSchema } from '../schemas.js';
import { imageUpload, saveImage, deleteImage } from '../uploads.js';

export const memberRouter = Router();

memberRouter.use(requireAuth('member'));

const PROFILE_SQL = `
  SELECT m.id, m.nom, m.secteur, m.categorie_id, c.name AS categorie, m.dirigeant,
         m.adhesion, m.email, m.tel, m.site, m.presentation, m.valide,
         m.logo_path, m.photo_path
    FROM members m LEFT JOIN categories c ON c.id = m.categorie_id
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
    const { nom, secteur, categorie_id, dirigeant, email, tel, site, presentation } = req.data;
    await query(
      `UPDATE members SET nom=$1, secteur=$2, categorie_id=$3, dirigeant=$4, email=$5,
              tel=$6, site=$7, presentation=$8, updated_at=now()
        WHERE id=$9`,
      [nom, secteur, categorie_id ?? null, dirigeant, email || null, tel, site, presentation, req.user.memberId]
    );
    const result = await query(PROFILE_SQL, [req.user.memberId]);
    res.json({ member: result.rows[0] });
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
