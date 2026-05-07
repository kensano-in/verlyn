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

// Lazy-load heavy 3D scene
const NetworkGraph = dynamic(() => import('@/components/NetworkGraph'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        border: '1px solid rgba(99,102,241,0.3)',
        borderTopColor: '#818cf8',
        animation: 'spin 0.9s linear infinite',
      }} />
    </div>
  ),
});

/* ── Animation variants ─────────────────────────────────────────── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const rise = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Feature Card ────────────────────────────────────────────────── */
function FeatureCard({ num, title, desc, index }: { num: string; title: string; desc: string; index: number }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.65 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 'clamp(28px, 4vw, 44px)',
        background: hovered ? 'rgba(99,102,241,0.04)' : 'rgba(0,0,0,0.01)',
        cursor: 'default',
        transition: 'background 0.35s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top border accent on hover */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: hovered ? 'rgba(99,102,241,0.25)' : 'transparent',
        transition: 'background 0.35s ease',
      }} />
      <span style={{
        display: 'block', fontSize: '10px', letterSpacing: '0.18em',
        color: hovered ? 'rgba(129,140,248,0.8)' : 'rgba(255,255,255,0.2)',
        fontWeight: 600, marginBottom: '22px',
        transition: 'color 0.3s ease',
      }}>{num}</span>
      <h3 style={{
        fontSize: '17px', fontWeight: 600, color: '#fff',
        marginBottom: '12px', letterSpacing: '-0.02em',
        lineHeight: 1.25,
      }}>{title}</h3>
      <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{desc}</p>
    </motion.div>
  );
}

