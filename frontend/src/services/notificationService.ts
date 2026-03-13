import { Notification } from '@shared/types';

const LOCAL_KEY = 'AI_Career_notifications';
const PREF_KEY = 'AI_Career_notification_preferences';

export const updateNotificationPreferences = async (prefs: Record<string, any>): Promise<void> => {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs || {}));
};

export const getNotificationPreferences = async (): Promise<any> => {
  const raw = localStorage.getItem(PREF_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const isSupabaseEnabled = () => false;

export const fetchNotifications = async (_userId?: string): Promise<Notification[]> => {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveNotification = async (n: Notification, _userId?: string): Promise<void> => {
  const raw = localStorage.getItem(LOCAL_KEY);
  const arr = raw ? JSON.parse(raw) : [];
  localStorage.setItem(LOCAL_KEY, JSON.stringify([n, ...arr]));
};

export const markAsReadRemote = async (id: string): Promise<void> => {
  const raw = localStorage.getItem(LOCAL_KEY);
  const arr = raw ? JSON.parse(raw) : [];
  const updated = arr.map((x: Notification) => (x.id === id ? { ...x, read: true } : x));
  localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
};

export const clearAllRemote = async (_userId?: string): Promise<void> => {
  localStorage.removeItem(LOCAL_KEY);
};

export const subscribeNotifications = (_handler: (n: Notification) => void) => {
  return () => {};
};

export default {
  isSupabaseEnabled,
  fetchNotifications,
  saveNotification,
  markAsReadRemote,
  clearAllRemote,
  subscribeNotifications,
};