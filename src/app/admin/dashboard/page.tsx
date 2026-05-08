'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

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

// ── UI Components ──────────────────────────────────────────────────────────

const StatusIndicator = ({ status }: { status: string }) => {
  const configs: Record<string, { color: string; bg: string; pulse: boolean }> = {
    'Received': { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', pulse: true },
    'In progress': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', pulse: true },
    'Active Session': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', pulse: true },
    'Resolved': { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', pulse: false },
  };
  const config = configs[status] || configs['Resolved'];

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        {config.pulse && (
          <div className="absolute w-2 h-2 rounded-full opacity-40 animate-ping" style={{ backgroundColor: config.color }} />
        )}
        <div className="w-1.5 h-1.5 rounded-full z-10" style={{ backgroundColor: config.color }} />
      </div>
      <span className="text-[10px] font-bold tracking-tight uppercase" style={{ color: config.color }}>
        {status}
      </span>
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
      setError('Invalid Operational Key');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-8 transform rotate-3">
               <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight leading-none mb-4">Verlyn HQ</h1>
            <p className="text-white/40 text-sm font-medium">Enterprise Support Console v5.0</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Operational Key" 
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 text-white placeholder:text-white/10 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all text-center tracking-widest text-lg font-bold"
              />
              {error && <p className="text-[10px] text-red-500 text-center font-bold uppercase tracking-widest mt-3">{error}</p>}
            </div>
            <button className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 text-sm tracking-wide">
              Initialize Access
            </button>
          </form>
          
          <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-center gap-8 opacity-20">
             <span className="text-[10px] font-bold tracking-widest uppercase">Encrypted</span>
             <span className="text-[10px] font-bold tracking-widest uppercase">Audited</span>
             <span className="text-[10px] font-bold tracking-widest uppercase">Secure</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] flex flex-col font-sans text-[#f2f2f2] overflow-hidden">
      {/* Header */}
      <header className="h-20 shrink-0 flex items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-3xl border-b border-white/5 z-50">
        <div className="flex items-center gap-5">
           <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
           </div>
           <div>
              <h2 className="text-lg font-bold tracking-tight leading-none">Command Center</h2>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                 Operational
              </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={fetchTickets} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
           </button>
           <button onClick={() => window.location.reload()} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex relative">
        <AnimatePresence mode="wait">
          {!selectedTicket ? (
            <motion.div 
              key="list" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 overflow-y-auto px-8 py-10 space-y-8 scrollbar-hide"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-end justify-between mb-12">
                   <div>
                      <h3 className="text-3xl font-bold tracking-tight mb-2">Priority Queue</h3>
                      <p className="text-white/40 text-sm font-medium">Monitoring active support transmissions</p>
                   </div>
                   <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold text-white/60 tracking-tight">{tickets.length} Active Tickets</span>
                   </div>
                </div>

                {loading ? (
                   <div className="flex flex-col items-center justify-center py-40 gap-6">
                      <div className="w-12 h-12 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      <p className="text-[10px] font-bold text-white/20 tracking-[0.4em] uppercase">Securing Data Stream</p>
                   </div>
                ) : tickets.length === 0 ? (
                   <div className="py-40 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto flex items-center justify-center mb-6">
                         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-20"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      </div>
                      <p className="text-white/20 text-sm font-medium italic">No pending dossiers. Network idle.</p>
                   </div>
                ) : (
                  <div className="grid gap-4">
                    {tickets.map(t => (
                      <motion.div 
                        key={t.id}
                        layoutId={t.id}
                        whileHover={{ scale: 1.005, backgroundColor: 'rgba(255,255,255,0.03)' }}
                        onClick={() => setSelectedTicket(t)}
                        className="group p-6 rounded-3xl bg-white/[0.02] border border-white/5 cursor-pointer transition-all flex items-center gap-6"
                      >
                         <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/10 transition-colors">
                            <span className="text-lg font-black text-white/20 group-hover:text-indigo-400/60 transition-colors">{t.full_name.charAt(0)}</span>
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1.5">
                               <StatusIndicator status={t.status} />
                               <span className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">{t.case_id}</span>
                            </div>
                            <h4 className="text-base font-bold text-white/90 group-hover:text-white transition-colors truncate">{t.subject}</h4>
                            <div className="flex items-center gap-3 mt-1.5">
                               <span className="text-[11px] text-white/40 font-medium truncate">{t.full_name}</span>
                               <span className="w-1 h-1 rounded-full bg-white/10" />
                               <span className="text-[11px] text-white/30 font-mono truncate">{t.email}</span>
                            </div>
                         </div>
                         <div className="w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-white/5">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                         </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="chat" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden bg-[#050505]"
            >
              {/* Chat Sub-Header */}
              <div className="h-20 shrink-0 px-8 bg-black/40 backdrop-blur-2xl border-b border-white/5 flex items-center gap-6">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-base font-black tracking-tight truncate">{selectedTicket.subject}</h4>
                      <StatusIndicator status={selectedTicket.status} />
                   </div>
                   <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{selectedTicket.case_id} — Secured Link</p>
                </div>
                <div className="flex items-center gap-2">
                   <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                   </div>
                </div>
              </div>

              {/* Chat Body */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                 <div className="max-w-3xl mx-auto space-y-10">
                    
                    {/* Dossier Summary Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 rounded-[32px] bg-white/[0.015] border border-white/5 relative group"
                    >
                       <div className="flex items-start justify-between mb-6">
                          <div>
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Initial Transmission</p>
                             <h5 className="text-xl font-bold text-white tracking-tight">{selectedTicket.report_type} Report</h5>
                          </div>
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                          </div>
                       </div>
                       <p className="text-sm leading-relaxed text-white/60 font-medium italic mb-8">
                          "{selectedTicket.description}"
                       </p>
                       <div className="flex items-center gap-5 pt-6 border-t border-white/5">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                             <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{selectedTicket.full_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                             <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                          </div>
                       </div>
                    </motion.div>

                    {/* Messages List */}
                    <div className="space-y-6">
                       {messages.map((m, idx) => {
                         const isAgent = m.sender_type === 'agent';
                         return (
                           <motion.div 
                             key={m.id}
                             initial={{ opacity: 0, x: isAgent ? 10 : -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                           >
                              <div className={`max-w-[85%] px-6 py-4 rounded-[26px] text-sm leading-relaxed shadow-xl ${
                                isAgent 
                                  ? 'bg-white text-black font-semibold rounded-tr-none' 
                                  : 'bg-[#151515] border border-white/5 text-[#f2f2f2] font-medium rounded-tl-none'
                              }`}>
                                 {m.content}
                              </div>
                              <span className="text-[9px] font-black text-white/20 mt-2 px-1 uppercase tracking-widest">
                                 {isAgent ? 'Official Agent' : 'User Client'} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </motion.div>
                         );
                       })}
                    </div>
                 </div>
              </div>

              {/* Reply Area */}
              <div className="shrink-0 p-8 bg-black/60 backdrop-blur-3xl border-t border-white/5">
                 <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleReply} className="relative flex items-end gap-3 group">
                       <div className="flex-1 relative">
                          <textarea 
                             value={replyText}
                             onChange={e => setReplyText(e.target.value)}
                             disabled={isSending}
                             placeholder="Message client..."
                             rows={1}
                             className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10 resize-none scrollbar-hide"
                             onKeyDown={(e) => {
                               if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handleReply(e as any);
                               }
                             }}
                          />
                       </div>
                       <button 
                         disabled={isSending || !replyText.trim()}
                         className="w-14 h-14 shrink-0 flex items-center justify-center rounded-2xl bg-white text-black hover:bg-[#e0e0e0] active:scale-90 disabled:opacity-20 disabled:scale-100 transition-all shadow-xl shadow-white/5"
                       >
                          {isSending ? (
                             <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          ) : (
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                          )}
                       </button>
                    </form>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
