import { UserProfile } from "../types";

const USER_KEY = 'kare26_user_profile';
const USERS_KEY = 'kare26_registered_users';

let supabase: any = null;
let isSupabase = false;
try {
  const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
  const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (SUPABASE_URL && SUPABASE_KEY) {
    // lazy require
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    isSupabase = true;
  }
} catch (e) {
  isSupabase = false;
}

interface RegisteredUser {
  email: string;
  password: string;
  name: string;
  createdAt: number;
  avatarImage?: string;
}

export const loginUser = (name: string, email: string, password: string): UserProfile => {
  // Check fixed demo credentials first
  const validCredentials = [
    { email: 'admin@kare26.com', password: 'password123', name: 'Admin User' },
    { email: 'student@kare26.com', password: 'student123', name: 'Student User' },
    { email: 'demo@kare26.com', password: 'demo123', name: 'Demo User' }
  ];

  const validDemoUser = validCredentials.find(cred => cred.email === email && cred.password === password);
  
  if (validDemoUser) {
    // Use the provided name if it matches the valid user's name, otherwise use the valid user's name
    const userName = name.trim() === validDemoUser.name ? name : validDemoUser.name;
    return createAndSaveUser(userName, email);
  }

  // Check registered users
  const registeredUsers = getRegisteredUsers();
  const registeredUser = registeredUsers.find(user => user.email === email && user.password === password);
  
  if (!registeredUser) {
    throw new Error('Invalid email or password');
  }

  return createAndSaveUser(registeredUser.name, email, registeredUser.avatarImage);
};

export const createUser = (name: string, email: string, password: string): UserProfile => {
  const registeredUsers = getRegisteredUsers();
  
  // Check if email already exists
  if (registeredUsers.some(user => user.email === email)) {
    throw new Error('Email already registered');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength (minimum 6 characters)
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Register the new user
  const newUser: RegisteredUser = {
    email,
    password,
    name: name.trim(),
    createdAt: Date.now()
  };

  registeredUsers.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(registeredUsers));

  // If Supabase configured, persist registered user record
  if (isSupabase && supabase) {
    try {
      supabase.from('users').insert({ email, name: newUser.name, password, created_at: newUser.createdAt });
    } catch (e) {
      console.error('Supabase create user error', e);
    }
  }

  return createAndSaveUser(name.trim(), email, newUser.avatarImage);
};

const createAndSaveUser = (name: string, email: string, avatarImage?: string): UserProfile => {
  // Check if user already exists in localStorage to preserve their data
  const existingUser = getCurrentUser();
  
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newUser: UserProfile = {
    name,
    email,
    targetRole: 'Software Engineer', // Default
    skills: '',
    joinedDate: Date.now(),
    avatarColor: randomColor,
    // Use provided avatarImage first, then existing, then undefined
    avatarImage: avatarImage || existingUser?.avatarImage || undefined
  };

  localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  if (isSupabase && supabase) {
    // upsert current user table entry for profile
    try {
      supabase.from('profiles').upsert({ email, name: newUser.name, avatar: avatarImage || null, joined_at: newUser.joinedDate });
    } catch (e) {
      console.error('Supabase upsert profile error', e);
    }
  }
  return newUser;
};

const getRegisteredUsers = (): RegisteredUser[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const logoutUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = (): UserProfile | null => {
  const data = localStorage.getItem(USER_KEY);
  if (data) return JSON.parse(data);

  // Optionally fetch from Supabase if configured (sync once)
  if (isSupabase && supabase) {
    // cannot be synchronous; return null and caller should re-check if needed
    return null;
  }
  return null;
};

export const updateUserProfile = (updatedData: Partial<UserProfile>): UserProfile | null => {
  const current = getCurrentUser();
  if (!current) return null;

  const updated = { ...current, ...updatedData };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));

  // Update registered users store if present (keep avatarImage & name in sync)
  const registeredUsers = getRegisteredUsers();
  const userIndex = registeredUsers.findIndex(user => user.email === updated.email);
  if (userIndex !== -1) {
    const ru = registeredUsers[userIndex];
    // update avatarImage and name when provided
    if (updated.avatarImage) ru.avatarImage = updated.avatarImage;
    if (updated.name) ru.name = updated.name;
    registeredUsers[userIndex] = ru;
    localStorage.setItem(USERS_KEY, JSON.stringify(registeredUsers));
  }

  // Update remote profile if available
  if (isSupabase && supabase) {
    try {
      supabase.from('profiles').update({ name: updated.name, avatar: updated.avatarImage }).eq('email', updated.email);
    } catch (e) {
      console.error('Supabase update profile error', e);
    }
  }

  return updated;
};
