import { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, FileText, Plus } from 'lucide-react';
import { api, dateParts, seasonLabel, statutLabel } from '../../lib/api.js';
import { copyRichEmail } from '../../lib/emailClipboard.js';
import { downloadOutlookDraft } from '../../lib/outlookDraft.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import Modal from '../Modal.jsx';
import ImageSlot from '../ImageSlot.jsx';
import { AccessCell, CredentialsModal } from './AccessControls.jsx';
import { associationSettings } from '../../lib/siteSettings.js';

/* ---------------- Members ---------------- */

function MemberFormModal({ member, categories, onClose, onSaved }) {
  const [form, setForm] = useState(
    member
      ? { ...member, email: member.email || '', tel: member.tel || '', site: member.site || '', adresse: member.adresse || '', presentation: member.presentation || '' }
      : { nom: '', secteur: '', categorie_id: categories[0]?.id ?? null, dirigeant: '', email: '', tel: '', site: '', adresse: '', presentation: '' }
  );
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'categorie_id' ? (value ? Number(value) : null) : value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const body = {
      nom: form.nom, secteur: form.secteur, categorie_id: form.categorie_id,
      dirigeant: form.dirigeant, email: form.email, tel: form.tel,
      site: form.site, adresse: form.adresse, presentation: form.presentation,
    };
    try {
      if (member) {
        await api.put(`/api/admin/members/${member.id}`, body);
        onSaved();
      } else {
        const result = await api.post('/api/admin/members', body);
        onSaved({ ...result, email: body.email });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth={600} header={{ kicker: 'Membres', title: member ? 'Modifier le membre' : 'Nouveau membre' }}>
      <form onSubmit={submit} style={{ padding: '26px 30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">Entreprise
              <input name="nom" value={form.nom} onChange={onChange} required maxLength={120} />
            </label>
            <label className="field">Catégorie
              <select name="categorie_id" value={form.categorie_id || ''} onChange={onChange}>
                <option value="">Non classée</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <label className="field">Secteur d'activité
            <input name="secteur" value={form.secteur} onChange={onChange} required maxLength={120} />
          </label>
          <label className="field">Dirigeant·e
            <input name="dirigeant" value={form.dirigeant} onChange={onChange} required maxLength={120} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">Email
              <input name="email" type="email" value={form.email} onChange={onChange} maxLength={254} />
            </label>
            <label className="field">Téléphone
              <input name="tel" value={form.tel} onChange={onChange} maxLength={30} />
            </label>
          </div>
          <label className="field">Site web
            <input name="site" value={form.site} onChange={onChange} maxLength={200} />
          </label>
          <label className="field">Adresse de l'entreprise
            <input name="adresse" value={form.adresse} onChange={onChange} maxLength={300} placeholder="Numéro, rue, code postal et ville" />
          </label>
          <label className="field">Présentation
            <textarea name="presentation" value={form.presentation} onChange={onChange} rows={3} maxLength={2000} />
          </label>
        </div>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button type="submit" className="btn btn-red btn-sm" style={{ flex: 1, fontSize: 14.5, padding: 13 }}>
            {member ? 'Enregistrer' : 'Ajouter le membre'}
          </button>
          <button type="button" className="btn btn-outline-soft btn-sm" style={{ fontSize: 14.5, padding: '13px 22px' }} onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
}

const SCOPE_LABELS = { site: 'Site internet', social: 'Réseaux sociaux', print: 'Supports imprimés' };

// Shows the member's recorded image-rights consent: decision, scopes, the
// drawn signature and the audit metadata (date, IP) — the proof of consent.
function ConsentRecordModal({ member, onClose }) {
  const [consent, setConsent] = useState(undefined); // undefined = loading

  useEffect(() => {
    api.get(`/api/admin/members/${member.id}/image-consent`).then((d) => setConsent(d.consent)).catch(() => setConsent(null));
  }, [member.id]);

  return (
    <Modal onClose={onClose} maxWidth={560} header={{ kicker: "Droit à l'image", title: member.nom }}>
      <div style={{ padding: '26px 30px' }}>
        {consent === undefined && <p style={{ color: 'var(--gray-light)' }}>Chargement…</p>}
        {consent === null && <p style={{ color: 'var(--gray-light)' }}>Aucun consentement enregistré pour ce membre.</p>}
        {consent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className={`badge ${consent.decision === 'accepted' ? 'badge-green' : 'badge-red'}`}>
                {consent.decision === 'accepted' ? 'Publication autorisée' : 'Publication refusée'}
              </span>
            </div>
            {consent.decision === 'accepted' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-mid)', marginBottom: 6 }}>Supports autorisés</div>
                <div style={{ fontSize: 13.5, color: 'var(--gray)' }}>
                  {(consent.scopes || '').split(',').filter(Boolean).map((s) => SCOPE_LABELS[s] || s).join(', ') || '—'}
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div><div style={{ fontSize: 11.5, color: 'var(--gray-light)' }}>Signataire</div>{consent.signatory_name}</div>
              <div><div style={{ fontSize: 11.5, color: 'var(--gray-light)' }}>Date</div>{new Date(consent.created_at).toLocaleString('fr-FR')}</div>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--gray-light)' }}>Adresse IP</div>
                {consent.ip_unavailable ? 'Non disponible (ancienne signature)' : (consent.ip || '—')}
              </div>
              <div><div style={{ fontSize: 11.5, color: 'var(--gray-light)' }}>Version</div>{consent.consent_version || '—'}</div>
            </div>
            {consent.signature_png && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-mid)', marginBottom: 6 }}>Signature</div>
                <img src={consent.signature_png} alt="Signature" style={{ maxWidth: '100%', border: '1px solid var(--border)', borderRadius: 6, background: '#fff' }} />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export function MembersTab() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null); // null | 'new' | member
  const [credentials, setCredentials] = useState(null); // { email, tempPassword }
  const [consentView, setConsentView] = useState(null); // member whose consent to view
  const [accessError, setAccessError] = useState('');
  const season = seasonLabel();

  const reload = () =>
    Promise.all([api.get('/api/admin/members'), api.get('/api/admin/categories')])
      .then(([m, c]) => {
        setMembers(m.members);
        setCategories(c.categories);
      })
      .catch(() => {});

  useEffect(() => {
    reload();
  }, []);

  const toggle = async (m) => {
    await api.post(`/api/admin/members/${m.id}/toggle-valide`);
    reload();
  };

  const generateAccess = async (m) => {
    setAccessError('');
    try {
      const d = await api.post(`/api/admin/members/${m.id}/reset-access`);
      setCredentials({ recipient: m.email, tempPassword: d.tempPassword });
      reload();
    } catch (err) {
      setAccessError(err.message);
    }
  };

  const actifs = members.filter((m) => m.valide).length;

  return (
    <div className="card" style={{ borderRadius: 6, overflow: 'hidden' }}>
      <div className="admin-panel-header">
        <div>
          <h3 className="serif" style={{ fontSize: 19, fontWeight: 600 }}>Membres · {actifs} validés</h3>
          <div style={{ fontSize: 12.5, color: 'var(--gray-light)', marginTop: 3 }}>
            Saison {season} · {members.length - actifs} à renouveler
          </div>
        </div>
        <div className="admin-panel-actions">
          <a className="btn btn-outline-soft btn-sm admin-export-btn" href="/api/admin/members.xlsx" download>
            <FileSpreadsheet size={17} aria-hidden="true" />
            <span>Excel (.xlsx)</span>
          </a>
          <a className="btn btn-outline-soft btn-sm admin-export-btn" href="/api/admin/members.pdf" download>
            <FileText size={17} aria-hidden="true" />
            <span>PDF</span>
          </a>
          <button className="btn btn-red btn-sm admin-export-btn" onClick={() => setModal('new')}>
            <Plus size={17} aria-hidden="true" />
            <span>Ajouter un membre</span>
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '14px 24px', background: '#FBF6EE', borderBottom: '1px solid var(--border-soft)', fontSize: 12.5, color: '#8A6D3B', lineHeight: 1.5 }}>
        <span>ⓘ</span>
        <span>
          Un membre non validé pour la saison en cours n'apparaît pas dans l'annuaire public et ne peut pas
          être inscrit aux rencontres. La saison court du 1<sup>er</sup> septembre au 31 août.
        </span>
      </div>
      {accessError && <p className="error-text" style={{ padding: '12px 24px 0' }}>{accessError}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Entreprise</th><th>Secteur</th><th>Dirigeant</th><th>Saison</th><th>Image</th><th>Accès</th><th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.nom}</td>
                <td>{m.secteur}</td>
                <td>{m.dirigeant}</td>
                <td>
                  <span className={`badge ${m.valide ? 'badge-green' : 'badge-red'}`}>
                    {m.valide ? `Validé ${season}` : 'Non validé'}
                  </span>
                </td>
                <td>
                  {m.image_consent ? (
                    <button
                      className={`badge ${m.image_consent === 'accepted' ? 'badge-green' : 'badge-red'}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                      title="Voir le consentement signé"
                      onClick={() => setConsentView(m)}
                    >
                      {m.image_consent === 'accepted' ? 'Autorisé' : 'Refusé'}
                    </button>
                  ) : (
                    <span className="badge badge-amber">En attente</span>
                  )}
                </td>
                <td>
                  <AccessCell
                    hasEmail={!!m.email}
                    hasLogin={m.has_login}
                    mustChangePassword={m.must_change_password}
                    tempPassword={m.temp_password}
                    onGenerate={() => generateAccess(m)}
                  />
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {isAdmin && (
                    <button className="btn-link-gray" style={{ color: 'var(--gray)', marginRight: 14 }} onClick={() => toggle(m)}>
                      {m.valide ? 'Suspendre' : 'Valider'}
                    </button>
                  )}
                  <button className="btn-link" style={{ fontSize: 13 }} onClick={() => setModal(m)}>Modifier</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <MemberFormModal
          member={modal === 'new' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={(result) => {
            setModal(null);
            reload();
            if (result?.tempPassword) {
              setCredentials({ recipient: result.email, tempPassword: result.tempPassword });
            } else if (result?.accessError) {
              setAccessError(`Membre créé, mais accès non créé : ${result.accessError}`);
            }
          }}
        />
      )}
      {credentials && (
        <CredentialsModal
          recipient={credentials.recipient}
          tempPassword={credentials.tempPassword}
          onClose={() => setCredentials(null)}
        />
      )}
      {consentView && <ConsentRecordModal member={consentView} onClose={() => setConsentView(null)} />}
    </div>
  );
}

/* ---------------- Rencontres ---------------- */

function RencFormModal({ renc, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(
    renc
      ? { titre: renc.titre, date_renc: String(renc.date_renc).slice(0, 10), heure: renc.heure, lieu: renc.lieu, description: renc.description, places: renc.places, participants_par_compte: renc.participants_par_compte || 1 }
      : { titre: '', date_renc: '', heure: '', lieu: '', description: '', places: 30, participants_par_compte: 1 }
  );
  const [image, setImage] = useState(renc?.image_path || '');
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (renc) await api.put(`/api/admin/rencontres/${renc.id}`, form);
      else await api.post('/api/admin/rencontres', form);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Supprimer cette rencontre et toutes ses inscriptions ?')) return;
    try {
      await api.del(`/api/admin/rencontres/${renc.id}`);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth={560} header={{ kicker: 'Rencontres', title: renc ? 'Gérer la rencontre' : 'Nouvelle rencontre' }}>
      <form onSubmit={submit} style={{ padding: '26px 30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 120, height: 84, flexShrink: 0 }}>
              <ImageSlot
                endpoint={renc ? `/api/admin/rencontres/${renc.id}/image` : undefined}
                value={image}
                disabled={!renc}
                placeholder={renc ? 'Photo de la rencontre' : "Enregistrez d'abord la rencontre"}
                onUploaded={setImage}
              />
            </div>
            <label className="field" style={{ flex: 1 }}>Titre de la rencontre
              <input name="titre" value={form.titre} onChange={onChange} required maxLength={200} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label className="field" style={{ gridColumn: 'span 2' }}>Date
              <input name="date_renc" type="date" value={form.date_renc} onChange={onChange} required />
            </label>
            <label className="field">Heure
              <input name="heure" value={form.heure} onChange={onChange} placeholder="18h30" maxLength={20} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <label className="field">Lieu
              <input name="lieu" value={form.lieu} onChange={onChange} required maxLength={200} />
            </label>
            <label className="field">Places totales
              <input name="places" type="number" min={0} max={100000} value={form.places} onChange={onChange} required />
            </label>
            <label className="field">Par compte
              <input name="participants_par_compte" type="number" min={1} max={100} value={form.participants_par_compte} onChange={onChange} required />
            </label>
          </div>
          <label className="field">Description
            <textarea name="description" value={form.description} onChange={onChange} rows={3} maxLength={2000} />
          </label>
        </div>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' }}>
          <button type="submit" className="btn btn-red btn-sm" style={{ flex: 1, fontSize: 14.5, padding: 13 }}>
            {renc ? 'Enregistrer' : 'Créer la rencontre'}
          </button>
          {renc && user.role === 'admin' && (
            <button type="button" className="btn-link-gray" style={{ fontSize: 13.5, padding: '13px 10px' }} onClick={remove}>
              Supprimer
            </button>
          )}
          <button type="button" className="btn btn-outline-soft btn-sm" style={{ fontSize: 14.5, padding: '13px 22px' }} onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
}

function escHtml(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Composer + preview of the ready-to-send HTML invitation email generated
// server-side for one rencontre. Every text zone (salutation, intro,
// conclusion, signature) is editable — the preview regenerates as the
// admin types; clearing a zone removes its block from the email.
// "Copier l'email" puts the rendered HTML on the clipboard (rich text
// where supported, so pasting into a mail client keeps the design); the
// .html download covers the rest.
function EmailModal({ renc, onClose }) {
  const [texts, setTexts] = useState(null); // editable zones, prefilled by the server
  const [data, setData] = useState(null); // { subject, html, inscriptionUrl }
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const skipRegen = useRef(true);

  const generate = (t) =>
    api.post(`/api/admin/rencontres/${renc.id}/email`, {
      // The browser knows the site's real public origin (scheme included) —
      // the server can't always tell behind a reverse proxy.
      base: window.location.origin,
      ...(t || {}),
    });

  useEffect(() => {
    generate(null)
      .then((d) => {
        setData(d);
        skipRegen.current = true;
        setTexts(d.texts);
      })
      .catch((e) => setError(e.message));
  }, [renc.id]);

  // Regenerate the preview as the admin edits, debounced.
  useEffect(() => {
    if (!texts) return;
    if (skipRegen.current) {
      skipRegen.current = false;
      return;
    }
    const id = setTimeout(() => {
      generate(texts).then(setData).catch((e) => setError(e.message));
    }, 450);
    return () => clearTimeout(id);
  }, [texts]);

  const onText = (e) => setTexts({ ...texts, [e.target.name]: e.target.value });

  const flash = (what) => {
    setCopied(what);
    setTimeout(() => setCopied(''), 1800);
  };

  const copyEmail = async () => {
    setError('');
    try {
      await copyRichEmail(data.html, `${data.subject}\n${data.inscriptionUrl}`);
      flash('email');
    } catch {
      setError('Copie impossible dans ce navigateur — utilisez le téléchargement.');
    }
  };

  const copyText = async (text, what) => {
    setError('');
    try {
      await navigator.clipboard.writeText(text);
      flash(what);
    } catch {
      setError('Copie impossible dans ce navigateur.');
    }
  };

  const downloadOutlook = async () => {
    const slug = renc.titre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    try {
      setError('');
      await downloadOutlookDraft({
        subject: data.subject,
        html: data.html,
        filename: `invitation-${slug}-outlook.eml`,
      });
      flash('outlook');
    } catch (err) {
      setError(err.message || "Impossible de créer le brouillon Outlook.");
    }
  };

  const download = () => {
    const blob = new Blob([data.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = renc.titre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    a.href = url;
    a.download = `invitation-${slug}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <Modal onClose={onClose} maxWidth={1000} header={{ kicker: "Email d'invitation", title: renc.titre }}>
      {!data && !error && <p style={{ padding: '30px 32px', color: 'var(--gray-light)' }}>Génération de l'email…</p>}
      {error && <p className="error-text" style={{ padding: '20px 32px 0' }}>{error}</p>}
      {data && texts && (
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 26, padding: '24px 32px 30px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="field">Salutation
              <input name="greeting" value={texts.greeting} onChange={onText} maxLength={300} />
            </label>
            <label className="field">Message d'introduction
              <textarea name="intro" value={texts.intro} onChange={onText} rows={4} maxLength={2000} />
            </label>
            <label className="field">Message de conclusion
              <textarea name="outro" value={texts.outro} onChange={onText} rows={4} maxLength={2000} />
            </label>
            <label className="field">Signature
              <textarea name="signature" value={texts.signature} onChange={onText} rows={2} maxLength={500} />
            </label>
            <p style={{ fontSize: 12, color: 'var(--gray-light)', lineHeight: 1.55 }}>
              Les détails de la rencontre (titre, description, date, lieu, places) sont repris
              automatiquement. Videz un champ pour retirer ce bloc de l'email.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              <button className="btn btn-red btn-sm" style={{ fontSize: 13.5, padding: '12px 18px' }} onClick={downloadOutlook}>
                {copied === 'outlook' ? '✓ Brouillon téléchargé' : 'Télécharger le brouillon Outlook'}
              </button>
              <button className="btn btn-outline-soft btn-sm" style={{ fontSize: 13, padding: '11px 18px' }} onClick={copyEmail}>
                {copied === 'email' ? '✓ Copié' : "Copier l'email (autres logiciels)"}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" style={{ flex: 1, background: 'var(--admin-bg)', fontSize: 13, padding: '11px 10px' }} onClick={() => copyText(data.subject, 'subject')}>
                  {copied === 'subject' ? '✓ Copié' : "Copier l'objet"}
                </button>
                <button className="btn btn-sm" style={{ flex: 1, background: 'var(--admin-bg)', fontSize: 13, padding: '11px 10px' }} onClick={() => copyText(data.inscriptionUrl, 'link')}>
                  {copied === 'link' ? '✓ Copié' : 'Copier le lien'}
                </button>
              </div>
              <button className="btn btn-outline-soft btn-sm" style={{ fontSize: 13, padding: '11px 18px' }} onClick={download}>
                ↓ Télécharger (.html)
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray-light)', lineHeight: 1.55 }}>
              Pour Outlook, ouvrez le fichier .eml téléchargé : il charge directement le vrai corps HTML sans passer par le presse-papiers. La copie reste disponible pour les autres logiciels de messagerie.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--gray-light)', marginBottom: 10 }}>
              <strong style={{ color: 'var(--gray)' }}>Objet :</strong> {data.subject}
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              <iframe title="Aperçu de l'email" srcDoc={data.html} sandbox="" style={{ display: 'block', width: '100%', height: 560, border: 'none', background: '#F2EEE8' }} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ParticipantsModal({ renc, associationName, onClose, onEdit, onCancel, refreshKey }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const { jour, mois } = dateParts(renc.date_renc);
  const meta = `${jour} ${mois} · ${renc.heure} · ${renc.lieu}`;

  useEffect(() => {
    api.get(`/api/admin/rencontres/${renc.id}/inscriptions`).then((d) => setRows(d.inscriptions)).catch(() => {});
  }, [renc.id, refreshKey]);

  const exportExcel = () => {
    let html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead>';
    const imgLabel = (v) => (v === true ? 'Autorisée' : v === false ? 'Refusée' : '');
    html += '<tr><th>Participant</th><th>Entreprise</th><th>Email</th><th>Téléphone</th><th>Rencontre</th><th>Droit image</th><th>Statut</th></tr></thead><tbody>';
    rows.forEach((p) => {
      html += `<tr><td>${escHtml(p.nom)}</td><td>${escHtml(p.entreprise)}</td><td>${escHtml(p.email)}</td><td>${escHtml(p.tel)}</td><td>${escHtml(renc.titre)}</td><td>${escHtml(imgLabel(p.image_consent))}</td><td>${escHtml(statutLabel(p.statut))}</td></tr>`;
    });
    html += '</tbody></table></body></html>';
    const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = renc.titre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    a.href = url;
    a.download = `inscrits-${slug}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const print = () => {
    let body = '';
    const imgLabel = (v) => (v === true ? 'Autorisée' : v === false ? 'Refusée' : '—');
    rows.forEach((p, i) => {
      body += `<tr><td>${i + 1}</td><td>${escHtml(p.nom)}</td><td>${escHtml(p.entreprise)}</td><td>${escHtml(p.email)}</td><td>${escHtml(p.tel)}</td><td>${escHtml(imgLabel(p.image_consent))}</td><td>${escHtml(statutLabel(p.statut))}</td></tr>`;
    });
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>Inscrits — ${escHtml(renc.titre)}</title>`
      + '<style>body{font-family:Arial,Helvetica,sans-serif;color:#1B1B1B;padding:32px}h1{font-size:22px;margin:0 0 4px}.meta{color:#666;font-size:13px;margin-bottom:20px}'
      + 'table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #ddd}th{background:#f4f1ec;text-transform:uppercase;font-size:11px;letter-spacing:.05em}'
      + '.brand{color:#C1272D;font-weight:700;font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px}</style></head><body>'
      + `<div class="brand">${escHtml(associationName)}</div>`
      + `<h1>${escHtml(renc.titre)}</h1><div class="meta">${escHtml(meta)} — ${rows.length} inscrits</div>`
      + '<table><thead><tr><th>#</th><th>Participant</th><th>Entreprise</th><th>Email</th><th>Téléphone</th><th>Droit image</th><th>Statut</th></tr></thead><tbody>'
      + body + '</tbody></table></body></html>';
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(doc);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  return (
    <Modal onClose={onClose} maxWidth={720} header={{ kicker: 'Liste des inscrits', title: renc.titre, meta: `${meta} · ${rows.length} inscrits` }}>
      <div style={{ padding: '22px 32px', display: 'flex', gap: 12, borderBottom: '1px solid var(--border-soft)' }}>
        <button className="btn btn-sm" style={{ background: 'var(--admin-bg)', color: 'var(--ink)', fontSize: 13.5, padding: '11px 18px' }} onClick={print}>
          ⎙ Imprimer
        </button>
        <button className="btn btn-sm" style={{ background: '#1E7B45', color: '#fff', fontSize: 13.5, padding: '11px 18px' }} onClick={exportExcel}>
          ↓ Exporter Excel
        </button>
      </div>
      <div style={{ padding: '6px 0 12px' }}>
        <table className="table">
          <thead>
            <tr><th>Participant</th><th>Entreprise</th><th>Image</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.nom}</td>
                <td>{p.entreprise}</td>
                <td>
                  <span
                    className={`badge ${p.image_consent === true ? 'badge-green' : p.image_consent === false ? 'badge-red' : 'badge-amber'}`}
                    title="Autorisation de publication de l'image du participant"
                  >
                    {p.image_consent === true ? 'Autorisée' : p.image_consent === false ? 'Refusée' : '—'}
                  </span>
                </td>
                <td><span className={`badge ${p.statut === 'confirmee' ? 'badge-green' : 'badge-amber'}`}>{statutLabel(p.statut)}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn-link" style={{ fontSize: 12.5, marginRight: 12 }} onClick={() => onEdit(p)}>Modifier</button>
                  {user.role === 'admin' && (
                    <button className="btn-link-gray" style={{ fontSize: 12.5 }} onClick={() => onCancel(p)}>Annuler</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-light)', fontSize: 14 }}>
            Aucun inscrit pour cette rencontre.
          </div>
        )}
      </div>
    </Modal>
  );
}

export function RencontresTab() {
  const [rencontres, setRencontres] = useState([]);
  const [formModal, setFormModal] = useState(null); // null | 'new' | renc
  const [participantsRenc, setParticipantsRenc] = useState(null);
  const [emailRenc, setEmailRenc] = useState(null);
  const [editInscr, setEditInscr] = useState(null);
  const [cancelInscr, setCancelInscr] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [associationName, setAssociationName] = useState(associationSettings().association_name);

  const reload = () => {
    api.get('/api/admin/rencontres').then((d) => setRencontres(d.rencontres)).catch(() => {});
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    reload();
    api.get('/api/public/bootstrap')
      .then((data) => setAssociationName(associationSettings(data.content).association_name))
      .catch(() => {});
  }, []);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <h3 className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Gestion des rencontres</h3>
        <button className="btn btn-red btn-sm" style={{ fontSize: 13, padding: '10px 18px' }} onClick={() => setFormModal('new')}>
          + Créer une rencontre
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rencontres.map((e) => {
          const { jour, mois } = dateParts(e.date_renc);
          return (
            <div key={e.id} className="card" style={{ borderRadius: 6, padding: '22px 24px', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 24, alignItems: 'center' }}>
              <div style={{ width: 56, textAlign: 'center', background: 'var(--admin-bg)', borderRadius: 5, padding: '10px 0', lineHeight: 1 }}>
                <div className="serif" style={{ fontSize: 24, fontWeight: 600 }}>{jour}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray-light)', letterSpacing: '.1em' }}>{mois}</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{e.titre}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-light)', marginTop: 4 }}>{e.heure} · {e.lieu}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--red)' }}>{e.inscrits}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-light)' }}>inscrits / {e.places}</div>
                <div style={{ fontSize: 10.5, color: 'var(--gray-light)', marginTop: 3 }}>max. {e.participants_par_compte} / compte</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-dark btn-sm" style={{ fontSize: 13, padding: '9px 16px' }} onClick={() => setParticipantsRenc(e)}>
                  Inscrits ({e.inscrits})
                </button>
                <button className="btn btn-sm" style={{ background: 'var(--admin-bg)', fontSize: 13, padding: '9px 16px' }} onClick={() => setEmailRenc(e)} title="Générer l'email d'invitation">
                  ✉ Email
                </button>
                <button className="btn btn-sm" style={{ background: 'var(--admin-bg)', fontSize: 13, padding: '9px 16px' }} onClick={() => setFormModal(e)}>
                  Gérer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {formModal && (
        <RencFormModal
          renc={formModal === 'new' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={() => { setFormModal(null); reload(); }}
        />
      )}
      {participantsRenc && (
        <ParticipantsModal
          renc={participantsRenc}
          associationName={associationName}
          refreshKey={refreshKey}
          onClose={() => setParticipantsRenc(null)}
          onEdit={setEditInscr}
          onCancel={setCancelInscr}
        />
      )}
      {emailRenc && <EmailModal renc={emailRenc} onClose={() => setEmailRenc(null)} />}
      {editInscr && (
        <InscriptionEditModal
          inscription={editInscr}
          rencontres={rencontres}
          onClose={() => setEditInscr(null)}
          onSaved={() => { setEditInscr(null); reload(); }}
          onRequestCancel={(p) => { setEditInscr(null); setCancelInscr(p); }}
        />
      )}
      {cancelInscr && (
        <CancelConfirmModal
          inscription={cancelInscr}
          onClose={() => setCancelInscr(null)}
          onDone={() => { setCancelInscr(null); reload(); }}
        />
      )}
    </>
  );
}

/* ---------------- Inscriptions ---------------- */

function InscriptionEditModal({ inscription, rencontres, onClose, onSaved, onRequestCancel }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nom: inscription.nom,
    entreprise: inscription.entreprise,
    email: inscription.email || '',
    tel: inscription.tel || '',
    rencontre_id: inscription.rencontre_id,
    statut: inscription.statut,
  });
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'rencontre_id' ? Number(value) : value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/api/admin/inscriptions/${inscription.id}`, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth={520} header={{ kicker: 'Inscription', title: "Modifier l'inscription" }}>
      <form onSubmit={submit} style={{ padding: '26px 30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">Participant
              <input name="nom" value={form.nom} onChange={onChange} required maxLength={120} />
            </label>
            <label className="field">Entreprise
              <input name="entreprise" value={form.entreprise} onChange={onChange} required maxLength={120} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">Email
              <input name="email" type="email" value={form.email} onChange={onChange} maxLength={254} />
            </label>
            <label className="field">Téléphone
              <input name="tel" value={form.tel} onChange={onChange} maxLength={30} />
            </label>
          </div>
          <label className="field">Rencontre
            <select name="rencontre_id" value={form.rencontre_id} onChange={onChange}>
              {rencontres.map((r) => <option key={r.id} value={r.id}>{r.titre}</option>)}
            </select>
          </label>
          <label className="field">Statut
            <select name="statut" value={form.statut} onChange={onChange}>
              <option value="confirmee">Confirmée</option>
              <option value="en_attente">En attente</option>
            </select>
          </label>
        </div>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' }}>
          <button type="submit" className="btn btn-red btn-sm" style={{ flex: 1, fontSize: 14.5, padding: 13 }}>Enregistrer</button>
          {user.role === 'admin' && (
            <button type="button" className="btn-link-gray" style={{ fontSize: 13.5, padding: '13px 10px' }} onClick={() => onRequestCancel(inscription)}>
              Annuler l'inscription
            </button>
          )}
          <button type="button" className="btn btn-outline-soft btn-sm" style={{ fontSize: 14.5, padding: '13px 22px' }} onClick={onClose}>
            Fermer
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CancelConfirmModal({ inscription, onClose, onDone }) {
  const [error, setError] = useState('');
  const confirm = async () => {
    try {
      await api.del(`/api/admin/inscriptions/${inscription.id}`);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <Modal onClose={onClose} maxWidth={440}>
      <div style={{ padding: '36px 34px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F6E4E4', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 20px' }}>⚠</div>
        <h3 className="serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Annuler cette inscription ?</h3>
        <p style={{ fontSize: 15, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 6 }}>
          Retirer <strong>{inscription.nom}</strong> de la liste
        </p>
        <p style={{ fontSize: 14, color: 'var(--gray-light)', marginBottom: 28 }}>{inscription.rencontre}</p>
        {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-red btn-sm" style={{ flex: 1, fontSize: 14.5, padding: 13 }} onClick={confirm}>
            Annuler l'inscription
          </button>
          <button className="btn btn-outline-soft btn-sm" style={{ flex: 1, fontSize: 14.5, padding: 13 }} onClick={onClose}>
            Retour
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function InscriptionsTab() {
  const { user } = useAuth();
  const [inscriptions, setInscriptions] = useState([]);
  const [rencontres, setRencontres] = useState([]);
  const [edit, setEdit] = useState(null);
  const [cancel, setCancel] = useState(null);

  const reload = () =>
    Promise.all([api.get('/api/admin/inscriptions'), api.get('/api/admin/rencontres')])
      .then(([i, r]) => {
        setInscriptions(i.inscriptions);
        setRencontres(r.rencontres);
      })
      .catch(() => {});

  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="card" style={{ borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 className="serif" style={{ fontSize: 19, fontWeight: 600 }}>Inscriptions aux rencontres</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr><th>Participant</th><th>Entreprise</th><th>Rencontre</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {inscriptions.map((i) => (
              <tr key={i.id}>
                <td>{i.nom}</td>
                <td>{i.entreprise}</td>
                <td>{i.rencontre}</td>
                <td><span className={`badge ${i.statut === 'confirmee' ? 'badge-green' : 'badge-amber'}`}>{statutLabel(i.statut)}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn-link" style={{ fontSize: 13, marginRight: 14 }} onClick={() => setEdit(i)}>Modifier</button>
                  {user.role === 'admin' && (
                    <button className="btn-link-gray" onClick={() => setCancel(i)}>Annuler</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <InscriptionEditModal
          inscription={edit}
          rencontres={rencontres}
          onClose={() => setEdit(null)}
          onSaved={() => { setEdit(null); reload(); }}
          onRequestCancel={(p) => { setEdit(null); setCancel(p); }}
        />
      )}
      {cancel && (
        <CancelConfirmModal
          inscription={cancel}
          onClose={() => setCancel(null)}
          onDone={() => { setCancel(null); reload(); }}
        />
      )}
    </div>
  );
}
