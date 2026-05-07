import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local');
}

// Single shared client for all browser operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

// Admin client factory (server-side only)
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

// Channel registry to prevent duplicate subscriptions
const channelRegistry = new Map<string, RealtimeChannel>();

export function getOrCreateChannel(name: string): RealtimeChannel {
  if (channelRegistry.has(name)) {
    return channelRegistry.get(name)!;
  }
  const channel = supabase.channel(name);
  channelRegistry.set(name, channel);
  return channel;
}

export function removeChannel(name: string): void {
  const ch = channelRegistry.get(name);
  if (ch) {
    supabase.removeChannel(ch);
    channelRegistry.delete(name);
  }
}
