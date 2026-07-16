import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import Modal from '../Modal.jsx';
import ImageSlot from '../ImageSlot.jsx';

// Manages the gallery of one past event: unlimited photos, add / delete /
// set-as-principal. Only available once the event exists (has an id).
// `refused` lists participants of the linked rencontre who declined image
// publication, warned about before photos are added.
function PhotoManager({ eventId, photos, setPhotos, refused = [] }) {
  const { user } = useAuth();
  const [error, setError] = useState('');

  const add = async (path, id) => {
    // ImageSlot uploads then hands us the stored path; the route also
    // returns the new photo id, but ImageSlot only forwards the path, so we
    // reload the event's photos to stay in sync.
    setError('');
    try {
      const d = await api.get(`/api/admin/rencontres-passees`);
      const ev = d.rencontresPassees.find((e) => e.id === eventId);
      if (ev) setPhotos(ev.photos || []);
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (photo) => {
    setError('');
    try {
      await api.del(`/api/admin/rencontres-passees/${eventId}/photos/${photo.id}`);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const setPrincipal = async (photo) => {
    setError('');
    try {
      await api.post(`/api/admin/rencontres-passees/${eventId}/photos/${photo.id}/principale`);
      setPhotos((prev) => [photo, ...prev.filter((p) => p.id !== photo.id)]);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      {refused.length > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', background: '#F6E4E4', border: '1px solid #E3B7B5', borderRadius: 6, fontSize: 12.5, color: '#8A2C29', lineHeight: 1.5, marginBottom: 14 }}>
          <span style={{ fontSize: 15 }}>⚠</span>
          <span>
            <strong>{refused.length} participant{refused.length > 1 ? 's ont' : ' a'} refusé la publication de {refused.length > 1 ? 'leur' : 'son'} image</strong> :{' '}
            {refused.join(', ')}. Ne {refused.length > 1 ? 'les' : 'le/la'} faites pas figurer sur les photos publiées ici.
          </span>
        </div>
      )}
      <div className="field" style={{ marginBottom: 8 }}>Photos ({photos.length})</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10 }}>
        {photos.map((p, idx) => (
          <div key={p.id} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 4, overflow: 'hidden', border: idx === 0 ? '2px solid var(--red)' : '1px solid var(--border)' }}>
            <img src={p.path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {idx === 0 && (
              <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, letterSpacing: '.04em' }}>PRINCIPALE</span>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', gap: 4, padding: 4, background: 'linear-gradient(transparent, rgba(0,0,0,.55))' }}>
              {idx !== 0 && (
                <button type="button" title="Définir comme principale" onClick={() => setPrincipal(p)} style={{ background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer', borderRadius: 3, fontSize: 11, padding: '2px 6px' }}>★</button>
              )}
              {user.role === 'admin' && (
                <button type="button" title="Supprimer" onClick={() => remove(p)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer', borderRadius: 3, fontSize: 11, padding: '2px 6px', color: 'var(--red)' }}>✕</button>
              )}
            </div>
          </div>
        ))}
        <div style={{ aspectRatio: '4/3' }}>
          <ImageSlot endpoint={`/api/admin/rencontres-passees/${eventId}/photos`} placeholder="+ Ajouter une photo" onUploaded={add} />
        </div>
      </div>
      {error && <p className="error-text" style={{ marginTop: 10 }}>{error}</p>}
    </div>
  );
}

function PastEventFormModal({ event, rencontres, onClose, onSaved }) {
  const { user } = useAuth();
  const [savedId, setSavedId] = useState(event?.id ?? null);
  const [form, setForm] = useState(
    event
      ? { date_label: event.date_label, lieu: event.lieu, titre: event.titre, texte: event.texte, participants: event.participants, rencontre_id: event.rencontre_id || '' }
      : { date_label: '', lieu: '', titre: '', texte: '', participants: 0, rencontre_id: '' }
  );
  const [photos, setPhotos] = useState(event?.photos || []);
  const [refused, setRefused] = useState([]);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const linked = form.rencontre_id ? rencontres.find((r) => r.id === Number(form.rencontre_id)) : null;

  // When the event is linked to a rencontre, list the participants who
  // declined image publication so the admin avoids publishing their photo.
  useEffect(() => {
    if (!form.rencontre_id) { setRefused([]); return; }
    api.get(`/api/admin/rencontres/${form.rencontre_id}/inscriptions`)
      .then((d) => setRefused(d.inscriptions.filter((i) => i.image_consent === false).map((i) => i.nom)))
      .catch(() => setRefused([]));
  }, [form.rencontre_id]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const body = {
      date_label: form.date_label,
      lieu: form.lieu,
      titre: form.titre,
      texte: form.texte,
      participants: Number(form.participants) || 0,
      rencontre_id: form.rencontre_id ? Number(form.rencontre_id) : null,
    };
    try {
      if (savedId) {
        await api.put(`/api/admin/rencontres-passees/${savedId}`, body);
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 1500);
      } else {
        const res = await api.post('/api/admin/rencontres-passees', body);
        setSavedId(res.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Supprimer cette rencontre passée et ses photos ?')) return;
    try {
      await api.del(`/api/admin/rencontres-passees/${savedId}`);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal onClose={onSaved} maxWidth={640} header={{ kicker: 'Rencontres passées', title: savedId ? 'Modifier la rencontre passée' : 'Nouvelle rencontre passée' }}>
      <form onSubmit={submit} style={{ padding: '26px 30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="field">Titre
            <input name="titre" value={form.titre} onChange={onChange} required maxLength={200} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <label className="field">Date affichée
              <input name="date_label" value={form.date_label} onChange={onChange} placeholder="Juin 2026" required maxLength={60} />
            </label>
            <label className="field">Lieu
              <input name="lieu" value={form.lieu} onChange={onChange} required maxLength={200} />
            </label>
          </div>
          <label className="field">Description
            <textarea name="texte" value={form.texte} onChange={onChange} rows={3} required maxLength={2000} />
          </label>
          <label className="field">Rencontre liée (participants automatiques)
            <select name="rencontre_id" value={form.rencontre_id} onChange={onChange}>
              <option value="">Aucune — saisir le nombre à la main</option>
              {rencontres.map((r) => <option key={r.id} value={r.id}>{r.titre}</option>)}
            </select>
          </label>
          <label className="field">Participants
            {linked ? (
              <input value={`${linked.inscrits} (depuis « ${linked.titre} »)`} disabled />
            ) : (
              <input name="participants" type="number" min={0} max={100000} value={form.participants} onChange={onChange} />
            )}
          </label>
        </div>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, alignItems: 'center' }}>
          <button type="submit" className="btn btn-red btn-sm" style={{ fontSize: 14.5, padding: '13px 24px' }}>
            {savedId ? 'Enregistrer' : 'Créer et ajouter des photos'}
          </button>
          {savedMsg && <span className="success-text">✓ Enregistré</span>}
          {savedId && user.role === 'admin' && (
            <button type="button" className="btn-link-gray" style={{ fontSize: 13.5, padding: '13px 10px' }} onClick={remove}>
              Supprimer
            </button>
          )}
          <button type="button" className="btn btn-outline-soft btn-sm" style={{ marginLeft: 'auto', fontSize: 14.5, padding: '13px 22px' }} onClick={onSaved}>
            Fermer
          </button>
        </div>
      </form>

      {savedId && (
        <div style={{ padding: '4px 30px 30px', borderTop: '1px solid var(--border-soft)', marginTop: 6 }}>
          <div style={{ paddingTop: 20 }}>
            <PhotoManager eventId={savedId} photos={photos} setPhotos={setPhotos} refused={refused} />
            <p style={{ fontSize: 12.5, color: 'var(--gray-light)', lineHeight: 1.55, marginTop: 12 }}>
              La première photo (★ principale) est mise en avant sur la page d'accueil. Le nombre de photos
              affiché sur le site correspond automatiquement aux photos ci-dessus.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function PastEventsTab() {
  const [events, setEvents] = useState([]);
  const [rencontres, setRencontres] = useState([]);
  const [modal, setModal] = useState(null); // null | 'new' | event

  const reload = () =>
    Promise.all([api.get('/api/admin/rencontres-passees'), api.get('/api/admin/rencontres')])
      .then(([p, r]) => {
        setEvents(p.rencontresPassees);
        setRencontres(r.rencontres);
      })
      .catch(() => {});

  useEffect(() => {
    reload();
  }, []);

  const cover = (ev) => (ev.photos && ev.photos[0]) || null;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h3 className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Rencontres passées</h3>
          <div style={{ fontSize: 12.5, color: 'var(--gray-light)', marginTop: 3 }}>
            Section « Ils y étaient » de la page d'accueil et page « Rencontres passées ».
          </div>
        </div>
        <button className="btn btn-red btn-sm" style={{ fontSize: 13, padding: '10px 18px' }} onClick={() => setModal('new')}>
          + Ajouter une rencontre passée
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {events.map((ev) => (
          <div key={ev.id} className="card" style={{ borderRadius: 6, padding: '18px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center' }}>
            <div className={cover(ev) ? '' : 'placeholder-pattern'} style={{ width: 84, height: 60, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
              {cover(ev) && <img src={cover(ev).path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{ev.titre}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-light)', marginTop: 4 }}>
                {ev.date_label} · {ev.lieu} · {ev.participants_display} participants · {ev.nb_photos} photo{ev.nb_photos > 1 ? 's' : ''}
              </div>
            </div>
            <button className="btn btn-sm" style={{ background: 'var(--admin-bg)', fontSize: 13, padding: '9px 16px' }} onClick={() => setModal(ev)}>
              Gérer
            </button>
          </div>
        ))}
        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-light)', fontSize: 14 }}>
            Aucune rencontre passée pour le moment.
          </div>
        )}
      </div>
      {modal && (
        <PastEventFormModal
          event={modal === 'new' ? null : modal}
          rencontres={rencontres}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload(); }}
        />
      )}
    </>
  );
}
