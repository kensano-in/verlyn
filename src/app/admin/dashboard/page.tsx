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

// ── UI Components ──────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'Received': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'In progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Active Session': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Resolved': 'bg-white/5 text-white/40 border-white/10',
  };
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest uppercase border ${styles[status] || styles['Resolved']}`}>
      {status}
    </span>
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

  // 1. Fetch Tickets via API
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

  // 2. Fetch Messages for selected ticket
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
      setError('INVALID PROTOCOL KEY');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center p-8 overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-sm z-10"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Command Center</h1>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">Operational Protocol v4.2</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="ENTER MASTER KEY" 
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-white/10 outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-center tracking-[0.2em] font-mono text-lg"
              />
              <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-red-500 text-center font-bold tracking-widest uppercase">
                {error}
              </motion.p>
            )}
            <button className="w-full bg-white text-black font-black py-5 rounded-2xl text-xs tracking-[0.2em] uppercase hover:bg-[#f2f2f2] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              Establish Session
            </button>
          </form>
          
          <p className="text-[9px] text-white/20 text-center mt-12 uppercase tracking-widest leading-relaxed">
            Unauthorized access to Verlyn infrastructure is strictly prohibited.<br />All sessions are monitored and recorded.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#030303] flex flex-col font-sans text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl z-50 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <span className="text-[11px] font-black tracking-[0.2em] text-white uppercase block leading-none">Operations</span>
            <span className="text-[9px] font-mono text-emerald-500/60 uppercase tracking-widest">System Optimal</span>
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        </button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {!selectedTicket ? (
            <motion.div 
              key="list" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Active Dossiers</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">Operational Queue</p>
                </div>
                <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">{tickets.length} Total</span>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                  <p className="text-[10px] font-mono text-white/20 tracking-[0.3em] uppercase">Retrieving Data...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-20 space-y-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  <p className="text-sm italic tracking-wide">Queue Empty. No active cases detected.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {tickets.map(t => (
                    <motion.div 
                      key={t.id}
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.04)' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedTicket(t)}
                      className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-mono text-white/30 tracking-tighter uppercase">{t.case_id}</span>
                          <StatusBadge status={t.status} />
                        </div>
                        <h3 className="text-sm font-bold text-white/90 group-hover:text-white transition-colors truncate">{t.subject}</h3>
                        <p className="text-[11px] text-white/40 mt-1 flex items-center gap-2">
                          <span className="font-medium text-white/60">{t.full_name}</span>
                          <span className="w-1 h-1 rounded-full bg-white/10" />
                          <span className="truncate">{t.email}</span>
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="chat" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Chat Sub-Header */}
              <div className="p-4 bg-white/[0.01] border-b border-white/5 flex items-center gap-4">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black tracking-tight truncate">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-tighter">{selectedTicket.case_id}</span>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">Active Link</span>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-void relative">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 mb-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] uppercase font-black text-white/20 mb-3 tracking-[0.2em] flex items-center gap-2">
                      <span className="w-3 h-[1px] bg-white/20" /> Initial Transmission
                    </p>
                    <p className="text-[13px] text-white/80 leading-relaxed font-medium">
                      {selectedTicket.description}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-[10px] text-white/30 font-mono">
                      <span>{selectedTicket.full_name}</span>
                      <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {messages.length === 0 ? (
                  <div className="py-20 text-center opacity-20">
                    <p className="text-xs italic">Awaiting secondary transmissions...</p>
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.sender_type === 'agent' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                        m.sender_type === 'agent' 
                          ? 'bg-white text-black font-semibold rounded-tr-none' 
                          : 'bg-white/[0.05] border border-white/10 text-white rounded-tl-none'
                      }`}>
                        {m.content}
                      </div>
                      <span className="text-[9px] text-white/20 font-mono mt-2 px-1">
                        {m.sender_type === 'agent' ? 'OPERATOR' : 'CLIENT'} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReply} className="p-6 bg-black border-t border-white/5 backdrop-blur-xl">
                <div className="flex gap-3 relative">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    disabled={isSending}
                    placeholder="Enter command or message..."
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                  />
                  <button 
                    disabled={isSending || !replyText.trim()}
                    className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white text-black hover:bg-[#f2f2f2] active:scale-[0.95] disabled:opacity-30 disabled:scale-100 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
