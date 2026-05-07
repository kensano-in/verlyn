import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 6-hour rate limit: max 1 report per IP per 6 hours
const rateLimitMap = new Map<string, number>(); // ip -> last_submitted_timestamp
const WINDOW_MS = 6 * 60 * 60 * 1000;

const SUBJECT_MIN_WORDS = 5;
const SUBJECT_MAX_CHARS = 120;
const DESC_MIN_WORDS    = 30;
const DESC_MAX_CHARS    = 1500;

const wordCount = (str: string) => str.trim().split(/\s+/).filter(Boolean).length;

// Simple spam pattern detector
const SPAM_PATTERNS = [/(.)\1{6,}/, /https?:\/\//i, /[A-Z]{15,}/];
const isSpam = (text: string) => SPAM_PATTERNS.some(p => p.test(text));

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    // 6-hour IP rate limit
    const lastSent = rateLimitMap.get(ip);
    if (lastSent && Date.now() - lastSent < WINDOW_MS) {
      const hoursLeft = Math.ceil((WINDOW_MS - (Date.now() - lastSent)) / 3600000);
      return NextResponse.json(
        { error: `You already submitted a report recently. Please wait ${hoursLeft} hour(s) before submitting again.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { fullName, email, subject, reportType, description, agreed } = body;

    if (!fullName?.trim() || !email?.trim() || !subject?.trim() || !reportType || !description?.trim() || !agreed) {
      return NextResponse.json({ error: 'All fields are required and terms must be accepted.' }, { status: 400 });
    }

    // Server-side word count validation
    const subjectWords = wordCount(subject);
    const descWords    = wordCount(description);

    if (subjectWords < SUBJECT_MIN_WORDS)
      return NextResponse.json({ error: `Subject needs at least ${SUBJECT_MIN_WORDS} words (you wrote ${subjectWords}).` }, { status: 400 });

    if (subject.length > SUBJECT_MAX_CHARS)
      return NextResponse.json({ error: `Subject is too long. Max ${SUBJECT_MAX_CHARS} characters.` }, { status: 400 });

    if (descWords < DESC_MIN_WORDS)
      return NextResponse.json({ error: `Description needs at least ${DESC_MIN_WORDS} words (you wrote ${descWords}). Please give us more detail so we can help you.` }, { status: 400 });

    if (description.length > DESC_MAX_CHARS)
      return NextResponse.json({ error: `Description is too long. Max ${DESC_MAX_CHARS} characters.` }, { status: 400 });

    // Spam pattern check
    if (isSpam(subject) || isSpam(description))
      return NextResponse.json({ error: 'Your report looks like spam. Please write a genuine description of your issue.' }, { status: 400 });

    // Email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });

    // Valid report type
    const VALID_TYPES = ['question', 'account', 'bug', 'suggestion', 'security'];
    if (!VALID_TYPES.includes(reportType))
      return NextResponse.json({ error: 'Invalid report type.' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const caseId = `CASE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const userAgent = req.headers.get('user-agent') ?? 'unknown';

    const { error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        case_id: caseId,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        report_type: reportType,
        description: description.trim(),
        ip_address: ip,
        user_agent: userAgent,
        status: 'Received'
      });

    if (error) {
      if (error.code === '42P01') {
        console.warn('support_tickets table missing. Please run the SQL migration.');
      } else {
        console.error('[Support API] DB error:', error.message);
        return NextResponse.json({ error: 'Failed to submit ticket. Please try again.' }, { status: 500 });
      }
    }

    // Mark IP as having submitted (only after successful insert)
    rateLimitMap.set(ip, Date.now());

    return NextResponse.json({
      success: true,
      case_id: caseId,
      status: 'Received',
      date_filed: new Date().toISOString()
    }, { status: 200 });

  } catch (err: any) {
    console.error('[Support API] Error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
