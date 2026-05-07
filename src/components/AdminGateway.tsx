'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

type GatewayStep = 'pin' | 'setup' | 'login' | 'dashboard';

export default function AdminGateway({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<GatewayStep>('pin');
  
  // Pin State
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Auth State
  const [password, setPassword] = useState('');
  const [token2FA, setToken2FA] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Setup State
  const [secret, setSecret] = useState('');
  const [qr, setQr] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [verifyingSetup, setVerifyingSetup] = useState(false);

  // Dashboard State
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'support'|'prereg'>('support');
  const [preRegs, setPreRegs] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyDone, setReplyDone] = useState(false);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // 1. Check PIN
  useEffect(() => {
    if (pin.length === 6) {
      if (pin === '021008') {
        checkSetup();
      } else {
        setPinError(true);
        setTimeout(() => {
          setPin('');
          setPinError(false);
        }, 800);
      }
    }
  }, [pin]);

  // 2. Check Setup
  const checkSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/setup-2fa');
      if (res.status === 403) {
        setStep('login');
      } else {
        const data = await res.json();
        if (data.secret) {
          setSecret(data.secret);
          if (data.otpauth_url) {
            const qrCodeDataUrl = await QRCode.toDataURL(data.otpauth_url);
            setQr(qrCodeDataUrl);
          }
          setStep('setup');
        }
      }
    } catch (err) {
      console.error(err);
      setStep('login'); 
    } finally {
      setLoading(false);
    }
  };

  // 2.5 Verify Setup Token
  const verifySetupToken = async () => {
    if (setupToken.length !== 6) return;
    setVerifyingSetup(true);
    setSetupError('');
    try {
      const res = await fetch('/api/admin/setup-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, token: setupToken })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSetupSuccess(true);
      } else {
        setSetupError(data.error || 'Invalid code');
      }
    } catch (err) {
      setSetupError('Verification failed');
    } finally {
      setVerifyingSetup(false);
    }
  };

  // 3. Login Action
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const authPayload = token2FA ? `${password}:${token2FA}` : password;
      const res = await fetch('/api/admin/tickets', {
        headers: { 'Authorization': `Bearer ${authPayload}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      setTickets(data.tickets || []);
      setAuthKey(authPayload);
      
      const prRes = await fetch('/api/admin/preregistrations', { headers: { 'Authorization': `Bearer ${authPayload}` } });
      if (prRes.ok) { const prData = await prRes.json(); setPreRegs(prData.registrations || []); }
      
      setStep('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Update Ticket Status Action
  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${authKey}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ id, status })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      setTickets(tickets.map(t => t.id === id ? { ...t, status } : t));
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 5. Send Reply
  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setReplySending(true);
    try {
      await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTicket.id, admin_reply: replyText.trim(), status: 'Completed' })
      });
      const updatedT = { ...selectedTicket, admin_reply: replyText.trim(), status: 'Completed' };
      setSelectedTicket(updatedT);
      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedT : t));
      setReplyDone(true);
      setTimeout(() => setReplyDone(false), 3000);
      setReplyText('');
    } catch { } finally { setReplySending(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return '#10b981';
      case 'In progress': return '#3b82f6';
      case 'In review': return '#f59e0b';
      case 'Completed': return '#8b5cf6';
      default: return '#888';
    }
  };

  const renderChatLog = (desc: string) => {
    const blocks = desc.split('[USER_REPLY]');
    const initialMessage = blocks[0].trim();
    const userReplies = blocks.slice(1).map(r => r.trim());

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: '#8b5cf6', background: 'rgba(139,92,246,0.15)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Original Ticket</span>
          </div>
          <p style={{ fontSize: '13px', color: '#e5e5e5', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{initialMessage}</p>
        </div>

        {userReplies.map((reply, idx) => (
          <div key={`reply-${idx}`} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, textTransform: 'uppercase' }}>User Reply</span>
            </div>
            <p style={{ fontSize: '13px', color: '#e5e5e5', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{reply}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* STEP 1: PIN ENTRY                                         */}
        {/* ========================================================= */}
        {step === 'pin' && (
          <motion.div key="pin" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            style={{ textAlign: 'center', position: 'relative' }}>
            <button onClick={onClose} style={{ position: 'absolute', top: '-60px', right: '-40px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h2 style={{ fontSize: '12px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '40px', fontWeight: 600 }}>Command Authorization</h2>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div key={idx} style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: pinError ? '#ef4444' : pin.length > idx ? '#fff' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: pin.length > idx && !pinError ? '0 0 20px rgba(255,255,255,0.6)' : 'none'
                }} />
              ))}
            </div>
            <input 
              type="password" autoFocus maxLength={6}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              style={{ position: 'absolute', opacity: 0, top: 0, left: 0, right: 0, bottom: 0, cursor: 'text' }}
            />
            {loading && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '40px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Initializing Secure Connection...</p>}
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: SETUP 2FA                                         */}
        {/* ========================================================= */}
        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ background: '#0a0a0a', padding: '48px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '460px', width: '100%', textAlign: 'center', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Security Initialization</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px', lineHeight: 1.5 }}>
              Scan this QR code with your authenticator app to secure the command gateway.
            </p>
            {qr && <img src={qr} alt="2FA QR Code" style={{ border: '8px solid white', borderRadius: '12px', marginBottom: '32px', width: '220px', background: '#fff' }} />}

            {!setupSuccess ? (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 600 }}>Verify Configuration Token</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" value={setupToken} onChange={e => setSetupToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" 
                    style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: 600, fontFamily: 'monospace' }}
                  />
                  <button onClick={verifySetupToken} disabled={verifyingSetup || setupToken.length !== 6} style={{ padding: '0 32px', background: '#fff', color: '#000', fontWeight: 700, border: 'none', borderRadius: '12px', cursor: (verifyingSetup || setupToken.length !== 6) ? 'not-allowed' : 'pointer', opacity: (verifyingSetup || setupToken.length !== 6) ? 0.5 : 1, transition: 'all 0.2s' }}>
                    {verifyingSetup ? '...' : 'Verify'}
                  </button>
                </div>
                {setupError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '12px' }}>{setupError}</p>}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'left' }}>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', color: '#10b981', fontWeight: 600, fontSize: '13px' }}>
                  Verification Successful
                </div>
                <div style={{ background: '#000', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Root Secret Key</p>
                  <code style={{ fontSize: '15px', color: '#fff', letterSpacing: '2px', wordBreak: 'break-all' }}>{secret}</code>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                    1. Add to Vercel Environment Variables:<br/>
                    <strong style={{color:'#fff', display: 'block', margin: '8px 0'}}>ADMIN_2FA_SECRET="{secret}"</strong>
                    2. Redeploy the application.<br/>
                    3. This setup will be locked permanently.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: LOGIN                                             */}
        {/* ========================================================= */}
        {step === 'login' && (
          <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ width: '100%', maxWidth: '400px' }}>
            <form onSubmit={handleLogin} style={{ padding: '48px 40px', background: '#0a0a0a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', position: 'relative' }}>
              <button type="button" onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.2s' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>System Override</h1>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>Master Identity</label>
                <input 
                  type="password" autoFocus
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••••••" required
                  style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', letterSpacing: '2px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>Authentication Token</label>
                <input 
                  type="text" 
                  value={token2FA} onChange={e => setToken2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" required
                  style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: 600, fontFamily: 'monospace' }}
                />
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center', marginBottom: '24px', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>}
              
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '18px', background: '#fff', color: '#000', fontWeight: 700, border: 'none', borderRadius: '12px', cursor: loading ? 'wait' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'background 0.2s' }}>
                {loading ? 'Authenticating...' : 'Access Command'}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: DASHBOARD                                         */}
        {/* ========================================================= */}
        {step === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ width: '100%', height: '100dvh', background: '#050505', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ── Fixed Navbar ── */}
            <header style={{ flexShrink: 0, padding: '0 32px', height: '64px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.15em', color: '#fff' }}>VERLYN COMMAND</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['support','prereg'] as const).map(tab => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setSelectedTicket(null); }}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', transition: 'all 0.2s',
                        background: activeTab === tab ? '#fff' : 'transparent',
                        color: activeTab === tab ? '#000' : 'rgba(255,255,255,0.5)' }}>
                      {tab === 'support' ? `Support (${tickets.length})` : `Pre-Registrations (${preRegs.length})`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{new Date().toLocaleTimeString()}</span>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.1em', transition: 'background 0.2s' }}>LOGOUT</button>
              </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

              {/* ── Sidebar ── */}
              <div style={{ width: '360px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: '#0a0a0a', overflowY: 'auto' }} className="scrollbar-hide">

                {/* Search/Filter placeholder */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <input type="text" placeholder="Search records..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }} />
                </div>

                {activeTab === 'support' && tickets.map(t => (
                  <div key={t.id} onClick={() => { setSelectedTicket(t); setReplyText(''); setReplyDone(false); }}
                    style={{ padding: '20px 24px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s',
                      background: selectedTicket?.id === t.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                      borderLeft: selectedTicket?.id === t.id ? '3px solid #fff' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', background: `${getStatusColor(t.status)}15`, color: getStatusColor(t.status), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.status}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.full_name} · {t.report_type}</p>
                    {t.admin_reply && <p style={{ fontSize: '10px', color: '#8b5cf6', marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Replied
                    </p>}
                  </div>
                ))}

                {activeTab === 'prereg' && preRegs.map((r: any) => (
                  <div key={r.id} onClick={() => setSelectedTicket(r)}
                    style={{ padding: '20px 24px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s',
                      background: selectedTicket?.id === r.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                      borderLeft: selectedTicket?.id === r.id ? '3px solid #fff' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{r.full_name || 'Anonymous'}</p>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>{r.email}</p>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{r.domain}</span>
                  </div>
                ))}

                {((activeTab === 'support' && tickets.length === 0) || (activeTab === 'prereg' && preRegs.length === 0)) && (
                  <div style={{ padding: '60px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No records found</div>
                )}
              </div>

              {/* ── Main Detail Panel ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }} className="scrollbar-hide">
                {selectedTicket && activeTab === 'support' ? (
                  <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                      <div style={{ flex: 1, marginRight: '24px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', marginBottom: '8px', lineHeight: 1.3 }}>{selectedTicket.subject}</h2>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>Case ID: {selectedTicket.case_id} · {new Date(selectedTicket.created_at).toLocaleString()}</p>
                      </div>
                      <select value={selectedTicket.status} onChange={(e) => updateStatus(selectedTicket.id, e.target.value)}
                        style={{ flexShrink: 0, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                        <option value="Received" style={{background:'#0a0a0a'}}>Received</option>
                        <option value="In progress" style={{background:'#0a0a0a'}}>In progress</option>
                        <option value="In review" style={{background:'#0a0a0a'}}>In review</option>
                        <option value="Completed" style={{background:'#0a0a0a'}}>Completed</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>Requester</p>
                        <p style={{ fontSize: '14px', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>{selectedTicket.full_name}</p>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{selectedTicket.email}</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>Telemetry</p>
                        <p style={{ fontSize: '13px', color: '#fff', fontFamily: 'monospace', marginBottom: '4px' }}>IP: {selectedTicket.ip_address}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTicket.user_agent}</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      {renderChatLog(selectedTicket.description)}
                    </div>

                    {/* ── Reply Box ── */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Official Response</p>
                      </div>

                      {selectedTicket.admin_reply && (
                        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '13px', color: '#fff', lineHeight: 1.6 }}>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Last transmission</span>
                          {selectedTicket.admin_reply}
                        </div>
                      )}
                      
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={`Draft response to ${selectedTicket.full_name}...`}
                        style={{ width: '100%', minHeight: '120px', padding: '16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '13.5px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, transition: 'border-color 0.2s' }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Sending a reply will mark this case as completed.</span>
                        <button onClick={sendReply} disabled={replySending || !replyText.trim()}
                          style={{ padding: '12px 28px', background: replyDone ? '#10b981' : '#fff', border: 'none', borderRadius: '10px', color: replyDone ? '#fff' : '#000', fontSize: '12px', fontWeight: 700, cursor: replySending || !replyText.trim() ? 'not-allowed' : 'pointer', opacity: !replyText.trim() ? 0.5 : 1, transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {replyDone ? 'Transmitted' : replySending ? 'Transmitting...' : 'Send Transmission'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : selectedTicket && activeTab === 'prereg' ? (
                  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{selectedTicket.full_name || 'Anonymous User'}</h2>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>ID: {selectedTicket.id}</p>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      {[
                        ['Email Address', selectedTicket.email],
                        ['Provider Domain', selectedTicket.domain],
                        ['Gender Identity', selectedTicket.gender || 'Not specified'],
                        ['Network IP', selectedTicket.ip_address || selectedTicket.ip_hash],
                        ['Registration Date', new Date(selectedTicket.created_at).toLocaleString()],
                        ['Account Status', selectedTicket.status || 'Pending Approval']
                      ].map(([label, val], idx) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: idx === 5 ? 'none' : '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
                          <span style={{ fontSize: '13.5px', color: '#fff', fontFamily: String(label).includes('IP') || String(label).includes('ID') ? 'monospace' : 'inherit', fontWeight: 500 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                    </div>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Select a record to view details</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
