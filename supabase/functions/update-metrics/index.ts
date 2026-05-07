// supabase/functions/update-metrics/index.ts
// Deploy: supabase functions deploy update-metrics
// Schedule: Supabase Dashboard → Database → pg_cron or Scheduled Hooks (every 30s)
//
// Simulates realistic metric fluctuation (replace with real monitoring hooks in prod)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

function jitter(base: number, maxDelta: number): number {
  return parseFloat((base + (Math.random() - 0.5) * maxDelta * 2).toFixed(2));
}

const serviceProfiles: Record<string, { basLatency: number; baseUptime: number }> = {
  'Pre-Registration API':       { basLatency: 42,  baseUptime: 99.98 },
  'Authentication Subsystem':   { basLatency: 18,  baseUptime: 99.99 },
  'Database Core (PostgreSQL)': { basLatency: 9,   baseUptime: 99.97 },
  'Edge Routing Network':       { basLatency: 4,   baseUptime: 99.99 },
  'Encrypted Message Queue':    { basLatency: 11,  baseUptime: 100.00 },
  'Rate Limiting Layer':        { basLatency: 2.8, baseUptime: 99.95 },
};

Deno.serve(async () => {
  const updates = Object.entries(serviceProfiles).map(([name, profile]) => ({
    service_name: name,
    latency_ms: jitter(profile.basLatency, 8),
    uptime_percentage: Math.min(100, jitter(profile.baseUptime, 0.03)),
    status: 'operational' as const,
    last_updated: new Date().toISOString(),
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('system_metrics')
      .update({
        latency_ms: update.latency_ms,
        uptime_percentage: update.uptime_percentage,
        status: update.status,
        last_updated: update.last_updated,
      })
      .eq('service_name', update.service_name);

    if (error) {
      console.error(`Failed to update ${update.service_name}:`, error.message);
    }
  }

  return new Response(JSON.stringify({ ok: true, updated: updates.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
