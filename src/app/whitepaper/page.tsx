import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Whitepaper — Verlyn Protocol Architecture',
  description: 'Technical architecture, security model, and infrastructure specification for the Verlyn private communication protocol.',
};

export default function WhitepaperPage() {
  return (
    <main style={{
      minHeight: '100dvh', background: '#000', color: '#fff',
      padding: 'clamp(48px, 8vw, 120px) clamp(24px, 5vw, 64px)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: '13px', color: '#7c3aed', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '56px' }}>
          ← Back to System
        </Link>

        <div style={{ marginBottom: '64px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#7c3aed', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
            Technical Document v1.0.4
          </p>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.0 }}>
            Verlyn<br />
            <span style={{ WebkitTextStroke: '1px rgba(255,255,255,0.35)', color: 'transparent' }}>Protocol Architecture</span>
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginTop: '20px', maxWidth: '520px', lineHeight: 1.65 }}>
            A specification for a privacy-first, decentralized, invite-only communication infrastructure designed for high-trust, low-latency, cryptographically verified operations.
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '16px' }}>
            Published May 2026 · Verlyn · Restricted Pre-Release
          </p>
        </div>

        {/* Table of contents */}
        <nav style={{
          padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', marginBottom: '56px',
        }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '16px' }}>Contents</p>
          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {['Executive Summary', 'Problem Statement', 'Protocol Architecture', 'Security Model', 'Infrastructure', 'Future Roadmap'].map((s, i) => (
              <li key={i}><span style={{ color: '#7c3aed', marginRight: '8px', fontSize: '12px' }}>{String(i + 1).padStart(2, '0')}</span>{s}</li>
            ))}
          </ol>
        </nav>

        <article style={{ display: 'flex', flexDirection: 'column', gap: '56px', color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.8 }}>

          <Section num="01" title="Executive Summary">
            <p>Verlyn is a private communication protocol engineered for scenarios in which the standard confidentiality, integrity, and availability model of existing platforms is insufficient. It addresses the systematic failure of contemporary communication infrastructure to provide verifiable identity separation, structural resistance to centralized surveillance, and cryptographically enforced message confidentiality without trusted third-party key custodians.</p>
            <p style={{ marginTop: '16px' }}>The protocol operates on three non-negotiable axioms: (1) the server must never hold plaintext; (2) participant identity must be cryptographically verifiable without being linkable to a public identifier; and (3) access must be deliberately gated to ensure network quality and security posture.</p>
            <p style={{ marginTop: '16px' }}>Verlyn is not a product. It is an infrastructure primitive. It does not compete with consumer messaging applications. It competes with the trust assumptions that underpin critical communications across defense, legal, financial, and research domains.</p>
          </Section>

          <Section num="02" title="Problem Statement">
            <p>The current landscape of encrypted communication presents a critical paradox: platforms that claim privacy often require trust in centralized key management, metadata collection, or third-party authentication services. Signal, despite its strong cryptographic reputation, requires a phone number — a PII anchor to a real-world identity. End-to-end encryption in enterprise tools is frequently incompatible with regulatory audit requirements. Self-hosted solutions impose unacceptable operational overhead for non-technical participants.</p>
            <p style={{ marginTop: '16px' }}>Simultaneously, the threat model has evolved. State-level adversaries, supply chain attacks, and insider threats at platform providers have demonstrated that relying on any single organizational trust boundary is structurally insufficient for high-value communication. The Verlyn protocol treats all infrastructure — including its own — as potentially adversarial, and designs accordingly.</p>
            <SubSection title="Identified Failure Modes in Existing Systems">
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><strong style={{ color: '#fff' }}>Key escrow architectures:</strong> Platforms retaining ability to decrypt, whether intentionally or under compulsion.</li>
                <li><strong style={{ color: '#fff' }}>Metadata leakage:</strong> Communication graph, timing, and volume data exposed even when content is encrypted.</li>
                <li><strong style={{ color: '#fff' }}>Identity coupling:</strong> Cryptographic identity bound to email, phone, or OAuth provider — creating deanonymization vectors.</li>
                <li><strong style={{ color: '#fff' }}>Network promiscuity:</strong> Publicly accessible registration allows Sybil attacks and network quality degradation.</li>
                <li><strong style={{ color: '#fff' }}>Single-point governance:</strong> Platform policy changes, jurisdictional seizure, or organizational failure can terminate service without participant recourse.</li>
              </ul>
            </SubSection>
          </Section>

          <Section num="03" title="Protocol Architecture">
            <p>The Verlyn protocol stack operates across four distinct layers, each with an independent security boundary:</p>

            <SubSection title="Layer 1: Identity Layer">
              Participant identity within Verlyn is represented as an Ed25519 public key. This key is generated locally on the participant's device and never transmitted. A cryptographic commitment to this key (a SHA-256 hash of the public key) serves as the participant's network address. There is no username, email-based account, or password at the protocol level. Identity is possession of the private key.
            </SubSection>

            <SubSection title="Layer 2: Session Layer">
              Each session establishes a ephemeral Diffie-Hellman key pair (X25519) distinct from the long-term identity key. A shared session secret is derived via ECDH between the ephemeral keys of both participants, processed through HKDF-SHA256 with a domain-specific info parameter. This session secret is used to derive symmetric keys for ChaCha20-Poly1305 AEAD encryption. Session keys are never stored; they exist only in process memory for the duration of the session.
            </SubSection>

            <SubSection title="Layer 3: Transport Layer">
              Encrypted payloads are transmitted over WebSocket connections secured by TLS 1.3. The transport layer carries only ciphertext — no metadata about sender identity, receiver identity, or message content is visible to the transport infrastructure. Message sequencing is handled via an authenticated counter embedded in the AEAD additional data field, providing replay protection and ordering guarantees.
            </SubSection>

            <SubSection title="Layer 4: Routing Layer">
              The routing layer operates on a mesh topology with no central message broker. Edge nodes maintain routing tables keyed to participant commitment values (hashed public keys). Message routing decisions are made using onion-routing-inspired path selection: each relay node knows only its predecessor and successor, not the full path. This provides sender and receiver anonymity at the network topology level.
            </SubSection>
          </Section>

          <Section num="04" title="Security Model">
            <p style={{ marginBottom: '16px' }}>The Verlyn threat model explicitly considers the following adversary classes:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
              {[
                { adversary: 'Passive network observer', capability: 'Can observe all traffic', mitigation: 'TLS 1.3 + E2E encryption eliminates plaintext observation' },
                { adversary: 'Compromised relay node', capability: 'Can read routed messages', mitigation: 'Onion routing + E2E ensures relay sees only ciphertext' },
                { adversary: 'Malicious server operator', capability: 'Full database access', mitigation: 'RLS + no plaintext storage; server cannot read content' },
                { adversary: 'State-level compulsion', capability: 'Legal demands for data', mitigation: 'Nothing readable to produce; metadata minimized to IP hash' },
                { adversary: 'Participant compromise', capability: 'Device seizure', mitigation: 'Session key forward secrecy; past sessions cannot be decrypted' },
              ].map((row, i, arr) => (
                <div key={i} style={{ padding: '16px 20px', background: '#000', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{row.adversary}</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{row.capability}</p>
                    </div>
                    <p style={{ fontSize: '12px', color: '#a78bfa', maxWidth: '280px', textAlign: 'right' }}>{row.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
            <SubSection title="Security Properties Achieved">
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong style={{ color: '#fff' }}>Confidentiality:</strong> ChaCha20-Poly1305 authenticated encryption with 256-bit keys</li>
                <li><strong style={{ color: '#fff' }}>Integrity:</strong> AEAD authentication tag; any tampering produces decryption failure</li>
                <li><strong style={{ color: '#fff' }}>Forward secrecy:</strong> Ephemeral session keys; past sessions cannot be decrypted even with long-term key compromise</li>
                <li><strong style={{ color: '#fff' }}>Authenticity:</strong> Ed25519 message signing for participant identity binding</li>
                <li><strong style={{ color: '#fff' }}>Deniability:</strong> Standard ECDH-based session establishment provides cryptographic deniability</li>
              </ul>
            </SubSection>
          </Section>

          <Section num="05" title="Infrastructure">
            <p>The current Verlyn pre-access infrastructure is hosted on a combination of Vercel (edge compute) and Supabase (PostgreSQL + realtime). This is the pre-production stack. Production protocol infrastructure will be hosted on a multi-region, self-managed Kubernetes cluster spanning at minimum three geographic regions.</p>
            <SubSection title="Pre-Registration Infrastructure">
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Frontend: Next.js 16 on Vercel Edge Network (global CDN)</li>
                <li>API: Next.js Route Handlers with per-IP rate limiting</li>
                <li>Database: Supabase PostgreSQL (EU West — Ireland) with RLS</li>
                <li>Secrets: Vercel Environment Variables (never in source control)</li>
                <li>Deployment: GitHub Actions → Vercel auto-deploy (main branch only)</li>
              </ul>
            </SubSection>
            <SubSection title="Production Protocol Infrastructure (Planned)">
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Multi-region Kubernetes (k8s) with automatic failover</li>
                <li>PostgreSQL with read replicas and point-in-time recovery</li>
                <li>Redis cluster for session state and rate limiting at scale</li>
                <li>Custom WebSocket relay mesh with onion routing</li>
                <li>Hardware Security Modules (HSMs) for root key material</li>
                <li>Immutable audit log on append-only storage</li>
              </ul>
            </SubSection>
          </Section>

          <Section num="06" title="Future Roadmap">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {[
                { phase: 'Q3 2026', title: 'Protocol Alpha Launch', items: ['Tier-1 pre-registration cohort onboarded', 'Core 1:1 messaging functional', 'Ed25519 identity key generation tooling released'] },
                { phase: 'Q4 2026', title: 'Mesh Routing Beta', items: ['3-node minimum onion routing deployed', 'Tier-2 referral system activated', 'Group session protocol (3–12 participants) released'] },
                { phase: 'Q1 2027', title: 'Decentralized Coordination Layer', items: ['Participant-run relay nodes', 'Key transparency log (auditable, append-only)', 'HSM integration for high-assurance participants'] },
                { phase: 'Q2 2027', title: 'Open Protocol Specification', items: ['Full cryptographic specification published', 'Third-party audit report released', 'SDK for authorized integrations'] },
              ].map((phase, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: '24px', padding: '24px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ minWidth: '80px', paddingTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700, letterSpacing: '0.05em' }}>{phase.phase}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', color: '#fff', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.01em' }}>{phase.title}</p>
                    <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                      {phase.items.map((item, j) => <li key={j}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div style={{ padding: '24px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '12px' }}>
            <p style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 600, marginBottom: '8px' }}>Classification: Restricted Pre-Release</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              This document is provided to pre-registration participants for informational purposes. Full cryptographic specifications, implementation details, and independent audit reports are scheduled for release to approved Tier-1 participants 30 days prior to the Protocol Alpha launch. Redistribution of this document without written authorization from Verlyn is prohibited.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 700, letterSpacing: '0.1em', flexShrink: 0 }}>{num}</span>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingLeft: '0px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '10px', letterSpacing: '-0.01em' }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
