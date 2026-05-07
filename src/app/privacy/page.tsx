import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Protocol — Verlyn',
  description: 'Cryptographic data flow, encryption layers, and our zero-tracking architecture.',
};

export default function PrivacyPage() {
  return (
    <main style={{
      minHeight: '100dvh', background: '#000', color: '#fff',
      padding: 'clamp(48px, 8vw, 120px) clamp(24px, 5vw, 64px)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: '13px', color: '#7c3aed', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '56px' }}>
          ← Back to System
        </Link>

        <div style={{ marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 500, marginBottom: '12px' }}>
            Privacy Architecture
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Privacy Protocol
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '12px' }}>
            Technical Specification for Data Handling
          </p>
        </div>

        <article style={{ display: 'flex', flexDirection: 'column', gap: '40px', color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.75 }}>

          <Section title="1. Data Flow Explanation">
            Verlyn operates on a strict zero-knowledge data flow model. When you interact with the protocol, payloads are encrypted client-side before transmission. The edge network routes encrypted blobs. The database persists encrypted blobs. At no point in the lifecycle does Verlyn infrastructure possess the cryptographic capability to inspect the contents of your communications.
          </Section>

          <Section title="2. Encryption Layers">
            Data is protected by three distinct cryptographic barriers. First: Transport Layer Security (TLS 1.3) secures the tunnel between your device and the edge node. Second: X25519 Elliptic Curve Diffie-Hellman establishes perfect forward secrecy for every session. Third: ChaCha20-Poly1305 Authenticated Encryption with Associated Data (AEAD) ensures that even if the transport layer is compromised, the payload remains cryptographically impenetrable and tamper-proof.
          </Section>

          <Section title="3. No Tracking Declaration">
            We categorically reject the surveillance economy. The Verlyn pre-access interface and core protocol contain exactly zero analytics SDKs, zero behavioral tracking pixels, and zero third-party advertising scripts. We do not measure your scroll depth, track your mouse movements, or build a shadow profile of your digital footprint.
          </Section>

          <Section title="4. IP Hashing Architecture">
            Network abuse prevention requires rate limiting, but storing raw IP addresses creates an unacceptable privacy liability. Verlyn solves this through irreversible hashing. Upon connection, your IP address is combined with a high-entropy, server-side cryptographic salt and hashed using SHA-256. The resulting output is stored to prevent Sybil attacks. The raw IP is instantly discarded from memory. It cannot be reconstructed.
          </Section>

          <Section title="5. Data Lifecycle & Purge Mechanics">
            Data within the Verlyn infrastructure is designed to expire. We do not maintain indefinite archives. System telemetry is overwritten on a 7-day rolling window. Pre-registration hashes are hard-deleted from the database upon the conclusion of the onboarding phase. Cryptographic session state exists only in volatile memory and is destroyed upon session termination or device reboot.
          </Section>

          <Section title="6. Requesting Purge">
            While our systems are designed to self-purge, verified participants may request immediate, manual cryptographic destruction of their node identity and associated network routing metadata by issuing a signed termination command to the network.
          </Section>

          <div style={{ marginTop: '8px', padding: '20px 24px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '4px' }}>
            <p style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 500 }}>
              Privacy & Compliance Inquiries: <strong>admin@kensano.in</strong><br />
              All inquiries must clearly state the nature of the request in the subject line.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '14px', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
