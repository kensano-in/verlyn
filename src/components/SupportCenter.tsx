'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [reportType, setReportType] = useState('general');
  const [customReportType, setCustomReportType] = useState('');
  const [description, setDescription] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifyAgreed, setNotifyAgreed] = useState(false);
  const [showNotifyReason, setShowNotifyReason] = useState(false);

  // Chat State
  const [chatTicket, setChatTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [userReplyText, setUserReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const messagesRef = useRef<any[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (view === 'chat' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [view]);

  // Poll real messages from support_messages table every 4s
  useEffect(() => {
    if (view !== 'chat' || !chatTicket) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/support/messages?case_id=${chatTicket.case_id}`);
        if (!res.ok) return;
        const data = await res.json();
        const newMsgs = data.messages || [];
        if (newMsgs.length > messagesRef.current.length) {
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg.sender_type === 'agent' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Verlyn Support', { body: lastMsg.content });
          }
        }
        setMessages(newMsgs);
        setTimeout(() => {
          chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 80);
      } catch {}
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [view, chatTicket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 6-hour spam guard (client-side)
    const lastSent = localStorage.getItem('vrl_support_last');
    if (lastSent && Date.now() - parseInt(lastSent) < 6 * 60 * 60 * 1000) {
      const hoursLeft = Math.ceil((6 * 60 * 60 * 1000 - (Date.now() - parseInt(lastSent))) / 3600000);
      setError(`Request limit reached. Please wait ${hoursLeft}h before submitting another request.`);
      return;
    }

    if (subjectWords < SUBJECT_MIN) return setError(`Subject requires at least ${SUBJECT_MIN} words.`);
    if (subject.length > SUBJECT_MAX) return setError(`Subject is too long. Max ${SUBJECT_MAX} characters.`);
    if (descWords < DESC_MIN) return setError(`Description requires at least ${DESC_MIN} words.`);
    if (description.length > DESC_MAX) return setError(`Description is too long. Max ${DESC_MAX} characters.`);
    if (!agreed) return setError('You must accept the terms to submit a request.');

    setLoading(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName, 
          email, 
          subject, 
          reportType: reportType === 'other' ? `Other: ${customReportType}` : reportType, 
          description, 
          agreed 
        })
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

      setChatTicket(newTicket);
      setActiveTicket(newTicket);
      setView('chat');

      setSubject(''); setDescription(''); setAgreed(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userReplyText.trim() || !chatTicket || sendingReply) return;
    const text = userReplyText;
    setUserReplyText('');
    setSendingReply(true);
    // Optimistic local message
    const msgContent = selectedFile ? `${text}\n\n[Attachment: ${selectedFile.name}]` : text;
    setMessages(prev => [...prev, { id: Date.now(), sender_type: 'user', content: msgContent, created_at: new Date().toISOString() }]);
    setSelectedFile(null);
    setTimeout(() => { chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' }); }, 80);
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: chatTicket.case_id, content: msgContent, sender_type: 'user' })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingReply(false);
    }
  };

  // Render real messages from support_messages table
  const renderChatMessages = () => {
    const hasAgentMsg = messages.some(m => m.sender_type === 'agent');
    return (
      <>
        {messages.map((msg) => (
          msg.sender_type === 'user' ? (
            <div key={msg.id} style={{ display:'flex', justifyContent:'flex-end', marginBottom:'12px' }}>
              <div style={{ maxWidth:'85%' }}>
                <div style={{ background:'#4f46e5', borderRadius:'16px 16px 4px 16px', padding:'12px 16px' }}>
                  <p style={{ fontSize:'13px', color:'#fff', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{msg.content}</p>
                </div>
                <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', textAlign:'right', marginTop:'4px' }}>
                  You · {new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'numeric'}).format(new Date(msg.created_at))}
                </p>
              </div>
            </div>
          ) : msg.sender_type === 'agent' ? (
            <motion.div key={msg.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <div style={{ maxWidth:'85%' }}>
                <p style={{ fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:'4px' }}>{msg.agent_name || 'Support Agent'} · Verlyn Support</p>
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'4px 16px 16px 16px', padding:'12px 16px' }}>
                  <p style={{ fontSize:'13px', color:'#fff', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{msg.content}</p>
                </div>
                <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', marginTop:'4px' }}>
                  {new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'numeric'}).format(new Date(msg.created_at))}
                </p>
              </div>
            </motion.div>
          ) : null
        ))}
        {/* Waiting for admin */}
        {!hasAgentMsg && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.05)', marginTop: '20px' }}>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255,255,255,0.1)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><path d="M12 16v-4m0-4h.01"/></svg>
              </div>
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#0a0a0a', borderRadius: '50%', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </motion.div>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Session Secured</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, maxWidth: '240px' }}>An admin will be assigned shortly and join the chat. The channel will unlock when they arrive.</p>
          </motion.div>
        )}
      </>
    );
  };

  const inpStyles = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: '#fff', fontSize: '13px',
    outline: 'none', marginBottom: '16px',
    transition: 'all 0.2s ease',
  };

  const lblStyles = {
    display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.6)',
    marginBottom: '8px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%', maxWidth: '440px',
          height: 'min(90vh, 720px)',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', position: 'relative', zIndex: 10,
          background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)'
        }}>
          {view !== 'menu' ? (
            <button onClick={() => setView('menu')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', padding:'4px', display:'flex', transition: 'color 0.2s' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          ) : (
            <div style={{ width: 28 }} />
          )}
          
          <h2 style={{ flex: 1, textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {view === 'menu' ? 'Verlyn Global Support' : view === 'form' ? 'Secure Request' : view === 'faq' ? 'Knowledge Base' : 'Active Case'}
          </h2>

          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', padding:'4px', display:'flex', transition: 'color 0.2s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content Area */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, position: 'relative', zIndex: 10 }} className="scrollbar-hide">
          <AnimatePresence mode="wait">
            
            {/* ── MENU VIEW ── */}
            {view === 'menu' && (
              <motion.div key="menu" initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} style={{ padding: '24px' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 20px',
                    background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 30px rgba(255,255,255,0.15)'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                      <path d="M12 16v-4m0-4h.01"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', marginBottom: '8px' }}>How can we assist you?</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Our concierge team provides priority support for your inquiries and requests.</p>
                </div>

                <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
                  <button onClick={() => setView('faq')} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Knowledge Base</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Find answers instantly</p>
                      </div>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>

                  <button onClick={() => setView('form')} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Contact Concierge</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Submit a secure request</p>
                      </div>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>

                {tickets.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px', paddingLeft: '4px' }}>Active Cases</h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {tickets.map((t) => (
                        <div key={t.case_id} onClick={() => { setActiveTicket(t); setView('tracking'); }}
                          style={{
                            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.2s'
                          }}>
                          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: t.status === 'Completed' ? 'rgba(255,255,255,0.3)' : '#fff', boxShadow: t.status === 'Completed' ? 'none' : '0 0 10px rgba(255,255,255,0.5)' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#fff', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</p>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <p style={{ fontSize: '11px', fontWeight: 600, color: t.status === 'Completed' ? 'rgba(255,255,255,0.4)' : '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.status}</p>
                              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{t.case_id}</p>
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
              <motion.div key="faq" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:10 }} style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {FAQS.map((faq, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px', overflow: 'hidden'
                    }}>
                      <button 
                        onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                        style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', color: '#fff', textAlign: 'left', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1.4 }}
                      >
                        {faq.q}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ transform: activeFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                      <AnimatePresence>
                        {activeFaq === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <p style={{ padding: '0 20px 20px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '40px', textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '13px', color: '#fff', marginBottom: '6px', fontWeight: 500 }}>Unresolved Issue?</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Our team is ready to assist you directly.</p>
                  <button onClick={() => setView('form')} style={{ background: '#fff', color: '#000', padding: '12px 24px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create Ticket</button>
                </div>
              </motion.div>
            )}

            {/* ── FORM VIEW ── */}
            {view === 'form' && (
              <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:10 }} style={{ padding: '24px' }}>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={lblStyles}>Full Name</label>
                    <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} required style={inpStyles} placeholder="Legal Name" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lblStyles}>Email Address</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={inpStyles} placeholder="Registered Email" />
                  </div>
                </div>

                <label style={lblStyles}>Inquiry Category</label>
                <div style={{ position: 'relative', marginBottom: reportType === 'other' ? '12px' : '16px' }}>
                  <select value={reportType} onChange={e=>setReportType(e.target.value)} style={{ ...inpStyles, appearance: 'none', cursor: 'pointer', paddingRight: '40px', marginBottom: 0 }}>
                    <optgroup label="Critical / Urgent" style={{ background: '#0a0a0a', color: 'rgba(255,255,255,0.4)', fontStyle: 'normal' }}>
                      <option value="critical" style={{ background: '#0a0a0a', color: '#fff' }}>Critical Infrastructure Failure</option>
                      <option value="breach" style={{ background: '#0a0a0a', color: '#fff' }}>Security Incident / Data Breach</option>
                    </optgroup>
                    <optgroup label="Core Inquiries" style={{ background: '#0a0a0a', color: 'rgba(255,255,255,0.4)', fontStyle: 'normal' }}>
                      <option value="general" style={{ background: '#0a0a0a', color: '#fff' }}>General Inquiry</option>
                      <option value="tech" style={{ background: '#0a0a0a', color: '#fff' }}>Technical Support</option>
                      <option value="protocol" style={{ background: '#0a0a0a', color: '#fff' }}>Protocol Architecture (ZKP)</option>
                    </optgroup>
                    <optgroup label="Compliance & Legal" style={{ background: '#0a0a0a', color: 'rgba(255,255,255,0.4)', fontStyle: 'normal' }}>
                      <option value="compliance" style={{ background: '#0a0a0a', color: '#fff' }}>Regulatory Compliance Audit</option>
                      <option value="legal" style={{ background: '#0a0a0a', color: '#fff' }}>Law Enforcement Request</option>
                      <option value="identity" style={{ background: '#0a0a0a', color: '#fff' }}>Identity Verification (KYC/AML)</option>
                    </optgroup>
                    <optgroup label="Business & Development" style={{ background: '#0a0a0a', color: 'rgba(255,255,255,0.4)', fontStyle: 'normal' }}>
                      <option value="enterprise" style={{ background: '#0a0a0a', color: '#fff' }}>Enterprise Licensing</option>
                      <option value="partnership" style={{ background: '#0a0a0a', color: '#fff' }}>Strategic Partnership</option>
                      <option value="vulnerability" style={{ background: '#0a0a0a', color: '#fff' }}>Vulnerability Disclosure</option>
                    </optgroup>
                    <option value="other" style={{ background: '#0a0a0a', color: '#fff' }}>Other / Custom Inquiry</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M6 9l6 6 6-6"/></svg>
                </div>

                {reportType === 'other' && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '16px' }}>
                    <input 
                      type="text" 
                      value={customReportType} 
                      onChange={e=>setCustomReportType(e.target.value)} 
                      placeholder="Specify your inquiry type..." 
                      required 
                      style={{ ...inpStyles, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)' }} 
                    />
                  </motion.div>
                )}

                <label style={lblStyles}>Subject <span style={{color:'rgba(255,255,255,0.3)',fontWeight:400,textTransform:'none',letterSpacing:0}}>({SUBJECT_MIN} words min)</span></label>
                <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} required style={{...inpStyles, borderColor: subject.length>0 && subjectWords<SUBJECT_MIN ? 'rgba(239,68,68,0.5)' : subject.length>0 && subjectWords>=SUBJECT_MIN ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}} placeholder="Brief description of the request..." />
                
                <label style={lblStyles}>Detailed Description <span style={{color:'rgba(255,255,255,0.3)',fontWeight:400,textTransform:'none',letterSpacing:0}}>({DESC_MIN} words min)</span></label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} required style={{...inpStyles, minHeight:'120px', resize:'vertical', borderColor: description.length>0 && descWords<DESC_MIN ? 'rgba(239,68,68,0.5)' : description.length>0 && descWords>=DESC_MIN ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}} placeholder="Provide comprehensive details regarding your inquiry. This ensures our concierge team can assist you efficiently..." />

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '12px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{ marginTop: '2px', accentColor: '#fff', width: '16px', height: '16px', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                    I authorize Verlyn to securely process this data for support purposes according to the Privacy Policy.
                  </span>
                </label>

                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <input type="checkbox" checked={notifyAgreed} onChange={e=>{
                      setNotifyAgreed(e.target.checked);
                      if(e.target.checked) setShowNotifyReason(true);
                    }} style={{ accentColor: '#fff', width: '16px', height: '16px', flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Enable browser notifications for agent responses.</span>
                  </label>

                  <AnimatePresence>
                    {showNotifyReason && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, zIndex: 10, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Why enable notifications?</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '12px' }}>
                          We value your time. Enabling notifications allows us to alert you the moment an agent joins your session or replies to your inquiry, so you don't have to keep the window open.
                        </p>
                        <button type="button" onClick={() => {
                          setShowNotifyReason(false);
                          if ('Notification' in window) Notification.requestPermission();
                        }} style={{ background: '#fff', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>GOT IT</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '16px', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>}

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '16px', borderRadius: '10px', marginTop: '24px',
                  background: loading ? 'rgba(255,255,255,0.5)' : '#fff',
                  color: '#000', fontSize: '13px', fontWeight: 600, border: 'none', cursor: loading ? 'wait' : 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'background 0.2s'
                }}>
                  {loading ? 'Transmitting...' : 'Submit Request'}
                </button>
              </motion.form>
            )}

            {/* ── TRACKING VIEW ── */}
            {view === 'tracking' && activeTicket && (
              <motion.div key="tracking" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:10 }} style={{ padding: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '10px' }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 30px rgba(255,255,255,0.15)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <h3 style={{ fontSize:'16px', fontWeight:600, color:'#fff', marginBottom:'6px' }}>{activeTicket.subject}</h3>
                  <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', fontFamily:'monospace' }}>{activeTicket.case_id}</p>
                </div>

                <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.06)', padding:'24px', marginBottom:'24px' }}>
                  <h4 style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'24px' }}>Case Timeline</h4>
                  <div style={{ position:'relative', paddingLeft:'24px' }}>
                    <div style={{ position:'absolute', left:'7px', top:'10px', bottom:'20px', width:'2px', background:'rgba(255,255,255,0.1)' }} />
                    
                    <div style={{ position:'relative', marginBottom:'28px' }}>
                      <div style={{ position:'absolute', left:'-22px', top:'4px', width:'10px', height:'10px', borderRadius:'50%', background:'#fff', boxShadow:'0 0 12px rgba(255,255,255,0.5)' }} />
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#fff', marginBottom:'4px' }}>Request Logged</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>{new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'numeric'}).format(new Date(activeTicket.date_filed))}</p>
                    </div>

                    <div style={{ position:'relative', marginBottom:'28px', opacity: activeTicket.status==='Received'?0.3:1 }}>
                      <div style={{ position:'absolute', left:'-22px', top:'4px', width:'10px', height:'10px', borderRadius:'50%', background: activeTicket.status!=='Received'?'#fff':'rgba(255,255,255,0.2)', boxShadow: activeTicket.status!=='Received'?'0 0 12px rgba(255,255,255,0.5)':'none' }} />
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#fff', marginBottom:'4px' }}>Agent Assigned</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>Concierge team is investigating</p>
                    </div>

                    <div style={{ position:'relative', opacity: activeTicket.status==='Completed'?1:0.3 }}>
                      <div style={{ position:'absolute', left:'-22px', top:'4px', width:'10px', height:'10px', borderRadius:'50%', background: activeTicket.status==='Completed'?'#fff':'rgba(255,255,255,0.2)', boxShadow: activeTicket.status==='Completed'?'0 0 12px rgba(255,255,255,0.5)':'none' }} />
                      <p style={{ fontSize:'13px', fontWeight:600, color:'#fff', marginBottom:'4px' }}>Case Resolved</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>Final resolution provided</p>
                    </div>
                  </div>
                </div>

                <button onClick={() => { setChatTicket(activeTicket); setView('chat'); }}
                  style={{ width:'100%', padding:'16px', borderRadius:'10px', border:'none', cursor:'pointer',
                    background:'#fff', color:'#000', fontSize:'13px', fontWeight:600, textTransform: 'uppercase', letterSpacing: '0.05em',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', transition: 'background 0.2s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  View Communications
                </button>
              </motion.div>
            )}

            {/* ── CHAT VIEW ── */}
            {view === 'chat' && chatTicket && (
              <motion.div key="chat" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:10 }}
                style={{ display:'flex', flexDirection:'column', height:'100%' }}>

                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'12px', overflowY:'auto', padding: '24px', paddingBottom: '16px' }} className="scrollbar-hide" ref={chatScrollRef}>
                  
                  <div style={{ textAlign:'center', marginBottom: '16px' }}>
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', background:'rgba(255,255,255,0.03)', padding:'6px 16px', borderRadius:'20px', border: '1px solid rgba(255,255,255,0.05)' }}>Session Secured · Case {chatTicket.case_id}</span>
                  </div>

                  {renderChatMessages()}

                </div>

                {/* Reply Form */}
                <div style={{ padding: '0 24px 24px 24px' }}>
                  {chatTicket.status === 'Completed' ? (
                     <div style={{ textAlign:'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>This case has been marked as resolved. If you need further assistance, please open a new request.</span>
                     </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedFile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{selectedFile.name}</span>
                          <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      )}
                      <form onSubmit={handleUserReply} style={{ background:'rgba(255,255,255,0.03)', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', padding: '8px', gap: '8px', opacity: messages.some(m => m.sender_type === 'agent') ? 1 : 0.5 }}>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                          style={{ display: 'none' }} 
                        />
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!messages.some(m => m.sender_type === 'agent')} style={{ background: 'none', border: 'none', color: selectedFile ? '#fff' : 'rgba(255,255,255,0.4)', cursor: messages.some(m => m.sender_type === 'agent') ? 'pointer' : 'not-allowed', padding: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        </button>
                        <input 
                          type="text" 
                          value={userReplyText} 
                          onChange={(e) => setUserReplyText(e.target.value)} 
                          disabled={sendingReply || !messages.some(m => m.sender_type === 'agent')}
                          placeholder={messages.some(m => m.sender_type === 'agent') ? "Type your reply here..." : "Waiting for admin to join..."}
                          style={{ flex:1, background:'none', border:'none', color:'#fff', fontSize:'13px', outline:'none', padding: '8px 4px' }} 
                        />
                        <button type="submit" disabled={sendingReply || (!userReplyText.trim() && !selectedFile) || !messages.some(m => m.sender_type === 'agent')} style={{ width:'36px', height:'36px', borderRadius:'10px', background: (userReplyText.trim() || selectedFile) && messages.some(m => m.sender_type === 'agent') ? '#fff' : 'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', border: 'none', cursor: (userReplyText.trim() || selectedFile) && messages.some(m => m.sender_type === 'agent') ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={(userReplyText.trim() || selectedFile) && messages.some(m => m.sender_type === 'agent') ? '#000' : 'rgba(255,255,255,0.3)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                <style>{`
                  @keyframes vrlBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
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
