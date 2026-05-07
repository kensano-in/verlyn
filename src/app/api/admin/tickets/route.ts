import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';

// Advanced admin auth check: Requires Password + 2FA Token
const checkAdminAuth = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  // Format expected: "Bearer <password>:<2fa_token>"
  const tokenString = authHeader.split(' ')[1];
  const [password, token2fa] = tokenString.split(':');

  const adminPassword = process.env.ADMIN_PASSWORD || 'S@6**9#hinichiro7980@##4_4$$&!227*5613###@!';
  const secret2fa = process.env.ADMIN_2FA_SECRET;

  if (password !== adminPassword) return false;

  // If 2FA is configured in .env, strictly enforce it
  if (secret2fa) {
    if (!token2fa) return false;
    const isValid2FA = speakeasy.totp.verify({
      secret: secret2fa,
      encoding: 'base32',
      token: token2fa,
      window: 2 // Allow 60 seconds clock skew
    });
    return isValid2FA;
  }

  // Fallback to password only if 2FA secret is not yet set up (for initial setup phase)
  return true;
};

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ tickets: [] }, { status: 200 }); // Table not created yet
      }
      throw error;
    }

    return NextResponse.json({ tickets: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, admin_reply } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const updatePayload: Record<string, string> = {};
    if (status) updatePayload.status = status;
    if (admin_reply !== undefined) updatePayload.admin_reply = admin_reply;

    if (Object.keys(updatePayload).length === 0)
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
