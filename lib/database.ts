import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key-for-local-dev-only';

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
