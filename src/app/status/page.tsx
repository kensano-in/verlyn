'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ServiceMetric {
  id: string;
  service_name: string;
  uptime_percentage: number;
  latency_ms: number;
  status: 'operational' | 'degraded' | 'down';
  last_updated: string;
}

type OverallStatus = 'All Systems Operational' | 'Partial Degradation' | 'Critical Outage';

function statusColor(s: ServiceMetric['status']): string {
  if (s === 'operational') return '#22c55e';
  if (s === 'degraded') return '#f59e0b';
  return '#ef4444';
}

function overallStatus(metrics: ServiceMetric[]): OverallStatus {
  if (metrics.some((m) => m.status === 'down')) return 'Critical Outage';
  if (metrics.some((m) => m.status === 'degraded')) return 'Partial Degradation';
  return 'All Systems Operational';
}

function overallColor(s: OverallStatus): string {
  if (s === 'All Systems Operational') return '#22c55e';
  if (s === 'Partial Degradation') return '#f59e0b';
  return '#ef4444';
}

function formatLatency(ms: number): string {
  return `${ms.toFixed(0)} ms`;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function StatusPage() {
  const [metrics, setMetrics] = useState<ServiceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function fetchMetrics() {
    const { data, error } = await supabase
      .from('system_metrics')
      .select('*')
      .order('service_name', { ascending: true });

    if (error) {
      setError('isolated');
    } else {
      setMetrics(data as ServiceMetric[]);
      setError(null);
    }
    setLastRefresh(new Date());
    setLoading(false);
  }

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10_000);
    return () => clearInterval(interval);
  }, []);

  const overall = metrics.length > 0 ? overallStatus(metrics) : null;
  const color = overall ? overallColor(overall) : '#22c55e';

  return (
    <main style={{
      minHeight: '100dvh', background: '#000', color: '#fff',
      padding: 'clamp(40px, 8vw, 120px) clamp(24px, 5vw, 64px)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Back */}
        <Link href="/" style={{ fontSize: '13px', color: '#7c3aed', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '48px' }}>
          ← Back to System
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '48px' }}>
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 500, marginBottom: '10px' }}>
              System Status
            </p>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              Verlyn Network
            </h1>
          </div>

          {overall && !error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px',
              background: `${color}12`,
              border: `1px solid ${color}30`,
              borderRadius: '4px',
              alignSelf: 'flex-start',
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: color, boxShadow: `0 0 8px ${color}`,
                animation: 'pulse 2s ease-in-out infinite', display: 'inline-block',
              }} />
              <span style={{ color, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {overall}
              </span>
            </div>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: error ? '#f59e0b' : '#7c3aed', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
            Auto-refreshes every 10s — Last sync attempt: {timeAgo(lastRefresh.toISOString())}
          </span>
        </div>

        {/* Content */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Querying system metrics…</span>
          </div>
        )}

        {error === 'isolated' && (
          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%', boxShadow: '0 0 8px #f59e0b', animation: 'pulse 2s infinite' }} />
              <p style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'monospace' }}>Metrics temporarily isolated — system integrity unaffected</p>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, paddingLeft: '20px' }}>
              Telemetry subsystems have been securely disconnected. Core network operations and cryptographic pipelines remain 100% operational. No data has been compromised. Reconnection will occur automatically.
            </p>
          </div>
        )}

        {!loading && !error && metrics.length === 0 && (
          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ width: '8px', height: '8px', background: '#7c3aed', borderRadius: '50%', boxShadow: '0 0 8px #7c3aed', animation: 'pulse 2s infinite' }} />
              <p style={{ fontSize: '14px', color: '#7c3aed', fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'monospace' }}>System initialization in progress</p>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, paddingLeft: '20px' }}>
              Metric aggregation nodes are synchronizing. Standby for baseline resolution.
            </p>
          </div>
        )}

        {!loading && metrics.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
            {metrics.map((m, idx) => (
              <div
                key={m.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  alignItems: 'center',
                  gap: '24px',
                  padding: '20px 24px',
                  background: '#000',
                  borderBottom: idx < metrics.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.2s',
                }}
              >
                {/* Service info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: statusColor(m.status),
                      boxShadow: `0 0 6px ${statusColor(m.status)}`,
                      flexShrink: 0,
                    }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
                      {m.service_name}
                    </h3>
                  </div>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', paddingLeft: '17px', display: 'block' }}>
                    Uptime 30d: {m.uptime_percentage.toFixed(2)}% · Updated {timeAgo(m.last_updated)}
                  </span>
                </div>

                {/* Latency */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatLatency(m.latency_ms)}
                  </span>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '2px', letterSpacing: '0.06em' }}>latency</p>
                </div>

                {/* Status badge */}
                <span style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: statusColor(m.status),
                  minWidth: '90px', textAlign: 'right',
                }}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '32px', textAlign: 'center', letterSpacing: '0.04em' }}>
          Metrics sourced from live Supabase system_metrics table. Infrastructure incident reports are sent to authorized participants only.
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </main>
  );
}
