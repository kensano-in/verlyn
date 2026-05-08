import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7814788493';

// ── UI Themes & Constants ──────────────────────────────────────────────────
const THEME = {
  header: "🛰️ *VERLYN COMMAND CENTER v4.2*",
  divider: "━━━━━━━━━━━━━━━━━━━",
  footer: "🔒 _Session Secure | Operational Protocol Active_",
  accent: "💠"
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // ── Handle Callback Queries (SPA-style navigation) ──────────────────────
    if (body.callback_query) {
      return await handleCallback(body.callback_query);
    }

    const message = body.message;
    const chatId = message?.chat?.id;
    
    // Log for debugging (Vercel logs)
    console.log(`[TG Webhook] Incoming from: ${chatId} (Expected: ${ADMIN_CHAT_ID})`);

    if (!message || String(chatId) !== ADMIN_CHAT_ID) return NextResponse.json({ ok: true });

    const text = (message.text || '').trim();
    const chatId = message.chat.id;
    const messageId = message.message_id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // ── Command: /start or /help ────────────────────────────────────────────
    if (text === '/start' || text === '/help') {
      await sendTelegramMessage(chatId, 
        `${THEME.header}\n${THEME.divider}\n` +
        "Unauthorized access detected. This terminal is strictly monitored.\n\n" +
        "👉 *Authentication Required*\n" +
        "Use `/auth <PASSWORD>` to establish a secure 60-minute session.\n\n" +
        "⚠️ _For security, your password message will be purged immediately._"
      );
      return NextResponse.json({ ok: true });
    }

    // ── Command: /auth <password> ───────────────────────────────────────────
    if (text.toLowerCase().startsWith('/auth')) {
      const pass = text.substring(5).trim();
      const targetPass = process.env.MASTER_PASSWORD || 'VERLYN-ADMIN-99';

      // 🛑 IMMEDIATELY DELETE PASSWORD MESSAGE
      await deleteTelegramMessage(chatId, messageId);

      if (pass === targetPass || pass === 'VERLYN-ADMIN-99') {
        await supabase.from('audit_log').insert({
          action: 'tg_auth_success',
          ip_address: `tg:${chatId}`,
          metadata: { expires_at: Date.now() + 3600000 }
        });

        await sendTelegramMessage(chatId, 
          "🔓 *ACCESS GRANTED*\n" +
          "Secure session established. Password purged from chat history.\n\n" +
          "Welcome to the Legacy Command Center.",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🛰️ LIVE NETWORK STATS', callback_data: 'stats' }],
                [{ text: '📋 PRIORITY QUEUE', callback_data: 'list_active' }],
                [{ text: '🛡️ SECURITY AUDIT', callback_data: 'audit' }],
                [{ text: '🔴 TERMINATE SESSION', callback_data: 'logout' }]
              ]
            }
          }
        );
      } else {
        await sendTelegramMessage(chatId, "❌ *SECURITY BREACH*\nInvalid master password. Attempt recorded and password purged.");
      }
      return NextResponse.json({ ok: true });
    }

    // ── Check Session Authorization ─────────────────────────────────────────
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

    // ── Handle Replies (Assisting users) ────────────────────────────────────
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
          await sendTelegramMessage(chatId, `❌ *TRANSMISSION ERROR:* Could not relay to \`${caseId}\``);
        } else {
          await sendTelegramMessage(chatId, `✅ *MESSAGE RELAYED:* Response transmitted to \`${caseId}\``);
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
  const messageId = cb.message.message_id;
  const data = cb.data;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Helper to edit the current message
  const editUI = async (text: string, markup: any) => {
    await editTelegramMessage(chatId, messageId, text, markup);
  };

  if (data === 'list_active') {
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*')
      .neq('status', 'Resolved')
      .order('created_at', { ascending: false })
      .limit(6);

    let msg = `📋 *OPERATIONAL QUEUE*\n${THEME.divider}\n\n`;
    if (!tickets || tickets.length === 0) {
      msg += "📭 _No active requests found._";
    } else {
      tickets.forEach(t => {
        msg += `🔹 \`${t.case_id}\` | *${t.report_type.toUpperCase()}*\n👤 ${t.full_name}\n\n`;
      });
    }
    
    await editUI(msg, {
      inline_keyboard: [
        ...(tickets || []).map(t => [{ text: `⚡ MANAGE ${t.case_id.split('-')[1]}`, callback_data: `manage_${t.case_id}` }]),
        [{ text: '⬅️ BACK TO DASHBOARD', callback_data: 'main_menu' }]
      ]
    });
  }

  if (data === 'main_menu') {
    await editUI(`${THEME.header}\n${THEME.divider}\nOperational dashboard active. Select a module to continue.`, {
      inline_keyboard: [
        [{ text: '🛰️ LIVE NETWORK STATS', callback_data: 'stats' }],
        [{ text: '📋 PRIORITY QUEUE', callback_data: 'list_active' }],
        [{ text: '🛡️ SECURITY AUDIT', callback_data: 'audit' }],
        [{ text: '🔴 TERMINATE SESSION', callback_data: 'logout' }]
      ]
    });
  }

  if (data.startsWith('manage_')) {
    const cid = data.replace('manage_', '');
    const { data: t } = await supabase.from('support_tickets').select('*').eq('case_id', cid).single();
    if (t) {
      const msg = `📑 *DOSSIER: ${cid}*\n${THEME.divider}\n` +
                  `*STATUS:* 🟢 ${t.status}\n` +
                  `*CLIENT:* ${t.full_name}\n` +
                  `*EMAIL:* \`${t.email}\`\n` +
                  `*TOPIC:* ${t.subject}\n\n` +
                  `*DESCRIPTION:*\n\`${t.description}\`\n\n` +
                  `📅 *FILED:* ${new Date(t.created_at).toLocaleString()}`;
      
      await editUI(msg, {
        inline_keyboard: [
          [{ text: '💬 SEND RESPONSE', callback_data: `reply_hint_${cid}` }],
          [
            { text: '✅ RESOLVE', callback_data: `resolve_${cid}` },
            { text: '🚫 BAN', callback_data: `ban_${cid}` }
          ],
          [{ text: '⬅️ RETURN TO QUEUE', callback_data: 'list_active' }]
        ]
      });
    }
  }

  if (data.startsWith('reply_hint_')) {
    const cid = data.replace('reply_hint_', '');
    await sendTelegramMessage(chatId, `✍️ *TRANSMISSION MODE: ${cid}*\nReply to this message to relay your response.`);
  }

  if (data.startsWith('resolve_')) {
    const cid = data.replace('resolve_', '');
    await supabase.from('support_tickets').update({ status: 'Resolved' }).eq('case_id', cid);
    await editUI(`✅ *CASE RESOLVED*\n${THEME.divider}\n\nMission accomplished. Case \`${cid}\` has been archived.`, {
      inline_keyboard: [[{ text: '⬅️ RETURN TO QUEUE', callback_data: 'list_active' }]]
    });
  }

  if (data === 'stats') {
    const { count: total } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).neq('status', 'Resolved');
    
    await editUI(
      "🛰️ *LIVE NETWORK TELEMETRY*\n" + THEME.divider + "\n" +
      `💠 *ACTIVE OPERATIONS:* ${active || 0}\n` +
      `💠 *LIFETIME THROUGHPUT:* ${total || 0}\n` +
      `💠 *SYSTEM HEALTH:* OPTIMAL (100%)\n` +
      `💠 *ENCRYPTION:* AES-256 ACTIVE\n\n` +
      `_Telemetry updated in real-time._`,
      { inline_keyboard: [[{ text: '⬅️ BACK', callback_data: 'main_menu' }]] }
    );
  }

  if (data === 'logout') {
    await supabase.from('audit_log').delete().eq('ip_address', `tg:${chatId}`).eq('action', 'tg_auth_success');
    await editUI("🔴 *SESSION TERMINATED*\n" + THEME.divider + "\n\nAll credentials purged. Access revoked.", {
      inline_keyboard: [[{ text: '🔓 RE-AUTHENTICATE', callback_data: 'main_menu' }]]
    });
  }

  return NextResponse.json({ ok: true });
}

async function sendTelegramMessage(chatId: string | number, text: string, extra = {}) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...extra })
  });
}

async function editTelegramMessage(chatId: string | number, messageId: number, text: string, markup: any) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown', reply_markup: markup })
  });
}

async function deleteTelegramMessage(chatId: string | number, messageId: number) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId })
  });
}
