import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import Modal from '../Modal.jsx';

const TYPE_LABEL = {
  sluc_partner: 'Partenaire SLUC',
  non_partner: 'Non partenaire SLUC',
};

const PAYMENT_LABEL = {
  carte: 'Carte bleue',
  virement: 'Virement',
  cheque: 'Chèque',
};

const euro = (value) => new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
}).format(Number(value || 0));

const dateInput = (value) => value ? String(value).slice(0, 10) : '';
const dateLabel = (value) => value
  ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('fr-FR')
  : '—';
const seasonLabel = (season) => season?.replace('-', '–') || '';

function SettingsPanel({ season, settings, onSaved, onClose }) {
  const [form, setForm] = useState({
    sluc_partner_amount_ht: settings.sluc_partner_amount_ht ?? 0,
    non_partner_amount_ht: settings.non_partner_amount_ht ?? 0,
    vat_rate: settings.vat_rate ?? 20,
    payment_due_days: settings.payment_due_days ?? 30,
    iban: settings.iban || '',
    legal_mentions: settings.legal_mentions || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put(`/api/admin/billing/seasons/${season}/settings`, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ borderRadius: 6, padding: 26, marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 22 }}>
        <div>
          <h3 className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Paramètres de la saison {seasonLabel(season)}</h3>
          <p style={{ fontSize: 13, color: 'var(--gray-light)', marginTop: 5 }}>Les montants sont saisis hors taxes. La TVA et le TTC sont calculés à la génération.</p>
        </div>
        {settings.configured && <button type="button" className="btn-link-gray" onClick={onClose}>Fermer</button>}
      </div>
      <form onSubmit={submit}>
        <div className="grid-4" style={{ gap: 12 }}>
          <label className="field">Partenaire SLUC - HT
            <input name="sluc_partner_amount_ht" type="number" min="0" max="1000000" step="0.01" value={form.sluc_partner_amount_ht} onChange={change} required />
          </label>
          <label className="field">Non partenaire - HT
            <input name="non_partner_amount_ht" type="number" min="0" max="1000000" step="0.01" value={form.non_partner_amount_ht} onChange={change} required />
          </label>
          <label className="field">TVA
            <div style={{ position: 'relative' }}>
              <input name="vat_rate" type="number" min="0" max="100" step="0.01" value={form.vat_rate} onChange={change} required style={{ paddingRight: 32 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-light)' }}>%</span>
            </div>
          </label>
          <label className="field">Échéance
            <div style={{ position: 'relative' }}>
              <input name="payment_due_days" type="number" min="0" max="365" step="1" value={form.payment_due_days} onChange={change} required style={{ paddingRight: 52 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-light)', fontSize: 12 }}>jours</span>
            </div>
          </label>
        </div>
        <label className="field" style={{ marginTop: 14 }}>IBAN à afficher sur les factures
          <input name="iban" value={form.iban} onChange={change} maxLength={42} placeholder="FR76…" />
        </label>
        <label className="field" style={{ marginTop: 14 }}>Mentions légales des factures
          <textarea name="legal_mentions" value={form.legal_mentions} onChange={change} rows={4} maxLength={3000} placeholder="Conditions de règlement, pénalités de retard, indemnité forfaitaire…" />
        </label>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <button type="submit" className="btn btn-red btn-sm" disabled={busy} style={{ marginTop: 18, fontSize: 14, padding: '12px 22px' }}>
          {busy ? 'Enregistrement…' : 'Enregistrer les paramètres'}
        </button>
      </form>
    </div>
  );
}

function PaymentModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({
    payment_method: member.payment_method || 'virement',
    paid_at: dateInput(member.paid_at) || new Date().toISOString().slice(0, 10),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put(`/api/admin/billing/invoices/${member.invoice_id}/payment`, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removePayment = async () => {
    if (!window.confirm('Retirer ce règlement et repasser la facture en attente ?')) return;
    setBusy(true);
    setError('');
    try {
      await api.del(`/api/admin/billing/invoices/${member.invoice_id}/payment`);
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth={480} header={{ kicker: 'Règlement', title: member.nom, meta: `${member.invoice_number} · ${euro(member.amount_ttc)}` }}>
      <form onSubmit={submit} style={{ padding: '26px 30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="field">Mode de règlement
            <select name="payment_method" value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })}>
              <option value="carte">Carte bleue</option>
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
            </select>
          </label>
          <label className="field">Date de règlement
            <input name="paid_at" type="date" value={form.paid_at} onChange={(event) => setForm({ ...form, paid_at: event.target.value })} required />
          </label>
        </div>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button type="submit" className="btn btn-red btn-sm" disabled={busy} style={{ flex: 1, fontSize: 14, padding: 12 }}>
            {busy ? 'Enregistrement…' : member.status === 'payee' ? 'Modifier le règlement' : 'Enregistrer le règlement'}
          </button>
          <button type="button" className="btn btn-outline-soft btn-sm" onClick={onClose}>Annuler</button>
        </div>
        {member.status === 'payee' && (
          <button type="button" className="btn-link-gray" disabled={busy} onClick={removePayment} style={{ marginTop: 18, color: 'var(--red)' }}>
            Retirer ce règlement
          </button>
        )}
      </form>
    </Modal>
  );
}

export function BillingTab() {
  const [seasons, setSeasons] = useState([]);
  const [season, setSeason] = useState('');
  const [data, setData] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentMember, setPaymentMember] = useState(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = () => {
    if (!season) return Promise.resolve();
    return api.get(`/api/admin/billing/seasons/${season}`)
      .then((result) => {
        setData(result);
        if (!result.settings.configured) setSettingsOpen(true);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    api.get('/api/admin/billing/seasons')
      .then((result) => {
        setSeasons(result.seasons);
        setSeason(result.current);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    setData(null);
    setError('');
    reload();
  }, [season]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data?.members || [];
    return (data?.members || []).filter((member) => `${member.nom} ${member.dirigeant || ''} ${member.email || ''}`.toLowerCase().includes(query));
  }, [data, search]);

  const updateType = async (member, billingType) => {
    setError('');
    try {
      await api.put(`/api/admin/billing/members/${member.id}/type`, { billing_type: billingType });
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const generateInvoices = async (memberIds) => {
    setBusy(true);
    setError('');
    try {
      const result = await api.post(`/api/admin/billing/seasons/${season}/invoices`, memberIds ? { member_ids: memberIds } : {});
      await reload();
      if (!result.created) setError('Toutes les factures concernées existent déjà.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelInvoice = async (member) => {
    if (!window.confirm(`Annuler la facture ${member.invoice_number} ? Elle restera dans l'historique comptable.`)) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/api/admin/billing/invoices/${member.invoice_id}/cancel`);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!season || !data) return <p style={{ color: 'var(--gray-light)' }}>{error || 'Chargement de la facturation…'}</p>;

  const stats = data.stats;
  const recovery = Number(stats.total_invoiced) > 0
    ? Math.round((Number(stats.total_paid) / Number(stats.total_invoiced)) * 100)
    : 0;
  const missingCount = data.members.filter((member) => !member.invoice_id).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-light)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Saison</label>
          <select value={season} onChange={(event) => setSeason(event.target.value)} style={{ minWidth: 150, padding: '10px 12px', border: '1px solid var(--input-border)', borderRadius: 3, background: '#fff', fontWeight: 600 }}>
            {seasons.map((item) => <option key={item} value={item}>{seasonLabel(item)}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-outline-soft btn-sm" onClick={() => setSettingsOpen((open) => !open)}>⚙ Paramètres</button>
          {stats.paid_count > 0 && <>
            <a className="btn btn-outline-soft btn-sm" href={`/api/admin/billing/seasons/${season}/paid.xlsx`} style={{ textDecoration: 'none' }}>↓ Excel</a>
            <a className="btn btn-outline-soft btn-sm" href={`/api/admin/billing/seasons/${season}/paid.pdf`} style={{ textDecoration: 'none' }}>↓ PDF</a>
          </>}
          <button className="btn btn-red btn-sm" disabled={busy || !data.settings.configured || missingCount === 0} onClick={() => generateInvoices()}>
            {busy ? 'Traitement…' : `Générer les factures manquantes (${missingCount})`}
          </button>
        </div>
      </div>

      {settingsOpen && (
        <SettingsPanel
          season={season}
          settings={data.settings}
          onClose={() => setSettingsOpen(false)}
          onSaved={async () => { await reload(); setSettingsOpen(false); }}
        />
      )}

      {!data.settings.configured && (
        <div style={{ padding: '14px 18px', background: '#FBF0E6', border: '1px solid #F0D6BC', borderRadius: 6, color: '#8A5A22', marginBottom: 22, fontSize: 13.5 }}>
          Configurez les tarifs, la TVA et l'IBAN avant de générer les factures de cette saison.
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 22 }}>
        {[
          ['Facturé TTC', euro(stats.total_invoiced), `${stats.invoiced_count} facture${stats.invoiced_count > 1 ? 's' : ''}`],
          ['Encaissé', euro(stats.total_paid), `${stats.paid_count} adhésion${stats.paid_count > 1 ? 's' : ''} à jour`],
          ['À encaisser', euro(stats.total_outstanding), `${stats.unpaid_count} règlement${stats.unpaid_count > 1 ? 's' : ''} attendu${stats.unpaid_count > 1 ? 's' : ''}`],
          ['Taux de règlement', `${recovery} %`, `TVA encaissée ${euro(stats.vat_collected)}`],
        ].map(([label, value, detail]) => (
          <div key={label} className="card" style={{ borderRadius: 6, padding: 22 }}>
            <div style={{ fontSize: 12, color: 'var(--gray-light)', marginBottom: 10 }}>{label}</div>
            <div className="serif" style={{ fontSize: 28, fontWeight: 600 }}>{value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 8 }}>{detail}</div>
          </div>
        ))}
      </div>

      {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}

      <div className="card" style={{ borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <h3 className="serif" style={{ fontSize: 19, fontWeight: 600 }}>Suivi des adhésions</h3>
            <div style={{ fontSize: 12, color: 'var(--gray-light)', marginTop: 3 }}>{stats.paid_count} à jour sur {stats.total_members} membres</div>
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un membre…" style={{ width: 260, padding: '10px 12px', border: '1px solid var(--input-border)', borderRadius: 3, background: '#fff' }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 1050 }}>
            <thead>
              <tr><th>Entreprise</th><th>Type d'adhésion</th><th>Montant</th><th>Facture</th><th>Situation</th><th>Règlement</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((member) => {
                const expectedHt = member.billing_type === 'sluc_partner'
                  ? data.settings.sluc_partner_amount_ht
                  : data.settings.non_partner_amount_ht;
                return (
                  <tr key={member.id}>
                    <td><strong>{member.nom}</strong><div style={{ fontSize: 11.5, color: 'var(--gray-light)', marginTop: 3 }}>{member.dirigeant}</div></td>
                    <td>
                      <select value={member.billing_type} disabled={Boolean(member.invoice_id)} onChange={(event) => updateType(member, event.target.value)} title={member.invoice_id ? 'Le type est figé pour la facture émise' : ''} style={{ minWidth: 170, padding: '8px 9px', border: '1px solid var(--input-border)', borderRadius: 3, background: member.invoice_id ? 'var(--admin-bg)' : '#fff', fontSize: 12.5 }}>
                        <option value="sluc_partner">Partenaire SLUC</option>
                        <option value="non_partner">Non partenaire SLUC</option>
                      </select>
                    </td>
                    <td>{member.invoice_id ? euro(member.amount_ttc) : <><strong>{euro(expectedHt)}</strong><small style={{ display: 'block', color: 'var(--gray-light)', marginTop: 3 }}>HT avant TVA</small></>}</td>
                    <td>
                      {member.invoice_id ? <>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{member.invoice_number}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--gray-light)', marginTop: 3 }}>{dateLabel(member.issued_at)}</div>
                      </> : <span style={{ color: 'var(--gray-light)' }}>Non générée</span>}
                    </td>
                    <td>
                      {!member.invoice_id && <span className="badge badge-amber">À facturer</span>}
                      {member.status === 'emise' && <span className="badge badge-red">À régler</span>}
                      {member.status === 'payee' && <span className="badge badge-green">À jour</span>}
                    </td>
                    <td>
                      {member.status === 'payee' ? <>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{PAYMENT_LABEL[member.payment_method]}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--gray-light)', marginTop: 3 }}>{dateLabel(member.paid_at)}</div>
                      </> : member.status === 'emise' ? <span style={{ fontSize: 12.5, color: 'var(--gray-light)' }}>Échéance {dateLabel(member.due_date)}</span> : '—'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {!member.invoice_id && <button className="btn-link" disabled={busy || !data.settings.configured} onClick={() => generateInvoices([member.id])}>Générer</button>}
                      {member.invoice_id && <a className="btn-link" href={`/api/admin/billing/invoices/${member.invoice_id}/pdf`} style={{ marginRight: 12 }}>PDF</a>}
                      {member.invoice_id && <button className="btn-link" onClick={() => setPaymentMember(member)}>{member.status === 'payee' ? 'Modifier' : 'Régler'}</button>}
                      {member.status === 'emise' && <button className="btn-link-gray" disabled={busy} onClick={() => cancelInvoice(member)} style={{ marginLeft: 12, color: 'var(--red)' }}>Annuler</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div style={{ padding: 42, textAlign: 'center', color: 'var(--gray-light)' }}>Aucun membre trouvé.</div>}
      </div>

      {paymentMember && (
        <PaymentModal
          member={paymentMember}
          onClose={() => setPaymentMember(null)}
          onSaved={async () => { setPaymentMember(null); await reload(); }}
        />
      )}
    </div>
  );
}
