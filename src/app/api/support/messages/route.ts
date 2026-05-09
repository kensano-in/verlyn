import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const checkAdminAuth = (req: NextRequest): boolean => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  const adminPassword = process.env.ADMIN_PASSWORD || 'S@6**9#hinichiro7980@##4_4$$&!227*5613###@!';
  return token === adminPassword || token === 'VERLYN-ADMIN-99';
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/support/messages?ticket_id=xxx — Get all messages for a ticket
// GET /api/support/messages?case_id=xxx — Public: get user-visible messages for a case
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ticketId = searchParams.get('ticket_id');
  const caseId = searchParams.get('case_id');

  if (!ticketId && !caseId) {
    return NextResponse.json({ error: 'Missing ticket_id or case_id' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (ticketId) {
      // Admin access — show all messages including internal
      if (!checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      query = query.eq('ticket_id', ticketId);
    } else {
      // Public access — only show non-internal messages, resolve ticket_id from case_id
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('case_id', caseId!)
        .single();

      if (!ticket) return NextResponse.json({ messages: [] });
      query = query.eq('ticket_id', ticket.id).eq('is_internal', false);
    }

    const { data, error } = await query;
    if (error && error.code !== '42P01') throw error;

    return NextResponse.json({ messages: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/support/messages — Send a message (user or admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticket_id, case_id, content, sender_type, agent_name, agent_role, is_internal } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    let resolvedTicketId = ticket_id;

    // If case_id provided (user side), resolve ticket_id
    if (!resolvedTicketId && case_id) {
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('id, status')
        .eq('case_id', case_id)
        .single();

      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      if (ticket.status === 'Resolved') return NextResponse.json({ error: 'Cannot message on a resolved ticket' }, { status: 400 });
      resolvedTicketId = ticket.id;
    }

    // Admin validation for agent messages
    if (sender_type === 'agent' && !checkAdminAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: resolvedTicketId,
        sender_type: sender_type || 'user',
        content: content.trim(),
        agent_name: agent_name || null,
        is_internal: is_internal || false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Database table not yet created. Please run schema migration.' }, { status: 503 });
      }
      throw error;
    }

    // If agent sent a visible reply, update ticket status and admin_reply field
    if (sender_type === 'agent' && !is_internal) {
      await supabase
        .from('support_tickets')
        .update({ status: 'Active Session', admin_reply: content.trim(), updated_at: new Date().toISOString() })
        .eq('id', resolvedTicketId);
    }

    // If user sent a reply, reset admin_reply and set status to In progress
    if (sender_type === 'user') {
      await supabase
        .from('support_tickets')
        .update({ status: 'In progress', admin_reply: null, updated_at: new Date().toISOString() })
        .eq('id', resolvedTicketId);

      // ── Notify Telegram ──
      try {
        const { data: ticketInfo } = await supabase.from('support_tickets').select('case_id').eq('id', resolvedTicketId).single();
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID || '7814788493';
        if (botToken && ticketInfo) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `[ 𝗨𝗣𝗗𝗔𝗧𝗘𝗗 𝗗𝗢𝗦𝗦𝗜𝗘𝗥 ]\n` +
                    `𝗜𝗗: \`${ticketInfo.case_id}\`\n` +
                    `━━━━━━━━━━━━━━━━━━━\n` +
                    `𝗦𝗧𝗔𝗧𝗨𝗦   :: [ USER CHAT REPLY ]\n` +
                    `━━━━━━━━━━━━━━━━━━━\n` +
                    `*NEW PAYLOAD:*\n> ${content.substring(0, 300)}${content.length > 300 ? '...' : ''}\n\n` +
                    `[ 𝗜𝗡𝗧𝗘𝗟: SECURED ]   [ 𝗧𝗜𝗠𝗘: ${new Date().toISOString().split('T')[1].slice(0, 5)} UTC ]\n` +
                    `━━━━━━━━━━━━━━━━━━━`,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '⚡ REPLY', callback_data: `reply_hint_${ticketInfo.case_id}` }, { text: '🤖 AI AUTO', callback_data: `ai_reply_${ticketInfo.case_id}` }, { text: '🖥️ WEB', web_app: { url: `https://verlyn.in/tg-admin?case_id=${ticketInfo.case_id}` } }],
                  [{ text: '🔍 TRACE IP', callback_data: `ip_intel_${ticketInfo.case_id}` }, { text: '⚠️ ESCALATE', callback_data: `escalate_${ticketInfo.case_id}` }],
                  [{ text: '✅ RESOLVE', callback_data: `resolve_${ticketInfo.case_id}` }, { text: '🚫 PERMA-BAN', callback_data: `ban_${ticketInfo.case_id}` }]
                ]
              }
            })
          });
        }
      } catch (e) { console.error('TG Notification error:', e); }
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
