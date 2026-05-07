import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Access Model — Verlyn',
  description: 'How Verlyn invites work, why restricted access exists, and what the tier system means.',
};

export default function AccessModelPage() {
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
            Access Architecture
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Access Model
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '12px' }}>
            How invites work. Why restriction exists. What access means.
          </p>
        </div>

        <article style={{ display: 'flex', flexDirection: 'column', gap: '40px', color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.75 }}>

          <Section title="Why Verlyn Is Invitation-Only">
            Open networks fail. Not because of technical deficiencies, but because of participant quality degradation. Every major communication network that began with high trust and intention has been systematically diluted by unrestricted access — creating noise, abuse vectors, and structural vulnerabilities that privacy-critical infrastructure cannot tolerate. Verlyn is built for operators, researchers, and builders who require absolute confidence in their communication layer. That confidence is only achievable when every participant in the network has been deliberately introduced.
          </Section>

          <Section title="The Pre-Registration Phase">
            <p style={{ marginBottom: '12px' }}>Pre-registration is the first gate. It establishes your intent to participate and places you in the Protocol Alpha queue. It does not guarantee access. During this phase:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>Your email is validated against a trusted provider whitelist (preventing disposable or anonymous addresses)</li>
              <li>Your submission is logged with a SHA-256 hashed IP for deduplication and abuse prevention</li>
              <li>You agree to the Verlyn Terms of Service and Privacy Protocol before submission is accepted</li>
              <li>A unique queue position is assigned based on submission order within your domain tier</li>
            </ul>
            <p style={{ marginTop: '12px' }}>Pre-registration is permanent. You will not be re-notified to re-register.</p>
          </Section>

          <Section title="The Tier System">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', marginTop: '4px' }}>
              {[
                {
                  tier: 'Tier 0 — Core',
                  access: 'Founding participants, infrastructure contributors',
                  status: 'Closed',
                  color: '#a78bfa',
                },
                {
                  tier: 'Tier 1 — Alpha',
                  access: 'Protocol Alpha pre-registration cohort',
                  status: 'Open Registration',
                  color: '#22c55e',
                },
                {
                  tier: 'Tier 2 — Beta',
                  access: 'Verified referral network from Tier 1',
                  status: 'Not Yet Open',
                  color: 'rgba(255,255,255,0.3)',
                },
                {
                  tier: 'Tier 3 — Public',
                  access: 'General access (if and when announced)',
                  status: 'Not Announced',
                  color: 'rgba(255,255,255,0.2)',
                },
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px 24px',
                  background: '#000',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: '15px', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>{row.tier}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{row.access}</p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: row.color, whiteSpace: 'nowrap' }}>{row.status}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="The Invite Process">
            <p style={{ marginBottom: '12px' }}>After the pre-registration window closes, access invitations are issued in the following sequence:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {[
                { step: '01', title: 'Queue Finalization', desc: 'Pre-registration list is frozen and deduplicated.' },
                { step: '02', title: 'Identity Verification', desc: 'Tier-1 participants undergo asynchronous identity confirmation via secure channel.' },
                { step: '03', title: 'Cryptographic Credential Issuance', desc: 'A unique, time-limited access credential is generated and delivered to your verified email.' },
                { step: '04', title: 'Network Onboarding', desc: 'Credential is exchanged for a node identity within the Verlyn network. No username. No password. Cryptographic only.' },
                { step: '05', title: 'Referral Rights', desc: 'Active Tier-1 participants receive a fixed number of Tier-2 referral slots, maintaining network integrity through trust chains.' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '20px',
                  padding: '20px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700, minWidth: '24px', paddingTop: '3px' }}>{item.step}</span>
                  <div>
                    <p style={{ fontSize: '15px', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>{item.title}</p>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="What Access Does Not Mean">
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Access to Verlyn does not imply financial participation, equity, or token allocation of any kind.</li>
              <li>Access rights are non-transferable and bound to the verified identity of the original recipient.</li>
              <li>Access can be revoked at any time for violations of the Terms of Service or network integrity rules.</li>
              <li>The Company makes no commitment to maintain or continue the network beyond what is warranted by operational viability.</li>
            </ul>
          </Section>

          <div style={{ padding: '24px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '12px' }}>
            <p style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 500, marginBottom: '4px' }}>Registration does not guarantee access.</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              Every admitted participant has been evaluated. Quality over quantity. This is not a promise — it is a constraint we enforce without exception.
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
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '14px', letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
