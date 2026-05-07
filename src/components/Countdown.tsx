'use client';

import { useEffect, useState } from 'react';

const LAUNCH_DATE = new Date('2026-09-01T00:00:00Z');

function getTimeLeft() {
  const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function Seg({ value, label }: { value: number; label: string }) {
  const v = String(value).padStart(2, '0');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{
        fontVariantNumeric: 'tabular-nums',
        fontSize: 'clamp(22px, 3vw, 32px)',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: '#fff',
        lineHeight: 1,
        minWidth: '2ch',
        textAlign: 'center',
      }}>
        {v}
      </div>
      <div style={{
        fontSize: '9px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
        fontWeight: 500,
      }}>
        {label}
      </div>
    </div>
  );
}

export default function Countdown() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setT(getTimeLeft());
    const id = setInterval(() => setT(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const sep = (
    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '20px', lineHeight: 1, paddingBottom: '20px' }}>:</span>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: mounted ? 1 : 0, transition: 'opacity 0.2s' }}>
      <Seg value={t.days} label="Days" />
      {sep}
      <Seg value={t.hours} label="Hours" />
      {sep}
      <Seg value={t.minutes} label="Min" />
      {sep}
      <Seg value={t.seconds} label="Sec" />
    </div>
  );
}
