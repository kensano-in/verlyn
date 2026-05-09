'use client';
import { motion } from 'framer-motion';
import { AuditEvent, LiveActivity } from './types';

const MOCK_AGENTS = [
  { id: '1', name: 'Zara Chen', role: 'Senior Support', status: 'online' as const, tickets_open: 4, tickets_resolved: 127, avg_response_time: '8m', avatar_color: '#7c3aed' },
  { id: '2', name: 'Marcus Obi', role: 'Security Analyst', status: 'online' as const, tickets_open: 2, tickets_resolved: 89, avg_response_time: '12m', avatar_color: '#0891b2' },
  { id: '3', name: 'Priya Nair', role: 'Support Lead', status: 'away' as const, tickets_open: 1, tickets_resolved: 203, avg_response_time: '6m', avatar_color: '#059669' },
];

interface Props {
  tickets: any[];
  preRegs: any[];
  auditEvents: AuditEvent[];
}

export default function OverviewPanel({ tickets, preRegs, auditEvents }: Props) {
  const open = tickets.filter(t => t.status !== 'Completed' && t.status !== 'Suspended').length;
  const critical = tickets.filter(t => t.priority === 'critical').length;
  const resolved = tickets.filter(t => t.status === 'Completed').length;
  const avgRisk = tickets.length ? Math.round(tickets.reduce((a, t) => a + (t.risk_score || 0), 0) / tickets.length) : 0;

  const stats = [
    { label: 'Active Tickets',     value: open,            color: '#7c3aed', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
    { label: 'Critical Cases',     value: critical,        color: '#ef4444', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
    { label: 'Resolved (Total)',   value: resolved,        color: '#10b981', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
    { label: 'Pre-Registrations', value: preRegs.length,  color: '#0891b2', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> },
    { label: 'Avg Risk Score',    value: `${avgRisk}%`,   color: avgRisk > 60 ? '#ef4444' : avgRisk > 30 ? '#f59e0b' : '#10b981', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={avgRisk > 60 ? '#ef4444' : avgRisk > 30 ? '#f59e0b' : '#10b981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { label: 'Online Agents',     value: MOCK_AGENTS.filter(a => a.status === 'online').length, color: '#10b981', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ];

  const recentActivity: LiveActivity[] = [
    ...tickets.slice(0, 3).map((t, i) => ({
      id: t.id + '-act',
      type: 'new_ticket' as const,
      message: `New ticket: "${t.subject?.slice(0, 40)}..."`,
      time: new Date(t.created_at).toLocaleTimeString(),
      severity: 'info' as const,
    })),
    ...auditEvents.slice(0, 5).map(e => ({
      id: e.id,
      type: 'status_change' as const,
      message: `${e.actor}: ${e.action}`,
      time: new Date(e.created_at).toLocaleTimeString(),
      severity: e.severity,
    })),
  ].sort(() => Math.random() - 0.5).slice(0, 8);

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }} className="scrollbar-hide">
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}22`, borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: `radial-gradient(circle at 100% 0%, ${s.color}15, transparent 70%)` }} />
            <div style={{ marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: s.color, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Live Activity Feed */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff' }}>Live Activity</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>No activity yet</div>
            ) : recentActivity.map((item, i) => (
              <motion.div key={item.id + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: item.severity === 'critical' ? '#ef4444' : item.severity === 'warn' ? '#f59e0b' : '#10b981' }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.message}</span>
                </div>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', flexShrink: 0 }}>{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Agent Status */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff' }}>Agent Status</span>
          </div>
          <div>
            {MOCK_AGENTS.map((agent, i) => (
              <div key={agent.id} style={{ padding: '16px 24px', borderBottom: i < MOCK_AGENTS.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: agent.avatar_color + '22', border: `2px solid ${agent.avatar_color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: agent.avatar_color }}>
                    {agent.name.charAt(0)}
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: agent.status === 'online' ? '#10b981' : agent.status === 'away' ? '#f59e0b' : '#6b7280', border: '2px solid #0a0a0a' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{agent.name}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{agent.role}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{agent.tickets_open} open</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>avg {agent.avg_response_time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
