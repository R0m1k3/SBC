import { useEffect, useState } from 'react';
import { api } from './api.js';

export function usePublicData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const reload = () =>
    api
      .get('/api/public/bootstrap')
      .then(setData)
      .catch((e) => setError(e.message));

  useEffect(() => {
    reload();
  }, []);

  return { data, error, reload };
}
