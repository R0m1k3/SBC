import { Router } from 'express';
import { pool, query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  billingSeasonParam,
  billingSettingsSchema,
  billingTypeSchema,
  invoiceGenerationSchema,
  paymentSchema,
  idParam,
} from '../schemas.js';
import { associationSettings } from '../siteSettings.js';
import { buildInvoicePdf, buildPaidMembersPdf, buildPaidMembersWorkbook } from '../billingDocuments.js';

export const billingRouter = Router();
billingRouter.use(requireAuth(['admin', 'treasurer']));

const DEFAULT_SETTINGS = {
  sluc_partner_amount_ht: 0,
  non_partner_amount_ht: 0,
  payment_due_days: 30,
  iban: '',
  legal_mentions: '',
};

function currentSeason(date = new Date()) {
  const start = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

function numberRow(row) {
  if (!row) return row;
  for (const key of ['sluc_partner_amount_ht', 'non_partner_amount_ht', 'amount_ht', 'amount_ttc']) {
    if (row[key] != null) row[key] = Number(row[key]);
  }
  return row;
}

async function loadSettings(season, client = { query }) {
  const result = await client.query('SELECT * FROM billing_season_settings WHERE season = $1', [season]);
  return result.rows[0] ? { ...numberRow(result.rows[0]), configured: true } : { season, ...DEFAULT_SETTINGS, configured: false };
}

async function loadPaidRows(season) {
  const result = await query(
    `SELECT invoice_number, member_name, billing_type, paid_at, payment_method, amount_ht
       FROM membership_invoices
      WHERE season = $1 AND status = 'payee'
      ORDER BY paid_at, member_name`,
    [season]
  );
  return result.rows.map(numberRow);
}

billingRouter.get('/seasons', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT season FROM billing_season_settings
      UNION SELECT season FROM membership_invoices
      ORDER BY season DESC`);
    const seasons = [...new Set([currentSeason(), ...result.rows.map((row) => row.season)])].sort().reverse();
    res.json({ seasons, current: currentSeason() });
  } catch (err) {
    next(err);
  }
});

billingRouter.get('/seasons/:season', validate(billingSeasonParam, 'params'), async (req, res, next) => {
  try {
    const { season } = req.params;
    const [settings, members, stats] = await Promise.all([
      loadSettings(season),
      query(
        `SELECT m.id, m.nom, m.dirigeant, m.email, m.adresse, m.billing_type, m.valide,
                i.id AS invoice_id, i.invoice_number, i.issued_at, i.due_date,
                i.amount_ht,
                i.status, i.payment_method, i.paid_at
           FROM members m
           LEFT JOIN LATERAL (
             SELECT * FROM membership_invoices mi
              WHERE mi.member_id = m.id AND mi.season = $1 AND mi.status <> 'annulee'
              ORDER BY mi.id DESC LIMIT 1
           ) i ON true
          ORDER BY m.nom`,
        [season]
      ),
      query(
        `SELECT
           (SELECT COUNT(*)::int FROM members) AS total_members,
           COUNT(*) FILTER (WHERE status <> 'annulee')::int AS invoiced_count,
           COUNT(*) FILTER (WHERE status = 'payee')::int AS paid_count,
           COUNT(*) FILTER (WHERE status = 'emise')::int AS unpaid_count,
           COALESCE(SUM(amount_ht) FILTER (WHERE status <> 'annulee'), 0)::float8 AS total_invoiced,
           COALESCE(SUM(amount_ht) FILTER (WHERE status = 'payee'), 0)::float8 AS total_paid,
           COALESCE(SUM(amount_ht) FILTER (WHERE status = 'emise'), 0)::float8 AS total_outstanding
         FROM membership_invoices WHERE season = $1`,
        [season]
      ),
    ]);
    res.json({
      season,
      settings,
      members: members.rows.map(numberRow),
      stats: stats.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

billingRouter.put('/seasons/:season/settings', validate(billingSeasonParam, 'params'), validate(billingSettingsSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const iban = d.iban.replace(/\s/g, '').toUpperCase();
    await query(
      `INSERT INTO billing_season_settings
         (season, sluc_partner_amount_ht, non_partner_amount_ht, vat_rate, payment_due_days, iban, legal_mentions)
       VALUES ($1, $2, $3, 0, $4, $5, $6)
       ON CONFLICT (season) DO UPDATE SET
         sluc_partner_amount_ht=EXCLUDED.sluc_partner_amount_ht,
         non_partner_amount_ht=EXCLUDED.non_partner_amount_ht,
         vat_rate=0,
         payment_due_days=EXCLUDED.payment_due_days,
         iban=EXCLUDED.iban,
         legal_mentions=EXCLUDED.legal_mentions,
         updated_at=now()`,
      [req.params.season, d.sluc_partner_amount_ht, d.non_partner_amount_ht,
       d.payment_due_days, iban, d.legal_mentions]
    );
    res.json({ settings: await loadSettings(req.params.season) });
  } catch (err) {
    next(err);
  }
});

billingRouter.put('/members/:id/type', validate(idParam, 'params'), validate(billingTypeSchema), async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE members SET billing_type=$1, updated_at=now() WHERE id=$2 RETURNING id, billing_type',
      [req.data.billing_type, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Membre introuvable' });
    res.json({ member: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

billingRouter.post('/seasons/:season/invoices', validate(billingSeasonParam, 'params'), validate(invoiceGenerationSchema), async (req, res, next) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const settingsResult = await client.query('SELECT * FROM billing_season_settings WHERE season=$1 FOR UPDATE', [req.params.season]);
    if (!settingsResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Configurez les tarifs de cette saison avant de générer les factures.' });
    }
    const settings = numberRow(settingsResult.rows[0]);
    const memberIds = req.data.member_ids;
    const members = await client.query(
      `SELECT id, nom, adresse, email, billing_type FROM members
        ${memberIds ? 'WHERE id = ANY($1::int[])' : ''}
        ORDER BY nom`,
      memberIds ? [memberIds] : []
    );
    const existing = await client.query(
      `SELECT member_id FROM membership_invoices
        WHERE season=$1 AND status <> 'annulee' AND member_id = ANY($2::int[])`,
      [req.params.season, members.rows.map((member) => member.id)]
    );
    const existingIds = new Set(existing.rows.map((row) => row.member_id));
    const content = await client.query(`SELECT key, value FROM site_content WHERE key LIKE 'association_%'`);
    const issuer = associationSettings(Object.fromEntries(content.rows.map((row) => [row.key, row.value])));
    const issuerSnapshot = {
      ...issuer,
      iban: settings.iban,
      legal_mentions: settings.legal_mentions,
    };
    let created = 0;
    for (const member of members.rows) {
      if (existingIds.has(member.id)) continue;
      const amountHt = member.billing_type === 'sluc_partner'
        ? settings.sluc_partner_amount_ht
        : settings.non_partner_amount_ht;
      const amountNet = Math.round(amountHt * 100) / 100;
      const sequence = await client.query(`SELECT nextval('billing_invoice_number_seq') AS n`);
      const invoiceNumber = `FAC-${req.params.season.slice(0, 4)}-${String(sequence.rows[0].n).padStart(5, '0')}`;
      await client.query(
        `INSERT INTO membership_invoices
          (season, member_id, invoice_number, due_date, member_name, member_address, member_email,
           billing_type, amount_ht, vat_rate, vat_amount, amount_ttc, issuer_snapshot)
         VALUES ($1, $2, $3, CURRENT_DATE + $4::int, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)`,
        [req.params.season, member.id, invoiceNumber, settings.payment_due_days, member.nom,
         member.adresse || '', member.email || '', member.billing_type, amountNet, 0,
         0, amountNet, JSON.stringify(issuerSnapshot)]
      );
      created += 1;
    }
    await client.query('COMMIT');
    res.status(201).json({ created });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client?.release();
  }
});

billingRouter.put('/invoices/:id/payment', validate(idParam, 'params'), validate(paymentSchema), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE membership_invoices SET status='payee', payment_method=$1, paid_at=$2, updated_at=now()
        WHERE id=$3 AND status <> 'annulee' RETURNING id`,
      [req.data.payment_method, req.data.paid_at, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Facture introuvable ou annulée' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

billingRouter.delete('/invoices/:id/payment', validate(idParam, 'params'), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE membership_invoices SET status='emise', payment_method=NULL, paid_at=NULL, updated_at=now()
        WHERE id=$1 AND status='payee' RETURNING id`,
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Règlement introuvable' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

billingRouter.post('/invoices/:id/cancel', validate(idParam, 'params'), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE membership_invoices SET status='annulee', payment_method=NULL, paid_at=NULL, updated_at=now()
        WHERE id=$1 AND status='emise' RETURNING id`,
      [req.params.id]
    );
    if (!result.rowCount) return res.status(409).json({ error: 'Seule une facture non réglée peut être annulée.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

billingRouter.get('/invoices/:id/pdf', validate(idParam, 'params'), async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM membership_invoices WHERE id=$1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Facture introuvable' });
    const invoice = numberRow(result.rows[0]);
    const pdf = await buildInvoicePdf(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

billingRouter.get('/seasons/:season/paid.xlsx', validate(billingSeasonParam, 'params'), async (req, res, next) => {
  try {
    const rows = await loadPaidRows(req.params.season);
    const workbook = await buildPaidMembersWorkbook({ season: req.params.season, rows });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="adhesions-payees-${req.params.season}.xlsx"`);
    res.send(workbook);
  } catch (err) {
    next(err);
  }
});

billingRouter.get('/seasons/:season/paid.pdf', validate(billingSeasonParam, 'params'), async (req, res, next) => {
  try {
    const rows = await loadPaidRows(req.params.season);
    const pdf = await buildPaidMembersPdf({ season: req.params.season, rows });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="adhesions-payees-${req.params.season}.pdf"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});
