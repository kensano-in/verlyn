'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ViewState = 'menu' | 'form' | 'tracking' | 'faq' | 'chat';

interface Ticket {
  case_id: string;
  subject: string;
  status: string;
  date_filed: string;
  description?: string;
  admin_reply?: string;
}

const FAQS = [
  { q: "When will I get access?", a: "Verlyn is currently rolling out access in waves based on queue position and security checks." },
  { q: "Is my data truly secure?", a: "Yes. Our zero-knowledge architecture means we literally cannot see your messages." },
  { q: "Can I change my registered email?", a: "For security reasons, emails cannot be changed while in the pre-registration queue." }
];

export default function SupportCenter({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<ViewState>('menu');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [reportType, setReportType] = useState('question');
  const [description, setDescription] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Chat State
  const [chatTicket, setChatTicket] = useState<Ticket | null>(null);
  const [adminReply, setAdminReply] = useState<string | null>(null);
  const [chatClosed, setChatClosed] = useState(false);
  const [polling, setPolling] = useState(false);

  // Validation helpers
  const wordCount = (str: string) => str.trim().split(/\s+/).filter(Boolean).length;
  const SUBJECT_MIN = 5; const SUBJECT_MAX = 120;
  const DESC_MIN = 30;   const DESC_MAX = 1500;
  const subjectWords = wordCount(subject);
  const descWords    = wordCount(description);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vrl_support_tickets');
      if (stored) setTickets(JSON.parse(stored));
    } catch (e) {}
  }, []);

  // Poll for admin reply every 5s when in chat view
  useEffect(() => {
    if (view !== 'chat' || !chatTicket || adminReply || chatClosed) return;
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/support/status?case_id=${chatTicket.case_id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.admin_reply) {
          setAdminReply(data.admin_reply);
          clearInterval(interval);
          setPolling(false);
        }
      } catch {}
    }, 5000);
    return () => { clearInterval(interval); setPolling(false); };
  }, [view, chatTicket, adminReply, chatClosed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 6-hour spam guard (client-side)
    const lastSent = localStorage.getItem('vrl_support_last');
    if (lastSent && Date.now() - parseInt(lastSent) < 6 * 60 * 60 * 1000) {
      const hoursLeft = Math.ceil((6 * 60 * 60 * 1000 - (Date.now() - parseInt(lastSent))) / 3600000);
      setError(`You already sent a report. Please wait ${hoursLeft}h before submitting again.`);
      return;
    }

    // Word count guards
    if (subjectWords < SUBJECT_MIN) {
      setError(`Subject is too short. Please write at least ${SUBJECT_MIN} words (you wrote ${subjectWords}).`);
      return;
    }
    if (subject.length > SUBJECT_MAX) {
      setError(`Subject is too long. Max ${SUBJECT_MAX} characters.`);
      return;
    }
    if (descWords < DESC_MIN) {
      setError(`Description is too short. Please write at least ${DESC_MIN} words so we can help you properly (you wrote ${descWords}).`);
      return;
    }
    if (description.length > DESC_MAX) {
      setError(`Description is too long. Max ${DESC_MAX} characters.`);
      return;
    }
    if (!agreed) {
      setError('You must accept the terms to submit a report.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, subject, reportType, description, agreed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      const newTicket: Ticket = {
        case_id: data.case_id,
        subject,
        status: data.status,
        date_filed: data.date_filed,
        description,
      };

      const updatedTickets = [newTicket, ...tickets];
      setTickets(updatedTickets);
      localStorage.setItem('vrl_support_tickets', JSON.stringify(updatedTickets));
      localStorage.setItem('vrl_support_last', Date.now().toString());

      // Go straight to chat so user sees their message immediately
      setChatTicket(newTicket);
      setAdminReply(null);
      setChatClosed(false);
      setActiveTicket(newTicket);
      setView('chat');

      setSubject(''); setDescription(''); setAgreed(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inpStyles = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', color: '#fff', fontSize: '14px',
    outline: 'none', marginBottom: '16px',
    transition: 'all 0.2s ease',
  };

  const lblStyles = {
    display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)',
    marginBottom: '8px', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' as const
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%', maxWidth: '460px', maxHeight: '85vh',
          background: 'rgba(10,10,10,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 40px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)',
          position: 'relative'
        }}
      >
        {/* Glow Orb */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '300px', height: '150px',
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.2) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', position: 'relative', zIndex: 10
        }}>
          {view !== 'menu' ? (
            <button onClick={() => setView('menu')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', padding:'4px', display:'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          ) : (
            <div style={{ width: 28 }} />
          )}
          
          <h2 style={{ flex: 1, textAlign: 'center', fontSize: '15px', fontWeight: 600, color: '#fff', letterSpacing: '0.02em' }}>
            {view === 'menu' ? 'Verlyn Support' : view === 'form' ? 'Submit a Request' : view === 'faq' ? 'Knowledge Base' : 'Case Status'}
          </h2>

          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', padding:'4px', display:'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content Area */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, position: 'relative', zIndex: 10 }} className="scrollbar-hide">
          <AnimatePresence mode="wait">
            
            {/* ── MENU VIEW ── */}
            {view === 'menu' && (
              <motion.div key="menu" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                
                <div style={{ textAlign: 'center', marginBottom: '36px', marginTop: '10px' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16v-4m0-4h.01" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: '6px' }}>How can we help?</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Our concierge team is standing by.</p>
                </div>

                <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
                  <button onClick={() => setView('faq')} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px', cursor: 'pointer', transition: 'background 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '20px' }}>📖</span>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>Knowledge Base</p>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Find answers to common questions</p>
                      </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>

                  <button onClick={() => setView('form')} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px', cursor: 'pointer', transition: 'background 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '20px' }}>✉️</span>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>Contact Concierge</p>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Submit a secure request</p>
                      </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>

                {tickets.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Your Open Cases</h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {tickets.map((t) => (
                        <div key={t.case_id} onClick={() => { setActiveTicket(t); setView('tracking'); }}
                          style={{
                            padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)'
                          }}>
                          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: t.status === 'Completed' ? '#3b82f6' : '#10b981', boxShadow: `0 0 10px ${t.status === 'Completed' ? '#3b82f6' : '#10b981'}` }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', color: '#fff', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <p style={{ fontSize: '12px', color: t.status === 'Completed' ? '#3b82f6' : '#10b981' }}>{t.status}</p>
                              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{t.case_id}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── FAQ VIEW ── */}
            {view === 'faq' && (
              <motion.div key="faq" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {FAQS.map((faq, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '16px', overflow: 'hidden'
                    }}>
                      <button 
                        onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                        style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', color: '#fff', textAlign: 'left', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        {faq.q}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ transform: activeFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                      <AnimatePresence>
                        {activeFaq === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <p style={{ padding: '0 20px 20px', fontSize: '13.5px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Didn't find your answer?</p>
                  <button onClick={() => setView('form')} style={{ background: 'transparent', border: '1px solid rgba(168,85,247,0.4)', color: '#a855f7', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Contact Us</button>
                </div>
              </motion.div>
            )}

            {/* ── FORM VIEW ── */}
            {view === 'form' && (
              <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={lblStyles}>Full Name</label>
                    <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} required style={inpStyles} placeholder="Your Name" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lblStyles}>Email Address</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={inpStyles} placeholder="Your Email" />
                  </div>
                </div>

                <label style={lblStyles}>Category</label>
                <select value={reportType} onChange={e=>setReportType(e.target.value)} style={{ ...inpStyles, appearance: 'none', cursor: 'pointer', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.5)\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}>
                  <option value="question" style={{ background: '#111' }}>General Inquiry</option>
                  <option value="account" style={{ background: '#111' }}>Account Support</option>
                  <option value="bug" style={{ background: '#111' }}>Report a Bug</option>
                  <option value="suggestion" style={{ background: '#111' }}>Feature Suggestion</option>
                  <option value="security" style={{ background: '#111' }}>Security Vulnerability</option>
                </select>

                <label style={lblStyles}>Subject <span style={{color:'rgba(255,255,255,0.25)',fontWeight:400,textTransform:'none',letterSpacing:0}}>— min 5 words, max 120 chars</span></label>
                <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} required style={{...inpStyles, borderColor: subject.length>0 && subjectWords<SUBJECT_MIN ? 'rgba(239,68,68,0.5)' : subject.length>0 && subjectWords>=SUBJECT_MIN ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}} placeholder="Describe your issue in at least 5 words..." />
                <div style={{display:'flex',justifyContent:'space-between',marginTop:'-12px',marginBottom:'16px'}}>
                  <span style={{fontSize:'11px',color: subjectWords<SUBJECT_MIN && subject.length>0 ? '#ef4444' : 'rgba(255,255,255,0.25)'}}>
                    {subject.length>0 ? `${subjectWords} word${subjectWords!==1?'s':''} — need ${Math.max(0,SUBJECT_MIN-subjectWords)} more` : `At least ${SUBJECT_MIN} words required`}
                  </span>
                  <span style={{fontSize:'11px',color: subject.length>SUBJECT_MAX ? '#ef4444' : 'rgba(255,255,255,0.25)'}}>{subject.length}/{SUBJECT_MAX}</span>
                </div>

                <label style={lblStyles}>Description <span style={{color:'rgba(255,255,255,0.25)',fontWeight:400,textTransform:'none',letterSpacing:0}}>— min 30 words, max 1500 chars</span></label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} required style={{...inpStyles, minHeight:'140px', resize:'vertical', borderColor: description.length>0 && descWords<DESC_MIN ? 'rgba(239,68,68,0.5)' : description.length>0 && descWords>=DESC_MIN ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}} placeholder="Please explain your issue in detail — what happened, when it happened, and any steps you already tried. The more detail you give us, the faster we can help you." />
                <div style={{display:'flex',justifyContent:'space-between',marginTop:'-12px',marginBottom:'16px'}}>
                  <span style={{fontSize:'11px',color: descWords<DESC_MIN && description.length>0 ? '#ef4444' : descWords>=DESC_MIN ? '#10b981' : 'rgba(255,255,255,0.25)'}}>
                    {description.length>0 ? `${descWords} word${descWords!==1?'s':''} ${descWords>=DESC_MIN?'✓':'— need '+Math.max(0,DESC_MIN-descWords)+' more'}` : `At least ${DESC_MIN} words required`}
                  </span>
                  <span style={{fontSize:'11px',color: description.length>DESC_MAX ? '#ef4444' : 'rgba(255,255,255,0.25)'}}>{description.length}/{DESC_MAX}</span>
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{ marginTop: '3px', accentColor: '#a855f7', width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                    By submitting this, I allow Verlyn to securely store this report, investigate my issue, and contact me via email. I understand that submitting false or abusive reports may result in restricted access.
                  </span>
                </label>

                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '16px', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px' }}>{error}</p>}

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '16px', borderRadius: '12px', marginTop: '24px',
                  background: loading ? 'rgba(168,85,247,0.5)' : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: loading ? 'wait' : 'pointer',
                  boxShadow: loading ? 'none' : '0 10px 25px rgba(168,85,247,0.3)', transition: 'all 0.2s'
                }}>
                  {loading ? 'Transmitting...' : 'Submit Secure Request'}
                </button>
              </motion.form>
            )}

            {/* ── TRACKING VIEW ── */}
            {view === 'tracking' && activeTicket && (
              <motion.div key="tracking" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <h3 style={{ fontSize:'18px', fontWeight:600, color:'#fff', marginBottom:'4px' }}>{activeTicket.subject}</h3>
                  <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', fontFamily:'monospace' }}>{activeTicket.case_id}</p>
                </div>

                <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.05)', padding:'20px', marginBottom:'20px' }}>
                  <h4 style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'20px' }}>Case Timeline</h4>
                  <div style={{ position:'relative', paddingLeft:'24px' }}>
                    <div style={{ position:'absolute', left:'7px', top:'10px', bottom:'20px', width:'2px', background:'rgba(255,255,255,0.05)' }} />
                    <div style={{ position:'relative', marginBottom:'24px' }}>
                      <div style={{ position:'absolute', left:'-22px', top:'4px', width:'10px', height:'10px', borderRadius:'50%', background:'#10b981', boxShadow:'0 0 12px rgba(16,185,129,0.5)' }} />
                      <p style={{ fontSize:'14px', fontWeight:600, color:'#fff', marginBottom:'2px' }}>Request Received</p>
                      <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'numeric'}).format(new Date(activeTicket.date_filed))}</p>
                    </div>
                    <div style={{ position:'relative', marginBottom:'24px', opacity: activeTicket.status==='Received'?0.4:1 }}>
                      <div style={{ position:'absolute', left:'-22px', top:'4px', width:'10px', height:'10px', borderRadius:'50%', background: activeTicket.status!=='Received'?'#3b82f6':'rgba(255,255,255,0.2)' }} />
                      <p style={{ fontSize:'14px', fontWeight:600, color:'#fff', marginBottom:'2px' }}>In Review</p>
                      <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>Agent assigned and investigating</p>
                    </div>
                    <div style={{ position:'relative', opacity: activeTicket.status==='Completed'?1:0.4 }}>
                      <div style={{ position:'absolute', left:'-22px', top:'4px', width:'10px', height:'10px', borderRadius:'50%', background: activeTicket.status==='Completed'?'#a855f7':'rgba(255,255,255,0.2)' }} />
                      <p style={{ fontSize:'14px', fontWeight:600, color:'#fff', marginBottom:'2px' }}>Completed</p>
                      <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>Resolution provided</p>
                    </div>
                  </div>
                </div>

                {/* ── Open Chat Button ── */}
                <button onClick={() => { setChatTicket(activeTicket); setAdminReply(null); setChatClosed(false); setView('chat'); }}
                  style={{ width:'100%', padding:'16px', borderRadius:'14px', border:'none', cursor:'pointer',
                    background:'linear-gradient(135deg,#7c3aed,#a855f7)',
                    color:'#fff', fontSize:'15px', fontWeight:700,
                    boxShadow:'0 8px 24px rgba(168,85,247,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Chat with Support Agent
                </button>
                <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.3)', marginTop:'10px' }}>Our team will respond to your case as soon as possible.</p>
              </motion.div>
            )}

            {/* ── CHAT VIEW ── */}
            {view === 'chat' && chatTicket && (
              <motion.div key="chat" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
                style={{ display:'flex', flexDirection:'column', height:'100%' }}>

                {/* Agent header */}
                <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'16px', background:'rgba(255,255,255,0.02)', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.05)', marginBottom:'16px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>V</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'2px' }}>Verlyn Support</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: adminReply||chatClosed ? 'rgba(255,255,255,0.2)' : '#10b981', display:'inline-block', animation: adminReply||chatClosed?'none':'vrlBlink 1.5s ease-in-out infinite' }} />
                      <span style={{ fontSize:'11px', color: adminReply||chatClosed?'rgba(255,255,255,0.3)':'#10b981' }}>{chatClosed?'Chat closed':adminReply?'Replied':'Active · Typically replies within a few hours'}</span>
                    </div>
                  </div>
                  <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>{chatTicket.case_id}</span>
                </div>

                {/* Messages */}
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'12px', overflowY:'auto', paddingBottom:'8px' }} className="scrollbar-hide">

                  {/* System message */}
                  <div style={{ textAlign:'center', margin:'4px 0' }}>
                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.04)', padding:'4px 12px', borderRadius:'20px' }}>Case #{chatTicket.case_id} opened</span>
                  </div>

                  {/* User's original message (right) */}
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <div style={{ maxWidth:'80%' }}>
                      <div style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius:'18px 18px 4px 18px', padding:'12px 16px' }}>
                        <p style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:'4px', fontSize:'11px' }}>{chatTicket.subject}</p>
                        <p style={{ fontSize:'13px', color:'#fff', lineHeight:1.6 }}>{chatTicket.description || 'Your report has been submitted successfully. Our support team is reviewing your case.'}</p>
                      </div>
                      <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', textAlign:'right', marginTop:'4px' }}>You · {new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'numeric'}).format(new Date(chatTicket.date_filed))}</p>
                    </div>
                  </div>

                  {/* Waiting indicator */}
                  {!adminReply && !chatClosed && (
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(168,85,247,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>V</div>
                      <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:'18px 18px 18px 4px', padding:'12px 16px', display:'flex', gap:'4px', alignItems:'center' }}>
                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'rgba(255,255,255,0.4)', animation:'vrlBlink 1s ease-in-out infinite' }} />
                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'rgba(255,255,255,0.4)', animation:'vrlBlink 1s 0.2s ease-in-out infinite' }} />
                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'rgba(255,255,255,0.4)', animation:'vrlBlink 1s 0.4s ease-in-out infinite' }} />
                      </div>
                    </div>
                  )}

                  {/* Admin reply (left) */}
                  {adminReply && (
                    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', alignItems:'flex-end', gap:'10px' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>V</div>
                      <div style={{ maxWidth:'80%' }}>
                        <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'18px 18px 18px 4px', padding:'12px 16px' }}>
                          <p style={{ fontSize:'13px', color:'#fff', lineHeight:1.6 }}>{adminReply}</p>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#a855f7"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                          <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>Verlyn Support · Official Response</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Chat closed notice */}
                  {adminReply && (
                    <div style={{ textAlign:'center', margin:'8px 0' }}>
                      <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.04)', padding:'4px 12px', borderRadius:'20px' }}>This conversation has been resolved. If you need more help, open a new case.</span>
                    </div>
                  )}
                </div>

                {/* Input area — locked after reply */}
                <div style={{ marginTop:'16px', padding:'12px', background:'rgba(255,255,255,0.03)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'10px', opacity: adminReply?0.4:1 }}>
                  <input disabled value="" placeholder={adminReply?"Case resolved — start a new case to continue":"Waiting for agent response..."}
                    style={{ flex:1, background:'none', border:'none', color:'rgba(255,255,255,0.3)', fontSize:'13px', outline:'none', cursor:'not-allowed' }} />
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(168,85,247,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </div>
                </div>

                <style>{`
                  @keyframes vrlBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
                `}</style>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
