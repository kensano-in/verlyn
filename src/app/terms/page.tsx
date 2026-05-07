import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Verlyn',
  description: 'Legal agreement governing access to and use of the Verlyn network infrastructure.',
};

export default function TermsPage() {
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
            Legal Framework
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '12px' }}>
            Document Reference: VRL-TOS-04 · Enforcement Date: Immediate
          </p>
        </div>

        <article style={{ display: 'flex', flexDirection: 'column', gap: '40px', color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.75 }}>
          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
            <p style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>WARNING</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Access to Verlyn infrastructure is a privilege, not a right. Violation of these terms will result in immediate, permanent revocation of access credentials and network blacklisting.</p>
          </div>

          <Section title="1. Identity Verification Requirements">
            Access to Verlyn requires stringent identity confirmation. To maintain network integrity, participants must verify their identity via secure asynchronous channels prior to credential issuance. We prohibit the use of disposable emails, anonymizing proxy networks during registration, and falsified credentials. Any attempt to circumvent identity verification represents a critical protocol violation.
          </Section>

          <Section title="2. Network Behavior Monitoring">
            While message content remains end-to-end encrypted and opaque to Verlyn infrastructure, network metadata (connection timing, packet volume, routing paths) is strictly monitored by automated anomaly detection systems. This monitoring identifies DoS patterns, Sybil activity, and protocol abuse without compromising cryptographic confidentiality. We reserve the right to throttle or terminate connections exhibiting signatures of malicious automation.
          </Section>

          <Section title="3. Data Retention Policy">
            We adhere to an aggressive data minimization doctrine. Cryptographic session keys are ephemeral. System logs are purged on a 7-day rolling cycle. Pre-registration data is retained solely for queue management and abuse prevention (via IP hashing) and is permanently destroyed upon queue closure. Verlyn maintains no historical archives of user activity.
          </Section>

          <Section title="4. Enforcement Mechanisms">
            Enforcement of these terms is absolute and automated. Upon detection of a violation, the system executes an immediate credential revocation protocol. There is no appeal process. A revoked identity key is permanently blacklisted at the network edge, preventing reconnection across all global routing nodes.
          </Section>

          <Section title="5. Abuse Classification (Levels)">
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Level 1 (Operational Abuse):</strong> Automated registration attempts, API polling exceeding limits. Consequence: 24-hour IP block.</li>
              <li><strong>Level 2 (Identity Fraud):</strong> Use of compromised domains, credential falsification. Consequence: Permanent identity ban.</li>
              <li><strong>Level 3 (Infrastructure Attack):</strong> Packet manipulation, routing exploitation, DoS. Consequence: Global network blocklist and legal referral.</li>
            </ul>
          </Section>

          <Section title="6. Data Sovereignty">
            You retain absolute ownership of the cryptographic keys generated on your device. Verlyn does not claim ownership over, nor do we possess the technical capability to access, the content transmitted through our routing infrastructure. We do not monetize network traffic.
          </Section>

          <Section title="7. Legal Jurisdiction">
            This agreement and any dispute arising from it shall be governed by and construed in accordance with the laws of the Republic of India. The courts of Bengaluru, India shall have exclusive jurisdiction. However, Verlyn reserves the right to seek injunctive relief or file civil claims in any global jurisdiction where infrastructure abuse originates.
          </Section>

          <div style={{ marginTop: '8px', padding: '20px 24px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '4px' }}>
            <p style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 500 }}>
              Legal Correspondence: <strong>admin@kensano.in</strong><br />
              All notices must be sent in writing to the above address.
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
