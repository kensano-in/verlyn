'use client';

import React, { useEffect } from 'react';
import SupportCenter from '@/components/SupportCenter';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();

  // Lock body scroll on mount
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <>
      {/* Dark page background — rendered at body level so fixed SupportCenter is never inside a stacking context */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#050505',
        zIndex: 0,
      }} />
      {/* SupportCenter is a fixed overlay — isolated from all other DOM contexts */}
      <SupportCenter
        onClose={() => router.push('/')}
        initialView="menu"
      />
    </>
  );
}
