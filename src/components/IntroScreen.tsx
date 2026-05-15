'use client';

import { useEffect, useRef, useState } from 'react';

const PILLARS = [
  'A new kind of social space.',
  'Your data. Only yours.',
  'Every message, encrypted.',
  'Built for people, not algorithms.',
];

export default function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [mounted,  setMounted]  = useState(false);
  const [pillar,   setPillar]   = useState(0);
  const [phase,    setPhase]    = useState<'hidden'|'orb'|'word'|'divider'|'pillars'|'bar'|'exit'>('hidden');
  const barRef   = useRef<HTMLDivElement>(null);
  const timers   = useRef<number[]>([]);
  const isDone   = useRef(false);

  const done = () => {
    if (isDone.current) return;
    isDone.current = true;
    timers.current.forEach(clearTimeout);
    // Restore scroll BEFORE setting exit phase
    document.body.style.overflow = '';
    setPhase('exit');
    window.setTimeout(() => onComplete(), 850);
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    // Lock scroll only while intro is active — simplest reliable method
    document.body.style.overflow = 'hidden';

    const t = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms) as unknown as number;
      timers.current.push(id);
    };

    t(() => setPhase('orb'),      80);
    t(() => setPhase('word'),    800);
    t(() => setPhase('divider'), 1500);
    t(() => setPhase('pillars'), 2100);
    t(() => setPillar(1),        2900);
    t(() => setPillar(2),        3800);
    t(() => setPillar(3),        4700);
    t(() => {
      setPhase('bar');
      requestAnimationFrame(() => {
        if (barRef.current) barRef.current.style.width = '100%';
      });
    }, 5400);
    t(() => done(), 6900);

    // Cleanup: if component somehow unmounts before done(), restore scroll
    return () => {
      timers.current.forEach(clearTimeout);
      document.body.style.overflow = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const [pillarVisible, setPillarVisible] = useState(true);
  const prevPillar = useRef(pillar);
  useEffect(() => {
    if (pillar === prevPillar.current) return;
    setPillarVisible(false);
    const id = window.setTimeout(() => {
      prevPillar.current = pillar;
      setPillarVisible(true);
    }, 250);
    return () => clearTimeout(id);
  }, [pillar]);

  if (!mounted) return null;

  const phaseOrder = ['hidden','orb','word','divider','pillars','bar'] as const;
  const show = (p: typeof phaseOrder[number]) =>
    phase !== 'hidden' && phase !== 'exit'
      ? phaseOrder.indexOf(p) <= phaseOrder.indexOf(phase as typeof phaseOrder[number])
      : false;

  const fade = (visible: boolean): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)`,
  });

  const isExiting = phase === 'exit';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      opacity: isExiting ? 0 : 1,
      transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1)',
      pointerEvents: isExiting ? 'none' : 'auto',
    }}>

      {/* Ambient bloom */}
      <div style={{
        position: 'absolute', width: '800px', height: '800px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.14) 0%, rgba(99,102,241,0.06) 45%, transparent 70%)',
        filter: 'blur(100px)', pointerEvents: 'none',
        animation: 'breathe 6s ease-in-out infinite',
      }} />

      {/* 3D V Logo */}
      <div style={{ ...fade(show('orb')), position: 'relative', width: '120px', height: '120px', marginBottom: '40px', perspective: '1000px' }}>
        <div style={{
          width: '100%', height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          animation: 'vRotate 8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        }}>
          <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.5))' }}>
            <defs>
              <linearGradient id="grad-e1" x1="17" y1="14" x2="32" y2="52" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="white" stopOpacity="1"/>
                <stop offset="100%" stopColor="white" stopOpacity="0.8"/>
              </linearGradient>
              <linearGradient id="grad-e2" x1="47" y1="14" x2="32" y2="52" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="white" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="white" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            <path 
              d="M17 14 L32 52" 
              stroke="url(#grad-e1)" 
              strokeWidth="5" 
              strokeLinecap="round"
              style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: 'vDrawLine 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.3s' }}
            />
            <path 
              d="M47 14 L32 52" 
              stroke="url(#grad-e2)" 
              strokeWidth="5" 
              strokeLinecap="round"
              style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: 'vDrawLine 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.8s' }}
            />
          </svg>

        </div>
        <div style={{
          position: 'absolute', inset: '20px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          animation: 'corePulse 2.8s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes vRotate {
          0% { transform: rotateY(-180deg) scale(0.8); opacity: 0; }
          20% { transform: rotateY(0deg) scale(1.1); opacity: 1; }
          100% { transform: rotateY(15deg) scale(1); opacity: 1; }
        }
        @keyframes vDrawLine {
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Wordmark */}
      <h1 style={{
        ...fade(show('word')),
        fontSize: 'clamp(44px, 7vw, 90px)',
        fontWeight: 400, color: '#fff', margin: '0 0 20px',
        letterSpacing: '0.38em',
        fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
        textShadow: '0 0 60px rgba(99,102,241,0.14)',
        lineHeight: 1,
      }}>
        VERLYN
      </h1>

      {/* Hairline */}
      <div style={{
        width: show('divider') ? '220px' : '0px', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)',
        transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
        marginBottom: '36px',
      }} />

      {/* Cycling pillars */}
      <div style={{
        height: '56px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', marginBottom: '60px',
        opacity: show('pillars') ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        <p style={{
          fontSize: 'clamp(15px, 2.2vw, 22px)', fontWeight: 500, color: '#fff',
          margin: '0 0 10px', letterSpacing: '-0.015em', textAlign: 'center',
          opacity: pillarVisible ? 1 : 0,
          transform: pillarVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}>
          {PILLARS[pillar]}
        </p>
        <div style={{ display: 'flex', gap: '6px' }}>
          {PILLARS.map((_, i) => (
            <div key={i} style={{
              width: i === pillar ? '20px' : '4px', height: '2px', borderRadius: '1px',
              background: i === pillar ? '#818cf8' : 'rgba(255,255,255,0.12)',
              transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
            }} />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '200px', marginBottom: '20px', opacity: show('bar') ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
          <div ref={barRef} style={{
            height: '100%', width: '0%',
            background: 'linear-gradient(90deg, rgba(99,102,241,0.4), #818cf8)',
            transition: 'width 1.4s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: show('bar') ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%', background: '#818cf8',
          display: 'inline-block', animation: 'blink 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
          Initializing secure environment
        </span>
      </div>

      {/* Skip */}
      <button
        onClick={done}
        style={{
          position: 'absolute', bottom: '28px', right: '28px',
          background: 'none', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.28)', fontSize: '10px',
          letterSpacing: '0.14em', padding: '9px 18px', cursor: 'pointer',
          borderRadius: '0px', textTransform: 'uppercase',
          transition: 'all 0.2s ease',
          opacity: show('word') ? 1 : 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
        }}
      >
        Enter →
      </button>
    </div>
  );
}
