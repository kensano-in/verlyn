'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SupportCenter from '@/components/SupportCenter';
import { useRouter } from 'next/navigation';

// ── SVG icon components ──────────────────────────────────────────────
const Icon = {
  // category icons
  Chat:     (c='#6366f1') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Wrench:   (c='#3b82f6') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  Shield:   (c='#8b5cf6') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  UserPlus: (c='#10b981') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  CreditCard:(c='#f59e0b') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  AlertTri: (c='#ef4444') => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  // guarantee icons
  Lock:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Zap:      () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Badge:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  Archive:  () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  ShieldOff:() => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/></svg>,
  // CTA icon
  Mail:     () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
};

const CATEGORIES = [
  { icon: Icon.Chat,      label: 'General',      sub: 'Questions & Inquiries',  color: '#6366f1', type: 'general' },
  { icon: Icon.Wrench,    label: 'Technical',    sub: 'Bugs & Connectivity',    color: '#3b82f6', type: 'tech' },
  { icon: Icon.Shield,    label: 'Security',     sub: 'Privacy & Access',       color: '#8b5cf6', type: 'security' },
  { icon: Icon.UserPlus,  label: 'Registration', sub: 'Access & Sign-up Help',  color: '#10b981', type: 'registration' },
  { icon: Icon.CreditCard,label: 'Billing',      sub: 'Payments & Plans',       color: '#f59e0b', type: 'billing' },
  { icon: Icon.AlertTri,  label: 'Emergency',    sub: 'Critical · Strict Policy',color: '#ef4444',type: 'emergency' },
];

const GUARANTEES = [
  { Icon: Icon.Lock,     title: 'End-to-End Encrypted',   body: 'Every support conversation is encrypted in transit and at rest. Not even our team can read your messages without you.' },
  { Icon: Icon.Zap,      title: 'Response under 2 hours', body: 'We commit to a first response within 2 hours for all standard cases. Emergency protocol cases get immediate attention.' },
  { Icon: Icon.Badge,    title: 'Verified Agents Only',   body: 'Every agent on our team passes identity verification. You will always know who you are talking to.' },
  { Icon: Icon.Archive,  title: 'Persistent Case History',body: 'Your Case ID is permanent. Even months later you can recover your conversation and status using the same ID.' },
  { Icon: Icon.ShieldOff,title: 'Zero Spam Tolerance',   body: 'Abuse, spam, and bad-faith submissions are permanently blacklisted at the network level. We protect our users.' },
];

const STEPS = [
  { n: '01', title: 'Choose a Category', desc: 'Select the type of issue from the support menu to route your case correctly.' },
  { n: '02', title: 'Submit Your Case',  desc: 'Fill in your details. Our system issues a unique Case ID for tracking.' },
  { n: '03', title: 'Live Case Chat',    desc: 'An admin joins your encrypted channel. You get notified when they reply.' },
  { n: '04', title: 'Resolution',        desc: 'Once resolved, your case is archived. You can re-open any time.' },
];

export default function SupportPage() {
  const router = useRouter();
  const [showWidget, setShowWidget] = useState(false);
  const [widgetView, setWidgetView] = useState<'menu'|'form'|'tracking'|'faq'|'chat'|'identity'>('menu');
  const [utc, setUtc] = useState('');

  useEffect(() => {
    const tick = () => setUtc(new Date().toISOString().split('T')[1].slice(0,8));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const openWidget = () => { setWidgetView('menu'); setShowWidget(true); };

  return (
    <div style={{ minHeight: '100dvh', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', background: 'rgba(5,5,5,0.9)', padding: '0 clamp(20px,5vw,60px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <button onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            verlyn.in
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.8)', animation: 'vrlPulse 2s infinite' }} />
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, fontFamily: 'monospace' }}>SUPPORT ONLINE · {utc} UTC</span>
          </div>
          <button onClick={openWidget}
            style={{ padding: '9px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.05em' }}>
            Open Case
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,60px) 60px', textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '100px', padding: '6px 16px', marginBottom: '32px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'vrlPulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '0.08em' }}>ALL SYSTEMS OPERATIONAL</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '20px' }}>
            Verlyn<br />
            <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Support Center</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 40px' }}>
            Enterprise-grade concierge support. Every case gets a dedicated agent, a private encrypted channel, and a guaranteed response.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openWidget}
              style={{ padding: '16px 36px', background: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.04em', boxShadow: '0 16px 48px rgba(255,255,255,0.12)' }}>
              Open a Support Case
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setWidgetView('tracking'); setShowWidget(true); }}
              style={{ padding: '16px 36px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.03em' }}>
              Track Existing Case
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '28px clamp(20px,5vw,60px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { val: '< 2h',  label: 'Average Response', sub: 'Guaranteed SLA' },
            { val: '99.9%', label: 'Uptime',           sub: 'Last 90 days' },
            { val: 'E2E',   label: 'Encryption',       sub: 'Zero-knowledge protocol' },
            { val: '24/7',  label: 'Availability',     sub: 'Global agent coverage' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{ textAlign: 'center', padding: '20px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <p style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }}>{s.val}</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>{s.label}</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.03em' }}>{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section style={{ padding: 'clamp(60px,6vw,90px) clamp(20px,5vw,60px)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>Support Categories</p>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 700, letterSpacing: '-0.03em' }}>What do you need help with?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
            {CATEGORIES.map((cat, i) => (
              <motion.button key={i} onClick={openWidget}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.5 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '22px 24px', background: `${cat.color}06`, border: `1px solid ${cat.color}22`, borderRadius: '16px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.2s' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: `${cat.color}15`, border: `1px solid ${cat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {cat.icon(cat.color)}
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px', letterSpacing: '-0.01em' }}>{cat.label}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)' }}>{cat.sub}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: 'clamp(60px,6vw,90px) clamp(20px,5vw,60px)', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>The Process</p>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 700, letterSpacing: '-0.03em' }}>How support works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '2px' }}>
            {STEPS.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{ padding: '32px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.06)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{step.n}</div>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '13px', fontWeight: 800, color: '#6366f1', fontFamily: 'monospace' }}>{step.n}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '10px', letterSpacing: '-0.01em' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUARANTEES ── */}
      <section style={{ padding: 'clamp(60px,6vw,90px) clamp(20px,5vw,60px)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '12px' }}>Support Guarantees</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Our commitments to every person who contacts us.</p>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {GUARANTEES.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
                style={{ display: 'flex', gap: '18px', padding: '22px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, marginTop: '2px', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.Icon />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{item.title}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65 }}>{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: 'clamp(60px,6vw,90px) clamp(20px,5vw,60px)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', padding: '48px 40px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Icon.Mail />
          </div>
          <h2 style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '12px' }}>Ready to get help?</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '32px', lineHeight: 1.6 }}>Open a case right now. A real person will read it and respond — no bots, no scripted replies.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openWidget}
              style={{ padding: '16px 36px', background: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.04em' }}>
              Start a Case
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setWidgetView('faq'); setShowWidget(true); }}
              style={{ padding: '16px 36px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Browse FAQs
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '28px clamp(20px,5vw,60px)', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} Verlyn Technologies ·{' '}
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Privacy</a> ·{' '}
          <a href="/terms"   style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms</a>
        </p>
      </footer>

      {/* ── WIDGET ── */}
      <AnimatePresence>
        {showWidget && <SupportCenter onClose={() => setShowWidget(false)} initialView={widgetView} />}
      </AnimatePresence>

      <style>{`
        @keyframes vrlPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.2)} }
      `}</style>
    </div>
  );
}
