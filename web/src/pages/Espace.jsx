import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import { api, seasonLabel } from '../lib/api.js';
import ImageSlot from '../components/ImageSlot.jsx';
import { AdminShell } from './Admin.jsx';

function LoginSection({ title = 'Gérez votre présence au Club', kicker = 'Espace membre' }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={{ minHeight: 'calc(100vh - 76px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', background: 'var(--dark)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="kicker on-dark" style={{ marginBottom: 14 }}>{kicker}</div>
          <h1 className="serif" style={{ fontWeight: 500, fontSize: 34, color: '#fff', lineHeight: 1.1 }}>{title}</h1>
        </div>
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 8, padding: '32px 30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label className="field">Email professionnel
              <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.fr" required maxLength={254} autoComplete="username" />
            </label>
            <label className="field">Mot de passe
              <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required maxLength={200} autoComplete="current-password" />
            </label>
          </div>
          {error && <p className="error-text" style={{ marginTop: 14 }}>{error}</p>}
          <button type="submit" className="btn btn-red" style={{ width: '100%', marginTop: 22, padding: 14, borderRadius: 3 }} disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </section>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post('/api/auth/change-password', form);
      setMsg({ ok: true, text: '✓ Mot de passe modifié' });
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  };

  return (
    <div className="card" style={{ borderRadius: 8, padding: 30, marginTop: 24 }}>
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Mot de passe</h2>
      <p style={{ fontSize: 13.5, color: 'var(--gray-light)', marginBottom: 20, lineHeight: 1.55 }}>
        10 caractères minimum, avec au moins une lettre et un chiffre.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="field">Mot de passe actuel
          <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required autoComplete="current-password" />
        </label>
        <label className="field">Nouveau mot de passe
          <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required minLength={10} autoComplete="new-password" />
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button type="submit" className="btn btn-red btn-sm" style={{ fontSize: 14.5, padding: '13px 26px' }}>Changer le mot de passe</button>
          {msg && <span className={msg.ok ? 'success-text' : 'error-text'}>{msg.text}</span>}
        </div>
      </form>
    </div>
  );
}

// Blocking gate shown right after login when the account still carries a
// temporary password (new member, or an admin reset). The temporary
// password itself doubles as "mot de passe actuel" here.
function ForcedPasswordChange() {
  const { logout, refreshUser } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/auth/change-password', form);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={{ minHeight: 'calc(100vh - 76px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', background: 'var(--dark)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="kicker on-dark" style={{ marginBottom: 14 }}>Première connexion</div>
          <h1 className="serif" style={{ fontWeight: 500, fontSize: 30, color: '#fff', lineHeight: 1.25 }}>
            Choisissez votre mot de passe
          </h1>
          <p style={{ fontSize: 14, color: '#B7AFA6', marginTop: 12, lineHeight: 1.6 }}>
            Votre mot de passe temporaire doit être remplacé avant de continuer.
          </p>
        </div>
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 8, padding: '32px 30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label className="field">Mot de passe temporaire
              <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required autoComplete="current-password" />
            </label>
            <label className="field">Nouveau mot de passe
              <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required minLength={10} autoComplete="new-password" />
            </label>
            <label className="field">Confirmer le nouveau mot de passe
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={10} autoComplete="new-password" />
            </label>
          </div>
          {error && <p className="error-text" style={{ marginTop: 14 }}>{error}</p>}
          <button type="submit" className="btn btn-red" style={{ width: '100%', marginTop: 22, padding: 14, borderRadius: 3 }} disabled={busy}>
            {busy ? 'Enregistrement…' : 'Valider mon mot de passe'}
          </button>
          <button type="button" onClick={logout} className="btn-link-gray" style={{ width: '100%', textAlign: 'center', marginTop: 14 }}>
            Se déconnecter
          </button>
        </form>
      </div>
    </section>
  );
}

function Portal() {
  const { logout } = useAuth();
  const [member, setMember] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const season = seasonLabel();

  useEffect(() => {
    Promise.all([api.get('/api/member/profile'), api.get('/api/public/bootstrap')])
      .then(([p, b]) => {
        setMember(p.member);
        setForm(p.member);
        setCategories(b.categories);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (!form) {
    return (
      <section className="container" style={{ padding: '60px 32px' }}>
        <p style={{ color: 'var(--gray-light)' }}>{error || 'Chargement…'}</p>
      </section>
    );
  }

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'categorie_id' ? (value ? Number(value) : null) : value });
    setSaved(false);
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const d = await api.put('/api/member/profile', {
        nom: form.nom, secteur: form.secteur, categorie_id: form.categorie_id,
        dirigeant: form.dirigeant, email: form.email || '', tel: form.tel || '',
        site: form.site || '', adresse: form.adresse || '', presentation: form.presentation || '',
      });
      setMember(d.member);
      setForm(d.member);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const valide = member?.valide;
  const catName = categories.find((c) => c.id === form.categorie_id)?.name || 'Non classée';

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 32px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 26 }}>
        <div>
          <div className="kicker" style={{ letterSpacing: '.16em', marginBottom: 8 }}>Espace membre</div>
          <h1 className="serif" style={{ fontWeight: 500, fontSize: 34, lineHeight: 1.1 }}>Bonjour {member.dirigeant}</h1>
          <div style={{ fontSize: 14, color: 'var(--gray-light)', marginTop: 4 }}>{member.nom}</div>
        </div>
        <button className="btn btn-outline-soft btn-sm" onClick={logout}>Se déconnecter</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: valide ? '#E8F3EC' : '#FBF0E6', border: `1px solid ${valide ? '#BFE0CB' : '#F0D6BC'}`, color: valide ? '#22623E' : '#8A5A22', borderRadius: 8, padding: '18px 22px' }}>
        <span style={{ fontSize: 22 }}>{valide ? '✓' : '⏳'}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {valide ? `Adhésion validée pour la saison ${season}` : 'Adhésion à renouveler'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
            {valide
              ? "Votre fiche est visible dans l'annuaire et vous pouvez vous inscrire aux rencontres."
              : "Tant que votre adhésion n'est pas validée par le Club, votre fiche n'apparaît pas dans l'annuaire et vous ne pouvez pas vous inscrire aux rencontres."}
          </div>
        </div>
      </div>

      <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.35fr .9fr', gap: 32, marginTop: 30, alignItems: 'start' }}>
        <div>
          <div className="card" style={{ borderRadius: 8, padding: 30 }}>
            <h2 className="serif" style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Mon profil</h2>
            <p style={{ fontSize: 13.5, color: 'var(--gray-light)', marginBottom: 24, lineHeight: 1.55 }}>
              Ces informations alimentent votre fiche dans l'annuaire des membres.
            </p>

            <div style={{ display: 'flex', gap: 22, marginBottom: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gray-light)', fontWeight: 600, marginBottom: 8 }}>Logo</div>
                <div style={{ width: 96, height: 96 }}>
                  <ImageSlot endpoint="/api/member/profile/logo" value={form.logo_path} placeholder="Déposez votre logo" onUploaded={(path) => { setForm((f) => ({ ...f, logo_path: path })); setMember((m) => ({ ...m, logo_path: path })); }} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gray-light)', fontWeight: 600, marginBottom: 8 }}>Photo dirigeant·e</div>
                <div style={{ width: 96, height: 96 }}>
                  <ImageSlot circle endpoint="/api/member/profile/photo" value={form.photo_path} placeholder="Déposez votre photo" onUploaded={(path) => { setForm((f) => ({ ...f, photo_path: path })); setMember((m) => ({ ...m, photo_path: path })); }} />
                </div>
              </div>
            </div>

            <form onSubmit={save}>
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
                <label className="field">Présentation
                  <textarea name="presentation" value={form.presentation || ''} onChange={onChange} rows={3} maxLength={2000} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label className="field">Email
                    <input name="email" type="email" value={form.email || ''} onChange={onChange} maxLength={254} />
                  </label>
                  <label className="field">Téléphone
                    <input name="tel" value={form.tel || ''} onChange={onChange} maxLength={30} />
                  </label>
                </div>
                <label className="field">Site web
                  <input name="site" value={form.site || ''} onChange={onChange} maxLength={200} />
                </label>
                <label className="field">Adresse de l'entreprise
                  <input name="adresse" value={form.adresse || ''} onChange={onChange} maxLength={300} placeholder="Numéro, rue, code postal et ville" />
                </label>
              </div>
              {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
                <button type="submit" className="btn btn-red btn-sm" style={{ fontSize: 14.5, padding: '13px 26px' }}>Enregistrer mon profil</button>
                {saved && <span className="success-text">✓ Profil enregistré</span>}
              </div>
            </form>
          </div>
          <PasswordCard />
        </div>

        <div style={{ position: 'sticky', top: 96 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--gray-light)', fontWeight: 600, marginBottom: 12 }}>
            Aperçu de votre fiche annuaire
          </div>
          <div className="card" style={{ padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div className={form.logo_path ? '' : 'placeholder-pattern'} style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 9, color: '#a8a099', background: form.logo_path ? '#fff' : undefined }}>
                {form.logo_path ? <img src={form.logo_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'logo'}
              </div>
              <div>
                <div className="serif" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.15 }}>{form.nom}</div>
                <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--red)', fontWeight: 600, marginTop: 5 }}>{form.secteur}</div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <span className="badge-cat">{catName}</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gray)', marginBottom: 20 }}>{form.presentation}</p>
            {form.adresse && (
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--gray-light)', marginBottom: 18 }}>{form.adresse}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, borderTop: '1px solid var(--border-soft)' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-light)' }}>{form.dirigeant}</span>
              <span className="btn-link">Voir la fiche →</span>
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--gray-light)', lineHeight: 1.55, marginTop: 14 }}>
            {valide
              ? "Votre fiche est publiée dans l'annuaire des membres."
              : "Cette fiche ne sera publiée qu'une fois votre adhésion validée pour la saison en cours."}
          </p>
        </div>
      </div>
    </section>
  );
}

// Single login entry point for members, admins and moderators. Once
// authenticated, the content shown depends on the account's role — the
// URL and the login form never differ.
export default function Espace() {
  const { user, loading } = useAuth();

  if (loading) return <main style={{ minHeight: '60vh' }} />;
  if (!user) return <main><LoginSection /></main>;
  if (user.mustChangePassword) return <main><ForcedPasswordChange /></main>;
  if (user.role === 'admin' || user.role === 'moderator' || user.role === 'treasurer') return <AdminShell />;
  return <main><Portal /></main>;
}
