'use client';

import SupportCenter from '@/components/SupportCenter';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-void)' }}>
      <SupportCenter onClose={() => router.push('/')} />
    </div>
  );
}
