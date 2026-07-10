const VALUES = [
  { t: 'Réseau', d: "Un carnet d'adresses vivant, nourri par des rencontres régulières et de vraies affinités." },
  { t: 'Convivialité', d: "Des moments d'échange chaleureux, où les relations se nouent avant les contrats." },
  { t: 'Performance', d: "L'exigence du haut niveau appliquée au monde de l'entreprise." },
  { t: 'Territoire', d: "Un engagement fort pour l'économie et le rayonnement du Grand Est." },
];

const TIMELINE = [
  { y: '1996', t: 'Création du Club', d: "Une poignée d'entreprises se rassemblent autour du SLUC Nancy." },
  { y: '2005', t: '50 membres', d: "Le réseau s'impose comme un acteur économique local." },
  { y: '2015', t: 'Premier gala', d: 'La soirée annuelle devient le rendez-vous phare du Club.' },
  { y: '2026', t: '85 membres actifs', d: "Un réseau d'affaires de référence dans la région." },
];

const STATS = [
  { n: '85', l: 'entreprises membres' },
  { n: '12', l: 'rencontres par an' },
  { n: '30 ans', l: 'de partenariat' },
  { n: '200+', l: 'invités au gala annuel' },
];

export default function Association() {
  return (
    <main>
      <section style={{ background: 'var(--dark)', color: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '110px 32px', textAlign: 'center' }}>
          <div className="kicker on-dark" style={{ letterSpacing: '.22em', marginBottom: 26 }}>L'association</div>
          <h1 className="serif" style={{ fontWeight: 400, fontSize: 'clamp(38px, 5vw, 56px)', lineHeight: 1.08, marginBottom: 26 }}>
            Trente ans à réunir le sport<br />et l'entreprise.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: '#B7AFA6', maxWidth: 620, margin: '0 auto' }}>
            Le Business Club est l'association des partenaires économiques du SLUC Nancy Basket.
            Une communauté de dirigeants qui partagent les valeurs du haut niveau.
          </p>
        </div>
      </section>

      <section className="hero-grid" style={{ maxWidth: 1080, margin: '0 auto', padding: '96px 32px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div className="kicker" style={{ marginBottom: 16 }}>Notre mission</div>
          <h2 className="serif" style={{ fontWeight: 500, fontSize: 38, lineHeight: 1.12, marginBottom: 22 }}>
            Créer des liens qui font grandir les entreprises.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--gray)', marginBottom: 16 }}>
            Nous rassemblons chaque année des dirigeants du Grand Est autour de rencontres d'affaires,
            d'événements exclusifs et de moments de convivialité, dans le cadre unique de la vie d'un
            club de basket professionnel.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--gray)' }}>
            Adhérer, c'est développer son réseau, gagner en visibilité et soutenir le sport de haut
            niveau sur son territoire.
          </p>
        </div>
        <div className="placeholder-pattern" style={{ aspectRatio: '4/3', borderRadius: 5, display: 'flex', alignItems: 'flex-end', padding: 22 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#a8a099', background: 'var(--bg)', padding: '5px 9px', borderRadius: 2 }}>
            photo — assemblée des membres
          </span>
        </div>
      </section>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 32px' }}>
        <div className="grid-4">
          {VALUES.map((v) => (
            <div key={v.t} className="card" style={{ padding: 26 }}>
              <div style={{ width: 34, height: 3, background: 'var(--red)', marginBottom: 18 }} />
              <h3 className="serif" style={{ fontSize: 21, fontWeight: 600, marginBottom: 10 }}>{v.t}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gray)' }}>{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--beige)', marginTop: 56, padding: '90px 0' }}>
        <div className="hero-grid" style={{ maxWidth: 980, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '.8fr 1.2fr', gap: 56, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ aspectRatio: '1/1', borderRadius: 6, background: 'repeating-linear-gradient(135deg,#e4dfd8 0 12px,#eeeae3 12px 24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 11, color: '#a8a099', marginBottom: 16 }}>
              portrait
            </div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Jean-Marc Lefèvre</div>
            <div style={{ fontSize: 13, color: 'var(--gray-light)', marginTop: 2 }}>Président du Business Club</div>
          </div>
          <div>
            <div className="serif" style={{ fontSize: 60, color: 'var(--red)', lineHeight: 0.5, height: 32 }}>“</div>
            <p className="serif" style={{ fontSize: 26, lineHeight: 1.45, fontWeight: 400, marginBottom: 22 }}>
              Notre force, c'est le collectif. Comme sur le terrain, nos membres avancent ensemble,
              se soutiennent et bâtissent des réussites communes.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--gray)' }}>
              Depuis sa création, le Club n'a cessé de grandir grâce à l'engagement de dirigeants qui
              croient à la puissance du réseau. Je vous invite à nous rejoindre.
            </p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '96px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="kicker" style={{ marginBottom: 14 }}>Notre histoire</div>
          <h2 className="serif" style={{ fontWeight: 500, fontSize: 40 }}>30 ans de croissance</h2>
        </div>
        <div className="grid-4" style={{ gap: 0 }}>
          {TIMELINE.map((t) => (
            <div key={t.y} style={{ padding: '0 20px', borderLeft: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: -6, top: 6, width: 11, height: 11, borderRadius: '50%', background: 'var(--red)' }} />
              <div className="serif" style={{ fontSize: 30, fontWeight: 600, color: 'var(--red)', marginBottom: 8 }}>{t.y}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t.t}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--gray)' }}>{t.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--dark)', color: '#fff', padding: '80px 0' }}>
        <div className="grid-4" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px', gap: 40, textAlign: 'center' }}>
          {STATS.map((s) => (
            <div key={s.l}>
              <div className="serif" style={{ fontSize: 46, fontWeight: 600 }}>{s.n}</div>
              <div style={{ fontSize: 13.5, color: '#B7AFA6', marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
