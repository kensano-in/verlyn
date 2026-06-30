'use client';

/**
 * VERLYN — Support & Incident Reporting Center
 * Route: /report
 * 
 * Standalone page for filing support tickets, looking up existing cases,
 * and communicating securely with agents.
 */

import React from 'react';
import SupportCenter from '@/components/SupportCenter';

export default function ReportPage() {
  const handleClose = () => {
    window.location.href = '/';
  };

  return (
    <main style={{
      background: '#000',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Background ambient animation or styling can be placed here if needed */}
      <SupportCenter onClose={handleClose} />
    </main>
  );
}
