'use client';
import { useState } from 'react';

interface Props { tickets: any[]; preRegs: any[]; authKey: string; }

export default function SecurityPanel({ tickets, preRegs, authKey }: Props) {
  const [ipLookup, setIpLookup] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const highRisk = tickets.filter(t => (t.risk_score||0) > 70);
  const flagged = tickets.filter(t => t.flagged);
  const suspended = tickets.filter(t => t.status === 'Suspended');

  const ipDomains = tickets.reduce((acc: Record<string, number>, t) => {
    if (t.ip_address) acc[t.ip_address] = (acc[t.ip_address]||0) + 1;
    return acc;
  }, {});
  const suspiciousIPs = Object.entries(ipDomains).filter(([,count]) => count > 2).sort((a,b)=>+b[1] - +a[1]);

  const emailDomains = [...tickets, ...preRegs].reduce((acc: Record<string, number>, r) => {
    const d = r.email?.split('@')[1];
    if (d) acc[d] = (acc[d]||0) + 1;
    return acc;
  }, {});
  const topDomains = Object.entries(emailDomains).sort((a,b)=>+b[1]-+a[1]).slice(0,8);

  const doLookup = async () => {
    if (!ipLookup.trim()) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`https://ipapi.co/${ipLookup.trim()}/json/`);
      const data = await res.json();
      setLookupResult(data);
    } catch { setLookupResult({ error: 'Lookup failed' }); }
    finally { setLookupLoading(false); }
  };

  const riskOverall = tickets.length ? Math.round(tickets.reduce((a,t)=>a+(t.risk_score||0),0)/tickets.length) : 0;
  const riskColor = riskOverall>60?'#ef4444':riskOverall>30?'#f59e0b':'#10b981';

  return (
    <div style={{ padding:'32px', overflowY:'auto', height:'100%' }} className="scrollbar-hide">
      <div style={{ maxWidth:'900px', margin:'0 auto' }}>
        <h2 style={{ fontSize:'18px', fontWeight:700, color:'#fff', margin:'0 0 4px' }}>Security Intelligence</h2>
        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginBottom:'28px' }}>Abuse detection, IP telemetry, and risk analysis</p>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'28px' }}>
          {[
            { label:'High Risk', value:highRisk.length, color:'#ef4444', icon:'🔴' },
            { label:'Flagged', value:flagged.length, color:'#f59e0b', icon:'⚑' },
            { label:'Suspended', value:suspended.length, color:'#6b7280', icon:'🔒' },
            { label:'Avg Risk Score', value:`${riskOverall}%`, color:riskColor, icon:'◈' },
          ].map(s=>(
            <div key={s.label} style={{ background:`${s.color}0d`, border:`1px solid ${s.color}22`, borderRadius:'12px', padding:'18px', textAlign:'center' }}>
              <div style={{ fontSize:'22px', marginBottom:'6px' }}>{s.icon}</div>
              <div style={{ fontSize:'26px', fontWeight:700, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:'4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }}>
          {/* Suspicious IPs */}
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#fff' }}>Repeated IPs</span>
            </div>
            {suspiciousIPs.length===0 ? (
              <div style={{ padding:'32px', textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'12px' }}>No repeated IPs detected</div>
            ) : suspiciousIPs.slice(0,6).map(([ip, count])=>(
              <div key={ip} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <code style={{ fontSize:'12px', color:'rgba(255,255,255,0.8)' }}>{ip}</code>
                <span style={{ fontSize:'11px', fontWeight:700, color: +count>4?'#ef4444':'#f59e0b', background: +count>4?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)', padding:'3px 10px', borderRadius:'20px' }}>{count}x</span>
              </div>
            ))}
          </div>

          {/* Top Email Domains */}
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#fff' }}>Email Domains</span>
            </div>
            {topDomains.map(([domain, count], i)=>(
              <div key={domain} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 20px', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'18px', fontSize:'11px', color:'rgba(255,255,255,0.3)', fontFamily:'monospace', textAlign:'right' }}>{i+1}</div>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.75)' }}>{domain}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'60px', height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{ width:`${(+count / +topDomains[0][1]) * 100}%`, height:'100%', background:'#7c3aed', borderRadius:'2px' }} />
                  </div>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', minWidth:'20px', textAlign:'right' }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IP Lookup */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'20px' }}>
          <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#fff', marginBottom:'16px' }}>IP Telemetry Lookup</div>
          <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
            <input value={ipLookup} onChange={e=>setIpLookup(e.target.value)} placeholder="Enter IP address…"
              onKeyDown={e=>e.key==='Enter'&&doLookup()}
              style={{ flex:1, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.08)', color:'#fff', borderRadius:'9px', padding:'10px 14px', fontSize:'13px', outline:'none', fontFamily:'monospace' }} />
            <button onClick={doLookup} disabled={lookupLoading||!ipLookup.trim()}
              style={{ padding:'10px 22px', background:'#7c3aed', border:'none', borderRadius:'9px', color:'#fff', fontWeight:700, fontSize:'12px', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {lookupLoading?'…':'Lookup'}
            </button>
          </div>
          {lookupResult && !lookupResult.error && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
              {[
                ['Country', `${lookupResult.country_name||'—'} ${lookupResult.country_code||''}`],
                ['City', lookupResult.city||'—'],
                ['Region', lookupResult.region||'—'],
                ['ISP / Org', lookupResult.org||'—'],
                ['Timezone', lookupResult.timezone||'—'],
                ['ASN', lookupResult.asn||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'10px 14px' }}>
                  <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, marginBottom:'4px' }}>{l}</div>
                  <div style={{ fontSize:'12px', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {lookupResult?.error && <p style={{ color:'#ef4444', fontSize:'12px', margin:0 }}>Lookup failed. Check IP format.</p>}
        </div>
      </div>
    </div>
  );
}
