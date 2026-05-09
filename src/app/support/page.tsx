'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SupportCenter from '@/components/SupportCenter';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { icon: '💬', label: 'General', sub: 'Questions & Inquiries', color: '#6366f1', type: 'general' },
  { icon: '🔧', label: 'Technical', sub: 'Bugs & Connectivity', color: '#3b82f6', type: 'tech' },
  { icon: '🔐', label: 'Security', sub: 'Privacy & Access', color: '#8b5cf6', type: 'security' },
  { icon: '📋', label: 'Registration', sub: 'Access & Sign-up Help', color: '#10b981', type: 'registration' },
  { icon: '⚡', label: 'Billing', sub: 'Payments & Plans', color: '#f59e0b', type: 'billing' },
  { icon: '🚨', label: 'Emergency', sub: 'Critical · Strict Policy', color: '#ef4444', type: 'emergency' },
];

const STEPS = [
  { n: '01', title: 'Choose a Category', desc: 'Select the type of issue from the support menu to route your case correctly.' },
  { n: '02', title: 'Submit Your Case', desc: 'Fill in your details. Our system issues a unique Case ID for tracking.' },
  { n: '03', title: 'Live Case Chat', desc: 'An admin joins your encrypted channel. You get notified when they reply.' },
  { n: '04', title: 'Resolution Confirmed', desc: 'Once resolved, your case is archived. You can re-open any time.' },
];

export default function SupportPage() {
  const router = useRouter();
  const [showWidget, setShowWidget] = useState(false);
  const [widgetView, setWidgetView] = useState<'menu' | 'form' | 'tracking' | 'faq' | 'chat' | 'identity'>('menu');
  const [tick, setTick] = useState(0);

  // Live clock tick for UTC display
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const openWidget = (type?: string) => {
    setWidgetView('menu');
    setShowWidget(true);
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#050505', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── TOP NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', background: 'rgba(5,5,5,0.9)', padding: '0 clamp(20px,5vw,60px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            verlyn.in
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.8)' }} />
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, fontFamily: 'monospace' }}>
              SUPPORT ONLINE · {new Date().toISOString().split('T')[1].slice(0, 8)} UTC
            </span>
          </div>
          <button onClick={() => openWidget()} style={{ padding: '9px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.05em' }}>
            Open Case
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,60px) 60px', textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '100px', padding: '6px 16px', marginBottom: '32px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '0.08em' }}>ALL SYSTEMS OPERATIONAL</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '20px' }}>
            Verlyn<br /><span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Support Center</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: '40px', maxWidth: '560px', margin: '0 auto 40px' }}>
            Enterprise-grade concierge support. Every case gets a dedicated agent, a private encrypted channel, and a guaranteed response.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => openWidget()}
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
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0' }}>
          {[
            { val: '< 2h', label: 'Average Response', sub: 'Guaranteed SLA' },
            { val: '99.9%', label: 'Uptime', sub: 'Last 90 days' },
            { val: 'E2E', label: 'Encryption', sub: 'Zero-knowledge protocol' },
            { val: '24/7', label: 'Availability', sub: 'Global agent coverage' },
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
              <motion.button key={i} onClick={() => openWidget(cat.type)}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.5 }}
                whileHover={{ scale: 1.02, borderColor: `${cat.color}50` }} whileTap={{ scale: 0.98 }}
                style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '22px 24px', background: `${cat.color}06`, border: `1px solid ${cat.color}20`, borderRadius: '16px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.2s' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: `${cat.color}15`, border: `1px solid ${cat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{cat.icon}</div>
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
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{ padding: '32px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.08)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{step.n}</div>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '13px', fontWeight: 800, color: '#6366f1', fontFamily: 'monospace' }}>{step.n}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '10px', letterSpacing: '-0.01em' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST / FAQ ── */}
      <section style={{ padding: 'clamp(60px,6vw,90px) clamp(20px,5vw,60px)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '12px' }}>Support Guarantees</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Our commitments to every person who contacts us.</p>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { icon: '🔒', title: 'End-to-End Encrypted', body: 'Every support conversation is encrypted in transit and at rest. Not even our team can read your messages without you.' },
              { icon: '⚡', title: 'Response under 2 hours', body: 'We commit to a first response within 2 hours for all standard cases. Emergency protocol cases get immediate attention.' },
              { icon: '🪪', title: 'Verified Agents Only', body: 'Every agent on our team passes identity verification. You will always know who you are talking to.' },
              { icon: '🗂️', title: 'Persistent Case History', body: 'Your Case ID is permanent. Even months later you can recover your conversation and status using the same ID.' },
              { icon: '🛡️', title: 'Zero Spam Tolerance', body: 'Abuse, spam, and bad-faith submissions are permanently blacklisted at the network level. We protect our users.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
                style={{ display: 'flex', gap: '18px', padding: '22px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{item.title}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65 }}>{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: 'clamp(60px,6vw,90px) clamp(20px,5vw,60px)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', padding: '48px 40px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '20px' }}>📬</div>
          <h2 style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '12px' }}>Ready to get help?</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '32px', lineHeight: 1.6 }}>Open a case right now. A real person will read it and respond — no bots, no scripted replies.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => openWidget()}
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
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} Verlyn Technologies · <a href="/privacy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Privacy</a> · <a href="/terms" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms</a></p>
      </footer>

      {/* ── SUPPORT WIDGET ── */}
      <AnimatePresence>
        {showWidget && (
          <SupportCenter onClose={() => setShowWidget(false)} initialView={widgetView} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.15)} }
      `}</style>
    </div>
  );
}
