async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const err = new Error(data?.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request(path, { method: 'POST', body: fd });
  },
};

const MOIS = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

export function dateParts(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { jour: '--', mois: '' };
  return { jour: String(d.getUTCDate()).padStart(2, '0'), mois: MOIS[d.getUTCMonth()] };
}

export function seasonLabel(d = new Date()) {
  const y = d.getFullYear();
  return d.getMonth() >= 8 ? `${y}–${y + 1}` : `${y - 1}–${y}`;
}

export const statutLabel = (s) => (s === 'confirmee' ? 'Confirmée' : 'En attente');
