import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { InscriptionModal } from './Home.jsx';

export default function Inscription() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rencontre, setRencontre] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/public/rencontres/${id}`)
      .then((data) => setRencontre(data.rencontre))
      .catch((err) => setError(err.message));
  }, [id]);

  const close = () => navigate('/', { replace: true });

  if (error) {
    return (
      <main className="container" style={{ minHeight: '60vh', padding: '80px 32px', textAlign: 'center' }}>
        <h1 className="serif" style={{ fontSize: 30, marginBottom: 12 }}>Inscription indisponible</h1>
        <p className="error-text">{error}</p>
        <button className="btn btn-dark" style={{ marginTop: 24 }} onClick={close}>Retour à l'accueil</button>
      </main>
    );
  }

  if (!rencontre) return <main style={{ minHeight: '60vh' }} />;

  return (
    <main style={{ minHeight: '60vh' }}>
      <InscriptionModal rencontre={rencontre} onClose={close} />
    </main>
  );
}
