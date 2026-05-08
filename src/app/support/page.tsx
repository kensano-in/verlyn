'use client';

import React from 'react';
import SupportCenter from '@/components/SupportCenter';
import GovernancePortal from '@/components/GovernancePortal';
import DeveloperIdentity from '@/components/DeveloperIdentity';
import AdminGateway from '@/components/AdminGateway';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportPage() {
  const router = useRouter();
  const [showSupport, setShowSupport] = React.useState(false);
  const [supportView, setSupportView] = React.useState<any>('menu');
  const [showIdentity, setShowIdentity] = React.useState(false);
  const [showGov, setShowGov] = React.useState(false);
  const [govView, setGovView] = React.useState<any>('terms');
  const [adminClicks, setAdminClicks] = React.useState(0);
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

  const govLinks = [
    'Terms', 'Privacy', 'Security', 'Access Model', 'Transparency', 'Status', 'Whitepaper', 'Developer'
  ];

  return (
    <main style={{ minHeight: '100dvh', background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Background Ambiance */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(168,85,247,0.03) 0%, transparent 70%)' }} />
      </div>

      {/* Main Concierge Area */}
      <div key={supportView} style={{ position: 'relative', zIndex: 1, width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <SupportCenter onClose={() => router.push('/')} initialView={supportView} />
      </div>

      {/* Support Panel */}
      <AnimatePresence>
        {showSupport && (
          <SupportCenter 
            onClose={() => setShowSupport(false)} 
            initialView={supportView}
          />
        )}
      </AnimatePresence>

      {/* God-Level Down Section (Identity & Links) */}
      <footer style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1280px', padding: '120px 24px 80px', borderTop: '1px solid rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          
          {/* Left side: Infrastructure Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div 
              onClick={handleAdminClick}
              style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.15em', color: '#fff', cursor: 'default', userSelect: 'none' }}
            >
              VERLYN
            </div>
            
            <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 40px' }}>
              {govLinks.map((link) => (
                <button 
                  key={link} 
                  onClick={() => {
                    if (link === 'Developer') {
                      setShowIdentity(true);
                    } else if (link === 'Support') {
                      setSupportView('menu');
                      setShowSupport(true);
                    } else {
                      window.location.href = `/${link.toLowerCase().replace(/\s+/g, '-')}`;
                    }
                  }}
                  style={{ 
                    fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textDecoration: 'none',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '12px', textTransform: 'uppercase', letterSpacing: '0.1em'
                  }} 
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                >
                  <div style={{ width: '8px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  {link}
                </button>
              ))}
              <button 
                onClick={() => { setSupportView('menu'); setShowSupport(true); }}
                style={{ 
                  fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textDecoration: 'none',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '12px', textTransform: 'uppercase', letterSpacing: '0.1em'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} 
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
              >
                <div style={{ width: '8px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                Support
              </button>
            </nav>

            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.1)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              © 2026 Verlyn · Secure Digital Infrastructure
            </p>
          </div>

          </div>
        </footer>

      {/* Governance Portal */}
      <AnimatePresence>
        {showGov && (
          <GovernancePortal 
            onClose={() => setShowGov(false)} 
            initialView={govView}
          />
        )}
      </AnimatePresence>
      {/* Developer Identity Overlay */}
      <AnimatePresence>
        {showIdentity && <DeveloperIdentity onClose={() => setShowIdentity(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAdminGateway && <AdminGateway onClose={() => setShowAdminGateway(false)} />}
      </AnimatePresence>
    </main>
  );
}
