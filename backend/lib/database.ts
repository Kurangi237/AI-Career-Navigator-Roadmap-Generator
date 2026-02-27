import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(url, anonKey || serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const getAdminClient = () => {
  if (!serviceKey) {
    return supabase;
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
