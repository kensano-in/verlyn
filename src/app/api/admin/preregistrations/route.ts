import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import speakeasy from 'speakeasy';

const checkAdminAuth = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const tokenString = authHeader.split(' ')[1];
  const [password, token2fa] = tokenString.split(':');
  const adminPassword = process.env.ADMIN_PASSWORD || 'S@6**9#hinichiro7980@##4_4$$&!227*5613###@!';
  const secret2fa = process.env.ADMIN_2FA_SECRET;
  if (password !== adminPassword) return false;
  if (secret2fa) {
    if (!token2fa) return false;
    return speakeasy.totp.verify({ secret: secret2fa, encoding: 'base32', token: token2fa, window: 2 });
  }
  return true;
};

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('preregistrations')
      .select('id, full_name, email, gender, ip_address, created_at, status')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ registrations: [] }, { status: 200 });
      throw error;
    }

    return NextResponse.json({ registrations: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
