import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MASTER_PASSWORD = 'VERLYN-ADMIN-99';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${MASTER_PASSWORD}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data } = await supabase.from('global_config').select('*');
  
  const config = {
    maintenance: data?.find(d => d.key === 'maintenance_mode')?.value === 'true',
    presence: data?.find(d => d.key === 'agent_presence')?.value || 'online',
    agent_name: data?.find(d => d.key === 'agent_display_name')?.value || 'Verlyn Command',
    registration_locked: data?.find(d => d.key === 'registration_locked')?.value === 'true',
    pow_difficulty: parseInt(data?.find(d => d.key === 'pow_difficulty')?.value || '4', 10),
    otp_expiry_mins: parseInt(data?.find(d => d.key === 'otp_expiry_mins')?.value || '10', 10),
  };

  return NextResponse.json({ config });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${MASTER_PASSWORD}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { key, value } = await req.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  await supabase.from('global_config').upsert({ key, value }, { onConflict: 'key' });
  return NextResponse.json({ ok: true });
}
