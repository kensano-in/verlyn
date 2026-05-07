import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security Architecture — Verlyn',
  description: 'Verlyn threat model, cryptography specification, and attack mitigation strategies.',
};

export default function SecurityPage() {
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
            Security Specification
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Security Architecture
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '12px' }}>
            Threat Models & Mitigation Engineering
          </p>
        </div>

        <article style={{ display: 'flex', flexDirection: 'column', gap: '40px', color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.75 }}>

          <Section title="Architecture Diagram">
            <div style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'pre', overflowX: 'auto', color: '#a78bfa', lineHeight: 1.4 }}>
{`[ PARTICIPANT NODE ]
       |
       |  (1) Ed25519 Identity Binding
       |  (2) X25519 Key Agreement
       |  (3) ChaCha20-Poly1305 Payload Cipher
       V
[ SECURE TUNNEL (TLS 1.3) ]
       |
       |  (4) Strict Cipher Suites Enforced
       |  (5) HSTS Preloaded
       V
[ VERLYN EDGE INFRASTRUCTURE ]
       |
       |  (6) WAF & DoS Mitigation
       |  (7) SHA-256 IP Hashing Module
       |  (8) Rate Limiting & Abuse Detection
       V
[ POSTGRESQL CLUSTER ]
          (9) Row-Level Security (RLS) Engine
          (10) AES-256-GCM Storage Encryption`}
            </div>
          </Section>

          <Section title="Threat Model Summary">
            The Verlyn security posture assumes that all networks are hostile, including our own infrastructure. We operate under a Zero-Trust Threat Model where the server is considered a potential adversary. We mitigate threats originating from: passive network surveillance, active Man-in-the-Middle (MitM) interception, state-level compulsion, database exfiltration, and malicious infrastructure operators. The only trust boundary that matters is the cryptographic boundary enforced on the client device.
          </Section>

          <Section title="Attack Mitigation">
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Sybil & Automated Abuse:</strong> Mitigated via rigorous identity validation, domain whitelisting, cryptographic IP hashing, and deterministic rate-limiting clusters.</li>
              <li><strong>Payload Tampering:</strong> Mitigated via Poly1305 Message Authentication Codes (MAC). Any bit flip or payload alteration results in immediate decryption failure and connection termination.</li>
              <li><strong>Timing Attacks:</strong> Mitigated via constant-time cryptographic primitives and randomized, simulated processing delays in critical access workflows.</li>
              <li><strong>Database Exfiltration:</strong> Mitigated via Row-Level Security (RLS) enforcing strict INSERT-only constraints for public APIs. Read operations are categorically denied.</li>
            </ul>
          </Section>

          <Section title="Key Management Explanation">
            Verlyn does not escrow keys. Long-term Ed25519 identity keys are generated and retained exclusively within the secure enclave or encrypted local storage of the participant's device. Session keys are derived ephemerally via HKDF-SHA256 from X25519 Diffie-Hellman exchanges and exist solely in volatile process memory. Compromise of a device yields only current session data; perfect forward secrecy guarantees that past communications remain cryptographically secure.
          </Section>

          <div style={{ marginTop: '8px', padding: '20px 24px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '4px' }}>
            <p style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 500 }}>
              Security Disclosures & Vulnerability Reporting: <strong>admin@kensano.in</strong><br />
              We do not operate a public bug bounty. Responsible disclosures are handled directly by the core engineering team.
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
