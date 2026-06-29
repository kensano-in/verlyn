'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface LegalPageProps {
  eyebrow: string;
  title: string;
  reference: string;
  children: ReactNode;
}

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="vrl-legal-section-title">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

export function LegalNotice({ children }: { children: ReactNode }) {
  return <div className="vrl-legal-notice">{children}</div>;
}

export function LegalContact({ email, label, description }: { email: string; label: string; description: string }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
      <div>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{label}</p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{description}</p>
      </div>
      <a href={`mailto:${email}`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontFamily: 'monospace', whiteSpace: 'nowrap', paddingTop: '2px', transition: 'color 0.2s' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
      >{email}</a>
    </div>
  );
}

export default function LegalPageLayout({ eyebrow, title, reference, children }: LegalPageProps) {
  return (
    <div className="vrl-legal-page">
      <div className="vrl-legal-container">
        <div className="vrl-legal-header">
          <Link href="/" className="vrl-legal-back">
            <BackArrow />
            Verlyn
          </Link>
          <p className="vrl-legal-eyebrow">{eyebrow}</p>
          <h1 className="vrl-legal-title">{title}</h1>
          <p className="vrl-legal-subtitle">{reference}</p>
        </div>

        <article className="vrl-legal-article">
          {children}
        </article>

        <footer style={{ marginTop: '80px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>Verlyn · verlyn.in</span>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[{ label: 'Terms', href: '/terms' }, { label: 'Privacy', href: '/privacy' }, { label: 'Security', href: '/security' }, { label: 'Status', href: '/status' }].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, transition: 'color 0.2s' }}>{l.label}</Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
