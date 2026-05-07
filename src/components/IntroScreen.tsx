'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── Key stored in localStorage (persists across sessions, clears on new deploy) ─── */
const KEY = 'vrl_intro_v3';

/* ─── Platform pillars that cycle during the intro ─── */
const PILLARS = [
  'A new kind of social space.',
  'Your data.\u00a0 Only yours.',
  'Every message, encrypted.',
  'Built for people, not algorithms.',
];

export default function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [mounted,   setMounted]   = useState(false);
  const [skip,      setSkip]      = useState(false);
  const [pillar,    setPillar]    = useState(0);
  const [phase,     setPhase]     = useState<
    'hidden' | 'orb' | 'word' | 'divider' | 'pillars' | 'bar' | 'exit'
  >('hidden');

  const barRef  = useRef<HTMLDivElement>(null);
  const timers  = useRef<number[]>([]);
  const isDone  = useRef(false);

  const done = () => {
    if (isDone.current) return;
    isDone.current = true;
    timers.current.forEach(clearTimeout);
    setPhase('exit');
    window.setTimeout(() => {
      localStorage.setItem(KEY, '1');
      onComplete();
    }, 900);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    /* Already seen → skip immediately */
    if (localStorage.getItem(KEY)) {
      onComplete();
      return;
    }

    const t = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms) as unknown as number;
      timers.current.push(id);
    };

    /* Sequence */
    t(() => setPhase('orb'),     100);
    t(() => setPhase('word'),    900);
    t(() => setPhase('divider'), 1600);
    t(() => setPhase('pillars'), 2300);

    /* Cycle pillars */
    t(() => setPillar(1), 3100);
    t(() => setPillar(2), 4000);
    t(() => setPillar(3), 4900);

    /* Progress bar */
    t(() => {
      setPhase('bar');
      requestAnimationFrame(() => {
        if (barRef.current) barRef.current.style.width = '100%';
      });
    }, 5600);

    /* Exit */
    t(() => done(), 7200);

    return () => timers.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  /* Pillar cross-fade */
  const [pillarVisible, setPillarVisible] = useState(true);
  const prevPillar = useRef(pillar);
  useEffect(() => {
    if (pillar === prevPillar.current) return;
    setPillarVisible(false);
    const id = window.setTimeout(() => {
      prevPillar.current = pillar;
      setPillarVisible(true);
    }, 280);
    return () => clearTimeout(id);
  }, [pillar]);

  /* Don't render until client-side (avoids SSR mismatch) */
  if (!mounted) return null;

  /* Already seen — renders nothing, onComplete was called above */
  if (localStorage.getItem(KEY)) return null;

  const show = (p: typeof phase) =>
    !['hidden'].includes(phase) && phase !== 'exit'
      ? p === phase || ['orb','word','divider','pillars','bar'].indexOf(p) <= ['orb','word','divider','pillars','bar'].indexOf(phase)
      : false;

  /* ─── Transition helpers ─── */
  const fade = (visible: boolean, delay = '0s'): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(10px)',
    transition: `opacity 0.7s ease ${delay}, transform 0.7s ease ${delay}`,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      opacity: phase === 'exit' || skip ? 0 : 1,
      transition: 'opacity 0.85s cubic-bezier(0.22,1,0.36,1)',
      pointerEvents: phase === 'exit' || skip ? 'none' : 'auto',
    }}>

      {/* ─── Ambient bloom ─── */}
      <div style={{
        position: 'absolute',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(88,28,220,0.16) 0%, rgba(124,58,237,0.07) 45%, transparent 70%)',
        filter: 'blur(90px)', pointerEvents: 'none',
        animation: 'vrlBreath 5s ease-in-out infinite',
      }} />

      {/* ─── Orbital system ─── */}
      <div style={{
        ...fade(show('orb')),
        position: 'relative', width: '100px', height: '100px',
        marginBottom: '48px',
      }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.3)',
          animation: 'vrlSpin 12s linear infinite',
        }}>
          <div style={{
            position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)',
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#a855f7',
            boxShadow: '0 0 14px #a855f7, 0 0 28px rgba(168,85,247,0.5)',
          }} />
        </div>
        {/* Mid ring */}
        <div style={{
          position: 'absolute', inset: '18px', borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.18)',
          animation: 'vrlSpin 7s linear infinite reverse',
        }}>
          <div style={{
            position: 'absolute', bottom: '-3px', left: '50%', transform: 'translateX(-50%)',
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'rgba(168,85,247,0.7)',
          }} />
        </div>
        {/* Inner ring */}
        <div style={{
          position: 'absolute', inset: '36px', borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.1)',
          animation: 'vrlSpin 4s linear infinite',
        }} />
        {/* Core glow */}
        <div style={{
          position: 'absolute', inset: '38px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.55) 0%, transparent 70%)',
          animation: 'vrlCore 2.5s ease-in-out infinite',
        }} />
      </div>

      {/* ─── Wordmark ─── */}
      <h1 style={{
        ...fade(show('word')),
        fontSize: 'clamp(42px,7vw,88px)',
        fontWeight: 700, color: '#fff', margin: '0 0 18px',
        letterSpacing: '0.4em',
        fontFamily: '"Bebas Neue","Inter",sans-serif',
        textShadow: '0 0 80px rgba(168,85,247,0.18)',
        lineHeight: 1,
      }}>
        VERLYN
      </h1>

      {/* ─── Hairline ─── */}
      <div style={{
        width: show('divider') ? '240px' : '0px',
        height: '1px',
        background: 'rgba(255,255,255,0.08)',
        transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
        marginBottom: '32px',
      }} />

      {/* ─── Cycling pillars ─── */}
      <div style={{
        height: '60px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '56px',
        opacity: show('pillars') ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>
        <p style={{
          fontSize: 'clamp(16px,2.2vw,24px)',
          fontWeight: 600, color: '#fff', margin: '0 0 8px',
          letterSpacing: '-0.02em', textAlign: 'center',
          opacity: pillarVisible ? 1 : 0,
          transform: pillarVisible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.28s ease, transform 0.28s ease',
        }}>
          {PILLARS[pillar]}
        </p>
        {/* Pillar dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {PILLARS.map((_, i) => (
            <div key={i} style={{
              width: i === pillar ? '18px' : '4px',
              height: '2px', borderRadius: '1px',
              background: i === pillar ? '#a855f7' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.4s ease',
            }} />
          ))}
        </div>
      </div>

      {/* ─── Progress bar ─── */}
      <div style={{
        width: '220px', marginBottom: '18px',
        opacity: show('bar') ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        <div style={{
          height: '1px', background: 'rgba(255,255,255,0.07)',
          borderRadius: '1px', overflow: 'hidden',
        }}>
          <div ref={barRef} style={{
            height: '100%', width: '0%',
            background: 'linear-gradient(90deg, rgba(168,85,247,0.4), #a855f7)',
            transition: 'width 1.5s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
      </div>

      {/* ─── Status line ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        opacity: show('bar') ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#a855f7', display: 'inline-block',
          animation: 'vrlBlink 1.3s ease-in-out infinite',
        }} />
        <span style={{
          fontSize: '10px', letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase',
        }}>
          Initializing secure environment
        </span>
      </div>

      {/* ─── Skip / Enter button ─── */}
      <button
        onClick={() => { setSkip(true); done(); }}
        style={{
          position: 'absolute', bottom: '28px', right: '28px',
          background: 'none',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.3)', fontSize: '11px',
          letterSpacing: '0.12em', padding: '9px 18px',
          cursor: 'pointer', borderRadius: '3px',
          textTransform: 'uppercase',
          transition: 'all 0.2s',
          opacity: show('word') ? 1 : 0,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.5)';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)';
        }}
      >
        Enter →
      </button>

      <style>{`
        @keyframes vrlBreath {
          0%,100% { transform:scale(1);    opacity:.85; }
          50%      { transform:scale(1.07); opacity:1;   }
        }
        @keyframes vrlSpin { to { transform: rotate(360deg); } }
        @keyframes vrlCore {
          0%,100% { opacity:.5; transform:scale(.9);  }
          50%      { opacity:1;  transform:scale(1.12); }
        }
        @keyframes vrlBlink {
          0%,100% { opacity:1; }
          50%      { opacity:.25; }
        }
      `}</style>
    </div>
  );
}
