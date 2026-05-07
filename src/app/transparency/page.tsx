import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Transparency — Verlyn',
  description: 'Verlyn transparency report. No data brokerage, no behavioral tracking, no algorithmic manipulation.',
};

export default function TransparencyPage() {
  return (
    <main style={{
      minHeight: '100dvh', background: '#000', color: '#fff',
      padding: 'clamp(48px, 8vw, 120px) clamp(24px, 5vw, 64px)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: '13px', color: '#7c3aed', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '56px' }}>
          ← Back to System
        </Link>

        <div style={{ marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 500, marginBottom: '12px' }}>
            System Integrity
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Transparency
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '12px' }}>
            What we do not do.
          </p>
        </div>

        <article style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {[
            { title: 'No Data Brokerage', desc: 'Your data is never sold, rented, or traded. We do not participate in the data economy.' },
            { title: 'No Behavioral Tracking', desc: 'There are no analytics SDKs, session recording tools, or tracking pixels anywhere in this system.' },
            { title: 'No Algorithmic Manipulation', desc: 'Content delivery is deterministic. There is no feed algorithm designed to maximize engagement or alter perception.' },
            { title: 'No Silent Fallbacks', desc: 'If encryption fails, communication stops. We do not silently downgrade to plaintext.' },
            { title: 'No False Scarcity', desc: 'Access restrictions are technical and operational constraints, not marketing tactics.' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px', letterSpacing: '-0.01em' }}>{item.title}</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}

          <div style={{ marginTop: '24px', padding: '16px', borderLeft: '2px solid #7c3aed' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              Verlyn is built for operators who understand that the business model of a platform dictates its security posture. Our model is based on direct infrastructure support, not the monetization of our participants.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
