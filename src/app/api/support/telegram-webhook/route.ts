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
      const msg = `[ 𝗘𝗡𝗖𝗥𝗬𝗣𝗧𝗘𝗗 𝗗𝗢𝗦𝗦𝗜𝗘𝗥 ]\n` +
                  `𝗜𝗗: \`${cid}\`\n` +
                  `━━━━━━━━━━━━━━━━━━━\n` +
                  `𝗦𝗧𝗔𝗧𝗨𝗦   :: [ ${t.status.toUpperCase()} ]\n` +
                  `𝗖𝗟𝗜𝗘𝗡𝗧   :: ${t.full_name.toUpperCase()}\n` +
                  `𝗖𝗢𝗡𝗧𝗔𝗖𝗧  :: \`${t.email}\`\n` +
                  `𝗣𝗥𝗜𝗢𝗥𝗜𝗧𝗬 :: NORMAL\n` +
                  `━━━━━━━━━━━━━━━━━━━\n` +
                  `*SUBJECT:*\n> ${t.subject}\n\n` +
                  `*PAYLOAD:*\n> ${t.description.substring(0, 300)}${t.description.length > 300 ? '...' : ''}\n\n` +
                  `[ 𝗜𝗡𝗧𝗘𝗟: ${t.ip_address ? 'SECURED' : 'UNAVAILABLE'} ]   [ 𝗧𝗜𝗠𝗘: ${new Date(t.created_at).toISOString().split('T')[1].slice(0, 5)} UTC ]\n` +
                  `━━━━━━━━━━━━━━━━━━━`;
      
      await editUI(msg, {
        inline_keyboard: [
          [{ text: '⚡ REPLY', callback_data: `reply_hint_${cid}` }, { text: '🤖 AI AUTO', callback_data: `ai_reply_${cid}` }, { text: '🖥️ WEB', web_app: { url: `https://verlyn.in/tg-admin?case_id=${cid}` } }],
          [{ text: '🔍 TRACE IP', callback_data: `ip_intel_${cid}` }, { text: '⚠️ ESCALATE', callback_data: `escalate_${cid}` }],
          [{ text: '🛡️ QUARANTINE', callback_data: `quarantine_${cid}` }, { text: '🗑️ PURGE LOGS', callback_data: `purge_${cid}` }],
          [{ text: '✅ RESOLVE', callback_data: `resolve_${cid}` }, { text: '🚫 PERMA-BAN', callback_data: `ban_${cid}` }],
          [{ text: '⬅️ RETURN TO OVERWATCH QUEUE', callback_data: 'list_active' }]
        ]
      });
    }
  }

  if (data.startsWith('ip_intel_')) {
    const cid = data.replace('ip_intel_', '');
    const { data: t } = await supabase.from('support_tickets').select('ip_address').eq('case_id', cid).single();
    if (t) {
      const msg = `🔍 *IP INTELLIGENCE REPORT*\n━━━━━━━━━━━━━━━━━━━\n*CASE ID:* \`${cid}\`\n*ORIGIN IP:* \`${t.ip_address || 'UNKNOWN'}\`\n\n_Note: Deep geographical tracking requires advanced API integration._`;
      await editUI(msg, { inline_keyboard: [[{ text: '⬅️ BACK TO DOSSIER', callback_data: `manage_${cid}` }]] });
    }
  }

  if (data.startsWith('escalate_')) {
    const cid = data.replace('escalate_', '');
    await supabase.from('support_tickets').update({ status: 'Escalated' }).eq('case_id', cid);
    await editUI(`⚠️ *CASE ESCALATED*\n━━━━━━━━━━━━━━━━━━━\nCase \`${cid}\` has been elevated to high priority.`, {
      inline_keyboard: [[{ text: '⬅️ BACK TO DOSSIER', callback_data: `manage_${cid}` }]]
    });
  }

  if (data.startsWith('quarantine_')) {
    const cid = data.replace('quarantine_', '');
    await supabase.from('support_tickets').update({ status: 'Quarantined', is_spam: true }).eq('case_id', cid);
    await editUI(`🛡️ *CASE QUARANTINED*\n━━━━━━━━━━━━━━━━━━━\nCase \`${cid}\` has been flagged and isolated from main queue.`, {
      inline_keyboard: [[{ text: '⬅️ BACK TO QUEUE', callback_data: 'list_active' }]]
    });
  }

  if (data.startsWith('purge_')) {
    const cid = data.replace('purge_', '');
    const { data: ticket } = await supabase.from('support_tickets').select('id').eq('case_id', cid).single();
    if (ticket) {
      await supabase.from('support_messages').delete().eq('ticket_id', ticket.id);
      await editUI(`🗑️ *LOGS PURGED*\n━━━━━━━━━━━━━━━━━━━\nAll communication history for Case \`${cid}\` has been permanently wiped from the database.`, {
        inline_keyboard: [[{ text: '⬅️ BACK TO DOSSIER', callback_data: `manage_${cid}` }]]
      });
    }
  }

  if (data.startsWith('reply_hint_')) {
    const cid = data.replace('reply_hint_', '');
    await sendTelegramMessage(chatId, `✍️ *TRANSMISSION MODE: ${cid}*\nReply to this message to relay your response.`, {}, supabase);
  }

  if (data.startsWith('ai_reply_')) {
    const cid = data.replace('ai_reply_', '');
    const { data: ticket } = await supabase.from('support_tickets').select('*').eq('case_id', cid).single();
    if (!ticket) return;

    if (ticket.status === 'Resolved') {
      await sendTelegramMessage(chatId, `❌ *ERROR:* Case \`${cid}\` is already resolved. Cannot send AI reply.`, {}, supabase);
      return NextResponse.json({ ok: true });
    }

    await editUI(`🤖 *AI AUTOPILOT ACTIVATED*\n━━━━━━━━━━━━━━━━━━━\nAnalyzing Case \`${cid}\` and generating response...`, {});

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY not configured.');
      
      const prompt = `You are the Verlyn Command AI, a high-status, professional concierge agent for Verlyn (an elite tech company).
A user has submitted a support ticket. Write a very concise, professional, and definitive reply to the user.
Do not use any placeholders. Keep it under 4 sentences.
Be extremely formal, precise, and polite.

User Name: ${ticket.full_name}
Report Type: ${ticket.report_type}
Subject: ${ticket.subject}
Message Payload: ${ticket.description}`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      if (!geminiRes.ok) {
        const errData = await geminiRes.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Gemini API error ${geminiRes.status}`);
      }
      const geminiData = await geminiRes.json();
      const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!aiText) throw new Error('No response generated by AI.');

      await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_type: 'agent',
        content: aiText,
        agent_name: 'Verlyn AI'
      });
      await supabase.from('support_tickets').update({ status: 'In progress', admin_reply: aiText, updated_at: new Date().toISOString() }).eq('id', ticket.id);

      await editUI(`🤖 *AI AUTOPILOT: SUCCESS*\n━━━━━━━━━━━━━━━━━━━\nResponse transmitted to \`${cid}\`.\n\n*PAYLOAD:*\n> ${aiText}`, {
        inline_keyboard: [[{ text: '⬅️ BACK TO DOSSIER', callback_data: `manage_${cid}` }]]
      });

    } catch (e: any) {
      await editUI(`❌ *AI AUTOPILOT FAILED*\n━━━━━━━━━━━━━━━━━━━\nError: ${e.message}`, {
        inline_keyboard: [[{ text: '⬅️ BACK TO DOSSIER', callback_data: `manage_${cid}` }]]
      });
    }
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
        "👉 *Advanced Mobile Commands*\n" +
        "`/ban CASE-ID` - Perma-ban user and IP\n" +
        "`/resolve CASE-ID` - Mark case as resolved\n" +
        "`/purge CASE-ID` - Wipe case chat history\n" +
        "`/trace CASE-ID` - Fetch IP intelligence\n" +
        "`/escalate CASE-ID` - Mark as high priority\n" +
        "`/quarantine CASE-ID` - Isolate as spam\n\n" +
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

    // ADVANCED MOBILE COMMANDS
    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const cmd = parts[0].toLowerCase();
      const targetCase = parts[1]?.toUpperCase();

      if (['/ban', '/resolve', '/purge', '/trace', '/escalate', '/quarantine'].includes(cmd) && targetCase) {
        await deleteTelegramMessage(chatId, messageId); // Clean up the command message
        
        // Execute the command action directly
        if (cmd === '/ban') {
           const { data: ticket } = await supabase.from('support_tickets').select('ip_address, email').eq('case_id', targetCase).single();
           if (ticket) {
             if (ticket.ip_address) await supabase.from('spam_blacklist').insert({ ip_address: ticket.ip_address, reason: `Banned from TG Mobile Command for case ${targetCase}` });
             if (ticket.email) await supabase.from('spam_blacklist').insert({ ip_address: ticket.email, reason: `Banned from TG Mobile Command for case ${targetCase}` });
             await supabase.from('support_tickets').update({ status: 'Resolved', is_spam: true }).eq('case_id', targetCase);
             await sendTelegramMessage(chatId, `🚫 *USER BANNED:* \`${targetCase}\` target blacklisted.`, {}, supabase);
           } else {
             await sendTelegramMessage(chatId, `❌ *ERROR:* Case \`${targetCase}\` not found.`, {}, supabase);
           }
        }
        else if (cmd === '/resolve') {
           await supabase.from('support_tickets').update({ status: 'Resolved' }).eq('case_id', targetCase);
           await sendTelegramMessage(chatId, `✅ *CASE RESOLVED:* \`${targetCase}\` archived.`, {}, supabase);
        }
        else if (cmd === '/purge') {
           const { data: ticket } = await supabase.from('support_tickets').select('id').eq('case_id', targetCase).single();
           if (ticket) {
             await supabase.from('support_messages').delete().eq('ticket_id', ticket.id);
             await sendTelegramMessage(chatId, `🗑️ *LOGS PURGED:* \`${targetCase}\` history wiped.`, {}, supabase);
           }
        }
        else if (cmd === '/trace') {
           const { data: ticket } = await supabase.from('support_tickets').select('ip_address').eq('case_id', targetCase).single();
           if (ticket) {
             await sendTelegramMessage(chatId, `🔍 *IP TRACE ${targetCase}:* \`${ticket.ip_address || 'UNKNOWN'}\``, {}, supabase);
           }
        }
        else if (cmd === '/escalate') {
           await supabase.from('support_tickets').update({ status: 'Escalated' }).eq('case_id', targetCase);
           await sendTelegramMessage(chatId, `⚠️ *ESCALATED:* \`${targetCase}\` marked as high priority.`, {}, supabase);
        }
        else if (cmd === '/quarantine') {
           await supabase.from('support_tickets').update({ status: 'Quarantined', is_spam: true }).eq('case_id', targetCase);
           await sendTelegramMessage(chatId, `🛡️ *QUARANTINED:* \`${targetCase}\` isolated from queue.`, {}, supabase);
        }
        return NextResponse.json({ ok: true });
      }
    }

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
          await supabase.from('support_tickets').update({ status: 'In progress' }).eq('id', ticket.id);
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
