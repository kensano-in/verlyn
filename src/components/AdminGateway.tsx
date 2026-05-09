'use client';

import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

type GatewayStep = 'pin' | 'setup' | 'login' | 'dashboard';

export default function AdminGateway({ onClose }: { onClose: () => void }) {
  // Scroll Lock
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);
  
  const [step, setStep] = useState<GatewayStep>('pin');
  const [attempts, setAttempts] = useState(0);
  const [isBanned, setIsBanned] = useState(false);

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
  const [activeTab, setActiveTab] = useState<'overwatch' | 'triage' | 'prereg' | 'security'>('overwatch');
  const [preRegs, setPreRegs] = useState<any[]>([]);
  // Live chat state
  const [adminName, setAdminName] = useState('');
  const [adminNameInput, setAdminNameInput] = useState('');
  const [joinStep, setJoinStep] = useState<'idle' | 'enter_name' | 'chat'>('idle');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // 1. Check PIN
  useEffect(() => {
    if (localStorage.getItem('vrl_admin_blocked') === '1') {
      setIsBanned(true);
      return;
    }

    if (pin.length === 6) {
      if (pin === '021008') {
        checkSetup();
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          localStorage.setItem('vrl_admin_blocked', '1');
          setIsBanned(true);
        }
        setPinError(true);
        setTimeout(() => {
          setPin('');
          setPinError(false);
        }, 800);
      }
    }
  }, [pin, attempts]);

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
      // Store only password for subsequent session requests (TOTP expires in 30s)
      setAuthKey(password);

      const prRes = await fetch('/api/admin/preregistrations', { headers: { 'Authorization': `Bearer ${authPayload}` } });
      if (prRes.ok) { const prData = await prRes.json(); setPreRegs(prData.registrations || []); }

      setStep('dashboard');
    } catch (err: any) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        localStorage.setItem('vrl_admin_blocked', '1');
        setIsBanned(true);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Update Ticket Status
  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed');
      }
      setTickets(tickets.map(t => t.id === id ? { ...t, status } : t));
      if (selectedTicket?.id === id) setSelectedTicket((p: any) => ({ ...p, status }));
    } catch (err: any) { alert(err.message); }
  };

  // 5. Fetch live chat messages for selected ticket
  useEffect(() => {
    if (joinStep !== 'chat' || !selectedTicket) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/support/messages?ticket_id=${selectedTicket.id}`, {
          headers: { 'Authorization': `Bearer ${authKey}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setChatMessages(data.messages || []);
        setTimeout(() => { chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' }); }, 80);
      } catch {}
    };
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, [joinStep, selectedTicket, authKey]);

  // 6. Admin send message
  const sendAdminMsg = async (overrideText?: string, overrideName?: string) => {
    const text = overrideText || chatInput;
    const name = overrideName || adminName;
    if (!text.trim() || !selectedTicket || chatSending) return;
    if (!overrideText) setChatInput('');
    setChatSending(true);
    setChatMessages(prev => [...prev, { id: Date.now(), sender_type: 'agent', agent_name: name, content: text, created_at: new Date().toISOString() }]);
    setTimeout(() => { chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' }); }, 80);
    try {
      await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: selectedTicket.id, content: text, sender_type: 'agent', agent_name: name })
      });
      // Update ticket status to In progress
      await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTicket.id, status: 'In progress' })
      });
      setTickets(ts => ts.map(t => t.id === selectedTicket.id ? { ...t, status: 'In progress' } : t));
    } catch { } finally { setChatSending(false); }
  };

  const getCategoryLabel = (cat: string) => {
    if (cat.startsWith('Custom:')) return cat;
    const labels: Record<string, string> = {
      general: 'General Inquiries',
      tech: 'Technical Support',
      security: 'Security & Privacy',
      account: 'Account Access',
      billing: 'Payment & Billing',
      bug: 'Bug Reports',
      legal: 'Legal & Compliance',
      partnership: 'Partnership Inquiry',
      suggestion: 'Feature Suggestions'
    };
    return labels[cat] || cat;
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

  if (isBanned) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 200000,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backdropFilter: 'blur(40px)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'inline-block', padding: '12px 24px', background: 'rgba(255, 59, 48, 0.1)', border: '1px solid #ff3b30', borderRadius: '12px', marginBottom: '32px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#ff3b30', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Security Breach Detected</span>
          </motion.div>
          <h1 style={{ fontSize: '32px', color: '#fff', fontWeight: 400, marginBottom: '16px', letterSpacing: '-0.03em' }}>Access Permanently Revoked</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '40px' }}>
            Multiple unauthorized attempts detected. This device has been blacklisted from the administrative gateway.
          </p>
          <div style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'left' }}>
            ERR_GATEWAY_BLACKLISTED_PERSISTENT<br/>
            TRACE: {Date.now().toString(16)}<br/>
            STATUS: PERMANENT_DENIAL
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 99999,
      background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '60px 24px',
      overflowY: 'auto',
    }}>
      <AnimatePresence mode="wait">

        {/* ========================================================= */}
        {/* STEP 1: PIN ENTRY                                         */}
        {/* ========================================================= */}
        {step === 'pin' && (
          <motion.div key="pin" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            style={{ textAlign: 'center', position: 'relative', margin: 'auto 0' }}>
            <button onClick={onClose} style={{ position: 'absolute', top: '-60px', right: '-40px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
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
            style={{ margin: 'auto 0', background: '#0a0a0a', padding: '48px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '460px', width: '100%', textAlign: 'center', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
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
                  <button onClick={verifySetupToken} disabled={verifyingSetup || setupToken.length !== 6} style={{ 
                    padding: '0 32px', background: '#fff', color: '#000', fontWeight: 800, border: 'none', 
                    borderRadius: '12px', cursor: (verifyingSetup || setupToken.length !== 6) ? 'not-allowed' : 'pointer', 
                    opacity: (verifyingSetup || setupToken.length !== 6) ? 0.5 : 1, transition: 'all 0.3s ease',
                    textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 10px 30px rgba(255,255,255,0.1)'
                  }}>
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
                    1. Add to Vercel Environment Variables:<br />
                    <strong style={{ color: '#fff', display: 'block', margin: '8px 0' }}>ADMIN_2FA_SECRET="{secret}"</strong>
                    2. Redeploy the application.<br />
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
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

              <button type="submit" disabled={loading} style={{ 
                width: '100%', padding: '20px', background: '#fff', color: '#000', fontWeight: 800, 
                border: 'none', borderRadius: '14px', cursor: loading ? 'wait' : 'pointer', 
                textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'all 0.3s ease',
                boxShadow: '0 10px 40px rgba(255,255,255,0.15)'
              }}>
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

            {/* COMMAND CENTER HEADER */}
            <header style={{
              padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', position: 'relative', zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px rgba(16,185,129,0.5)', animation: 'vrlBlink 2s infinite' }} />
                  <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.15em', color: '#fff', textTransform: 'uppercase' }}>Command</span>
                </div>
                
                {/* TABS */}
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {(['overwatch', 'triage', 'prereg', 'security'] as const).map(tab => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setSelectedTicket(null); }}
                      style={{
                        padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                        boxShadow: activeTab === tab ? '0 2px 10px rgba(0,0,0,0.2)' : 'none'
                      }}>
                      {tab === 'triage' ? `Triage (${tickets.length})` : tab === 'prereg' ? `Registry (${preRegs.length})` : tab}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80" alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>O. Director</p>
                    <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{new Date().toISOString().split('T')[1].slice(0, 8)} UTC</p>
                  </div>
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.1em', transition: 'all 0.2s' }}>
                  SECURE EXIT
                </button>
              </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

              {/* ── Sidebar ── */}
              <div style={{ width: '360px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: '#0a0a0a', overflowY: 'auto' }} className="scrollbar-hide">

                {/* Search/Filter placeholder */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <input type="text" placeholder="Search records..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }} />
                </div>

                {activeTab === 'triage' && (
                  (() => {
                    const grouped = tickets.reduce((acc: any, t) => {
                      const cat = t.report_type || 'general';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(t);
                      return acc;
                    }, {});
                    
                    return Object.entries(grouped).map(([cat, catTickets]: [string, any]) => (
                      <div key={cat}>
                        <div style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.02)', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {getCategoryLabel(cat)} ({catTickets.length})
                        </div>
                        {catTickets.map((t: any) => (
                          <div key={t.id} onClick={() => { setSelectedTicket(t); setJoinStep('idle'); setChatMessages([]); setAdminNameInput(''); setChatInput(''); }}
                            style={{
                              padding: '20px 24px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s',
                              background: selectedTicket?.id === t.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                              borderLeft: selectedTicket?.id === t.id ? '3px solid #6366f1' : '3px solid transparent'
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', background: `${getStatusColor(t.status)}15`, color: getStatusColor(t.status), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.status}</span>
                              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{t.case_id}</span>
                            </div>
                            <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</p>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.full_name} · Risk: Low</p>
                            {t.admin_reply && <p style={{ fontSize: '10px', color: '#6366f1', marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Awaiting User
                            </p>}
                          </div>
                        ))}
                      </div>
                    ));
                  })()
                )}

                {activeTab === 'prereg' && preRegs.map((r: any) => (
                  <div key={r.id} onClick={() => setSelectedTicket(r)}
                    style={{
                      padding: '20px 24px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s',
                      background: selectedTicket?.id === r.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                      borderLeft: selectedTicket?.id === r.id ? '3px solid #fff' : '3px solid transparent'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{r.full_name || 'Anonymous'}</p>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>{r.email}</p>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{r.domain}</span>
                  </div>
                ))}

                {((activeTab === 'triage' && tickets.length === 0) || (activeTab === 'prereg' && preRegs.length === 0)) && (
                  <div style={{ padding: '60px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No records found</div>
                )}
              </div>

              {/* ── Main Detail Panel ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }} className="scrollbar-hide">
                
                {activeTab === 'overwatch' && (
                  <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Global Overwatch</h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>Realtime telemetry and system status.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                      {[
                        { label: 'Active Cases', value: tickets.length, color: '#6366f1' },
                        { label: 'Agents Online', value: '4', color: '#10b981' },
                        { label: 'Avg Response', value: '1.2m', color: '#f59e0b' },
                        { label: 'Risk Score', value: 'Low', color: '#8b5cf6' }
                      ].map((stat, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 600 }}>{stat.label}</p>
                          <p style={{ fontSize: '32px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Live Security Feed</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'vrlBlink 2s infinite' }} />
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>WSS://VERLYN-CORE</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                          { time: 'Just now', event: 'New support ticket received.', type: 'info' },
                          { time: '2m ago', event: 'Elena Voss (Security Ops) joined Case VX-20491.', type: 'success' },
                          { time: '15m ago', event: 'Automated spam filter blocked 3 submissions.', type: 'warning' }
                        ].map((log, i) => (
                          <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: i === 2 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', width: '80px', flexShrink: 0 }}>{log.time}</span>
                            <span style={{ fontSize: '13px', color: log.type === 'warning' ? '#f59e0b' : log.type === 'success' ? '#10b981' : '#fff' }}>{log.event}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Security & Access Control</h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>Role-based access matrix and rate-limit administration.</p>
                    <div style={{ padding: '60px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" style={{ marginBottom: '16px' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>System Nominal</h3>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>No active threats detected. WAF rules enforcing correctly.</p>
                    </div>
                  </div>
                )}

                {selectedTicket && activeTab === 'triage' ? (
                  <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                      <div style={{ flex: 1, marginRight: '24px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', marginBottom: '8px', lineHeight: 1.3 }}>{selectedTicket.subject}</h2>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>Case ID: {selectedTicket.case_id} · {new Date(selectedTicket.created_at).toLocaleString()}</p>
                      </div>
                      <select value={selectedTicket.status} onChange={(e) => updateStatus(selectedTicket.id, e.target.value)}
                        style={{ flexShrink: 0, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                        <option value="Received" style={{ background: '#0a0a0a' }}>Received</option>
                        <option value="In progress" style={{ background: '#0a0a0a' }}>In progress</option>
                        <option value="In review" style={{ background: '#0a0a0a' }}>In review</option>
                        <option value="Completed" style={{ background: '#0a0a0a' }}>Completed</option>
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

                  <div style={{ marginBottom: '24px' }}>
                      {/* Simple chat log (ticket description) */}
                      {renderChatLog(selectedTicket.description)}
                    </div>

                    {/* ── LIVE CHAT PANEL ── */}
                    {joinStep === 'idle' && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: '#fff', marginBottom: '8px', fontWeight: 600 }}>Join Live Chat</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>Enter the chat to reply directly to {selectedTicket.full_name} in real-time.</p>
                        <button onClick={() => setJoinStep('enter_name')}
                          style={{ 
                            padding: '14px 40px', background: '#fff', color: '#000', border: 'none', 
                            borderRadius: '12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', 
                            textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.3s ease',
                            boxShadow: '0 10px 30px rgba(255,255,255,0.1)'
                          }}>
                          Join Session
                        </button>
                      </div>
                    )}

                    {joinStep === 'enter_name' && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Enter your name to join the session</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <input autoFocus value={adminNameInput} onChange={e => setAdminNameInput(e.target.value)}
                            onKeyDown={e => { 
                              if (e.key === 'Enter' && adminNameInput.trim()) { 
                                const name = adminNameInput.trim();
                                setAdminName(name); 
                                setJoinStep('chat'); 
                                setChatMessages([]);
                                sendAdminMsg(`Hello, I am ${name} from Verlyn Support. I've joined the session to assist you with your request. How can I help you today?`, name);
                              } 
                            }}
                            placeholder="Your name..." style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                          <button onClick={() => { 
                            if (adminNameInput.trim()) { 
                              const name = adminNameInput.trim();
                              setAdminName(name); 
                              setJoinStep('chat'); 
                              setChatMessages([]);
                              sendAdminMsg(`Hello, I am ${name} from Verlyn Support. I've joined the session to assist you with your request. How can I help you today?`, name);
                            } 
                          }}
                            style={{ 
                              padding: '12px 24px', background: '#fff', color: '#000', border: 'none', 
                              borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                              textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.3s ease'
                            }}>
                            Enter
                          </button>
                        </div>
                      </div>
                    )}

                    {joinStep === 'chat' && (
                      <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '360px' }}>
                        {/* Chat header */}
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Live · {adminName} → {selectedTicket.full_name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button onClick={async () => { await updateStatus(selectedTicket.id, 'Completed'); setJoinStep('idle'); setChatMessages([]); }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Close Session</button>
                            <button onClick={() => { setJoinStep('idle'); setChatMessages([]); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px' }}>Leave</button>
                          </div>
                        </div>
                        {/* Messages */}
                        <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="scrollbar-hide">
                          {chatMessages.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '40px' }}>No messages yet. Say hello to {selectedTicket.full_name}.</p>
                          )}
                          {chatMessages.map(msg => (
                            msg.sender_type === 'user' ? (
                              <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8' }}>{(selectedTicket.full_name||'U')[0]}</span>
                                </div>
                                <div>
                                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{selectedTicket.full_name}</p>
                                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <p style={{ fontSize: '13px', color: '#fff', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'flex-start' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{msg.agent_name || adminName}</p>
                                  <div style={{ background: '#4f46e5', borderRadius: '12px 4px 12px 12px', padding: '10px 14px' }}>
                                    <p style={{ fontSize: '13px', color: '#fff', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                  </div>
                                </div>
                                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                        {/* Input */}
                        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px' }}>
                          <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminMsg(); } }}
                            placeholder={`Reply as ${adminName}...`}
                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '13px', padding: '10px 14px', outline: 'none' }} />
                          <button onClick={() => sendAdminMsg()} disabled={chatSending || !chatInput.trim()}
                            style={{ 
                              padding: '10px 24px', background: chatInput.trim() ? '#fff' : 'rgba(255,255,255,0.1)', 
                              color: chatInput.trim() ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', 
                              borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: chatInput.trim() ? 'pointer' : 'not-allowed', 
                              transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.1em'
                            }}>
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedTicket && activeTab === 'prereg' ? (
                  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
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
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
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
