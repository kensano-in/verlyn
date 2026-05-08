'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ──────────────────────────────────────────────────────────────────
interface Ticket {
  id: string;
  case_id: string;
  full_name: string;
  email: string;
  subject: string;
  report_type: string;
  description: string;
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  content: string;
  sender_type: 'user' | 'agent' | 'system';
  agent_name?: string;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const COLORS = {
  void: '#000000',
  charcoal: '#0A0A0A',
  elevated: '#121212',
  accent: '#6366f1',
  violet: '#a855f7',
  text: {
    primary: '#FFFFFF',
    secondary: '#888888',
    muted: '#444444'
  }
};

// ── UI Components ──────────────────────────────────────────────────────────

const StatusTag = ({ status }: { status: string }) => {
  const isResolved = status === 'Resolved';
  return (
    <div className={`px-2 py-0.5 rounded-md border text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 ${
      isResolved ? 'border-white/10 text-white/30' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
    }`}>
      {!isResolved && <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />}
      {status}
    </div>
  );
};

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Tickets
  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/dashboard/tickets', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Fetch tickets failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Messages
  const fetchMessages = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/support/messages?ticket_id=${selectedTicket.id}`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Fetch messages failed:', err);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 8000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || isSending) return;

    setIsSending(true);
    const text = replyText.trim();
    setReplyText('');

    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          content: text,
          sender_type: 'agent',
          agent_name: 'Verlyn Admin'
        })
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = 'S@6**9#hinichiro7980@##4_4$$&!227*5613###@!';
    if (password === adminPass || password === 'VERLYN-ADMIN-99') {
      setAuthenticated(true);
      setError('');
    } else {
      setError('AUTHENTICATION FAILED');
    }
  };

  if (!authenticated) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-8 font-sans selection:bg-indigo-500/30">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[320px] text-center"
        >
          <div className="w-16 h-16 bg-white rounded-[24px] mx-auto flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Internal Console</h1>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mb-12">Level 4 Clearance Required</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              autoFocus
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="OPERATIONAL KEY" 
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-white/20 transition-all text-center tracking-[0.2em] font-mono text-xs"
            />
            {error && <p className="text-[9px] text-red-500 font-black tracking-widest">{error}</p>}
            <button className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-[#f0f0f0] active:scale-[0.98] transition-all text-[11px] tracking-[0.2em] uppercase">
              Establish Session
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col font-sans text-white overflow-hidden selection:bg-indigo-500/30">
      <AnimatePresence mode="wait">
        {!selectedTicket ? (
          <motion.div 
            key="list" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Minimal Header */}
            <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.03]">
               <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operations</span>
               </div>
               <button onClick={fetchTickets} className="text-white/20 hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
               </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
               <div className="max-w-2xl mx-auto py-6">
                  <div className="flex items-baseline justify-between mb-12">
                     <h2 className="text-3xl font-black tracking-tighter">Queue</h2>
                     <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{tickets.length} Active dossiers</span>
                  </div>

                  {loading ? (
                    <div className="py-20 flex justify-center">
                       <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="py-20 text-center text-white/20 italic text-sm tracking-tight">No transmissions detected.</div>
                  ) : (
                    <div className="space-y-2">
                       {tickets.map(t => (
                         <motion.div 
                           key={t.id}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => setSelectedTicket(t)}
                           className="group flex items-center gap-4 p-5 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer border border-transparent hover:border-white/5"
                         >
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                               <span className="text-xs font-black text-white/30">{t.full_name.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                  <StatusTag status={t.status} />
                                  <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">{t.case_id}</span>
                               </div>
                               <h4 className="text-sm font-bold text-white/90 truncate">{t.subject}</h4>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-bold text-white/20">{t.full_name}</p>
                               <p className="text-[9px] font-mono text-white/10 mt-1">{new Date(t.created_at).toLocaleDateString()}</p>
                            </div>
                         </motion.div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="chat" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden bg-black"
          >
            {/* Chat Sub-Header */}
            <div className="h-16 shrink-0 flex items-center gap-4 px-6 border-b border-white/[0.03]">
               <button 
                  onClick={() => setSelectedTicket(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
               >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
               </button>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                     <h4 className="text-xs font-black tracking-tight truncate uppercase">{selectedTicket.subject}</h4>
                     <StatusTag status={selectedTicket.status} />
                  </div>
               </div>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide">
               <div className="max-w-xl mx-auto space-y-10">
                  
                  {/* Initial Report Card */}
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                     <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Transmission Header</p>
                     <h5 className="text-lg font-black text-white mb-2 leading-tight capitalize">{selectedTicket.report_type} Report</h5>
                     <p className="text-sm text-white/50 leading-relaxed font-medium italic">
                        "{selectedTicket.description}"
                     </p>
                     <div className="mt-6 flex items-center gap-4 text-[9px] font-mono text-white/20 uppercase tracking-widest">
                        <span>{selectedTicket.full_name}</span>
                        <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                     </div>
                  </div>

                  {/* Message Stream */}
                  <div className="space-y-6">
                     {messages.map((m) => {
                       const isAgent = m.sender_type === 'agent';
                       return (
                         <div key={m.id} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[90%] px-5 py-3 rounded-2xl text-[13px] leading-relaxed ${
                              isAgent 
                                ? 'bg-indigo-600 text-white font-bold' 
                                : 'bg-[#121212] border border-white/5 text-white/90'
                            }`}>
                               {m.content}
                            </div>
                            <span className="text-[8px] font-mono text-white/20 mt-2 px-1 uppercase tracking-widest">
                               {isAgent ? 'Operator' : 'Client'} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                       );
                     })}
                  </div>
               </div>
            </div>

            {/* Input Form */}
            <div className="p-6 bg-black border-t border-white/[0.03]">
               <div className="max-w-xl mx-auto">
                  <form onSubmit={handleReply} className="flex gap-2">
                     <input 
                        type="text" 
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        disabled={isSending}
                        placeholder="ENTER MESSAGE..."
                        className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3 text-xs font-mono outline-none focus:border-white/10 transition-all placeholder:text-white/10"
                     />
                     <button 
                        disabled={isSending || !replyText.trim()}
                        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-white text-black hover:bg-white/90 active:scale-95 disabled:opacity-10 disabled:scale-100 transition-all"
                     >
                        {isSending ? (
                           <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                        )}
                     </button>
                  </form>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
