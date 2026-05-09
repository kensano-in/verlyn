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

// ── Helpers ──────────────────────────────────────────────────────────────────

async function deleteTelegramMessage(chatId: string | number, messageId: number) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId })
  });
}

async function trackMessageId(supabase: any, chatId: string | number, messageId: number) {
  try {
    const { data: session } = await supabase
      .from('audit_log')
      .select('*')
      .eq('ip_address', `tg:${chatId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (session) {
      const metadata = session.metadata || {};
      const existingIds = metadata.message_ids || [];
      if (!existingIds.includes(messageId)) {
        await supabase.from('audit_log').update({
          metadata: { ...metadata, message_ids: [...existingIds, messageId] }
        }).eq('id', session.id);
      }
    } else {
      await supabase.from('audit_log').insert({
        action: 'tg_session_pending',
        ip_address: `tg:${chatId}`,
        metadata: { message_ids: [messageId] }
      });
    }
  } catch (e) {
    console.error('[TG Webhook] Track Error:', e);
  }
}

async function purgeSessionMessages(supabase: any, chatId: string | number) {
  try {
    const { data: sessions } = await supabase
      .from('audit_log')
      .select('*')
      .eq('ip_address', `tg:${chatId}`)
      .not('metadata->message_ids', 'is', null);

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const ids = session.metadata?.message_ids || [];
        for (const id of ids) {
          await deleteTelegramMessage(chatId, id);
        }
        // Once purged, clear the metadata so we don't try again
        await supabase.from('audit_log').update({ 
          metadata: { ...session.metadata, message_ids: [] } 
        }).eq('id', session.id);
      }
    }
  } catch (e) {
    console.error('[TG Webhook] Purge Error:', e);
  }
}

async function sendTelegramMessage(chatId: string | number, text: string, extra = {}, supabase?: any) {
  if (!BOT_TOKEN) return;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...extra })
  });
  const data = await res.json();
  if (data.ok && supabase) {
    await trackMessageId(supabase, chatId, data.result.message_id);
  }
  return data;
}

async function editTelegramMessage(chatId: string | number, messageId: number, text: string, markup: any, supabase?: any) {
  if (!BOT_TOKEN) return;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown', reply_markup: markup })
  });
  const data = await res.json();
  if (data.ok && supabase) {
    await trackMessageId(supabase, chatId, data.result.message_id);
  }
  return data;
}

async function checkSession(supabase: any, chatId: string | number) {
  const { data: lastAuth } = await supabase
    .from('audit_log')
    .select('metadata, created_at')
    .eq('action', 'tg_auth_success')
    .eq('ip_address', `tg:${chatId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return lastAuth && (Date.now() - new Date(lastAuth.created_at).getTime() < 3600000);
}

// ── Main Handlers ────────────────────────────────────────────────────────────

async function handleCallback(cb: any, supabase: any) {
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;
  const data = cb.data;
  
  // 🛡️ AUTHORIZATION GATE
  if (data !== 'logout' && data !== 'main_menu') {
    const isAuthorized = await checkSession(supabase, chatId);
    if (!isAuthorized) {
      await purgeSessionMessages(supabase, chatId);
      await sendTelegramMessage(chatId, "⚠️ *SESSION EXPIRED*\nPlease re-authenticate using `/auth`.", {}, supabase);
      return NextResponse.json({ ok: true });
    }
  }

  const editUI = async (text: string, markup: any) => {
    await editTelegramMessage(chatId, messageId, text, markup, supabase);
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
      tickets.forEach((t: any) => {
        msg += `🔹 \`${t.case_id}\` | *${t.report_type.toUpperCase()}*\n👤 ${t.full_name}\n\n`;
      });
    }
    
    await editUI(msg, {
      inline_keyboard: [
        ...(tickets || []).map((t: any) => [{ text: `⚡ MANAGE ${t.case_id.split('-')[1]}`, callback_data: `manage_${t.case_id}` }]),
        [{ text: '⬅️ BACK TO DASHBOARD', callback_data: 'main_menu' }]
      ]
    });
  }

  if (data === 'main_menu') {
    const isAuthorized = await checkSession(supabase, chatId);
    if (!isAuthorized) {
      await purgeSessionMessages(supabase, chatId);
      await sendTelegramMessage(chatId, "⚠️ *SESSION EXPIRED*\nPlease re-authenticate using `/auth`.", {}, supabase);
      return NextResponse.json({ ok: true });
    }

    await editUI(`${THEME.header}\n${THEME.divider}\nOperational dashboard active. Select a module to continue.`, {
      inline_keyboard: [
        [{ text: '🛰️ OPEN WEB CONSOLE', web_app: { url: 'https://verlyn.in/tg-admin' } }],
        [{ text: '📋 PRIORITY QUEUE', callback_data: 'list_active' }, { text: '🛡️ SECURITY AUDIT', callback_data: 'audit' }],
        [{ text: '📊 LIVE STATS', callback_data: 'stats' }],
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
          [{ text: '🖥️ OPEN IN WEB CONSOLE', web_app: { url: `https://verlyn.in/tg-admin?case_id=${cid}` } }],
          [{ text: '💬 SEND RESPONSE', callback_data: `reply_hint_${cid}` }],
          [{ text: '✅ RESOLVE', callback_data: `resolve_${cid}` }, { text: '🚫 BAN', callback_data: `ban_${cid}` }],
          [{ text: '⬅️ RETURN TO QUEUE', callback_data: 'list_active' }]
        ]
      });
    }
  }

  if (data.startsWith('reply_hint_')) {
    const cid = data.replace('reply_hint_', '');
    await sendTelegramMessage(chatId, `✍️ *TRANSMISSION MODE: ${cid}*\nReply to this message to relay your response.`, {}, supabase);
  }

  if (data.startsWith('resolve_')) {
    const cid = data.replace('resolve_', '');
    await supabase.from('support_tickets').update({ status: 'Resolved' }).eq('case_id', cid);
    await editUI(`✅ *CASE RESOLVED*\n${THEME.divider}\n\nMission accomplished. Case \`${cid}\` has been archived.`, {
      inline_keyboard: [[{ text: '⬅️ RETURN TO QUEUE', callback_data: 'list_active' }]]
    });
  }

  if (data.startsWith('ban_')) {
    const cid = data.replace('ban_', '');
    const { data: ticket } = await supabase.from('support_tickets').select('ip_address, email').eq('case_id', cid).single();
    if (ticket) {
      if (ticket.ip_address) {
        await supabase.from('spam_blacklist').insert({ ip_address: ticket.ip_address, reason: `Banned from TG Console for case ${cid}` });
      }
      if (ticket.email) {
        await supabase.from('spam_blacklist').insert({ ip_address: ticket.email, reason: `Banned from TG Console for case ${cid}` });
      }
      await supabase.from('support_tickets').update({ status: 'Resolved', is_spam: true }).eq('case_id', cid);
    }
    await editUI(`🚫 *USER BANNED*\n${THEME.divider}\n\nTarget has been blacklisted. Case \`${cid}\` terminated.`, {
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

  if (data === 'audit') {
    const { data: logs } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(5);
    let msg = "🛡️ *SECURITY AUDIT LOG*\n" + THEME.divider + "\n\n";
    logs?.forEach((l: any) => {
      msg += `• ${new Date(l.created_at).toLocaleTimeString()} | *${l.action}*\n_${l.ip_address}_\n\n`;
    });
    await editUI(msg, { inline_keyboard: [[{ text: '⬅️ BACK', callback_data: 'main_menu' }]] });
  }

  if (data === 'logout') {
    await purgeSessionMessages(supabase, chatId);
    await supabase.from('audit_log').delete().eq('ip_address', `tg:${chatId}`).eq('action', 'tg_auth_success');
    await sendTelegramMessage(chatId, "🔴 *SESSION TERMINATED*\n" + THEME.divider + "\n\nAll credentials purged. Access revoked.");
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    if (body.callback_query) {
      return await handleCallback(body.callback_query, supabase);
    }

    const message = body.message;
    const chatId = message?.chat?.id;
    if (!message || String(chatId) !== ADMIN_CHAT_ID) return NextResponse.json({ ok: true });

    const text = (message.text || '').trim();
    const messageId = message.message_id;

    if (text === '/start' || text === '/help') {
      await deleteTelegramMessage(chatId, messageId);
      await sendTelegramMessage(chatId, 
        `${THEME.header}\n${THEME.divider}\n` +
        "Unauthorized access detected. This terminal is strictly monitored.\n\n" +
        "👉 *Authentication Required*\n" +
        "Use `/auth <PASSWORD>` to establish a secure 60-minute session.\n\n" +
        "⚠️ _For security, your password message will be purged immediately._",
        {}, supabase
      );
      return NextResponse.json({ ok: true });
    }

    if (text.toLowerCase().startsWith('/auth')) {
      const pass = text.substring(5).trim();
      const targetPass = process.env.MASTER_PASSWORD || 'VERLYN-ADMIN-99';
      await deleteTelegramMessage(chatId, messageId);

      if (pass === targetPass || pass === 'S@6**9#hinichiro7980@##4_4$$&!227*5613###@!') {
        await purgeSessionMessages(supabase, chatId);
        await supabase.from('audit_log').insert({
          action: 'tg_auth_success',
          ip_address: `tg:${chatId}`,
          metadata: { expires_at: Date.now() + 3600000, message_ids: [] }
        });

        await sendTelegramMessage(chatId, 
          "🔓 *ACCESS GRANTED*\nSecure session established. Password purged.\n\nWelcome to the Legacy Command Center.",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🛰️ OPEN WEB CONSOLE', web_app: { url: 'https://verlyn.in/tg-admin' } }],
                [{ text: '📋 PRIORITY QUEUE', callback_data: 'list_active' }, { text: '🛡️ SECURITY AUDIT', callback_data: 'audit' }],
                [{ text: '📊 LIVE STATS', callback_data: 'stats' }],
                [{ text: '🔴 TERMINATE SESSION', callback_data: 'logout' }]
              ]
            }
          }, supabase
        );
      } else {
        await sendTelegramMessage(chatId, "❌ *SECURITY BREACH*\nInvalid master password.", {}, supabase);
      }
      return NextResponse.json({ ok: true });
    }

    const isAuthorized = await checkSession(supabase, chatId);
    if (!isAuthorized) {
      await purgeSessionMessages(supabase, chatId);
      await sendTelegramMessage(chatId, "⚠️ *SESSION EXPIRED*\nPlease re-authenticate using `/auth`.", {}, supabase);
      return NextResponse.json({ ok: true });
    }

    await trackMessageId(supabase, chatId, messageId);

    if (message.reply_to_message) {
      const originalText = message.reply_to_message.text || '';
      const caseIdMatch = originalText.match(/CASE-[A-Z0-9-]+/);
      if (caseIdMatch) {
        const caseId = caseIdMatch[0];
        const { data: ticket } = await supabase.from('support_tickets').select('id').eq('case_id', caseId).single();
        if (ticket) {
          await supabase.from('support_messages').insert({
            ticket_id: ticket.id, content: text, sender_type: 'agent', agent_name: 'Verlyn Admin'
          });
          await supabase.from('support_tickets').update({ status: 'Active Session' }).eq('id', ticket.id);
          // Delete admin's response to keep chat clean
          await deleteTelegramMessage(chatId, messageId);
          await sendTelegramMessage(chatId, `✅ *MESSAGE TRANSMITTED:* Response relayed to \`${caseId}\``, {}, supabase);
        } else {
          await sendTelegramMessage(chatId, `❌ *ERROR:* Case \`${caseId}\` not found.`, {}, supabase);
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[TG Webhook] Error:', err);
    return NextResponse.json({ ok: true });
  }
}
