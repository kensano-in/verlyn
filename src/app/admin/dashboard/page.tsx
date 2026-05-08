'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// ── UI Components ──────────────────────────────────────────────────────────

const TerminalHeader = ({ title, status }: { title: string, status: string }) => (
  <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
      <span className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase">{title}</span>
    </div>
    <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">{status}</span>
  </div>
);

const CaseCard = ({ ticket, onClick }: { ticket: any, onClick: () => void }) => (
  <motion.div 
    whileHover={{ scale: 1.02, x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-mono text-white/30 uppercase tracking-tighter">{ticket.case_id}</span>
      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest uppercase ${
        ticket.status === 'Received' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
        ticket.status === 'In progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
        'bg-white/5 text-white/40'
      }`}>
        {ticket.status}
      </span>
    </div>
    <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{ticket.subject}</h3>
    <p className="text-xs text-white/40 mt-1 line-clamp-1">{ticket.full_name} · {ticket.email}</p>
  </motion.div>
);

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Initial Load
  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .neq('status', 'Resolved')
        .order('created_at', { ascending: false });
      setTickets(data || []);
      setLoading(false);
    };

    if (authenticated) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  // 2. Poll Messages for selected ticket
  useEffect(() => {
    if (!selectedTicket) return;
    const fetchMsgs = async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 4000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const text = replyText;
    setReplyText('');

    const { error } = await supabase.from('support_messages').insert({
      ticket_id: selectedTicket.id,
      content: text,
      sender_type: 'agent',
      agent_name: 'Verlyn Admin'
    });

    if (!error) {
      await supabase.from('support_tickets').update({ status: 'Active Session' }).eq('id', selectedTicket.id);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this should be a server-side session, but for this "Legacy Terminal" vibe:
    if (password === 'S@6**9#hinichiro7980@##4_4$$&!227*5613###@!' || password === 'VERLYN-ADMIN-99') {
      setAuthenticated(true);
      setError('');
    } else {
      setError('INVALID CREDENTIALS. ATTEMPT LOGGED.');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Access Protocol</h1>
            <p className="text-xs text-white/40 uppercase tracking-[0.2em]">Verlyn Command Center v4.2</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="ENTER MASTER KEY" 
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-center tracking-widest"
            />
            {error && <p className="text-[10px] text-red-500 text-center font-mono animate-pulse">{error}</p>}
            <button className="w-full bg-white text-black font-bold py-4 rounded-xl text-xs tracking-widest uppercase hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              Establish Session
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans text-white selection:bg-white selection:text-black">
      <TerminalHeader title="Legacy Operations" status="Encrypted" />

      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {!selectedTicket ? (
            <motion.div 
              key="list" 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              <div className="mb-6 px-1">
                <h2 className="text-xl font-bold text-white/90">Operational Queue</h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Direct Case Management</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-20 opacity-30 italic text-sm">No active cases detected.</div>
              ) : (
                tickets.map(t => (
                  <CaseCard key={t.id} ticket={t} onClick={() => setSelectedTicket(t)} />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="chat" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-4">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">{selectedTicket.subject}</h3>
                  <p className="text-[10px] text-white/40 font-mono tracking-tighter uppercase">{selectedTicket.case_id}</p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-6">
                  <p className="text-[10px] uppercase font-bold text-white/20 mb-2 tracking-widest">Initial Report</p>
                  <p className="text-xs text-white/70 leading-relaxed italic">"{selectedTicket.description}"</p>
                </div>

                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender_type === 'agent' 
                        ? 'bg-white text-black font-medium rounded-tr-none' 
                        : 'bg-white/[0.05] border border-white/10 text-white/90 rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="p-4 bg-black border-t border-white/10">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type mission response..."
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition-all"
                  />
                  <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
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
