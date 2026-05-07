import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';

const checkAdminAuth = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const [password, token2fa] = authHeader.split(' ')[1].split(':');
  const adminPassword = process.env.ADMIN_PASSWORD || 'S@6**9#hinichiro7980@##4_4$$&!227*5613###@!';
  const secret2fa = process.env.ADMIN_2FA_SECRET;
  if (password !== adminPassword) return false;
  if (secret2fa) {
    if (!token2fa) return false;
    return speakeasy.totp.verify({ secret: secret2fa, encoding: 'base32', token: token2fa, window: 2 });
  }
  return true;
};

const supa = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { data, error } = await supa()
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error?.code === '42P01') return NextResponse.json({ events: [] });
    if (error) throw error;
    return NextResponse.json({ events: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { action, ticket_id, actor, detail, severity } = body;
    if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });

    const { data, error } = await supa()
      .from('admin_audit_log')
      .insert({
        action,
        ticket_id: ticket_id || null,
        actor: actor || 'Admin',
        detail: detail || '',
        severity: severity || 'info',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error?.code === '42P01') {
      return NextResponse.json({ success: true, event: { id: 'mock', action, ticket_id, actor, detail, severity, created_at: new Date().toISOString() } });
    }
    if (error) throw error;
    return NextResponse.json({ success: true, event: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
