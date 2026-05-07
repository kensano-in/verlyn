'use client';

import { useState, useEffect } from 'react';
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
      // Try to generate a setup secret. If it returns 403, setup is already done.
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
      setStep('login'); // fallback to login
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
      // Also load preregistrations
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
        body: JSON.stringify({ id: selectedTicket.id, admin_reply: replyText.trim() })
      });
      setSelectedTicket({ ...selectedTicket, admin_reply: replyText.trim() });
      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, admin_reply: replyText.trim() } : t));
      setReplyDone(true);
      setTimeout(() => setReplyDone(false), 3000);
      setReplyText('');
    } catch { } finally { setReplySending(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return '#10b981'; // Green
      case 'In progress': return '#3b82f6'; // Blue
      case 'In review': return '#f59e0b'; // Orange
      case 'Completed': return '#a855f7'; // Purple
      default: return '#888';
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* STEP 1: PIN ENTRY (021008)                                */}
        {/* ========================================================= */}
        {step === 'pin' && (
          <motion.div key="pin" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ textAlign: 'center', position: 'relative' }}>
            
            <button onClick={onClose} style={{ position: 'absolute', top: '-60px', right: '-40px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '24px' }}>✕</button>
            
            <h2 style={{ fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>System Access</h2>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div key={idx} style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: pinError ? '#ef4444' : pin.length > idx ? '#fff' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.2s ease',
                  boxShadow: pin.length > idx && !pinError ? '0 0 16px rgba(255,255,255,0.8)' : 'none'
                }} />
              ))}
            </div>

            <input 
              type="password" autoFocus maxLength={6}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              style={{ position: 'absolute', opacity: 0, top: 0, left: 0, right: 0, bottom: 0, cursor: 'text' }}
            />
            {loading && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '32px' }}>VERIFYING...</p>}
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: INITIAL 2FA SETUP (Only appears once)             */}
        {/* ========================================================= */}
        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ background: 'rgba(10,10,10,0.9)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Security Initialization</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
              Scan this QR code with Google Authenticator or Ente Auth to secure the gateway.
            </p>

            {qr && <img src={qr} alt="2FA QR Code" style={{ border: '4px solid white', borderRadius: '8px', marginBottom: '32px', width: '200px' }} />}

            {!setupSuccess ? (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Verify 6-Digit Code</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={setupToken} onChange={e => setSetupToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000" 
                      style={{ flex: 1, padding: '16px', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px', color: '#a855f7', outline: 'none', textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: 600, fontFamily: 'monospace' }}
                    />
                    <button onClick={verifySetupToken} disabled={verifyingSetup || setupToken.length !== 6} style={{ padding: '0 24px', background: '#a855f7', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '12px', cursor: (verifyingSetup || setupToken.length !== 6) ? 'not-allowed' : 'pointer', opacity: (verifyingSetup || setupToken.length !== 6) ? 0.5 : 1 }}>
                      {verifyingSetup ? '...' : 'Verify'}
                    </button>
                  </div>
                  {setupError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{setupError}</p>}
                </div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'left' }}>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
                  <p style={{ color: '#10b981', fontWeight: 600, fontSize: '14px' }}>✓ Verification Successful</p>
                </div>

                <div style={{ background: '#000', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>Secret Key</p>
                  <code style={{ fontSize: '16px', color: '#a855f7', letterSpacing: '2px' }}>{secret}</code>
                </div>

                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                    1. Update your <code>.env.local</code> with this verified key:<br/>
                    <strong style={{color:'#fff', display: 'block', margin: '8px 0', wordBreak: 'break-all'}}>ADMIN_2FA_SECRET="{secret}"</strong>
                    2. Restart the server.<br/>
                    3. This setup screen will disappear forever.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: LOGIN (God Mode)                                  */}
        {/* ========================================================= */}
        {step === 'login' && (
          <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ width: '100%', maxWidth: '380px' }}>
            <form onSubmit={handleLogin} style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 40px 100px rgba(0,0,0,0.9)', position: 'relative' }}>
              <button type="button" onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>✕</button>
              
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '0.1em', fontFamily: 'var(--font-bebas)' }}>GOD MODE</h1>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Master Password</label>
                <input 
                  type="password" autoFocus
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••••••" required
                  style={{ width: '100%', padding: '16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', letterSpacing: '2px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>2FA Code</label>
                <input 
                  type="text" 
                  value={token2FA} onChange={e => setToken2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" required
                  style={{ width: '100%', padding: '16px', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px', color: '#a855f7', outline: 'none', textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: 600, fontFamily: 'monospace' }}
                />
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center', marginBottom: '20px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px' }}>{error}</p>}
              
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: '#fff', color: '#000', fontWeight: 700, border: 'none', borderRadius: '12px', cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Authenticating...' : 'INITIALIZE'}
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
            <header style={{ flexShrink: 0, padding: '0 32px', height: '56px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#050505', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', color: '#a855f7' }}>VERLYN ⚡ COMMAND</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['support','prereg'] as const).map(tab => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setSelectedTicket(null); }}
                      style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        background: activeTab === tab ? 'rgba(168,85,247,0.15)' : 'transparent',
                        color: activeTab === tab ? '#a855f7' : 'rgba(255,255,255,0.4)' }}>
                      {tab === 'support' ? `Support (${tickets.length})` : `Pre-Regs (${preRegs.length})`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{new Date().toLocaleTimeString()}</span>
                <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '6px 14px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>EXIT</button>
              </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

              {/* ── Sidebar ── */}
              <div style={{ width: '340px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', overflowY: 'auto' }} className="scrollbar-hide">

                {activeTab === 'support' && tickets.map(t => (
                  <div key={t.id} onClick={() => { setSelectedTicket(t); setReplyText(''); setReplyDone(false); }}
                    style={{ padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: selectedTicket?.id === t.id ? 'rgba(168,85,247,0.07)' : 'transparent',
                      borderLeft: selectedTicket?.id === t.id ? '2px solid #a855f7' : '2px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '4px', background: `${getStatusColor(t.status)}18`, color: getStatusColor(t.status) }}>{t.status}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{t.full_name} · {t.report_type}</p>
                    {t.admin_reply && <p style={{ fontSize: '10px', color: '#a855f7', marginTop: '4px' }}>✓ Replied</p>}
                  </div>
                ))}

                {activeTab === 'prereg' && preRegs.map((r: any) => (
                  <div key={r.id} onClick={() => setSelectedTicket(r)}
                    style={{ padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: selectedTicket?.id === r.id ? 'rgba(168,85,247,0.07)' : 'transparent',
                      borderLeft: selectedTicket?.id === r.id ? '2px solid #a855f7' : '2px solid transparent' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '3px' }}>{r.full_name}</p>
                    <p style={{ fontSize: '11px', color: '#a855f7', marginBottom: '3px' }}>{r.email}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{r.gender || '—'}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}

                {((activeTab === 'support' && tickets.length === 0) || (activeTab === 'prereg' && preRegs.length === 0)) && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>No records yet</div>
                )}
              </div>

              {/* ── Main Detail Panel ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="scrollbar-hide">
                {selectedTicket && activeTab === 'support' ? (
                  <div style={{ maxWidth: '740px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{selectedTicket.subject}</h2>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{selectedTicket.case_id} · {new Date(selectedTicket.created_at).toLocaleString()}</p>
                      </div>
                      <select value={selectedTicket.status} onChange={(e) => updateStatus(selectedTicket.id, e.target.value)}
                        style={{ flexShrink: 0, padding: '8px 14px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                        <option value="Received" style={{background:'#111'}}>Received</option>
                        <option value="In progress" style={{background:'#111'}}>In progress</option>
                        <option value="In review" style={{background:'#111'}}>In review</option>
                        <option value="Completed" style={{background:'#111'}}>Completed</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>User</p>
                        <p style={{ fontSize: '14px', color: '#fff', fontWeight: 600, marginBottom: '2px' }}>{selectedTicket.full_name}</p>
                        <p style={{ fontSize: '12px', color: '#a855f7' }}>{selectedTicket.email}</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Network</p>
                        <p style={{ fontSize: '12px', color: '#fff', fontFamily: 'monospace', marginBottom: '2px' }}>{selectedTicket.ip_address}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTicket.user_agent}</p>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
                      <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: '20px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'inline-block' }}>Type: {selectedTicket.report_type}</span>
                      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</p>
                    </div>

                    {/* ── Reply Box ── */}
                    <div style={{ background: 'rgba(168,85,247,0.04)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.12)' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>📨 Reply to {selectedTicket.full_name}</p>
                      {selectedTicket.admin_reply && (
                        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                          <span style={{ fontSize: '10px', color: '#10b981', display: 'block', marginBottom: '6px' }}>✓ Last reply sent</span>
                          {selectedTicket.admin_reply}
                        </div>
                      )}
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={`Type your reply to ${selectedTicket.email} here... This will be stored as your response.`}
                        style={{ width: '100%', minHeight: '100px', padding: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button onClick={sendReply} disabled={replySending || !replyText.trim()}
                          style={{ padding: '10px 22px', background: replyDone ? '#10b981' : 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: replySending || !replyText.trim() ? 'not-allowed' : 'pointer', opacity: !replyText.trim() ? 0.5 : 1, transition: 'all 0.2s' }}>
                          {replyDone ? '✓ Saved' : replySending ? 'Saving...' : 'Save Reply'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : selectedTicket && activeTab === 'prereg' ? (
                  <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>{selectedTicket.full_name}</h2>
                    {[['Email', selectedTicket.email],['Gender', selectedTicket.gender || '—'],['IP Address', selectedTicket.ip_address],['Registered', new Date(selectedTicket.created_at).toLocaleString()],['Status', selectedTicket.status || 'Pre-Registered']].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: '13px', color: '#fff', fontFamily: label === 'IP Address' || label === 'Email' ? 'monospace' : 'inherit' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '32px' }}>⚡</span>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Select an item from the sidebar</p>
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