/* ── Step Row ────────────────────────────────────────────────────── */
function StepRow({ step, i, total }: { step: { title: string; desc: string }; i: number; total: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: i * 0.09, duration: 0.55 }}
      style={{
        display: 'flex', gap: '24px', alignItems: 'flex-start',
        padding: '28px 0',
        borderBottom: i < total - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
      }}
    >
      <span style={{
        fontSize: '11px', color: 'rgba(255,255,255,0.2)',
        fontWeight: 700, letterSpacing: '0.1em',
        minWidth: '28px', paddingTop: '2px',
        fontFamily: 'var(--font-mono, monospace)',
      }}>0{i + 1}</span>
      <div>
        <h3 style={{ fontSize: '15px', color: '#fff', fontWeight: 600, marginBottom: '8px' }}>{step.title}</h3>
        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const [transparencyMode, setTransparencyMode] = React.useState(false);
  const [introComplete, setIntroComplete]       = React.useState(false);
  const [showSupport, setShowSupport]           = React.useState(false);
  const [adminClicks, setAdminClicks]           = React.useState(0);
  const [showAdminGateway, setShowAdminGateway] = React.useState(false);
  const adminClickTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const handleAdminClick = () => {
    setAdminClicks(prev => {
      const n = prev + 1;
      if (n >= 10) { setShowAdminGateway(true); return 0; }
      return n;
    });
    if (adminClickTimeout.current) clearTimeout(adminClickTimeout.current);
    adminClickTimeout.current = setTimeout(() => setAdminClicks(0), 2000);
  };

  React.useEffect(() => {
    // Intro always shows now
  }, []);

  const features = [
    { num: '01', title: 'Private Social Space', desc: 'Share and connect without exposure. Your social circle, entirely private and truly yours.' },
    { num: '02', title: 'Secure Messaging',      desc: 'Conversations designed to stay yours. End-to-end encrypted, zero server storage.' },
    { num: '03', title: 'Controlled Access',     desc: 'Real people, verified presence. Quality connections over viral metrics and follower counts.' },
    { num: '04', title: 'No Noise',              desc: 'No spam, no tracking, no algorithm chaos. A calm, chronological feed that respects your time.' },
  ];

  const steps = [
    { title: 'You request access',       desc: 'Enter your email to reserve a verified spot on the waitlist. No spam. No marketing.' },
    { title: 'We verify your identity',  desc: 'Our system validates entries, filters bots, and ensures genuine human requests.' },
    { title: 'Invitations are released', desc: 'Access is granted in deliberate phases to maintain platform integrity and privacy.' },
  ];

  const footerLinks = [
    { label: 'Terms',        href: '/terms' },
    { label: 'Privacy',      href: '/privacy' },
    { label: 'Security',     href: '/security' },
    { label: 'Access Model', href: '/access-model' },
    { label: 'Transparency', href: '/transparency' },
    { label: 'Status',       href: '/status' },
    { label: 'Whitepaper',   href: '/whitepaper' },
  ];

  return (
    <main style={{
      background: '#000',
      minHeight: '100dvh',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* ── CINEMATIC INTRO ── */}
      <IntroScreen onComplete={() => setIntroComplete(true)} />

      {/* ── MAIN CONTENT ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        style={{ pointerEvents: introComplete ? 'auto' : 'none' }}
      >

        {/* ── BACKGROUND 3D ── */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            style={{ width: '100%', height: '100%' }}
          >
            <NetworkGraph />
          </motion.div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            HERO — Full Screen
        ════════════════════════════════════════════════════════════ */}
        <section style={{
          position: 'relative', minHeight: '100dvh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1,
        }}>
          <div style={{
            position: 'relative', zIndex: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center',
            width: '100%', maxWidth: '820px',
            padding: 'clamp(40px, 6vw, 100px) clamp(24px, 5vw, 40px)',
            marginTop: '60px',
          }}>
            <motion.div variants={stagger} initial="hidden" animate="show"
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {/* Logo */}
              <motion.div variants={rise} style={{ marginBottom: '44px' }}>
                <Logo size={76} />
              </motion.div>

              {/* Hero Title */}
              <motion.div variants={rise} style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {/* Ghost outline — editorial depth */}
                  <h1 aria-hidden="true" style={{
                    position: 'absolute', top: 0, left: 0,
                    fontSize: 'clamp(76px, 11.5vw, 176px)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 400,
                    letterSpacing: '0.18em', lineHeight: 1,
                    WebkitTextStroke: '1.5px rgba(255,255,255,0.1)',
                    color: 'transparent',
                    transform: 'translate(4px, 4px)',
                    pointerEvents: 'none', userSelect: 'none',
                    whiteSpace: 'nowrap', zIndex: 1,
                  }}>VERLYN</h1>

                  {/* Main title */}
                  <h1 style={{
                    fontSize: 'clamp(76px, 11.5vw, 176px)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 400,
                    letterSpacing: '0.18em', lineHeight: 1,
                    color: '#ffffff',
                    position: 'relative', zIndex: 2,
                    cursor: 'default', margin: 0,
                    userSelect: 'none', whiteSpace: 'nowrap',
                    transition: 'letter-spacing 0.7s cubic-bezier(0.22,1,0.36,1)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.letterSpacing = '0.26em'; }}
                    onMouseLeave={e => { e.currentTarget.style.letterSpacing = '0.18em'; }}
                  >VERLYN</h1>
                </div>

                {/* Editorial hairline + year */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px', justifyContent: 'center' }}>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12))', maxWidth: '80px' }} />
                  <span style={{ fontSize: '9px', letterSpacing: '0.32em', color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Est. 2025
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.12), transparent)', maxWidth: '80px' }} />
                </div>
              </motion.div>

              {/* Tagline */}
              <motion.div variants={rise} style={{ marginBottom: '44px', maxWidth: '520px' }}>
                <p style={{
                  fontSize: 'clamp(19px, 2.4vw, 27px)',
                  color: '#ffffff', fontWeight: 600, lineHeight: 1.28,
                  marginBottom: '14px', letterSpacing: '-0.015em',
                  textShadow: '0 4px 20px rgba(0,0,0,0.7)',
                }}>
                  The private messaging &amp; social platform.
                </p>
                <p style={{
                  fontSize: '14px', color: 'rgba(255,255,255,0.5)',
                  fontWeight: 400, lineHeight: 1.7,
                  textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                }}>
                  Pre-register now for early access. Zero-knowledge architecture,
                  end-to-end encryption, and a feed that belongs to you.
                </p>
              </motion.div>

              {/* Countdown */}
              <motion.div variants={rise} style={{ marginBottom: '44px' }}>
                <Countdown />
              </motion.div>

              {/* Registration form — glass container */}
              <motion.div variants={rise} style={{
                width: '100%', maxWidth: '460px',
                background: 'rgba(8,8,8,0.72)',
                backdropFilter: 'saturate(180%) blur(24px)',
                WebkitBackdropFilter: 'saturate(180%) blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '18px', padding: '28px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.07)',
              }}>
                <PreRegisterForm />

                {/* Transparency Toggle */}
                <div style={{
                  marginTop: '22px', paddingTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Transparency Mode
                  </span>
                  <button
                    onClick={() => setTransparencyMode(!transparencyMode)}
                    aria-label="Toggle transparency mode"
                    style={{
                      width: '34px', height: '20px', borderRadius: '10px',
                      background: transparencyMode ? '#6366f1' : 'rgba(255,255,255,0.08)',
                      position: 'relative', cursor: 'pointer', border: 'none',
                      transition: 'background 0.28s ease', flexShrink: 0,
                    }}
                  >
                    <motion.div
                      animate={{ x: transparencyMode ? 14 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: '#fff', position: 'absolute', top: '2px', left: '0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
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
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        marginTop: '14px', padding: '16px',
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '10px', textAlign: 'left',
                      }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>
                          <strong>Data Handling:</strong> Emails are encrypted client-side before transmission. No raw data is stored.{' '}
                          <strong>System Behavior:</strong> Access simulation uses deterministic delays to prevent timing attacks.{' '}
                          <strong>Privacy:</strong> Zero third-party tracking. Zero analytics. Zero compromise.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            WHY VERLYN
        ════════════════════════════════════════════════════════════ */}
        <section style={{
          position: 'relative', zIndex: 1,
          padding: 'clamp(80px, 10vw, 140px) var(--gutter)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
            style={{ marginBottom: '64px', maxWidth: '600px' }}
          >
            <p style={{
              fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.22)', fontWeight: 600, marginBottom: '18px',
            }}>The Platform</p>
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 46px)', fontWeight: 700,
              letterSpacing: '-0.03em', color: '#fff', marginBottom: '20px', lineHeight: 1.05,
            }}>
              Why Verlyn?
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.75 }}>
              A space where connections are real, data is encrypted, and interactions are deliberate — not engineered by an algorithm.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}>
            {features.map((f, i) => (
              <FeatureCard key={i} index={i} num={f.num} title={f.title} desc={f.desc} />
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            WHAT HAPPENS NEXT
        ════════════════════════════════════════════════════════════ */}
        <section style={{
          position: 'relative', zIndex: 1,
          padding: 'clamp(60px, 8vw, 100px) var(--gutter)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.65 }}
            style={{ maxWidth: '600px' }}
          >
            <p style={{
              fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.22)', fontWeight: 600, marginBottom: '18px',
            }}>Onboarding</p>
            <h2 style={{
              fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700,
              color: '#fff', marginBottom: '40px', letterSpacing: '-0.025em', lineHeight: 1.1,
            }}>
              What happens next?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {steps.map((step, i) => (
                <StepRow key={i} step={step} i={i} total={steps.length} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════════════════ */}
        <footer style={{
          position: 'relative', zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          padding: 'clamp(36px, 5vw, 56px) var(--gutter)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '20px',
          }}>
            {/* Brand */}
            <span
              onClick={handleAdminClick}
              style={{
                fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.55)', cursor: 'default', userSelect: 'none',
                transition: 'color 0.2s',
              }}
            >
              VERLYN
            </span>

            {/* Nav links */}
            <nav style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
              {footerLinks.map(l => (
                <a key={l.label} href={l.href} style={{
                  fontSize: '10px', fontWeight: 500,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.22)', textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.22)'; }}
                >{l.label}</a>
              ))}
              <button onClick={() => setShowSupport(true)} style={{
                fontSize: '10px', fontWeight: 500,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.22)', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'color 0.2s ease',
              }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.22)'; }}
              >Support</button>
            </nav>

            {/* Copyright */}
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.05em' }}>
              © Verlyn.in
            </p>
          </div>
        </footer>

      </motion.div>{/* end intro-gated content */}

      {/* Support Panel */}
      <AnimatePresence>
        {showSupport && <SupportCenter onClose={() => setShowSupport(false)} />}
      </AnimatePresence>

      {/* Admin Gateway */}
      <AnimatePresence>
        {showAdminGateway && <AdminGateway onClose={() => setShowAdminGateway(false)} />}
      </AnimatePresence>
    </main>
  );
}
