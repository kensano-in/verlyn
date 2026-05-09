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
import GovernancePortal from '@/components/GovernancePortal';
import DeveloperIdentity from '@/components/DeveloperIdentity';

const AnimatedPath = ({ d, color }: { d: string, color: string }) => (
  <>
    <motion.path d={d} stroke={`url(#grad-home-${color.replace('#', '')})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 1.2, ease: "easeInOut" }} />
    <motion.path d={d} stroke={color} strokeWidth="3" opacity="0.2" filter="blur(3px)" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 1.2, ease: "easeInOut" }} />
  </>
);

const SvgBase = ({ children, color, size = 26 }: { children: React.ReactNode, color: string, size?: number }) => (
  <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.5, ease: "easeOut" }}>
    <defs>
      <linearGradient id={`grad-home-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="1" />
        <stop offset="100%" stopColor={color} stopOpacity="0.3" />
      </linearGradient>
    </defs>
    {children}
  </motion.svg>
);

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
  // Always start false (avoids SSR/client hydration mismatch)
  // useEffect reads sessionStorage after mount - safe from hydration errors
  const [introComplete, setIntroComplete] = React.useState(false);
  const [showSupport, setShowSupport] = React.useState(false);
  const [supportView, setSupportView] = React.useState<any>('menu');
  const [showGov, setShowGov]         = React.useState(false);
  const [govView, setGovView]         = React.useState<any>('terms');
  const [adminClicks, setAdminClicks]           = React.useState(0);
  const [showAdminGateway, setShowAdminGateway] = React.useState(false);
  const [showIdentity, setShowIdentity]         = React.useState(false);
  const adminClickTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // After mount, check if intro was already seen this session
  React.useEffect(() => {
    if (sessionStorage.getItem('vrl_intro_done') === '1') {
      setIntroComplete(true);
    }
  }, []);

  const handleAdminClick = () => {
    setAdminClicks(prev => {
      const n = prev + 1;
      if (n >= 10) { setShowAdminGateway(true); return 0; }
      return n;
    });
    if (adminClickTimeout.current) clearTimeout(adminClickTimeout.current);
    adminClickTimeout.current = setTimeout(() => setAdminClicks(0), 2000);
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem('vrl_intro_done', '1');
    setIntroComplete(true);
  };

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
    { label: 'Developer',    onClick: 'showIdentity' }
  ];

  return (
    <main style={{
      background: '#000',
      minHeight: '100dvh',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* ── CINEMATIC INTRO ── only shows if not seen this session */}
      {!introComplete && <IntroScreen onComplete={handleIntroComplete} />}

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
            WHAT IS VERLYN — Plain Language Explainer
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
            style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', marginBottom: '72px' }}
          >
            <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', fontWeight: 600, marginBottom: '18px' }}>The Basics</p>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: '20px', lineHeight: 1.08 }}>
              What is Verlyn?
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>
              In plain words — Verlyn is a private, secure place to message and connect with real people online. Think of it like a social network, but one that genuinely respects you.
            </p>
          </motion.div>

          {/* Big explainer cards */}
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '72px' }}>
            {[
              {
                icon: <SvgBase color="#6366f1"><AnimatedPath color="#6366f1" d="M7 11V7a5 5 0 0 1 10 0v4 M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"/></SvgBase>,
                title: 'Your messages stay private',
                body: 'When you send a message on Verlyn, only you and the person you\'re talking to can read it. Nobody else — not even us. This is called end-to-end encryption, and it\'s the same technology banks use.'
              },
              {
                icon: <SvgBase color="#8b5cf6"><AnimatedPath color="#8b5cf6" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></SvgBase>,
                title: 'Real people only',
                body: 'Verlyn is invite-only. You can\'t just sign up with a fake email and a made-up name. Every person on the platform is verified, which means less spam, no bots, and better conversations.'
              },
              {
                icon: <SvgBase color="#10b981"><AnimatedPath color="#10b981" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M4.93 4.93l14.14 14.14"/></SvgBase>,
                title: 'No algorithm, no ads',
                body: 'Verlyn does not track what you look at, sell your data to advertisers, or show you content designed to make you anxious. You see what matters to you, in the order it happened.'
              },
              {
                icon: <SvgBase color="#0891b2"><AnimatedPath color="#0891b2" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></SvgBase>,
                title: 'Built for everyone',
                body: 'Whether you\'re a professional, a creator, or just someone who wants a quieter corner of the internet — Verlyn works for you. No technical knowledge required.'
              },
              {
                icon: <SvgBase color="#f59e0b"><AnimatedPath color="#f59e0b" d="M13 2L3 14h9l-1 8 10-12h-9z"/></SvgBase>,
                title: 'Fast and reliable',
                body: 'Verlyn is engineered for speed. Messages arrive instantly. The platform stays online. There are no frustrating delays or unexpected outages during important conversations.'
              },
              {
                icon: <SvgBase color="#ef4444"><AnimatedPath color="#ef4444" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></SvgBase>,
                title: 'We can\'t sell what we don\'t have',
                body: 'Most platforms make money by collecting everything about you. Verlyn is different — our architecture is designed so that we never store sensitive data in a form we can read or share.'
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.07, duration: 0.55 }}
                style={{
                  padding: '32px 28px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  transition: 'border-color 0.25s',
                }}
                whileHover={{ borderColor: 'rgba(255,255,255,0.14)' }}
              >
                <div style={{ fontSize: '28px', marginBottom: '16px' }}>{card.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '10px', lineHeight: 1.3 }}>{card.title}</h3>
                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.72 }}>{card.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Q&A strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.6 }}
            style={{ maxWidth: '720px', margin: '0 auto' }}
          >
            <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', fontWeight: 600, marginBottom: '32px', textAlign: 'center' }}>Common Questions</p>
            {[
              { q: 'Is Verlyn free to use?', a: 'Yes. Verlyn is free for everyone during the early access period. We may introduce optional premium features in the future, but the core product will always remain accessible.' },
              { q: 'Who built Verlyn?', a: 'Verlyn is built by a focused team of engineers and designers who believe the internet deserves better tools — ones that put users first rather than advertisers.' },
              { q: 'When can I join?', a: 'Verlyn is currently in a controlled pre-launch phase. Pre-register above with your email to secure your spot. Access is released in deliberate waves to maintain quality.' },
              { q: 'Is my data safe?', a: 'Yes. All data in transit is encrypted. We use zero-knowledge principles wherever possible, meaning we are technically unable to access your private messages.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={{
                  padding: '24px 0',
                  borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '32px', alignItems: 'start'
                }}
              >
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{item.q}</p>
                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{item.a}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Support CTA strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              maxWidth: '720px', margin: '64px auto 0',
              padding: '32px 40px',
              background: 'rgba(99,102,241,0.04)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '20px',
            }}
          >
            <div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Still have questions?</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Our concierge team is here to help — any time.</p>
            </div>
            <button
              onClick={() => { setSupportView('menu'); setShowSupport(true); }}
              style={{
                padding: '14px 28px',
                background: '#fff', color: '#000',
                border: 'none', borderRadius: '10px',
                fontSize: '12px', fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              Contact Support
            </button>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════════════════ */}
        <footer style={{ position: 'relative', zIndex: 10, padding: '120px 24px 80px', borderTop: '1px solid rgba(255,255,255,0.02)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '60px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            
            {/* Left side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div 
                onClick={handleAdminClick}
                style={{
                  fontSize: '16px', fontWeight: 800, letterSpacing: '0.15em',
                  color: '#fff', cursor: 'default', userSelect: 'none'
                }}
              >
                VERLYN
              </div>
              
              <nav style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
                {footerLinks.map(l => (
                  <button 
                    key={l.label} 
                    onClick={() => {
                      if (l.onClick === 'showIdentity') {
                        setShowIdentity(true);
                      } else if (l.href) {
                        window.location.href = l.href;
                      }
                    }} 
                    style={{
                      fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s'
                    }} 
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'} 
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                  >
                    {l.label}
                  </button>
                ))}
                <button onClick={() => { setSupportView('menu'); setShowSupport(true); }} style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'color 0.2s'
                }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
                  Support
                </button>
              </nav>

              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.1)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '32px' }}>
                © 2026 Verlyn · Secure Digital Infrastructure
              </p>
            </div>

          </div>
        </footer>

      </motion.div>{/* end intro-gated content */}

      {/* Support Panel */}
      <AnimatePresence mode="wait">
        {showSupport && (
          <SupportCenter 
            key={supportView}
            onClose={() => setShowSupport(false)} 
            initialView={supportView}
          />
        )}
      </AnimatePresence>

      {/* Admin Gateway */}
      <AnimatePresence>
        {showAdminGateway && <AdminGateway onClose={() => setShowAdminGateway(false)} />}
      </AnimatePresence>

      {/* Governance Portal */}
      <AnimatePresence mode="wait">
        {showGov && (
          <GovernancePortal 
            key={govView}
            onClose={() => setShowGov(false)} 
            initialView={govView}
          />
        )}
      </AnimatePresence>
 
      {/* Developer Identity Overlay */}
      <AnimatePresence>
        {showIdentity && <DeveloperIdentity onClose={() => setShowIdentity(false)} />}
      </AnimatePresence>
    </main>
  );
}
