import { NextResponse } from 'next/server';

const TOP_100_COMMANDS = [
  // Core Operations
  { command: 'help', description: 'Show all command clusters' },
  { command: 'status', description: 'System health & uptime' },
  { command: 'unresolved', description: 'List top 5 unresolved tickets' },
  { command: 'spam', description: 'View recent spam flag' },
  { command: 'ban', description: 'Ban a user (e.g., /ban case_id)' },
  { command: 'vip', description: 'List active VIPs' },
  { command: 'take', description: 'Assign case to yourself' },
  { command: 'shift_start', description: 'Clock in to support queue' },
  { command: 'shift_end', description: 'Clock out of support queue' },
  { command: 'escalate', description: 'Escalate case to L2' },

  // Batch 1
  { command: 'resolve', description: 'Mark case as resolved' },
  { command: 'close_spam', description: 'Close case as spam' },
  { command: 'vip_add', description: 'Add user to VIP roster' },
  { command: 'ip_block', description: 'Block an IP address' },
  { command: 'agent_handoff', description: 'Handoff case to another agent' },
  { command: 'canned_1', description: 'Send canned response 1' },
  { command: 'canned_2', description: 'Send canned response 2' },
  { command: 'canned_3', description: 'Send canned response 3' },
  { command: 'kb_search', description: 'Search Knowledge Base' },
  { command: 'task_add', description: 'Add task to Admin Board' },

  // Batch 2
  { command: 'task_list', description: 'List active Admin tasks' },
  { command: 'task_done', description: 'Mark admin task complete' },
  { command: 'feature_toggle', description: 'Toggle a feature flag' },
  { command: 'export_csv', description: 'Export support data' },
  { command: 'gdpr_wipe', description: 'Hard delete user data' },
  { command: 'session_kill', description: 'Kill user session' },
  { command: 'broadcast_all', description: 'Send global push alert' },
  { command: 'monthly_report', description: 'Generate SLA report' },
  { command: 'sentiment_scan', description: 'Scan DB for angry users' },
  { command: 'db_health', description: 'Run database diagnostics' },

  // Batch 3
  { command: 'cache_purge', description: 'Clear Redis/Vercel Cache' },
  { command: 'ssl_check', description: 'Verify SSL certificates' },
  { command: 'dns_check', description: 'Verify DNS propagation' },
  { command: 'db_backup', description: 'Trigger manual DB snapshot' },
  { command: 'reboot_edge', description: 'Simulate Edge node reboot' },
  { command: 'ban_domain', description: 'Block an entire email domain' },
  { command: 'whitelist_ip', description: 'Whitelist an IP address' },
  { command: 'rate_limit', description: 'Adjust global rate limit' },
  { command: 'kill_switch', description: 'Emergency API disable' },
  { command: 'revive_api', description: 'Re-enable API endpoints' },

  // Batch 4 (Audit & Crisis)
  { command: 'audit_user', description: 'Fetch user audit logs' },
  { command: 'audit_ip', description: 'Fetch IP audit logs' },
  { command: 'merge_cases', description: 'Merge two tickets' },
  { command: 'split_case', description: 'Split ticket into child' },
  { command: 'mark_duplicate', description: 'Close as duplicate' },
  { command: 'macro_refund', description: 'Trigger refund workflow' },
  { command: 'macro_escalate', description: 'P0 escalation workflow' },
  { command: 'sub_status', description: 'Check user billing plan' },
  { command: 'active_users', description: 'Check live WebSocket users' },
  { command: 'cpu_load', description: 'Check Edge CPU load' },

  { command: 'slow_queries', description: 'Audit DB performance' },
  { command: 'role_grant', description: 'Grant admin role' },
  { command: 'role_revoke', description: 'Revoke admin role' },
  { command: 'admin_list', description: 'View Admin roster' },
  { command: 'lockdown', description: 'Restrict public API endpoints' },
  { command: 'unlockdown', description: 'Restore public API' },
  { command: 'defcon', description: 'Set security DEFCON level' },
  { command: 'panic', description: 'Terminate all global sessions' },
  { command: 'maint_start', description: 'Enable maintenance mode' },
  { command: 'maint_end', description: 'Disable maintenance mode' },

  // Batch 5 (DevOps, Commerce, Gamification)
  { command: 'debug_on', description: 'Enable debug mode' },
  { command: 'debug_off', description: 'Disable debug mode' },
  { command: 'tail_logs', description: 'Tail system logs' },
  { command: 'clear_logs', description: 'Purge volatile logs' },
  { command: 'simulate_load', description: 'Run load test' },
  { command: 'stripe_sync', description: 'Sync Stripe webhooks' },
  { command: 'refund_all', description: 'Refund all recent (Locked)' },
  { command: 'discount_create', description: 'Generate promo code' },
  { command: 'subs_pause', description: 'Pause billing cycle' },
  { command: 'ai_train', description: 'Fine-tune AI model' },

  { command: 'ai_flush', description: 'Clear AI memory' },
  { command: 'ai_tone', description: 'Set AI response tone' },
  { command: 'geo_block', description: 'Block region via WAF' },
  { command: 'route_cdn', description: 'Route to Cloudflare Edge' },
  { command: 'oncall_status', description: 'Check primary on-call' },
  { command: 'oncall_page', description: 'Page on-call engineer' },
  { command: 'incident_start', description: 'Declare major outage' },
  { command: 'sev1', description: 'Declare SEV1 failure' },
  { command: 'tweet_publish', description: 'Publish alert to Twitter' },
  { command: 'discord_mute', description: 'Lock down Discord' },

  { command: 's3_size', description: 'Check storage buckets' },
  { command: 'cdn_purge', description: 'Invalidate CDN cache' },
  { command: 'db_vacuum_full', description: 'Run full Postgres vacuum' },
  { command: 'legal_hold', description: 'Freeze user data' },
  { command: 'dmca_takedown', description: 'Execute DMCA strike' },
  { command: 'soc2_report', description: 'Generate SOC2 report' },
  { command: 'points_add', description: 'Add community points' },
  { command: 'badge_award', description: 'Award profile badge' },
  { command: 'leaderboard', description: 'View top users' },
  { command: 'sudo', description: 'Niche Admin Joke' },

  { command: 'rm_rf', description: 'Fatal Destruction Joke' },
  { command: 'matrix', description: 'The Matrix Joke' },
  { command: 'hack', description: 'Mainframe Hacker Joke' },
  { command: 'blame', description: 'Its Always DNS Joke' }
];

export async function GET(req: Request) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is missing in env.' }, { status: 500 });
    }

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: TOP_100_COMMANDS
      })
    });

    const data = await response.json();

    if (data.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully registered Top 100 Commands to Telegram UI!',
        commands_registered: TOP_100_COMMANDS.length,
        note: 'The remaining 210+ commands will still work perfectly if typed out manually.'
      });
    } else {
      return NextResponse.json({ success: false, error: data }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
