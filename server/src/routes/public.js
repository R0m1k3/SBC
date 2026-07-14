import { Router } from 'express';
import { pool, query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
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
        `SELECT r.id, r.titre, r.date_renc, r.heure, r.lieu, r.description, r.places,
                r.participants_par_compte, r.image_path,
                COUNT(i.id)::int AS inscrits
           FROM rencontres r LEFT JOIN inscriptions i ON i.rencontre_id = r.id
          WHERE r.date_renc >= CURRENT_DATE
          GROUP BY r.id ORDER BY r.date_renc`
      ),
      query(`
        SELECT rp.id, rp.date_label, rp.lieu, rp.titre, rp.texte,
               CASE WHEN rp.rencontre_id IS NOT NULL THEN COALESCE(rc.inscrits, 0) ELSE rp.participants END AS participants,
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
          ) rc ON rc.rencontre_id = rp.rencontre_id
          ORDER BY rp.id DESC`),
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

// Registration context for the connected member account. Existing names are
// returned so the member can review or amend the complete participant list.
publicRouter.get(
  '/rencontres/:id/inscription',
  requireAuth('member'),
  validate(idParam, 'params'),
  async (req, res, next) => {
    try {
      const [member, rencontre, participants] = await Promise.all([
        query('SELECT id, nom, dirigeant, email, tel, valide FROM members WHERE id = $1', [req.user.memberId]),
        query(
          `SELECT r.id, r.places, r.participants_par_compte, COUNT(i.id)::int AS inscrits
             FROM rencontres r LEFT JOIN inscriptions i ON i.rencontre_id = r.id
            WHERE r.id = $1 AND r.date_renc >= CURRENT_DATE
            GROUP BY r.id`,
          [req.params.id]
        ),
        query(
          `SELECT nom, statut FROM inscriptions
            WHERE rencontre_id = $1 AND member_id = $2 ORDER BY created_at, id`,
          [req.params.id, req.user.memberId]
        ),
      ]);
      if (member.rowCount === 0) return res.status(403).json({ error: 'Compte membre introuvable.' });
      if (!member.rows[0].valide) {
        return res.status(403).json({ error: "Votre adhésion doit être validée pour vous inscrire." });
      }
      if (rencontre.rowCount === 0) return res.status(404).json({ error: 'Rencontre introuvable' });
      res.json({ member: member.rows[0], rencontre: rencontre.rows[0], participants: participants.rows });
    } catch (err) {
      next(err);
    }
  }
);

// One authenticated member account can register several named people, within
// both the per-account limit and the event's total capacity.
publicRouter.post(
  '/rencontres/:id/inscriptions',
  publicFormLimiter,
  requireAuth('member'),
  validate(idParam, 'params'),
  validate(inscriptionPublicSchema),
  async (req, res, next) => {
    let client;
    try {
      client = await pool.connect();
      const { id } = req.params;
      const participants = req.data.participants;
      const names = participants.map((name) => name.toLocaleLowerCase('fr-FR'));
      if (new Set(names).size !== names.length) {
        return res.status(400).json({ error: 'Chaque participant doit avoir un nom différent.' });
      }

      await client.query('BEGIN');
      // Lock the event before counting places so concurrent registrations
      // cannot overbook it.
      const renc = await client.query(
        `SELECT id, places, participants_par_compte FROM rencontres
          WHERE id = $1 AND date_renc >= CURRENT_DATE FOR UPDATE`,
        [id]
      );
      if (renc.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Rencontre introuvable' });
      }
      const member = await client.query(
        'SELECT id, nom, email, tel, valide FROM members WHERE id = $1',
        [req.user.memberId]
      );
      if (member.rowCount === 0 || !member.rows[0].valide) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "Votre adhésion doit être validée pour vous inscrire." });
      }
      if (participants.length > renc.rows[0].participants_par_compte) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Cette rencontre autorise ${renc.rows[0].participants_par_compte} participant(s) maximum par compte.`,
        });
      }

      const otherCount = await client.query(
        `SELECT COUNT(*)::int AS n FROM inscriptions
          WHERE rencontre_id = $1 AND (member_id IS NULL OR member_id <> $2)`,
        [id, req.user.memberId]
      );
      if (otherCount.rows[0].n + participants.length > renc.rows[0].places) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Il ne reste pas assez de places pour ces participants.' });
      }

      const existing = await client.query(
        `SELECT id, nom FROM inscriptions
          WHERE rencontre_id = $1 AND member_id = $2 ORDER BY created_at, id`,
        [id, req.user.memberId]
      );
      const available = new Map();
      for (const row of existing.rows) {
        const key = row.nom.toLocaleLowerCase('fr-FR');
        if (!available.has(key)) available.set(key, []);
        available.get(key).push(row);
      }

      const keptIds = [];
      const account = member.rows[0];
      for (const nom of participants) {
        const key = nom.toLocaleLowerCase('fr-FR');
        const row = available.get(key)?.shift();
        if (row) {
          keptIds.push(row.id);
          await client.query(
            'UPDATE inscriptions SET nom=$1, entreprise=$2, email=$3, tel=$4 WHERE id=$5',
            [nom, account.nom, account.email, account.tel, row.id]
          );
        } else {
          const inserted = await client.query(
            `INSERT INTO inscriptions (rencontre_id, member_id, nom, entreprise, email, tel, statut)
             VALUES ($1, $2, $3, $4, $5, $6, 'en_attente') RETURNING id`,
            [id, account.id, nom, account.nom, account.email, account.tel]
          );
          keptIds.push(inserted.rows[0].id);
        }
      }
      await client.query(
        `DELETE FROM inscriptions
          WHERE rencontre_id = $1 AND member_id = $2 AND NOT (id = ANY($3::int[]))`,
        [id, account.id, keptIds]
      );
      await client.query('COMMIT');
      res.status(201).json({ ok: true, participants: participants.length });
    } catch (err) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      next(err);
    } finally {
      client?.release();
    }
  }
);
