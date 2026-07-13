import { usePublicData } from '../lib/usePublic.js';
import PastEventCard from '../components/PastEventCard.jsx';

export default function RencontresPassees() {
  const { data } = usePublicData();
  const passees = data?.rencontresPassees ?? [];

  return (
    <main>
      <section style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '70px 32px 60px' }}>
          <div className="kicker" style={{ marginBottom: 16 }}>Ils y étaient</div>
          <h1 className="serif" style={{ fontWeight: 500, fontSize: 'clamp(36px, 5vw, 54px)', lineHeight: 1.05, marginBottom: 18 }}>
            Nos rencontres passées
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--gray)', maxWidth: 600 }}>
            Revivez en images les temps forts du Business Club : galas, visites privées, tables rondes
            et afterworks. Cliquez sur une rencontre pour parcourir toutes ses photos.
          </p>
        </div>
      </section>

      <section style={{ background: 'var(--beige)', padding: '64px 0 96px' }}>
        <div className="container">
          {passees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--gray-light)' }}>
              <div className="serif" style={{ fontSize: 26, color: 'var(--ink)', marginBottom: 10 }}>Aucune rencontre passée</div>
              <p style={{ fontSize: 15 }}>Les prochains événements apparaîtront ici une fois terminés.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
              {passees.map((p) => (
                <PastEventCard key={p.id} event={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
