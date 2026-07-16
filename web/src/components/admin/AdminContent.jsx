import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { ASSOCIATION_DEFAULTS, associationSettings } from '../../lib/siteSettings.js';
import ImageSlot from '../ImageSlot.jsx';

export function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState('');
  const [newCat, setNewCat] = useState('');
  const [error, setError] = useState('');

  const reload = () =>
    api.get('/api/admin/categories').then((d) => setCategories(d.categories)).catch(() => {});

  useEffect(() => {
    reload();
  }, []);

  const save = async (id) => {
    if (!draft.trim()) return setEditId(null);
    try {
      await api.put(`/api/admin/categories/${id}`, { name: draft.trim() });
      setEditId(null);
      setDraft('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ? Les entreprises concernées deviendront « Non classée ».`)) return;
    try {
      await api.del(`/api/admin/categories/${c.id}`);
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    setError('');
    try {
      await api.post('/api/admin/categories', { name: newCat.trim() });
      setNewCat('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid-2" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
      <div className="card" style={{ borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 className="serif" style={{ fontSize: 19, fontWeight: 600 }}>Catégories d'entreprises</h3>
          <span style={{ fontSize: 13, color: 'var(--gray-light)' }}>{categories.length} catégories</span>
        </div>
        <table className="table">
          <thead>
            <tr><th>Catégorie</th><th>Entreprises</th><th></th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: '12px 24px' }}>
                  {editId === c.id ? (
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={80}
                      autoFocus
                      style={{ fontSize: 14, padding: '8px 12px', border: '1px solid var(--red)', borderRadius: 3, background: 'var(--bg)', width: '100%', maxWidth: 260 }}
                    />
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                  )}
                </td>
                <td style={{ padding: '12px 24px' }}>{c.count}</td>
                <td style={{ padding: '12px 24px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {editId === c.id ? (
                    <>
                      <button className="btn btn-red btn-sm" style={{ fontSize: 12.5, padding: '8px 14px', marginRight: 6 }} onClick={() => save(c.id)}>
                        Enregistrer
                      </button>
                      <button className="btn-link-gray" style={{ fontSize: 12.5, padding: 8 }} onClick={() => { setEditId(null); setDraft(''); }}>
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-link" style={{ fontSize: 13, marginRight: 14 }} onClick={() => { setEditId(c.id); setDraft(c.name); }}>
                        Renommer
                      </button>
                      <button className="btn-link-gray" onClick={() => remove(c)}>Supprimer</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && <p className="error-text" style={{ padding: '12px 24px' }}>{error}</p>}
      </div>
      <div className="card" style={{ borderRadius: 6, padding: 26 }}>
        <h3 className="serif" style={{ fontSize: 19, fontWeight: 600, marginBottom: 8 }}>Nouvelle catégorie</h3>
        <p style={{ fontSize: 13.5, color: 'var(--gray-light)', lineHeight: 1.55, marginBottom: 18 }}>
          Ajoutez une catégorie pour classer les entreprises de l'annuaire.
        </p>
        <form onSubmit={add}>
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Ex. Restauration & Hôtellerie"
            maxLength={80}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--input-border)', borderRadius: 3, background: 'var(--bg)', marginBottom: 14 }}
          />
          <button type="submit" className="btn btn-red" style={{ width: '100%', fontSize: 14.5, padding: 13, borderRadius: 3 }}>
            + Ajouter la catégorie
          </button>
        </form>
      </div>
    </div>
  );
}

export function ContenuTab() {
  const [content, setContent] = useState({ hero_quote_text: '', hero_quote_author: '', hero_photo: '' });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/public/bootstrap').then((d) => setContent({ hero_photo: '', ...d.content })).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put('/api/admin/content', {
        hero_quote_text: content.hero_quote_text,
        hero_quote_author: content.hero_quote_author,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid-2" style={{ gap: 20, alignItems: 'start', maxWidth: 900 }}>
      <div className="card" style={{ borderRadius: 6, padding: 26 }}>
        <h3 className="serif" style={{ fontSize: 19, fontWeight: 600, marginBottom: 8 }}>Section « L'esprit du Club »</h3>
        <p style={{ fontSize: 13.5, color: 'var(--gray-light)', lineHeight: 1.55, marginBottom: 20 }}>
          Photo, citation et signature affichées sur la page d'accueil.
        </p>
        <form onSubmit={save}>
          <label className="field" style={{ marginBottom: 16 }}>Citation
            <textarea
              rows={2}
              value={content.hero_quote_text}
              maxLength={300}
              onChange={(e) => { setContent({ ...content, hero_quote_text: e.target.value }); setSaved(false); }}
              style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 400 }}
            />
          </label>
          <label className="field">Signature
            <input
              value={content.hero_quote_author}
              maxLength={120}
              onChange={(e) => { setContent({ ...content, hero_quote_author: e.target.value }); setSaved(false); }}
            />
          </label>
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
            <button type="submit" className="btn btn-red btn-sm" style={{ fontSize: 14, padding: '12px 22px' }}>Enregistrer</button>
            {saved && <span className="success-text">✓ Contenu enregistré</span>}
          </div>
        </form>
      </div>
      <div className="card" style={{ borderRadius: 6, padding: 26 }}>
        <h3 className="serif" style={{ fontSize: 19, fontWeight: 600, marginBottom: 8 }}>Photo</h3>
        <p style={{ fontSize: 13.5, color: 'var(--gray-light)', lineHeight: 1.55, marginBottom: 18 }}>
          Déposez une image ou cliquez pour en choisir une — elle remplace celle affichée sur l'accueil.
        </p>
        <div style={{ aspectRatio: '4/5', maxWidth: 260 }}>
          <ImageSlot
            endpoint="/api/admin/content/hero-photo"
            value={content.hero_photo}
            placeholder="Photo — networking en tribune VIP"
            onUploaded={(path) => setContent({ ...content, hero_photo: path })}
          />
        </div>
      </div>
    </div>
  );
}

export function ParametresTab() {
  const [settings, setSettings] = useState(ASSOCIATION_DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/public/bootstrap')
      .then((data) => setSettings(associationSettings(data.content)))
      .catch((err) => setError(err.message));
  }, []);

  const onChange = (event) => {
    setSettings({ ...settings, [event.target.name]: event.target.value });
    setSaved(false);
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const body = Object.fromEntries(
        Object.keys(ASSOCIATION_DEFAULTS).map((key) => [key, settings[key] || ''])
      );
      await api.put('/api/admin/content', body);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={save} style={{ maxWidth: 980, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ borderRadius: 6, padding: 26 }}>
        <h3 className="serif" style={{ fontSize: 19, fontWeight: 600, marginBottom: 8 }}>Identité et coordonnées</h3>
        <p style={{ fontSize: 13.5, color: 'var(--gray-light)', lineHeight: 1.55, marginBottom: 22 }}>
          Ces informations sont reprises dans le site public et les e-mails générés.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="field">Nom officiel de l'association
            <input name="association_name" value={settings.association_name} onChange={onChange} required maxLength={160} />
          </label>
          <label className="field">Adresse
            <textarea name="association_address" value={settings.association_address} onChange={onChange} rows={3} maxLength={500} placeholder="Adresse complète" />
          </label>
          <div className="grid-2" style={{ gap: 12 }}>
            <label className="field">E-mail
              <input name="association_email" type="email" value={settings.association_email} onChange={onChange} maxLength={254} />
            </label>
            <label className="field">Téléphone
              <input name="association_phone" type="tel" value={settings.association_phone} onChange={onChange} maxLength={40} />
            </label>
          </div>
          <label className="field">SIRET
            <input
              name="association_siret"
              value={settings.association_siret}
              onChange={onChange}
              inputMode="numeric"
              maxLength={20}
              placeholder="14 chiffres"
              aria-describedby="association-siret-help"
            />
            <span id="association-siret-help" style={{ marginTop: 5, fontSize: 11.5, color: 'var(--gray-light)', fontWeight: 400 }}>
              Les espaces sont acceptés; le numéro doit contenir exactement 14 chiffres.
            </span>
          </label>
          <div className="grid-2" style={{ gap: 12 }}>
            <label className="field">Contact principal
              <input name="association_contact" value={settings.association_contact} onChange={onChange} maxLength={160} placeholder="Nom et fonction" />
            </label>
            <label className="field">Site web
              <input name="association_website" type="url" value={settings.association_website} onChange={onChange} maxLength={300} placeholder="https://…" />
            </label>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <label className="field">Page Facebook
              <input name="association_facebook_url" type="url" value={settings.association_facebook_url} onChange={onChange} maxLength={500} />
            </label>
            <label className="field">Page LinkedIn
              <input name="association_linkedin_url" type="url" value={settings.association_linkedin_url} onChange={onChange} maxLength={500} />
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderRadius: 6, padding: 26 }}>
        <h3 className="serif" style={{ fontSize: 19, fontWeight: 600, marginBottom: 8 }}>Gouvernance</h3>
        <p style={{ fontSize: 13.5, color: 'var(--gray-light)', lineHeight: 1.55, marginBottom: 22 }}>
          Laissez un poste vide pour ne pas l'afficher sur la page Association.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2" style={{ gap: 12 }}>
            <label className="field">Président ou présidente
              <input name="association_president" value={settings.association_president} onChange={onChange} maxLength={160} />
            </label>
            <label className="field">Vice-président ou vice-présidente
              <input name="association_vice_president" value={settings.association_vice_president} onChange={onChange} maxLength={160} />
            </label>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <label className="field">Trésorier ou trésorière
              <input name="association_treasurer" value={settings.association_treasurer} onChange={onChange} maxLength={160} />
            </label>
            <label className="field">Secrétaire
              <input name="association_secretary" value={settings.association_secretary} onChange={onChange} maxLength={160} />
            </label>
          </div>
          <label className="field">Membres du conseil d'administration
            <textarea
              name="association_board_members"
              value={settings.association_board_members}
              onChange={onChange}
              rows={6}
              maxLength={3000}
              placeholder="Une personne par ligne"
            />
          </label>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="submit" className="btn btn-red btn-sm" style={{ fontSize: 14, padding: '12px 22px' }}>Enregistrer les paramètres</button>
        {saved && <span className="success-text">✓ Paramètres enregistrés</span>}
      </div>
    </form>
  );
}
