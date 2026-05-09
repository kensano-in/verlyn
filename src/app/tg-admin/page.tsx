'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Raw SVGs
const Icons = {
  Terminal: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  Zap: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Send: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Archive: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  ArrowLeft: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
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
    // Inject Telegram Web App script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
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
      if (!res.ok) throw new Error('Failed to send transmission.');
      await fetchCaseData();
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      alert('Transmission failed. Retry.');
    } finally {
      setSending(false);
    }
  };

  const markResolved = async () => {
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
      setActiveCaseId(null); // Go back to queue
    } catch (e) { alert('Failed to update status.'); }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6 text-white font-mono uppercase tracking-[0.2em] text-[10px]">
        <div className="flex flex-col items-center gap-4 text-white/40">
          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          Establishing Secure Uplink...
        </div>
      </div>
    );
  }

  // QUEUE VIEW
  if (!activeCaseId) {
    return (
      <div className="fixed inset-0 bg-[#050505] text-white font-sans flex flex-col overflow-hidden">
        <header className="h-14 border-b border-white/[0.05] bg-[#0a0a0a] flex items-center px-4 shrink-0 z-20">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 bg-white text-black rounded-sm flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span className="text-[12px] font-semibold tracking-widest uppercase">VERLYN WEB CONSOLE</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {queue.length === 0 ? (
            <div className="text-center mt-10 text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Queue is empty.
            </div>
          ) : (
            queue.map(t => (
              <button 
                key={t.id} 
                onClick={() => { setActiveCaseId(t.case_id); setDossier(null); setMessages([]); setError(''); }}
                className="w-full text-left p-4 bg-[#0a0a0a] border border-white/[0.05] rounded-xl flex flex-col gap-2 hover:bg-[#111] transition-all"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest">{t.case_id}</span>
                  <span className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                    t.status === 'In progress' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="text-[13px] font-medium text-white truncate">{t.subject}</div>
                <div className="flex justify-between items-center w-full text-[10px] text-white/30">
                  <span>{t.full_name}</span>
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // ERROR DOSSIER VIEW
  if (error || !dossier) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6 text-white text-center font-mono relative">
        <button onClick={() => setActiveCaseId(null)} className="absolute top-4 left-4 p-2 text-white/40 hover:text-white bg-white/5 rounded-lg"><Icons.ArrowLeft /></button>
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
          <h2 className="text-[12px] uppercase tracking-widest text-red-500 mb-2 font-bold">Signal Lost</h2>
          <p className="text-[10px] text-white/40">{error || 'Dossier not found or encrypted.'}</p>
        </div>
      </div>
    );
  }

  // DOSSIER VIEW
  return (
    <div className="fixed inset-0 bg-[#050505] text-white font-sans flex flex-col overflow-hidden selection:bg-indigo-500/30">
      
      {/* ── HEADER ── */}
      <header className="h-14 border-b border-white/[0.05] bg-[#0a0a0a] flex items-center justify-between px-2 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveCaseId(null)} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <Icons.ArrowLeft />
          </button>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wide uppercase truncate max-w-[150px]">{dossier.subject}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[8px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                {dossier.report_type}
              </span>
              <span className="text-[8px] text-white/20 uppercase font-mono tracking-widest truncate">{dossier.case_id}</span>
            </div>
          </div>
        </div>
        
        <button onClick={markResolved} className="w-8 h-8 mr-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-emerald-400/20 hover:text-emerald-400 transition-all">
          <Icons.Archive />
        </button>
      </header>

      {/* ── DOSSIER META (EXPANDABLE) ── */}
      <div className="bg-[#0c0c0c] border-b border-white/5 p-4 shrink-0 flex flex-col gap-3">
        <div className="flex justify-between items-center text-[11px] font-medium text-white/80">
          <span>{dossier.full_name}</span>
          <span className="text-white/40 font-mono text-[9px]">{new Date(dossier.created_at).toLocaleDateString()}</span>
        </div>
        <div className="text-[10px] text-white/50 font-mono flex items-center gap-2">
          <Icons.Zap /> {dossier.ip_address || 'ENCRYPTED IP'}
        </div>
      </div>

      {/* ── TRANSMISSION STREAM ── */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 scrollbar-hide flex flex-col gap-6 bg-[#0a0a0a]">
        
        {/* Initial Report */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-4 w-full">
          <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em] mb-2 block">Initial Signal</span>
          <p className="text-[13px] leading-relaxed text-white/80 whitespace-pre-wrap">
            {dossier.description}
          </p>
        </div>

        {messages.length === 0 && (
          <div className="text-center py-6 font-mono text-[9px] uppercase tracking-widest text-white/20">
            -- No further transmissions --
          </div>
        )}

        {/* Message Stream */}
        <div className="w-full flex flex-col gap-4">
          {messages.map((m) => {
            const isAgent = m.sender_type === 'agent' || m.sender_type === 'system';
            return (
              <div key={m.id} className={`flex flex-col max-w-[85%] ${isAgent ? 'self-end items-end' : 'self-start items-start'}`}>
                <div className={`px-4 py-3 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                  isAgent 
                    ? 'bg-white text-black font-medium' 
                    : 'bg-[#161616] border border-white/[0.05] text-white/90'
                }`}>
                  {m.content}
                </div>
                <div className="flex gap-2 items-center mt-1.5 px-1">
                  <span className="font-mono text-[8px] text-white/30 uppercase tracking-widest">
                    {isAgent ? m.agent_name || 'Command' : dossier.full_name}
                  </span>
                  <span className="text-white/10 text-[8px]">•</span>
                  <span className="font-mono text-[8px] text-white/20">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {/* Spacer for bottom input */}
        <div className="h-4 shrink-0" />
      </div>

      {/* ── COMMAND INPUT ── */}
      <div className="p-3 border-t border-white/[0.05] bg-[#0c0c0c] shrink-0 pb-safe">
        <form onSubmit={executeProtocol} className="w-full relative flex items-center">
          <div className="absolute left-3 text-white/30">
            <Icons.Terminal />
          </div>
          <input 
            type="text" 
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Execute protocol..."
            disabled={sending}
            className="w-full bg-[#161616] border border-white/10 rounded-xl pl-9 pr-12 py-3.5 text-[13px] text-white outline-none focus:border-white/20 transition-all placeholder:text-white/20"
          />
          <button 
            disabled={!inputVal.trim() || sending}
            className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all">
            <Icons.Send />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TgAdminPage() {
  return (
    <Suspense fallback={<div className="bg-[#050505] min-h-screen" />}>
      <TgAdminConsole />
    </Suspense>
  );
}
