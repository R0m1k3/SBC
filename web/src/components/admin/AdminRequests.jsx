import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { CredentialsModal } from './AccessControls.jsx';

const STATUS = {
  nouvelle: { label: 'Nouvelle', className: 'badge-red' },
  contactee: { label: 'Contact pris', className: 'badge-amber' },
  validee: { label: 'Membre validé', className: 'badge-green' },
};

const formatDate = (value) => new Date(value).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric',
});

export function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState(null);

  const reload = () => api.get('/api/admin/demandes')
    .then((data) => setRequests(data.demandes))
    .catch((err) => setError(err.message));

  useEffect(() => { reload(); }, []);

  const visible = useMemo(() => requests.filter((request) => (
    filter === 'completed' ? request.statut === 'validee' : request.statut !== 'validee'
  )), [filter, requests]);
  const pendingCount = requests.filter((request) => request.statut !== 'validee').length;
  const newCount = requests.filter((request) => request.statut === 'nouvelle').length;

  const run = async (request, action) => {
    setBusyId(request.id);
    setError('');
    try {
      const result = await api.post(`/api/admin/demandes/${request.id}/${action}`);
      if (result.tempPassword) {
        setCredentials({ recipient: result.email, tempPassword: result.tempPassword });
      } else if (result.accessError) {
        setError(`Membre validé, mais accès non créé : ${result.accessError}`);
      }
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="requests-layout">
      <div className="requests-summary">
        <div className="card request-stat"><span>À traiter</span><strong>{pendingCount}</strong></div>
        <div className="card request-stat request-stat-accent"><span>Nouvelles</span><strong>{newCount}</strong></div>
        <div className="card request-stat"><span>Validées</span><strong>{requests.length - pendingCount}</strong></div>
      </div>

      <section className="card requests-panel">
        <div className="requests-toolbar">
          <div>
            <h3 className="serif">Demandes d’adhésion</h3>
            <p>Contactez chaque personne avant validation membre.</p>
          </div>
          <div className="requests-filter" aria-label="Filtrer les demandes">
            <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>En cours</button>
            <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Terminées</button>
          </div>
        </div>

        {error && <p className="error-text requests-error">{error}</p>}
        <div className="requests-list">
          {visible.map((request) => {
            const status = STATUS[request.statut] || STATUS.nouvelle;
            const busy = busyId === request.id;
            return (
              <article className="request-row" key={request.id}>
                <div className="request-date"><span>Reçue</span><strong>{formatDate(request.created_at)}</strong></div>
                <div className="request-identity">
                  <div className="request-title-line">
                    <h4>{request.nom}</h4>
                    <span className={`badge ${status.className}`}>{status.label}</span>
                  </div>
                  <p>{request.fonction || 'Fonction non précisée'} · <strong>{request.entreprise}</strong></p>
                  <div className="request-contact">
                    <a href={`mailto:${request.email}`}>{request.email}</a>
                    {request.tel && <a href={`tel:${request.tel}`}>{request.tel}</a>}
                  </div>
                </div>
                <div className="request-actions">
                  {request.statut === 'nouvelle' && (
                    <button className="btn btn-outline-soft btn-sm" disabled={busy} onClick={() => run(request, 'contact')}>
                      {busy ? 'Enregistrement…' : '✓ Contact pris'}
                    </button>
                  )}
                  {request.statut === 'contactee' && (
                    <button className="btn btn-red btn-sm" disabled={busy || !request.email} onClick={() => run(request, 'validate')}>
                      {busy ? 'Validation…' : 'Valider comme membre'}
                    </button>
                  )}
                  {request.statut === 'validee' && (
                    <span className="request-member-link">Membre : {request.membre_nom || request.entreprise}</span>
                  )}
                </div>
              </article>
            );
          })}
          {visible.length === 0 && (
            <div className="requests-empty">
              <span>✓</span>
              <h4>Aucune demande {filter === 'pending' ? 'en cours' : 'terminée'}</h4>
              <p>Les nouvelles demandes apparaîtront ici.</p>
            </div>
          )}
        </div>
      </section>

      {credentials && (
        <CredentialsModal recipient={credentials.recipient} tempPassword={credentials.tempPassword} onClose={() => setCredentials(null)} />
      )}
    </div>
  );
}
