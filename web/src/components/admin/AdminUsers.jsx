import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import Modal from '../Modal.jsx';
import { AccessCell, CredentialsModal } from './AccessControls.jsx';

const ROLE_LABEL = { admin: 'Administrateur', moderator: 'Modérateur' };

function UserFormModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ fullName: '', email: '', role: 'moderator' });
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await api.post('/api/admin/users', form);
      onCreated({ ...result, email: form.email, fullName: form.fullName });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth={480} header={{ kicker: 'Comptes', title: 'Nouveau compte' }}>
      <form onSubmit={submit} style={{ padding: '26px 30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="field">Nom complet
            <input name="fullName" value={form.fullName} onChange={onChange} required maxLength={120} />
          </label>
          <label className="field">Email
            <input name="email" type="email" value={form.email} onChange={onChange} required maxLength={254} />
          </label>
          <label className="field">Rôle
            <select name="role" value={form.role} onChange={onChange}>
              <option value="moderator">Modérateur — membres, rencontres, inscriptions</option>
              <option value="admin">Administrateur — accès complet</option>
            </select>
          </label>
        </div>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button type="submit" className="btn btn-red btn-sm" style={{ flex: 1, fontSize: 14.5, padding: 13 }}>
            Créer le compte
          </button>
          <button type="button" className="btn btn-outline-soft btn-sm" style={{ fontSize: 14.5, padding: '13px 22px' }} onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function UsersTab() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');

  const reload = () => api.get('/api/admin/users').then((d) => setUsers(d.users)).catch(() => {});

  useEffect(() => {
    reload();
  }, []);

  const generateAccess = async (u) => {
    setError('');
    try {
      const d = await api.post(`/api/admin/users/${u.id}/reset-access`);
      setCredentials({ recipient: `${u.full_name} (${u.email})`, tempPassword: d.tempPassword });
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeRole = async (u, role) => {
    setError('');
    try {
      await api.put(`/api/admin/users/${u.id}/role`, { role });
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Supprimer le compte de ${u.full_name || u.email} ?`)) return;
    setError('');
    try {
      await api.del(`/api/admin/users/${u.id}`);
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card" style={{ borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h3 className="serif" style={{ fontSize: 19, fontWeight: 600 }}>Administrateurs & modérateurs</h3>
          <div style={{ fontSize: 12.5, color: 'var(--gray-light)', marginTop: 3, maxWidth: 520, lineHeight: 1.5 }}>
            Les modérateurs gèrent les membres, les rencontres et les inscriptions. Les administrateurs
            ont accès à l'ensemble du back-office.
          </div>
        </div>
        <button className="btn btn-red btn-sm" style={{ fontSize: 13, padding: '10px 18px' }} onClick={() => setModal(true)}>
          + Ajouter un compte
        </button>
      </div>
      {error && <p className="error-text" style={{ padding: '12px 24px 0' }}>{error}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th><th>Email</th><th>Rôle</th><th>Accès</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name || '—'}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-green' : 'badge-amber'}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td>
                  <AccessCell
                    hasLogin
                    mustChangePassword={u.must_change_password}
                    tempPassword={u.temp_password}
                    onGenerate={() => generateAccess(u)}
                  />
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {u.is_self ? (
                    <span style={{ fontSize: 12, color: 'var(--gray-light)' }}>Vous</span>
                  ) : (
                    <>
                      <button
                        className="btn-link-gray"
                        style={{ color: 'var(--gray)', marginRight: 14 }}
                        onClick={() => changeRole(u, u.role === 'admin' ? 'moderator' : 'admin')}
                      >
                        {u.role === 'admin' ? 'Passer modérateur' : 'Passer admin'}
                      </button>
                      <button className="btn-link" style={{ fontSize: 13 }} onClick={() => remove(u)}>Supprimer</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <UserFormModal
          onClose={() => setModal(false)}
          onCreated={(result) => {
            setModal(false);
            reload();
            setCredentials({ recipient: `${result.fullName} (${result.email})`, tempPassword: result.tempPassword });
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
    </div>
  );
}
