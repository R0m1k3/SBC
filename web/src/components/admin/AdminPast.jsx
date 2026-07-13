import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import Modal from '../Modal.jsx';
import ImageSlot from '../ImageSlot.jsx';

function PastEventFormModal({ event, onClose, onSaved }) {
  const [form, setForm] = useState(
    event
      ? { date_label: event.date_label, lieu: event.lieu, titre: event.titre, texte: event.texte, participants: event.participants, nb_photos: event.nb_photos }
      : { date_label: '', lieu: '', titre: '', texte: '', participants: 0, nb_photos: 0 }
  );
  const [images, setImages] = useState([event?.image_path || '', event?.image_path_2 || '', event?.image_path_3 || '']);
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const setImageAt = (i) => (path) => setImages((prev) => prev.map((p, idx) => (idx === i ? path : p)));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (event) await api.put(`/api/admin/rencontres-passees/${event.id}`, form);
      else await api.post('/api/admin/rencontres-passees', form);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Supprimer cette rencontre passée et ses photos ?')) return;
    try {
      await api.del(`/api/admin/rencontres-passees/${event.id}`);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth={620} header={{ kicker: 'Rencontres passées', title: event ? 'Modifier la rencontre passée' : 'Nouvelle rencontre passée' }}>
      <form onSubmit={submit} style={{ padding: '26px 30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="field" style={{ marginBottom: 8 }}>Photos</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8, height: 160 }}>
              <div style={{ gridRow: 'span 2' }}>
                <ImageSlot
                  endpoint={event ? `/api/admin/rencontres-passees/${event.id}/image/1` : undefined}
                  value={images[0]}
                  disabled={!event}
                  placeholder={event ? 'Photo principale' : "Enregistrez d'abord"}
                  onUploaded={setImageAt(0)}
                />
              </div>
              <ImageSlot
                endpoint={event ? `/api/admin/rencontres-passees/${event.id}/image/2` : undefined}
                value={images[1]}
                disabled={!event}
                placeholder="Photo"
                onUploaded={setImageAt(1)}
              />
              <ImageSlot
                endpoint={event ? `/api/admin/rencontres-passees/${event.id}/image/3` : undefined}
                value={images[2]}
                disabled={!event}
                placeholder="Photo"
                onUploaded={setImageAt(2)}
              />
            </div>
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">Participants
              <input name="participants" type="number" min={0} max={100000} value={form.participants} onChange={onChange} required />
            </label>
            <label className="field">Nombre de photos affiché
              <input name="nb_photos" type="number" min={0} max={100000} value={form.nb_photos} onChange={onChange} required />
            </label>
          </div>
        </div>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' }}>
          <button type="submit" className="btn btn-red btn-sm" style={{ flex: 1, fontSize: 14.5, padding: 13 }}>
            {event ? 'Enregistrer' : 'Créer'}
          </button>
          {event && (
            <PastDeleteButton onDelete={remove} />
          )}
          <button type="button" className="btn btn-outline-soft btn-sm" style={{ fontSize: 14.5, padding: '13px 22px' }} onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Only admins can delete — moderators manage this section but can't
// destroy data (same rule as members/rencontres/inscriptions).
function PastDeleteButton({ onDelete }) {
  const { user } = useAuth();
  if (user.role !== 'admin') return null;
  return (
    <button type="button" className="btn-link-gray" style={{ fontSize: 13.5, padding: '13px 10px' }} onClick={onDelete}>
      Supprimer
    </button>
  );
}

export function PastEventsTab() {
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null); // null | 'new' | event

  const reload = () => api.get('/api/admin/rencontres-passees').then((d) => setEvents(d.rencontresPassees)).catch(() => {});

  useEffect(() => {
    reload();
  }, []);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h3 className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Rencontres passées</h3>
          <div style={{ fontSize: 12.5, color: 'var(--gray-light)', marginTop: 3 }}>
            Section « Ils y étaient » de la page d'accueil.
          </div>
        </div>
        <button className="btn btn-red btn-sm" style={{ fontSize: 13, padding: '10px 18px' }} onClick={() => setModal('new')}>
          + Ajouter une rencontre passée
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {events.map((ev) => (
          <div key={ev.id} className="card" style={{ borderRadius: 6, padding: '18px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center' }}>
            <div className={ev.image_path ? '' : 'placeholder-pattern'} style={{ width: 84, height: 60, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
              {ev.image_path && <img src={ev.image_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{ev.titre}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-light)', marginTop: 4 }}>
                {ev.date_label} · {ev.lieu} · {ev.participants} participants
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
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload(); }}
        />
      )}
    </>
  );
}
