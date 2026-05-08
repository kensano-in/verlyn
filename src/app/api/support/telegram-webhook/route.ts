import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7814788493';
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'VERLYN-ADMIN-99'; // Secure this in env!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate if it's a message from our authorized admin
    const message = body.message;
    if (!message || String(message.chat.id) !== ADMIN_CHAT_ID) {
      return NextResponse.json({ ok: true }); // Ignore non-admin messages
    }

    const text = message.text || '';
    const chatId = message.chat.id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // ── Command: /start or /help ──────────────────────────────────────────────
    if (text === '/start' || text === '/help') {
      await sendTelegramMessage(chatId, 
        "🛠 *VERLYN COMMAND CENTER*\n\n" +
        "Authorized access required. Please authenticate to use the mobile dashboard.\n\n" +
        "Commands:\n" +
        "• `/auth <password>` — Authenticate session\n" +
        "• `/tickets` — List active tickets\n" +
        "• `/resolve <case_id>` — Mark resolved"
      );
      return NextResponse.json({ ok: true });
    }

    // ── Command: /auth <password> ─────────────────────────────────────────────
    if (text.startsWith('/auth ')) {
      const pass = text.split(' ')[1];
      if (pass === MASTER_PASSWORD) {
        await sendTelegramMessage(chatId, "✅ *Authenticated Successfully*\nWelcome back, Administrator. You now have full access to support methods.", {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 View All Tickets', callback_data: 'list_tickets' }],
              [{ text: '🛡️ Audit Logs', callback_data: 'view_audit' }, { text: '⚙️ Settings', callback_data: 'view_settings' }]
            ]
          }
        });
      } else {
        await sendTelegramMessage(chatId, "❌ *Access Denied*\nInvalid master password.");
      }
      return NextResponse.json({ ok: true });
    }

    // ── Handle Callback Queries (Buttons) ─────────────────────────────────────
    if (body.callback_query) {
      const cb = body.callback_query;
      const data = cb.data;
      
      if (data === 'list_tickets') {
        const { data: tickets, error } = await supabase
          .from('support_tickets')
          .select('case_id, full_name, subject, status')
          .neq('status', 'Resolved')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error || !tickets) {
          await sendTelegramMessage(chatId, "❌ Error fetching tickets.");
        } else {
          let ticketList = "📋 *ACTIVE TICKETS*\n\n";
          tickets.forEach(t => {
            ticketList += `• \`${t.case_id}\` | ${t.full_name}\n_${t.subject}_\n\n`;
          });
          
          await sendTelegramMessage(chatId, ticketList, {
            reply_markup: {
              inline_keyboard: tickets.map(t => [
                { text: `💬 Assist ${t.case_id.split('-')[1]}`, callback_data: `assist_${t.case_id}` }
              ])
            }
          });
        }
      }
      
      return NextResponse.json({ ok: true });
    }

    // ── Handle Replies (Assisting users) ──────────────────────────────────────
    if (message.reply_to_message) {
      const originalText = message.reply_to_message.text || '';
      const caseIdMatch = originalText.match(/CASE-[A-Z0-9-]+/);
      
      if (caseIdMatch) {
        const caseId = caseIdMatch[0];
        const replyText = text;

        // Update ticket in DB
        const { error: updateErr } = await supabase
          .from('support_tickets')
          .update({ admin_reply: replyText, status: 'In progress' })
          .eq('case_id', caseId);

        if (updateErr) {
          await sendTelegramMessage(chatId, `❌ Failed to send reply to ${caseId}`);
        } else {
          await sendTelegramMessage(chatId, `✅ Reply sent to ${caseId}`);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[TG Webhook] Error:', err);
    return NextResponse.json({ ok: true }); // Always return OK to TG to avoid retry loops
  }
}

async function sendTelegramMessage(chatId: string | number, text: string, extra = {}) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...extra
    })
  });
}
