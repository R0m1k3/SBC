import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  adminMemberSchema,
  rencontreSchema,
  inscriptionAdminSchema,
  categorySchema,
  contentSchema,
  idParam,
} from '../schemas.js';
import { imageUpload, saveImage, deleteImage } from '../uploads.js';

export const adminRouter = Router();

adminRouter.use(requireAuth('admin'));

const MEMBER_SQL = `
  SELECT m.id, m.nom, m.secteur, m.categorie_id, c.name AS categorie, m.dirigeant,
         m.adhesion, m.email, m.tel, m.site, m.presentation, m.valide,
         m.logo_path, m.photo_path
    FROM members m LEFT JOIN categories c ON c.id = m.categorie_id`;

const RENC_SQL = `
  SELECT r.id, r.titre, r.date_renc, r.heure, r.lieu, r.description, r.places,
         COUNT(i.id)::int AS inscrits
    FROM rencontres r LEFT JOIN inscriptions i ON i.rencontre_id = r.id`;

const INSCR_SQL = `
  SELECT i.id, i.nom, i.entreprise, i.email, i.tel, i.statut, i.created_at,
         i.rencontre_id, r.titre AS rencontre
    FROM inscriptions i JOIN rencontres r ON r.id = i.rencontre_id`;

// ---------- Dashboard ----------
adminRouter.get('/dashboard', async (_req, res, next) => {
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

// ---------- Members ----------
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
      `INSERT INTO members (nom, secteur, categorie_id, dirigeant, adhesion, email, tel, site, presentation, valide)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [d.nom, d.secteur, d.categorie_id ?? null, d.dirigeant, new Date().getFullYear(),
       d.email || null, d.tel, d.site, d.presentation, d.valide ?? true]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/members/:id', validate(idParam, 'params'), validate(adminMemberSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const result = await query(
      `UPDATE members SET nom=$1, secteur=$2, categorie_id=$3, dirigeant=$4, email=$5,
              tel=$6, site=$7, presentation=$8, valide=COALESCE($9, valide), updated_at=now()
        WHERE id=$10 RETURNING id`,
      [d.nom, d.secteur, d.categorie_id ?? null, d.dirigeant, d.email || null,
       d.tel, d.site, d.presentation, d.valide ?? null, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Membre introuvable' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/members/:id/toggle-valide', validate(idParam, 'params'), async (req, res, next) => {
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

// ---------- Rencontres ----------
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
      `INSERT INTO rencontres (titre, date_renc, heure, lieu, description, places)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [d.titre, d.date_renc, d.heure, d.lieu, d.description, d.places]
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
      `UPDATE rencontres SET titre=$1, date_renc=$2, heure=$3, lieu=$4, description=$5, places=$6
        WHERE id=$7 RETURNING id`,
      [d.titre, d.date_renc, d.heure, d.lieu, d.description, d.places, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rencontre introuvable' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/rencontres/:id', validate(idParam, 'params'), async (req, res, next) => {
  try {
    await query('DELETE FROM rencontres WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
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

// ---------- Inscriptions ----------
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

adminRouter.delete('/inscriptions/:id', validate(idParam, 'params'), async (req, res, next) => {
  try {
    await query('DELETE FROM inscriptions WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Categories ----------
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

adminRouter.post('/categories', validate(categorySchema), async (req, res, next) => {
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

adminRouter.put('/categories/:id', validate(idParam, 'params'), validate(categorySchema), async (req, res, next) => {
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

adminRouter.delete('/categories/:id', validate(idParam, 'params'), async (req, res, next) => {
  try {
    // members.categorie_id has ON DELETE SET NULL: they become "Non classée"
    await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Site content ----------
adminRouter.put('/content', validate(contentSchema), async (req, res, next) => {
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

adminRouter.post('/content/hero-photo', (req, res, next) => {
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

// ---------- Demandes d'adhésion ----------
adminRouter.get('/demandes', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM demandes_adhesion ORDER BY created_at DESC');
    res.json({ demandes: result.rows });
  } catch (err) {
    next(err);
  }
});
