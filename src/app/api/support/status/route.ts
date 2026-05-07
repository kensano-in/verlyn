import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const case_id = req.nextUrl.searchParams.get('case_id');
  if (!case_id) return NextResponse.json({ error: 'Missing case_id' }, { status: 400 });

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('support_tickets')
      .select('status, admin_reply')
      .eq('case_id', case_id)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    return NextResponse.json({ status: data.status, admin_reply: data.admin_reply || null });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
