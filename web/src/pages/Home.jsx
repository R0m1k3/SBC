import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePublicData } from '../lib/usePublic.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { api, dateParts } from '../lib/api.js';
import Modal from '../components/Modal.jsx';
import PastEventCard from '../components/PastEventCard.jsx';

export function InscriptionModal({ rencontre, onClose, onDone }) {
  const { user, login } = useAuth();
  const [context, setContext] = useState(null);
  const [participants, setParticipants] = useState(['']);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { jour, mois } = dateParts(rencontre.date_renc);

  useEffect(() => {
    if (user?.role !== 'member' || user.mustChangePassword) return;
    setError('');
    api.get(`/api/public/rencontres/${rencontre.id}/inscription`)
      .then((d) => {
        setContext(d);
        setParticipants(d.participants.length ? d.participants.map((p) => p.nom) : [d.member.dirigeant || '']);
      })
      .catch((err) => setError(err.message));
  }, [user, rencontre.id]);

  const submitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(credentials.email, credentials.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changeParticipant = (index, value) => {
    setParticipants((current) => current.map((name, i) => (i === index ? value : name)));
  };

  const maxPerAccount = context?.rencontre.participants_par_compte || rencontre.participants_par_compte || 1;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post(`/api/public/rencontres/${rencontre.id}/inscriptions`, { participants });
      setDone(true);
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Modal onClose={onClose} maxWidth={460}>
        <div style={{ textAlign: 'center', padding: '50px 36px' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FBEDEC', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 22px' }}>✓</div>
          <h3 className="serif" style={{ fontSize: 26, fontWeight: 600, marginBottom: 10 }}>Inscription enregistrée</h3>
          <p style={{ fontSize: 15, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 8 }}>
            Votre demande pour <strong>{rencontre.titre}</strong> est bien enregistrée.
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--gray-light)', marginBottom: 26 }}>
            {participants.length} participant{participants.length > 1 ? 's' : ''} — confirmation par l'équipe du Club.
          </p>
          <button className="btn btn-dark btn-sm" style={{ padding: '13px 28px', fontSize: 14 }} onClick={onClose}>Fermer</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={onClose}
      maxWidth={460}
      header={{ kicker: 'Inscription', title: rencontre.titre, meta: `${jour} ${mois} · ${rencontre.heure} · ${rencontre.lieu}` }}
    >
      {!user && (
        <form onSubmit={submitLogin} style={{ padding: '28px 30px' }}>
          <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 18 }}>
            Connectez-vous avec votre compte membre avant de choisir les participants.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="field-plain">Email du compte
              <input type="email" value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} required autoComplete="username" />
            </label>
            <label className="field-plain">Mot de passe
              <input type="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} required autoComplete="current-password" />
            </label>
          </div>
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <button type="submit" className="btn btn-red" style={{ width: '100%', marginTop: 22, padding: 14 }} disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter et continuer'}
          </button>
        </form>
      )}

      {user && (user.role !== 'member' || user.mustChangePassword) && (
        <div style={{ padding: '30px' }}>
          <p className="error-text">
            {user.role !== 'member'
              ? 'Les inscriptions doivent être effectuées avec un compte membre.'
              : 'Vous devez d’abord remplacer votre mot de passe temporaire.'}
          </p>
          <Link to="/espace-membre" className="btn btn-dark" style={{ display: 'block', textAlign: 'center', marginTop: 20, textDecoration: 'none' }}>
            Ouvrir mon espace membre
          </Link>
        </div>
      )}

      {user?.role === 'member' && !user.mustChangePassword && !context && (
        <p style={{ padding: '30px', color: 'var(--gray-light)' }}>{error || 'Chargement de votre compte…'}</p>
      )}

      {user?.role === 'member' && !user.mustChangePassword && context && (
        <form onSubmit={submit} style={{ padding: '28px 30px' }}>
          <div style={{ background: 'var(--beige)', padding: '12px 14px', borderRadius: 4, fontSize: 13, color: 'var(--gray)', marginBottom: 18 }}>
            Compte : <strong>{context.member.nom}</strong> · maximum {maxPerAccount} participant{maxPerAccount > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {participants.map((name, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <label className="field-plain" style={{ flex: 1 }}>Participant {index + 1} — nom & prénom
                  <input value={name} onChange={(e) => changeParticipant(index, e.target.value)} required maxLength={120} />
                </label>
                {participants.length > 1 && (
                  <button type="button" className="btn btn-outline-soft btn-sm" style={{ padding: '11px 13px' }} onClick={() => setParticipants((current) => current.filter((_, i) => i !== index))} aria-label={`Retirer le participant ${index + 1}`}>×</button>
                )}
              </div>
            ))}
          </div>
          {participants.length < maxPerAccount && (
            <button type="button" className="btn-link" style={{ marginTop: 14 }} onClick={() => setParticipants((current) => [...current, ''])}>
              + Ajouter un participant
            </button>
          )}
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
          <button type="submit" className="btn btn-red" style={{ width: '100%', marginTop: 22, padding: 14 }} disabled={busy}>
            {busy ? 'Enregistrement…' : `Enregistrer ${participants.length} participant${participants.length > 1 ? 's' : ''}`}
          </button>
          <p style={{ fontSize: 12, color: 'var(--gray-light)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
            Vous pourrez rouvrir ce formulaire pour modifier les noms enregistrés.
          </p>
        </form>
      )}
    </Modal>
  );
}

export default function Home() {
  const { data, reload } = usePublicData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inscrRenc, setInscrRenc] = useState(null);
  const [homeDone, setHomeDone] = useState(false);
  const [homeError, setHomeError] = useState('');
  const [form, setForm] = useState({ nom: '', fonction: '', entreprise: '', email: '' });

  // Registration links in invitation emails point to /?inscription=<id> :
  // once the public data is loaded, open the matching inscription modal.
  useEffect(() => {
    const id = Number(searchParams.get('inscription'));
    if (!id || !data) return;
    const renc = (data.rencontres || []).find((r) => r.id === id);
    if (renc) setInscrRenc(renc);
  }, [data, searchParams]);

  const closeInscription = () => {
    setInscrRenc(null);
    if (searchParams.has('inscription')) setSearchParams({}, { replace: true });
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submitHome = async (e) => {
    e.preventDefault();
    setHomeError('');
    try {
      await api.post('/api/public/demandes-adhesion', form);
      setHomeDone(true);
    } catch (err) {
      setHomeError(err.message);
    }
  };

  const members = data?.members ?? [];
  const rencontres = data?.rencontres ?? [];
  const passees = data?.rencontresPassees ?? [];
  const content = data?.content ?? {};
  const marquee = members.concat(members);

  return (
    <main>
      {/* HERO */}
      <section className="container hero-grid" style={{ padding: '64px 32px 40px', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div className="kicker" style={{ marginBottom: 26 }}>Réseau d'affaires · SLUC Nancy Basket</div>
          <h1 className="serif" style={{ fontWeight: 500, fontSize: 'clamp(40px, 6vw, 66px)', lineHeight: 1.02, letterSpacing: '-.01em', marginBottom: 26 }}>
            Le business se joue en <em style={{ fontStyle: 'italic', color: 'var(--red)' }}>équipe</em>.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--gray)', maxWidth: 480, marginBottom: 38 }}>
            Depuis 30 ans, le Business Club rassemble les dirigeants du Grand Est autour des valeurs du sport
            de haut niveau : performance, engagement et esprit collectif.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="#adhesion" style={{ textDecoration: 'none' }}>
              <button className="btn btn-red">Rejoindre le club</button>
            </a>
            <Link to="/association" style={{ textDecoration: 'none' }}>
              <button className="btn btn-outline">Découvrir l'association</button>
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 42, marginTop: 54, paddingTop: 34, borderTop: '1px solid var(--border)' }}>
            {[[String(members.length), 'entreprises membres'], [String(passees.length), 'rencontres organisées'], ['30 ans', 'de partenariat']].map(([n, l]) => (
              <div key={l}>
                <div className="serif" style={{ fontSize: 34, fontWeight: 600 }}>{n}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-light)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div className={content.hero_photo ? '' : 'placeholder-pattern'} style={{ aspectRatio: '4/5', borderRadius: 4, overflow: 'hidden', boxShadow: '0 30px 60px -30px rgba(27,27,27,.4)', display: 'flex', alignItems: 'flex-end', padding: content.hero_photo ? 0 : 22 }}>
            {content.hero_photo ? (
              <img src={content.hero_photo} alt="L'esprit du Club" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#a8a099', background: 'var(--bg)', padding: '5px 9px', borderRadius: 2 }}>
                photo — networking en tribune VIP
              </span>
            )}
          </div>
          <div style={{ position: 'absolute', left: -30, bottom: 40, background: 'var(--ink)', color: '#fff', padding: '22px 26px', borderRadius: 4, maxWidth: 230, boxShadow: '0 20px 40px -20px rgba(0,0,0,.5)' }}>
            <div className="serif" style={{ fontSize: 19, lineHeight: 1.3, marginBottom: 6 }}>
              « {content.hero_quote_text || 'On ne réussit jamais seul.'} »
            </div>
            <div style={{ fontSize: 12, color: '#B7AFA6' }}>{content.hero_quote_author || "L'esprit du Club"}</div>
          </div>
        </div>
      </section>

      {/* SLUC LINK */}
      <section className="container" style={{ paddingBottom: 56 }}>
        <a
          href="https://www.sluc-nancy-basket.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', alignItems: 'center', gap: 28, background: 'var(--dark)', borderRadius: 6, padding: '28px 32px', textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ aspectRatio: '1/1', width: 110, borderRadius: 8, overflow: 'hidden', background: '#fff', padding: 14 }}>
            <img src="/assets/logo.jpg" alt="Logo SLUC Nancy Basket" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--red-soft)', fontWeight: 600, marginBottom: 8 }}>
              Partenaire officiel
            </div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 6 }}>SLUC Nancy Basket</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: '#B7AFA6' }}>
              Retrouvez l'actualité, le calendrier et la billetterie du club sur son site officiel.
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
            Voir le site <span style={{ fontSize: 16 }}>↗</span>
          </div>
        </a>
      </section>

      {/* MEMBERS MARQUEE */}
      <section style={{ padding: '72px 0', background: '#fff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ paddingBottom: 34, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 12 }}>Ils nous font confiance</div>
            <h2 className="serif" style={{ fontWeight: 500, fontSize: 36, lineHeight: 1.1 }}>Nos entreprises membres</h2>
          </div>
          <Link to="/annuaire" style={{ textDecoration: 'none' }}>
            <span className="btn-link" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>Voir l'annuaire complet →</span>
          </Link>
        </div>
        <div className="container">
          <div className="marquee-mask">
            <div className="marquee-fade marquee-fade-left" />
            <div className="marquee-fade marquee-fade-right" />
            <div className="marquee-track">
              {marquee.map((m, i) => (
                <div key={`${m.id}-${i}`} style={{ width: 210, flexShrink: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className={m.logo_path ? '' : 'placeholder-pattern'} style={{ height: 56, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 10, color: '#a8a099', overflow: 'hidden', background: m.logo_path ? '#fff' : undefined }}>
                    {m.logo_path ? <img src={m.logo_path} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : 'logo'}
                  </div>
                  <div>
                    <div className="serif" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.2 }}>{m.nom}</div>
                    <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--red)', fontWeight: 600, marginTop: 6 }}>{m.secteur}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* UPCOMING */}
      <section className="container" style={{ padding: '96px 32px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="kicker" style={{ marginBottom: 14 }}>Agenda</div>
          <h2 className="serif" style={{ fontWeight: 500, fontSize: 44, lineHeight: 1.08 }}>Prochaines rencontres</h2>
        </div>
        <div className="grid-3">
          {rencontres.map((e) => {
            const { jour, mois } = dateParts(e.date_renc);
            const restantes = Math.max(0, e.places - e.inscrits);
            return (
              <div key={e.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className={e.image_path ? '' : 'placeholder-pattern'} style={{ height: 170, position: 'relative' }}>
                  {e.image_path && (
                    <img src={e.image_path} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--dark)', color: '#fff', borderRadius: 3, padding: '8px 12px', textAlign: 'center', lineHeight: 1.05 }}>
                    <div className="serif" style={{ fontSize: 24, fontWeight: 600 }}>{jour}</div>
                    <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#B7AFA6' }}>{mois}</div>
                  </div>
                </div>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-light)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{e.heure}</span><span>·</span><span>{e.lieu}</span>
                  </div>
                  <h3 className="serif" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2, marginBottom: 10 }}>{e.titre}</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--gray)', flex: 1 }}>{e.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border-soft)' }}>
                    <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>
                      {restantes > 0 ? `${restantes} places restantes` : 'Complet'}
                      <small style={{ display: 'block', color: 'var(--gray-light)', fontWeight: 400, marginTop: 3 }}>
                        Max. {e.participants_par_compte} par compte
                      </small>
                    </span>
                    <button className="btn btn-dark btn-sm" style={{ fontSize: 13.5 }} disabled={restantes === 0} onClick={() => setInscrRenc(e)}>
                      S'inscrire
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PAST */}
      <section style={{ background: 'var(--beige)', marginTop: 56, padding: '96px 0' }}>
        <div className="container">
          <div style={{ marginBottom: 52, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div className="kicker" style={{ marginBottom: 14 }}>Ils y étaient</div>
              <h2 className="serif" style={{ fontWeight: 500, fontSize: 44, lineHeight: 1.08 }}>Rencontres passées</h2>
            </div>
            <Link to="/rencontres-passees" style={{ textDecoration: 'none' }}>
              <span className="btn-link" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>Voir toutes les rencontres →</span>
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
            {passees.slice(0, 3).map((p) => (
              <PastEventCard key={p.id} event={p} excerptLines={3} />
            ))}
          </div>
        </div>
      </section>

      {/* ADHESION */}
      <section id="adhesion" style={{ background: 'var(--dark)', color: '#fff', padding: '100px 0' }}>
        <div className="hero-grid" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 70, alignItems: 'center' }}>
          <div>
            <div className="kicker on-dark" style={{ marginBottom: 20 }}>Nous rejoindre</div>
            <h2 className="serif" style={{ fontWeight: 500, fontSize: 46, lineHeight: 1.08, marginBottom: 22 }}>
              Faites entrer votre entreprise dans le Club.
            </h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.65, color: '#B7AFA6', marginBottom: 32 }}>
              Rejoignez un réseau de 85 dirigeants, accédez à toutes nos rencontres et bénéficiez d'une visibilité au cœur du SLUC Nancy.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['Accès à toutes les rencontres business', 'Places privilégiées aux matchs', "Présence dans l'annuaire des membres"].map((t) => (
                <li key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, color: '#E7E1D9' }}>
                  <span style={{ color: 'var(--red-soft)', fontWeight: 700 }}>—</span>{t}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#fff', color: 'var(--ink)', borderRadius: 6, padding: 38 }}>
            {homeDone ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#FBEDEC', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>✓</div>
                <h3 className="serif" style={{ fontSize: 26, fontWeight: 600, marginBottom: 10 }}>Demande envoyée !</h3>
                <p style={{ fontSize: 15, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 24 }}>
                  Merci pour votre intérêt. Notre équipe vous recontacte sous 48h.
                </p>
                <button className="btn btn-outline btn-sm" style={{ fontSize: 14, padding: '12px 24px' }} onClick={() => { setHomeDone(false); setForm({ nom: '', fonction: '', entreprise: '', email: '' }); }}>
                  Nouvelle demande
                </button>
              </div>
            ) : (
              <form onSubmit={submitHome}>
                <h3 className="serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 22 }}>Demande d'adhésion</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label className="field-plain">Nom & prénom
                      <input name="nom" value={form.nom} onChange={onChange} required maxLength={120} />
                    </label>
                    <label className="field-plain">Fonction
                      <input name="fonction" value={form.fonction} onChange={onChange} maxLength={120} />
                    </label>
                  </div>
                  <label className="field-plain">Entreprise
                    <input name="entreprise" value={form.entreprise} onChange={onChange} required maxLength={120} />
                  </label>
                  <label className="field-plain">Email professionnel
                    <input name="email" type="email" value={form.email} onChange={onChange} required maxLength={254} />
                  </label>
                </div>
                {homeError && <p className="error-text" style={{ marginTop: 12 }}>{homeError}</p>}
                <button type="submit" className="btn btn-red" style={{ width: '100%', marginTop: 24, padding: 15 }}>
                  Envoyer ma demande
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {inscrRenc && (
        <InscriptionModal key={inscrRenc.id} rencontre={inscrRenc} onClose={closeInscription} onDone={reload} />
      )}
    </main>
  );
}
