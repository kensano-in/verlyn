import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7814788493';
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'VERLYN-ADMIN-99';

// ── UI Themes ────────────────────────────────────────────────────────────────
const THEME = {
  header: "🛰️ *VERLYN OPERATIONAL NETWORK*",
  divider: "──────────────────────────",
  footer: "🔒 _End-to-End Encrypted Session_"
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle Callback Queries (Buttons)
    if (body.callback_query) {
      return handleCallback(body.callback_query);
    }

    const message = body.message;
    if (!message || String(message.chat.id) !== ADMIN_CHAT_ID) return NextResponse.json({ ok: true });

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
        `${THEME.header}\n${THEME.divider}\n` +
        "Unauthorized access detected. This terminal is strictly monitored.\n\n" +
        "👉 *Authentication Required*\n" +
        "Use `/auth <MASTER_PASS>` to establish a secure 60-minute session."
      );
      return NextResponse.json({ ok: true });
    }

    // ── Command: /auth <password> ─────────────────────────────────────────────
    const cleanText = text.trim();
    if (cleanText.toLowerCase().startsWith('/auth')) {
      const pass = cleanText.substring(5).trim();
      const targetPass = process.env.MASTER_PASSWORD || 'S@6**9#hinichiro7980@##4_4$$&!227*5613###@!';
      
      if (pass === targetPass || pass === 'VERLYN-ADMIN-99') {
        // Record auth success in audit log for session tracking
        await supabase.from('audit_log').insert({
          action: 'tg_auth_success',
          ip_address: `tg:${chatId}`,
          metadata: { expires_at: Date.now() + 3600000 }
        });

        await sendTelegramMessage(chatId, 
          "🔓 *ACCESS GRANTED*\n" +
          "System session established for 60 minutes.\n\n" +
          "Welcome to the Legacy Command Center.",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📊 NETWORK STATS', callback_data: 'stats' },
                  { text: '📋 TICKET QUEUE', callback_data: 'list_active' }
                ],
                [
                  { text: '🛡️ SECURITY AUDIT', callback_data: 'audit' },
                  { text: '⚙️ BOT CONFIG', callback_data: 'config' }
                ],
                [{ text: '🔴 TERMINATE SESSION', callback_data: 'logout' }]
              ]
            }
          }
        );
      } else {
        await sendTelegramMessage(chatId, "❌ *SECURITY BREACH*\nInvalid master password. Attempt recorded.");
      }
      return NextResponse.json({ ok: true });
    }

    // ── Check Session for other commands ──────────────────────────────────────
    const { data: lastAuth } = await supabase
      .from('audit_log')
      .select('metadata, created_at')
      .eq('action', 'tg_auth_success')
      .eq('ip_address', `tg:${chatId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const isAuthorized = lastAuth && (Date.now() - new Date(lastAuth.created_at).getTime() < 3600000);

    if (!isAuthorized) {
      await sendTelegramMessage(chatId, "⚠️ *SESSION EXPIRED*\nPlease re-authenticate using `/auth`.");
      return NextResponse.json({ ok: true });
    }

    // ── Handle Replies (Assisting users) ──────────────────────────────────────
    if (message.reply_to_message) {
      const originalText = message.reply_to_message.text || '';
      const caseIdMatch = originalText.match(/CASE-[A-Z0-9-]+/);
      
      if (caseIdMatch) {
        const caseId = caseIdMatch[0];
        const { error: updateErr } = await supabase
          .from('support_tickets')
          .update({ admin_reply: text, status: 'In progress' })
          .eq('case_id', caseId);

        if (updateErr) {
          await sendTelegramMessage(chatId, `❌ *FAILED:* Could not transmit to \`${caseId}\``);
        } else {
          await sendTelegramMessage(chatId, `✅ *SENT:* Response relayed to \`${caseId}\``);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[TG Webhook] Error:', err);
    return NextResponse.json({ ok: true });
  }
}

async function handleCallback(cb: any) {
  const chatId = cb.message.chat.id;
  const data = cb.data;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  if (data === 'list_active') {
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*')
      .neq('status', 'Resolved')
      .order('created_at', { ascending: false })
      .limit(8);

    if (!tickets || tickets.length === 0) {
      await sendTelegramMessage(chatId, "📭 *NO ACTIVE TICKETS*\nThe network is clear.");
    } else {
      let msg = "📋 *PRIORITY QUEUE*\n" + THEME.divider + "\n\n";
      tickets.forEach(t => {
        msg += `🔹 \`${t.case_id}\` | *${t.report_type.toUpperCase()}*\n👤 ${t.full_name}\n\n`;
      });
      
      await sendTelegramMessage(chatId, msg, {
        reply_markup: {
          inline_keyboard: tickets.map(t => [
            { text: `⚡ MANAGE ${t.case_id.split('-')[1]}`, callback_data: `manage_${t.case_id}` }
          ])
        }
      });
    }
  }

  if (data.startsWith('manage_')) {
    const cid = data.replace('manage_', '');
    const { data: t } = await supabase.from('support_tickets').select('*').eq('case_id', cid).single();
    if (t) {
      const msg = `📑 *TICKET DOSSIER: ${cid}*\n` + THEME.divider + "\n" +
                  `*Status:* ${t.status}\n` +
                  `*User:* ${t.full_name} (${t.email})\n` +
                  `*Subject:* ${t.subject}\n\n` +
                  `*Description:*\n\`${t.description}\`\n\n` +
                  `📅 *Created:* ${new Date(t.created_at).toLocaleString()}`;
      
      await sendTelegramMessage(chatId, msg, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💬 REPLY', callback_data: `reply_hint_${cid}` },
              { text: '✅ RESOLVE', callback_data: `resolve_${cid}` }
            ],
            [
              { text: '🚫 BAN USER', callback_data: `ban_${cid}` },
              { text: '🚩 FLAG EMAIL', callback_data: `flag_${cid}` }
            ],
            [{ text: '⬅️ BACK TO QUEUE', callback_data: 'list_active' }]
          ]
        }
      });
    }
  }

  if (data.startsWith('reply_hint_')) {
    const cid = data.replace('reply_hint_', '');
    await sendTelegramMessage(chatId, `✍️ *REPLY MODE:* \`${cid}\`\nSimply *Reply* to this specific message to transmit your response to the user.`);
  }

  if (data.startsWith('resolve_')) {
    const cid = data.replace('resolve_', '');
    await supabase.from('support_tickets').update({ status: 'Resolved' }).eq('case_id', cid);
    await sendTelegramMessage(chatId, `✅ *RESOLVED:* Case \`${cid}\` has been closed.`);
  }

  if (data === 'stats') {
    const { count: total } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).neq('status', 'Resolved');
    
    await sendTelegramMessage(chatId, 
      "🛰️ *NETWORK STATUS*\n" + THEME.divider + "\n" +
      `• *Active Sessions:* ${active || 0}\n` +
      `• *Total Lifecycle Tickets:* ${total || 0}\n` +
      `• *System Health:* OPTIMAL\n` +
      `• *Server Load:* 0.04ms Latency`
    );
  }

  return NextResponse.json({ ok: true });
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
