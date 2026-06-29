/**
 * POST /api/invite/send-otp
 *
 * Generates a secure 6-digit OTP, stores it hashed in DB, and delivers it
 * to the invitation's bound email address.
 *
 * Requires: valid vrl_acc_sess cookie at stage 'email_verified'.
 *
 * Security gates:
 *   1. CSRF header
 *   2. JWT verification + jti DB check
 *   3. Stage guard: must be 'email_verified'
 *   4. Rate limit: 3 OTP sends / hour / invitation
 *   5. Invalidate any prior unused OTPs for this invitation
 *   6. Generate OTP via crypto.randomInt, hash with bcrypt (12 rounds)
 *   7. Send via Resend to invitation's email (fetched from DB, not from client)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase';
import { audit } from '@/lib/audit';
import { rateLimit } from '@/lib/rateLimit';
import {
  verifyInviteJWT,
  extractInviteCookie,
  generateOtp,
  hashOtp,
  hashIp,
} from '@/lib/inviteSession';

// 3 OTP sends per hour per invitation
function otpSendLimiter(invId: string) {
  return rateLimit(`invite_otp_send:${invId}`, {
    limit:    3,
    windowMs: 60 * 60 * 1000,
    blockMs:  60 * 60 * 1000,
  });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          ?? req.headers.get('x-real-ip')
          ?? 'unknown';

  try {
    // ── 1. CSRF guard ────────────────────────────────────────────────────────
    if (req.headers.get('x-verlyn-request') !== '1') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── 2. JWT verification ──────────────────────────────────────────────────
    const token = extractInviteCookie(req.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyInviteJWT(token);
    } catch {
      return NextResponse.json({ error: 'Session invalid or expired.' }, { status: 401 });
    }

    // ── 3. Stage guard ───────────────────────────────────────────────────────
    if (payload.stage !== 'email_verified') {
      return NextResponse.json({ error: 'Invalid session stage.' }, { status: 400 });
    }

    // ── 4. jti DB check ──────────────────────────────────────────────────────
    const supabase = createAdminClient();
    const { data: session, error: sessErr } = await supabase
      .from('invitation_sessions')
      .select('id, expires_at')
      .eq('jti', payload.jti)
      .eq('invitation_id', payload.inv_id)
      .eq('stage', 'email_verified')
      .single();

    if (sessErr || !session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session not found or expired.' }, { status: 401 });
    }

    // ── 5. Rate limit by invitation ID ──────────────────────────────────────
    const rl = otpSendLimiter(payload.inv_id);
    if (!rl.allowed) {
      await audit({
        category: 'security', action: 'invite.otp.send_rate_limited',
        actor: hashIp(ip), target: payload.inv_id,
        severity: 'warn', success: false,
      });
      return NextResponse.json(
        { error: 'Too many verification code requests. Please wait before requesting another.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 3600) } },
      );
    }

    // ── 6. Fetch invitation email from DB (never from client) ────────────────
    const { data: invitation, error: invErr } = await supabase
      .from('invitations')
      .select('email, status')
      .eq('id', payload.inv_id)
      .single();

    if (invErr || !invitation) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }

    if (invitation.status !== 'active') {
      return NextResponse.json({ error: 'Invitation is no longer active.' }, { status: 400 });
    }

    // ── 7. Invalidate prior OTPs for this invitation ──────────────────────────
    await supabase
      .from('invitation_otps')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('invitation_id', payload.inv_id)
      .eq('used', false);

    // ── 8. Generate + hash OTP ───────────────────────────────────────────────
    const otp      = generateOtp();
    const otpHash  = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    const { error: otpInsertErr } = await supabase.from('invitation_otps').insert({
      invitation_id: payload.inv_id,
      otp_hash:      otpHash,
      expires_at:    expiresAt,
      ip_hash:       hashIp(ip),
    });

    if (otpInsertErr) {
      console.error('[invite/send-otp] OTP insert failed:', otpInsertErr);
      return NextResponse.json({ error: 'Internal error. Please try again.' }, { status: 500 });
    }

    // ── 9. Send OTP via Resend ───────────────────────────────────────────────
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: sendErr } = await resend.emails.send({
      from:    'Verlyn <noreply@verlyn.in>',
      to:      [invitation.email],
      subject: 'Your Verlyn Advance Access Verification Code',
      html:    buildOtpEmail(otp),
    });

    if (sendErr) {
      console.error('[invite/send-otp] Resend error:', sendErr);
      // Don't reveal email delivery failure details
      return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
    }

    await audit({
      category: 'auth', action: 'invite.otp.sent',
      actor: hashIp(ip), target: payload.inv_id,
      severity: 'info', success: true,
    });

    // Respond success — never include OTP or email in response
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[invite/send-otp]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function buildOtpEmail(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verlyn Verification Code</title>
</head>
<body style="margin:0;padding:0;background:#080808;font-family:'Inter',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#0f0f0f;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <p style="margin:0 0 24px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.3);font-weight:600;">
                Advance Access · Verification
              </p>
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                Email Verification Required
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;">
                We've sent this code to the email address registered to your invitation. 
                Enter it in the Verlyn Advance Access portal to continue.
              </p>
              <!-- OTP Display -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:32px;">
                    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(99,102,241,0.7);font-weight:600;">
                      Your Verification Code
                    </p>
                    <p style="margin:0;font-size:48px;font-weight:800;letter-spacing:0.18em;color:#ffffff;font-family:'Courier New',monospace;">
                      ${otp}
                    </p>
                    <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.3);">
                      Valid for <strong style="color:rgba(255,255,255,0.55);">10 minutes</strong> · Single use
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Warning -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.12);border-radius:8px;padding:16px 20px;">
                    <p style="margin:0;font-size:12px;color:rgba(239,68,68,0.7);line-height:1.6;">
                      <strong style="color:rgba(239,68,68,0.9);">Security notice:</strong> 
                      The Verlyn Engineering Team will never ask you to share this code. 
                      If you did not request this code, please disregard this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px 40px;border-top:1px solid rgba(255,255,255,0.05);margin-top:32px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;line-height:1.6;">
                Sent to you as part of the Verlyn Advance Access program.<br>
                This is an automated message — do not reply.<br>
                <span style="color:rgba(255,255,255,0.12);">© 2026 Verlyn · Secure Digital Infrastructure</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
