'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Raw SVGs
const Icons = {
  Terminal: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  Zap: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Send: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Archive: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  ArrowLeft: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Lock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
};

// Haptic feedback helper
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
    const haptic = (window as any).Telegram.WebApp.HapticFeedback;
    if (['light', 'medium', 'heavy'].includes(style)) {
      haptic.impactOccurred(style);
    } else {
      haptic.notificationOccurred(style);
    }
  }
};

function TgAdminConsole() {
  const searchParams = useSearchParams();
  const initialCaseId = searchParams.get('case_id');

  const [activeCaseId, setActiveCaseId] = useState<string | null>(initialCaseId);
  const [dossier, setDossier] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // FETCH QUEUE
  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/admin/dashboard/tickets', {
        headers: { 'Authorization': 'Bearer VERLYN-ADMIN-99' }
      });
      if (res.ok) {
        const data = await res.json();
        setQueue(data.tickets || []);
      }
    } catch (e) { console.error('Queue error', e); }
  };

  // FETCH SPECIFIC DOSSIER
  const fetchCaseData = async () => {
    if (!activeCaseId) return;
    try {
      const resTicket = await fetch(`/api/support/ticket?case_id=${activeCaseId}`, {
        headers: { 'Authorization': 'Bearer VERLYN-ADMIN-99' }
      });
      if (!resTicket.ok) throw new Error('Failed to retrieve dossier data.');
      const dataTicket = await resTicket.json();
      setDossier(dataTicket.ticket);

      const resMsgs = await fetch(`/api/support/messages?case_id=${activeCaseId}`, {
        headers: { 'Authorization': 'Bearer VERLYN-ADMIN-99' }
      });
      if (resMsgs.ok) {
        const dataMsgs = await resMsgs.json();
        setMessages(dataMsgs.messages || []);
      }
    } catch (err: any) {
      setError(err.message || 'Transmission failed.');
    }
  };

  useEffect(() => {
    // Inject Telegram Web App script and set ready
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0a0a0a');
        tg.setBackgroundColor('#0a0a0a');
      }
    };
    document.body.appendChild(script);

    const init = async () => {
      setLoading(true);
      if (activeCaseId) {
        await fetchCaseData();
      } else {
        await fetchQueue();
      }
      setLoading(false);
    };
    init();

    const interval = setInterval(() => {
      if (activeCaseId) fetchCaseData();
      else fetchQueue();
    }, 3000); // Poll for real-time updates
    return () => clearInterval(interval);
  }, [activeCaseId]);

  useEffect(() => {
    if (chatScrollRef.current && activeCaseId) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, dossier, activeCaseId]);

  const executeProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || !dossier || sending) return;
    
    triggerHaptic('medium');
    const text = inputVal.trim();
    setSending(true);
    setInputVal('');

    // Optimistic UI
    const tempMsg = {
      id: Date.now(),
      sender_type: 'agent',
      agent_name: 'Verlyn Command',
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);

    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer VERLYN-ADMIN-99'
        },
        body: JSON.stringify({ 
          case_id: dossier.case_id, 
          content: text, 
          sender_type: 'agent', 
          agent_name: 'Verlyn Command' 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send transmission.');
      triggerHaptic('success');
      await fetchCaseData();
    } catch (err: any) {
      triggerHaptic('error');
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      alert(`Transmission Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const markResolved = async () => {
    triggerHaptic('heavy');
    if (!confirm('Mark this dossier as resolved?')) return;
    try {
      await fetch('/api/support/ticket', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer VERLYN-ADMIN-99'
        },
        body: JSON.stringify({ case_id: dossier.case_id, status: 'Resolved' })
      });
      triggerHaptic('success');
      setActiveCaseId(null); // Go back to queue
    } catch (e) { alert('Failed to update status.'); }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center p-6 text-white font-mono uppercase tracking-[0.2em] text-[10px]">
        <div className="flex flex-col items-center gap-5 text-white/30">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-8 h-8 border-[1.5px] border-indigo-500/20 border-t-indigo-500 rounded-full" 
          />
          Establishing Secure Uplink...
        </div>
      </div>
    );
  }

  // ERROR DOSSIER VIEW
  if (error || (activeCaseId && !dossier && !loading)) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center p-6 text-white text-center font-mono relative">
        <button 
          onClick={() => { triggerHaptic('light'); setActiveCaseId(null); setError(''); }} 
          className="absolute top-6 left-6 p-3 text-white/40 hover:text-white bg-white/[0.02] border border-white/[0.05] rounded-xl active:scale-95 transition-all">
          <Icons.ArrowLeft />
        </button>
        <div className="bg-red-500/[0.03] border border-red-500/10 p-8 rounded-3xl max-w-[280px]">
          <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
            <Icons.Zap />
          </div>
          <h2 className="text-[12px] uppercase tracking-widest text-red-500 mb-2 font-semibold">Signal Lost</h2>
          <p className="text-[10px] text-white/40 leading-relaxed">{error || 'Dossier not found or currently encrypted.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white font-sans overflow-hidden selection:bg-indigo-500/30">
      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* QUEUE VIEW */}
        {/* ========================================================= */}
        {!activeCaseId ? (
          <motion.div 
            key="queue"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Header */}
            <header className="h-[60px] bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.04] flex items-center justify-between px-5 shrink-0 z-20">
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 bg-white text-black rounded flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold tracking-widest uppercase">Verlyn Command</span>
                  <span className="text-[9px] font-mono text-emerald-400/80 uppercase tracking-widest">Active Link</span>
                </div>
              </div>
            </header>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-safe scrollbar-hide">
              <div className="px-2 pt-2 pb-1 flex justify-between items-center">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Priority Queue</span>
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{queue.length} Active</span>
              </div>
              
              {queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center mt-10">
                  <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center text-white/10 mb-4">
                    <Icons.Check />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
                    All clear. No pending operations.
                  </span>
                </div>
              ) : (
                queue.map((t, i) => (
                  <motion.button 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={t.id} 
                    onClick={() => { 
                      triggerHaptic('light');
                      setActiveCaseId(t.case_id); 
                      setDossier(null); 
                      setMessages([]); 
                      setError(''); 
                    }}
                    className="w-full text-left p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex flex-col gap-3 active:scale-[0.98] active:bg-white/[0.04] transition-all"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.2em]">{t.case_id}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                        t.status === 'Received' ? 'bg-indigo-500/10 text-indigo-400' : 
                        t.status === 'In progress' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="text-[14px] font-medium text-white/90 leading-snug">{t.subject}</div>
                    <div className="flex justify-between items-center w-full mt-1 border-t border-white/[0.02] pt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[9px] font-medium text-white/50 uppercase">
                          {t.full_name.charAt(0)}
                        </div>
                        <span className="text-[11px] text-white/40 font-medium">{t.full_name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/20">{new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        ) : (

        /* ========================================================= */
        /* DOSSIER VIEW */
        /* ========================================================= */
          <motion.div 
            key="dossier"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col bg-[#0a0a0a]"
          >
            {/* Header */}
            <header className="h-[64px] bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-white/[0.04] flex items-center justify-between px-3 shrink-0 z-20">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { triggerHaptic('light'); setActiveCaseId(null); }} 
                  className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white active:bg-white/5 rounded-full transition-colors"
                >
                  <Icons.ArrowLeft />
                </button>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold tracking-wide uppercase truncate max-w-[180px] text-white/90">
                      {dossier?.subject || 'Encrypted File'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[9px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                      {dossier?.report_type || 'Unknown'}
                    </span>
                    <span className="text-[9px] text-white/30 uppercase font-mono tracking-widest truncate">{dossier?.case_id}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={markResolved} 
                className="w-9 h-9 mr-1 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/40 active:scale-95 active:bg-emerald-500/20 active:text-emerald-400 active:border-emerald-500/30 transition-all"
              >
                <Icons.Archive />
              </button>
            </header>

            {/* Dossier Meta */}
            <div className="bg-gradient-to-b from-[#0a0a0a] to-transparent pt-4 pb-2 px-5 shrink-0 flex flex-col gap-2 z-10">
              <div className="flex justify-between items-center text-[12px] font-medium text-white/80">
                <span>{dossier?.full_name}</span>
                <span className="text-white/40 font-mono text-[10px]">{dossier ? new Date(dossier.created_at).toLocaleDateString() : ''}</span>
              </div>
              <div className="text-[10px] text-white/30 font-mono flex items-center gap-2 bg-white/[0.02] w-fit px-2 py-1 rounded border border-white/[0.02]">
                <Icons.Lock /> {dossier?.ip_address || 'ENCRYPTED IP'}
              </div>
            </div>

            {/* Chat Stream */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 pb-6 pt-2 scrollbar-hide flex flex-col gap-5 relative z-0">
              
              {/* Initial Report Bubble */}
              <div className="self-start w-full max-w-[90%] mt-2">
                <div className="bg-[#111] border border-white/[0.04] rounded-2xl rounded-tl-sm p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-white/10" />
                  <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em] mb-3 block flex items-center gap-2">
                    <Icons.Zap /> Initial Signal
                  </span>
                  <p className="text-[14px] leading-relaxed text-white/80 whitespace-pre-wrap font-medium">
                    {dossier?.description}
                  </p>
                </div>
              </div>

              {messages.length === 0 && (
                <div className="text-center py-8 font-mono text-[10px] uppercase tracking-[0.2em] text-white/20 flex items-center justify-center gap-3">
                  <div className="w-8 h-[1px] bg-white/10" />
                  No Transmissions
                  <div className="w-8 h-[1px] bg-white/10" />
                </div>
              )}

              {/* Dynamic Messages */}
              <div className="w-full flex flex-col gap-1.5">
                {messages.map((m, index) => {
                  const isAgent = m.sender_type === 'agent' || m.sender_type === 'system';
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
                  
                  const isFirstInGroup = !prevMsg || prevMsg.sender_type !== m.sender_type;
                  const isLastInGroup = !nextMsg || nextMsg.sender_type !== m.sender_type;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={m.id} 
                      className={`flex flex-col max-w-[85%] ${isAgent ? 'self-end' : 'self-start'} ${isFirstInGroup ? 'mt-4' : 'mt-0'}`}
                    >
                      <div className={`px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap shadow-sm
                        ${isAgent 
                          ? 'bg-white text-black font-medium border border-transparent' 
                          : 'bg-[#161616] border border-white/[0.04] text-white/90'
                        }
                        ${isFirstInGroup ? (isAgent ? 'rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl rounded-br-sm' : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm') : 'rounded-2xl'}
                        ${!isFirstInGroup && !isLastInGroup ? (isAgent ? 'rounded-r-sm' : 'rounded-l-sm') : ''}
                        ${isLastInGroup && !isFirstInGroup ? (isAgent ? 'rounded-br-2xl rounded-tr-sm' : 'rounded-bl-2xl rounded-tl-sm') : ''}
                      `}>
                        {m.content}
                      </div>
                      {isLastInGroup && (
                        <div className={`flex gap-1.5 items-center mt-1.5 px-1 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                          <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
                            {isAgent ? m.agent_name || 'Command' : dossier?.full_name}
                          </span>
                          <span className="font-mono text-[9px] text-white/10 uppercase tracking-widest">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/[0.04] shrink-0 pb-safe z-20">
              {dossier?.status === 'Resolved' ? (
                <div className="w-full bg-white/[0.02] border border-white/[0.05] rounded-full py-3.5 text-[12px] font-mono uppercase tracking-widest text-center text-emerald-500/50">
                  <Icons.Check /> <span className="ml-2 inline-block relative top-[-2px]">Case Resolved</span>
                </div>
              ) : (
                <form onSubmit={executeProtocol} className="w-full relative flex items-center">
                  <div className="absolute left-4 text-white/30 pointer-events-none">
                    <Icons.Terminal />
                  </div>
                  <input 
                    type="text" 
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    placeholder="Execute protocol..."
                    disabled={sending}
                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-full pl-11 pr-12 py-3.5 text-[14px] text-white outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all placeholder:text-white/20 shadow-inner"
                  />
                  <button 
                    disabled={!inputVal.trim() || sending}
                    className={`absolute right-1.5 w-10 h-10 flex items-center justify-center rounded-full transition-all 
                      ${inputVal.trim() && !sending 
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-90' 
                        : 'bg-transparent text-white/20'}`}
                  >
                    {sending ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full" />
                    ) : (
                      <Icons.Send />
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TgAdminPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-[1.5px] border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <TgAdminConsole />
    </Suspense>
  );
}
