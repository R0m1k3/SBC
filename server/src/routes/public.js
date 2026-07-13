import { Router } from 'express';
import { query } from '../db.js';
import { validate } from '../middleware/validate.js';
import { publicFormLimiter } from '../middleware/security.js';
import { demandeSchema, inscriptionPublicSchema, idParam } from '../schemas.js';

export const publicRouter = Router();

// Single bootstrap payload for the public site
publicRouter.get('/bootstrap', async (_req, res, next) => {
  try {
    const [content, categories, members, rencontres, passees] = await Promise.all([
      query('SELECT key, value FROM site_content'),
      query('SELECT id, name FROM categories ORDER BY id'),
      query(
        `SELECT m.id, m.nom, m.secteur, m.dirigeant, m.adhesion, m.email, m.tel, m.site,
                m.presentation, m.logo_path, m.photo_path, c.name AS categorie
           FROM members m LEFT JOIN categories c ON c.id = m.categorie_id
          WHERE m.valide = true ORDER BY m.nom`
      ),
      query(
        `SELECT r.id, r.titre, r.date_renc, r.heure, r.lieu, r.description, r.places, r.image_path,
                COUNT(i.id)::int AS inscrits
           FROM rencontres r LEFT JOIN inscriptions i ON i.rencontre_id = r.id
          WHERE r.date_renc >= CURRENT_DATE
          GROUP BY r.id ORDER BY r.date_renc`
      ),
      query('SELECT * FROM rencontres_passees ORDER BY id DESC'),
    ]);
    const contentMap = Object.fromEntries(content.rows.map((r) => [r.key, r.value]));
    res.json({
      content: contentMap,
      categories: categories.rows,
      members: members.rows,
      rencontres: rencontres.rows,
      rencontresPassees: passees.rows,
    });
  } catch (err) {
    next(err);
  }
});

// Membership request (home page form)
publicRouter.post(
  '/demandes-adhesion',
  publicFormLimiter,
  validate(demandeSchema),
  async (req, res, next) => {
    try {
      const { nom, fonction, entreprise, email } = req.data;
      await query(
        'INSERT INTO demandes_adhesion (nom, fonction, entreprise, email) VALUES ($1, $2, $3, $4)',
        [nom, fonction, entreprise, email]
      );
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// Event registration (public modal)
publicRouter.post(
  '/rencontres/:id/inscriptions',
  publicFormLimiter,
  validate(idParam, 'params'),
  validate(inscriptionPublicSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nom, entreprise, email, tel } = req.data;
      const renc = await query(
        `SELECT r.places, COUNT(i.id)::int AS inscrits
           FROM rencontres r LEFT JOIN inscriptions i ON i.rencontre_id = r.id
          WHERE r.id = $1 AND r.date_renc >= CURRENT_DATE
          GROUP BY r.id`,
        [id]
      );
      if (renc.rowCount === 0) return res.status(404).json({ error: 'Rencontre introuvable' });
      if (renc.rows[0].inscrits >= renc.rows[0].places) {
        return res.status(409).json({ error: 'Cette rencontre est complète.' });
      }
      const dup = await query(
        'SELECT 1 FROM inscriptions WHERE rencontre_id = $1 AND email = $2',
        [id, email]
      );
      if (dup.rowCount > 0) {
        return res.status(409).json({ error: 'Une inscription existe déjà avec cet email.' });
      }
      await query(
        `INSERT INTO inscriptions (rencontre_id, nom, entreprise, email, tel, statut)
         VALUES ($1, $2, $3, $4, $5, 'en_attente')`,
        [id, nom, entreprise, email, tel]
      );
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);
