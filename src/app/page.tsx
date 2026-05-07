'use client';
import React from 'react';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Countdown from '@/components/Countdown';
import PreRegisterForm from '@/components/PreRegisterForm';
import Logo from '@/components/Logo';
import IntroScreen from '@/components/IntroScreen';
import SupportCenter from '@/components/SupportCenter';
import AdminGateway from '@/components/AdminGateway';

const NetworkGraph = dynamic(() => import('@/components/NetworkGraph'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '36px', height: '36px',
        borderRadius: '50%',
        border: '1px solid rgba(124,58,237,0.4)',
        borderTopColor: '#7c3aed',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
  ),
});

/* ── Feature Card (extracted to avoid complex Framer union types) ── */
function FeatureCard({ num, title, desc, index }: { num: string; title: string; desc: string; index: number }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 'clamp(28px, 4vw, 44px)',
        background: hovered ? 'rgba(124,58,237,0.05)' : '#000',
        cursor: 'default',
        transition: 'background 0.3s ease',
      }}
    >
      <span style={{ display: 'block', fontSize: '11px', letterSpacing: '0.15em', color: '#7c3aed', fontWeight: 600, marginBottom: '20px' }}>{num}</span>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{desc}</p>
    </motion.div>
  );
}

/* ── micro-animation variants ─────────────────────────────────────── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function HomePage() {
  const [transparencyMode, setTransparencyMode] = React.useState(false);
  // Start as "complete" on server; on client, check if intro was already seen
  const [introComplete, setIntroComplete] = React.useState(false);
  const [showSupport, setShowSupport] = React.useState(false);
  
  // Easter Egg State
  const [adminClicks, setAdminClicks] = React.useState(0);
  const [showAdminGateway, setShowAdminGateway] = React.useState(false);
  const adminClickTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const handleAdminClick = () => {
    setAdminClicks((prev) => {
      const newCount = prev + 1;
      if (newCount >= 10) {
        setShowAdminGateway(true);
        return 0;
      }
      return newCount;
    });

    if (adminClickTimeout.current) clearTimeout(adminClickTimeout.current);
    adminClickTimeout.current = setTimeout(() => setAdminClicks(0), 2000); // Reset if 2s pass
  };

  // After mount, skip the gate if intro was already seen
  React.useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('vrl_intro_v3')) {
      setIntroComplete(true);
    }
  }, []);

  return (
    <main style={{
      background: '#000000',
      minHeight: '100dvh',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      {/* ── CINEMATIC INTRO (shows once per session) ── */}
      <IntroScreen onComplete={() => setIntroComplete(true)} />

      {/* ── MAIN CONTENT — gated until intro finishes ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ pointerEvents: introComplete ? 'auto' : 'none' }}
      >

      {/* ── BACKGROUND 3D CANVAS (FIXED & UNTOUCHABLE) ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          style={{ width: '100%', height: '100%' }}
        >
          <NetworkGraph />
        </motion.div>
      </div>

      {/* ── HERO: Full Screen ─────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
      }}>

        {/* ── FOREGROUND CONTENT ── */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
          maxWidth: '800px',
          padding: 'clamp(40px, 6vw, 96px) clamp(20px, 5vw, 40px)',
          marginTop: '60px',
        }}>
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* eyebrow removed */}

            {/* HERO title — Editorial / Luxury brand treatment */}
            <motion.div variants={rise} style={{ position: 'relative', marginBottom: '20px' }}>
              <div style={{ marginBottom: '40px' }}>
                <Logo size={80} />
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>

                {/* Ghost outline — depth illusion, barely visible */}
                <h1 aria-hidden="true" style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  fontSize: 'clamp(80px, 12vw, 180px)',
                  fontFamily: 'var(--font-bebas), "Bebas Neue", Impact, sans-serif',
                  fontWeight: 400,
                  letterSpacing: '0.18em',
                  lineHeight: 1,
                  WebkitTextStroke: '1.5px rgba(255,255,255,0.18)',
                  color: 'transparent',
                  transform: 'translate(3px, 3px)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 1,
                }}>VERLYN</h1>

                {/* Main title — solid white, dominant, editorial */}
                <h1 style={{
                  fontSize: 'clamp(80px, 12vw, 180px)',
                  fontFamily: 'var(--font-bebas), "Bebas Neue", Impact, sans-serif',
                  fontWeight: 400,
                  letterSpacing: '0.18em',
                  lineHeight: 1,
                  color: '#ffffff',
                  position: 'relative',
                  zIndex: 2,
                  cursor: 'default',
                  transition: 'letter-spacing 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.letterSpacing = '0.24em'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.letterSpacing = '0.18em'; }}
                >VERLYN</h1>
              </div>

              {/* Editorial hairline rule + year tag */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '12px',
                justifyContent: 'center',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.15)', maxWidth: '80px' }} />
                <span style={{
                  fontSize: '10px',
                  letterSpacing: '0.3em',
                  color: 'rgba(255,255,255,0.35)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                }}>Est. 2025</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.15)', maxWidth: '80px' }} />
              </div>
            </motion.div>


            {/* tagline */}
            <motion.div variants={rise} style={{ marginBottom: '40px', maxWidth: '540px' }}>
              <p style={{
                fontSize: 'clamp(20px, 2.5vw, 28px)',
                color: '#ffffff',
                fontWeight: 600,
                lineHeight: 1.3,
                marginBottom: '14px',
                letterSpacing: '-0.01em',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)'
              }}>
                The private messaging & social platform.
              </p>
              <p style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.65)',
                fontWeight: 400,
                lineHeight: 1.65,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)'
              }}>
                Pre-register now for early access. Experience a zero-knowledge chatting and social network where your data is end-to-end encrypted and truly belongs to you.
              </p>
            </motion.div>

            {/* Countdown */}
            <motion.div variants={rise} style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
              <Countdown />
            </motion.div>

            {/* Form inside a gorgeous glass container */}
            <motion.div variants={rise} style={{ 
              width: '100%', 
              maxWidth: '480px', 
              position: 'relative',
              background: 'rgba(10, 10, 10, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
              <PreRegisterForm />
              
              {/* Transparency Toggle */}
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Transparency Mode
                </span>
                <button
                  onClick={() => setTransparencyMode(!transparencyMode)}
                  style={{
                    width: '32px', height: '18px', borderRadius: '9px',
                    background: transparencyMode ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', border: 'none', transition: 'background 0.3s'
                  }}
                >
                  <motion.div
                    animate={{ x: transparencyMode ? 14 : 2 }}
                    style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: '#fff', position: 'absolute', top: '2px', left: '0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  />
                </button>
              </div>
              <AnimatePresence>
                {transparencyMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'left' }}>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                        <strong>Data Handling:</strong> Emails are encrypted on the client side. No raw data is stored. <strong>System Behavior:</strong> Access simulation involves deterministic delays to prevent timing attacks. <strong>Privacy:</strong> Zero third-party tracking scripts. Zero analytics.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── WHY VERLYN SECTION ─────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: 'clamp(80px, 10vw, 140px) clamp(32px, 8vw, 120px)',
        background: 'transparent',
        backdropFilter: 'none',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ marginBottom: '64px', maxWidth: '640px' }}
        >
          <p style={{
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 500,
            marginBottom: '16px',
          }}>
            The Platform
          </p>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            marginBottom: '24px'
          }}>
            Why Verlyn?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            A space where connections are real, data is encrypted, and interactions are deliberate.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {[
            { num: '01', title: 'Private Social Space', desc: 'Share and connect without exposure. Your social circle, entirely private.' },
            { num: '02', title: 'Secure Messaging', desc: 'Conversations designed to stay yours. End-to-end encrypted by default.' },
            { num: '03', title: 'Controlled Access', desc: 'Real people, verified presence. Quality connections over viral metrics.' },
            { num: '04', title: 'No Noise', desc: 'No spam, no tracking, no algorithm chaos. A calm, chronological feed.' },
          ].map((f, i) => (
            <FeatureCard key={i} index={i} num={f.num} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>

      {/* ── WHAT HAPPENS NEXT ────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: 'clamp(60px, 8vw, 100px) clamp(32px, 8vw, 120px)',
        background: 'transparent',
        backdropFilter: 'none',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <p style={{
          fontSize: '11px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
          fontWeight: 500,
          marginBottom: '40px',
        }}>
          Onboarding
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 600, color: '#fff', marginBottom: '32px', letterSpacing: '-0.02em' }}>
          What happens next?
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', maxWidth: '640px' }}>
          {[
            { title: '1. You request access', desc: 'Enter your email to reserve a secure spot on the waiting list.' },
            { title: '2. We verify entries', desc: 'Our system filters out bots and ensures genuine human requests.' },
            { title: '3. Invitations are released', desc: 'Access is granted in phases to ensure platform stability and privacy.' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '24px 0',
                borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <h3 style={{ fontSize: '16px', color: '#fff', fontWeight: 600 }}>{step.title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ACCESS RULES (REMOVED) ────────────────────────────────────────────────── */}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        background: 'transparent',
        backdropFilter: 'none',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: 'clamp(40px, 5vw, 64px) clamp(32px, 8vw, 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px',
      }}>
        <span 
          onClick={handleAdminClick}
          style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', cursor: 'default', userSelect: 'none' }}
        >
          VERLYN
        </span>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {[
            { label: 'Terms', href: '/terms' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Security', href: '/security' },
            { label: 'Access Model', href: '/access-model' },
            { label: 'Transparency', href: '/transparency' },
            { label: 'Status', href: '/status' },
            { label: 'Whitepaper', href: '/whitepaper' },
          ].map((l) => (
            <a key={l.label} href={l.href} style={{
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.25)'; }}
            >{l.label}</a>
          ))}
          <button onClick={() => setShowSupport(true)} style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
            textDecoration: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.2s',
          }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.25)'; }}
          >SUPPORT</button>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.05em' }}>
          © Verlyn.in
        </p>
      </footer>

      {/* ── Global keyframe injection ─────────────────────────────────── */}
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @media (max-width: 768px) {
          h1 { letter-spacing: -0.04em !important; }
        }
      `}</style>

      </motion.div>{/* end intro-gated content */}

      <AnimatePresence>
        {showSupport && <SupportCenter onClose={() => setShowSupport(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminGateway && <AdminGateway onClose={() => setShowAdminGateway(false)} />}
      </AnimatePresence>
    </main>
  );
}
