export const TOP_100_COMMANDS = [
  // ── CORE OPERATIONS ───────────────────────────────────────────────
  { command: 'help', description: 'Show all available command clusters' },
  { command: 'status', description: 'Global system health & latency report' },
  { command: 'uptime', description: 'Check server and process uptime' },
  { command: 'queue', description: 'View current active support queue' },
  { command: 'recent', description: 'List 5 most recent support cases' },
  { command: 'oldest', description: 'Identify oldest unresolved case' },
  { command: 'ping', description: 'Verify bot-to-server latency' },
  { command: 'version', description: 'View current system build version' },

  // ── CASE MANAGEMENT ───────────────────────────────────────────────
  { command: 'take', description: 'Assign the current case to yourself' },
  { command: 'resolve', description: 'Mark case as resolved and notify user' },
  { command: 'reply', description: 'Send response to the active case' },
  { command: 'assign', description: 'Hand case to specific agent (/assign email)' },
  { command: 'transcript', description: 'Fetch full chat history for a case' },
  { command: 'history', description: 'View all tickets from a specific user' },
  { command: 'reopen', description: 'Restore a resolved/closed case' },
  { command: 'priority', description: 'Set case priority (Low/Medium/High/P0)' },
  { command: 'tag', description: 'Add category tag to a case' },
  { command: 'note', description: 'Add internal admin note to case' },
  { command: 'filter', description: 'Filter tickets by status (e.g. /filter Resolved)' },

  // ── USER INTELLIGENCE ──────────────────────────────────────────────
  { command: 'whois', description: 'Fetch full dossier for a user email' },
  { command: 'ipcheck', description: 'Run forensics on a specific IP address' },
  { command: 'users', description: 'List 5 most recent preregistrations' },
  { command: 'waitlist', description: 'Check current waitlist metrics' },
  { command: 'registrations', description: 'Daily/Weekly registration breakdown' },
  { command: 'userinfo', description: 'Deep dive into user profile & metadata' },
  { command: 'vip_list', description: 'View all users in the VIP roster' },
  { command: 'vip_add', description: 'Promote a user to VIP status' },
  { command: 'vip_remove', description: 'Revoke VIP status from a user' },

  // ── THREAT & SPAM DEFENSE ─────────────────────────────────────────
  { command: 'threats', description: 'Generate active threat report (IP clusters)' },
  { command: 'dupes', description: 'Scan for duplicate/sockpuppet registrations' },
  { command: 'spamcheck', description: 'Analyze global spam metrics' },
  { command: 'blacklist', description: 'View last 10 entries in ban roster' },
  { command: 'ban', description: 'Permanently blacklist an IP/Email' },
  { command: 'unban', description: 'Restore access to a blacklisted entity' },
  { command: 'shadowban', description: 'Enable stealth-mode ban on IP' },
  { command: 'unshadow', description: 'Lift shadowban from an IP' },
  { command: 'lockdown', description: 'Emergency public API restriction' },
  { command: 'unlockdown', description: 'Restore public API availability' },
  { command: 'defcon', description: 'Set security state (1-5)' },
  { command: 'panic', description: 'Immediate termination of all global sessions' },

  // ── SYSTEM & DATABASE ─────────────────────────────────────────────
  { command: 'health', description: 'Detailed component health check' },
  { command: 'dbcheck', description: 'Run Postgres connectivity diagnostics' },
  { command: 'sessions', description: 'Count active administrative sessions' },
  { command: 'killsessions_all', description: 'Force logout all admin users' },
  { command: 'clear_cache', description: 'Purge Redis and Edge Cache layers' },
  { command: 'db_backup', description: 'Trigger manual DB snapshot' },
  { command: 'api_limits', description: 'View current global rate limits' },
  { command: 'cache_status', description: 'Check cache hit/miss ratio' },
  { command: 'cpu_load', description: 'Monitor Edge function CPU load' },
  { command: 'slow_queries', description: 'List DB queries exceeding 100ms' },

  // ── CONFIGURATION & FLAGS ─────────────────────────────────────────
  { command: 'config', description: 'View global system configuration' },
  { command: 'setconfig', description: 'Update system config key/value' },
  { command: 'ff_list', description: 'List all available feature flags' },
  { command: 'ff_enable', description: 'Enable a specific feature flag' },
  { command: 'ff_disable', description: 'Disable a specific feature flag' },
  { command: 'agentname', description: 'Update your display identity' },
  { command: 'ratelimit', description: 'Adjust IP-based rate thresholds' },

  // ── DEVOPS & INCIDENTS ────────────────────────────────────────────
  { command: 'logs', description: 'View latest 10 system error logs' },
  { command: 'tail_logs', description: 'Start streaming system logs (Live)' },
  { command: 'clear_logs', description: 'Wipe all volatile log tables' },
  { command: 'maint_start', description: 'Activate Maintenance Mode UI' },
  { command: 'maint_end', description: 'Restore platform availability' },
  { command: 'incident_start', description: 'Declare major outage incident' },
  { command: 'incident_resolve', description: 'Resolve active major outage' },
  { command: 'sev1', description: 'Declare SEV-1 failure (Critical)' },
  { command: 'pager_test', description: 'Verify paging system functionality' },
  { command: 'oncall_status', description: 'View current on-call rotation' },

  // ── AUDIT & COMPLIANCE ────────────────────────────────────────────
  { command: 'audit', description: 'Fetch latest 5 platform audit events' },
  { command: 'audit_user', description: 'Track all actions by specific user' },
  { command: 'audit_ip', description: 'Track all actions from specific IP' },
  { command: 'gdpr_wipe', description: 'Hard-delete all user data (Permanent)' },
  { command: 'privacy_status', description: 'Check platform compliance status' },
  { command: 'compliance_scan', description: 'Scan DB for unencrypted PII' },
  { command: 'tos_update', description: 'Force all users to re-accept Terms' },

  // ── COMMUNICATION ─────────────────────────────────────────────────
  { command: 'announce', description: 'Send platform announcement (Banner)' },
  { command: 'broadcast', description: 'Send global push notification' },
  { command: 'notify_vips', description: 'Message all VIP users specifically' },
  { command: 'alert', description: 'Trigger visual alert on frontend' },
  { command: 'motd', description: 'Update Message of the Day' },
  { command: 'tweet_publish', description: 'Publish alert to Twitter/X' },

  // ── KNOWLEDGE & TASKS ─────────────────────────────────────────────
  { command: 'kb_search', description: 'Search Internal Knowledge Base' },
  { command: 'kb_list', description: 'List all KB documentation entries' },
  { command: 'todo_list', description: 'View Admin Team task board' },
  { command: 'todo_add', description: 'Add task to the Admin Board' },
  { command: 'todo_done', description: 'Mark admin task as completed' },

  // ── UTILITY & FUN (ROOT LEVEL) ────────────────────────────────────
  { command: 'sudo', description: 'Execute as superuser' },
  { command: 'rm_rf', description: 'Fatal destruction protocol' },
  { command: 'matrix', description: 'Enter the Simulation' },
  { command: 'hack', description: 'Bypass the mainframe' },
  { command: 'shrug', description: '¯\\_(ツ)_/¯' },
  { command: 'coffee', description: 'Request digital caffeine' },
  { command: 'dice', description: 'Roll a D6' },
  { command: 'quote', description: 'Get a random tech quote' },
  { command: 'blame', description: 'Identify the DNS failure' }
];
