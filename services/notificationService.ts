import { Notification } from '../types';

let supabase: any = null;
let isSupabase = false;

try {
  // Vite env vars
  const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
  const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (SUPABASE_URL && SUPABASE_KEY) {
    // lazy import to avoid build issues when not used
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    isSupabase = true;
  }
} catch (e) {
  // ignore - supabase not configured or package missing
  isSupabase = false;
}

const LOCAL_KEY = 'kare26_notifications';

export const isSupabaseEnabled = () => isSupabase;

export const fetchNotifications = async (userId?: string): Promise<Notification[]> => {
  if (!isSupabase || !supabase) {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  try {
    const qb = supabase.from('notifications').select('*');
    if (userId) qb.eq('user_id', userId);
    const { data, error } = await qb.order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      read: !!r.read,
      type: r.type,
      title: r.title,
      message: r.message,
      priority: r.priority,
      category: r.category,
      link: r.link,
    }));
  } catch (e) {
    console.error('Supabase fetch error', e);
    return [];
  }
};

export const saveNotification = async (n: Notification, userId?: string): Promise<void> => {
  if (!isSupabase || !supabase) {
    const raw = localStorage.getItem(LOCAL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LOCAL_KEY, JSON.stringify([n, ...arr]));
    return;
  }

  try {
    await supabase.from('notifications').upsert({
      id: n.id,
      user_id: userId || null,
      timestamp: n.timestamp,
      read: n.read,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      category: n.category,
      link: n.link,
    });
  } catch (e) {
    console.error('Supabase save error', e);
  }
};

export const markAsReadRemote = async (id: string): Promise<void> => {
  if (!isSupabase || !supabase) {
    const raw = localStorage.getItem(LOCAL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const updated = arr.map((x: Notification) => x.id === id ? { ...x, read: true } : x);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    return;
  }

  try {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  } catch (e) {
    console.error('Supabase mark read error', e);
  }
};

export const clearAllRemote = async (userId?: string): Promise<void> => {
  if (!isSupabase || !supabase) {
    localStorage.removeItem(LOCAL_KEY);
    return;
  }

  try {
    const qb = supabase.from('notifications');
    if (userId) qb.eq('user_id', userId);
    await qb.delete();
  } catch (e) {
    console.error('Supabase clear error', e);
  }
};

// Subscribe to realtime notifications (Supabase). Returns an unsubscribe function.
export const subscribeNotifications = (handler: (n: Notification) => void) => {
  if (!isSupabase || !supabase) return () => {};

  try {
    const channel = supabase.channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: any) => {
        const r = payload.new;
        const notif: Notification = {
          id: r.id,
          timestamp: r.timestamp,
          read: !!r.read,
          type: r.type,
          title: r.title,
          message: r.message,
          priority: r.priority,
          category: r.category,
          link: r.link,
        };
        handler(notif);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, (payload: any) => {
        // For updates, we can send the updated row as well
        const r = payload.new;
        const notif: Notification = {
          id: r.id,
          timestamp: r.timestamp,
          read: !!r.read,
          type: r.type,
          title: r.title,
          message: r.message,
          priority: r.priority,
          category: r.category,
          link: r.link,
        };
        handler(notif);
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch (e) { /* ignore */ }
    };
  } catch (e) {
    console.error('Supabase subscribe error', e);
    return () => {};
  }
};

export default {
  isSupabaseEnabled,
  fetchNotifications,
  saveNotification,
  markAsReadRemote,
  clearAllRemote,
  subscribeNotifications,
};
