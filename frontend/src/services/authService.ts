import { UserProfile, UserRole, SubscriptionPlan } from '@shared/types';

const USER_KEY = 'KBV_user_profile';
const USERS_KEY = 'KBV_registered_users';
const LEGACY_USER_KEY = 'kare26_user_profile';
const LEGACY_USERS_KEY = 'kare26_registered_users';

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
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  createdAt: number;
  avatarImage?: string;
}

export const loginUser = (name: string, email: string, password: string): UserProfile => {
  const normalizedEmail = email.trim().toLowerCase();
  // Check fixed demo credentials first
  const validCredentials = [
    { email: 'admin@kbv.com', password: 'password123', name: 'Admin User', role: 'admin' as UserRole, subscriptionPlan: 'business' as SubscriptionPlan },
    { email: 'student@kbv.com', password: 'student123', name: 'Student User', role: 'student' as UserRole, subscriptionPlan: 'starter' as SubscriptionPlan },
    { email: 'demo@kbv.com', password: 'demo123', name: 'Mentor Demo', role: 'mentor' as UserRole, subscriptionPlan: 'pro' as SubscriptionPlan }
  ];

  const validDemoUser = validCredentials.find(cred => cred.email === normalizedEmail && cred.password === password);
  
  if (validDemoUser) {
    // Use the provided name if it matches the valid user's name, otherwise use the valid user's name
    const userName = name.trim() === validDemoUser.name ? name : validDemoUser.name;
    return createAndSaveUser(userName, normalizedEmail, validDemoUser.role, validDemoUser.subscriptionPlan);
  }

  // Check registered users
  const registeredUsers = getRegisteredUsers();
  const registeredUser = registeredUsers.find(user => user.email.toLowerCase() === normalizedEmail && user.password === password);
  
  if (!registeredUser) {
    throw new Error('Invalid email or password');
  }

  return createAndSaveUser(
    registeredUser.name,
    normalizedEmail,
    registeredUser.role || 'student',
    registeredUser.subscriptionPlan || 'starter',
    registeredUser.avatarImage
  );
};

export const createUser = (
  name: string,
  email: string,
  password: string,
  role: UserRole = 'student',
  subscriptionPlan: SubscriptionPlan = 'starter'
): UserProfile => {
  const normalizedEmail = email.trim().toLowerCase();
  const registeredUsers = getRegisteredUsers();
  
  // Check if email already exists
  if (registeredUsers.some(user => user.email.toLowerCase() === normalizedEmail)) {
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
    email: normalizedEmail,
    password,
    name: name.trim(),
    role,
    subscriptionPlan,
    createdAt: Date.now()
  };

  registeredUsers.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(registeredUsers));

  // If Supabase configured, persist registered user record
  if (isSupabase && supabase) {
    try {
      supabase.from('users').insert({
        email: normalizedEmail,
        name: newUser.name,
        role: newUser.role,
        subscription_plan: newUser.subscriptionPlan,
        password,
        created_at: newUser.createdAt
      });
    } catch (e) {
      console.error('Supabase create user error', e);
    }
  }

  return createAndSaveUser(name.trim(), normalizedEmail, newUser.role, newUser.subscriptionPlan, newUser.avatarImage);
};

const createAndSaveUser = (
  name: string,
  email: string,
  role: UserRole,
  subscriptionPlan: SubscriptionPlan,
  avatarImage?: string
): UserProfile => {
  // Check if user already exists in localStorage to preserve their data
  const existingUser = getCurrentUser();
  
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newUser: UserProfile = {
    name,
    email,
    role,
    subscriptionPlan,
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
      supabase.from('profiles').upsert({
        email,
        full_name: newUser.name,
        role: newUser.role,
        subscription_plan: newUser.subscriptionPlan,
        avatar_url: avatarImage || null,
        target_role: newUser.targetRole,
        skills: newUser.skills,
        joined_at: newUser.joinedDate
      });
    } catch (e) {
      console.error('Supabase upsert profile error', e);
    }
  }
  return newUser;
};

const getRegisteredUsers = (): RegisteredUser[] => {
  const data = localStorage.getItem(USERS_KEY) || localStorage.getItem(LEGACY_USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const logoutUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = (): UserProfile | null => {
  const data = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    return { role: 'student', subscriptionPlan: 'starter', ...parsed };
  }

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

  const updated: UserProfile = {
    ...current,
    ...updatedData,
    // Ensure critical fields are never lost
    email: current.email,
    role: updatedData.role || current.role,
    subscriptionPlan: updatedData.subscriptionPlan || current.subscriptionPlan,
    joinedDate: current.joinedDate,
    avatarColor: current.avatarColor,
  };

  try {
    // Save to primary key
    const serialized = JSON.stringify(updated);
    localStorage.setItem(USER_KEY, serialized);

    // Verify write was successful
    const verification = localStorage.getItem(USER_KEY);
    if (!verification) {
      console.error('localStorage write failed - verification failed');
      return null;
    }

    // Also update legacy key for backward compatibility
    try {
      localStorage.setItem(LEGACY_USER_KEY, serialized);
    } catch (e) {
      console.warn('Could not update legacy key', e);
    }

    // Update registered users store if present (keep avatarImage & name in sync)
    const registeredUsers = getRegisteredUsers();
    const userIndex = registeredUsers.findIndex(user => user.email === updated.email);
    if (userIndex !== -1) {
      const ru = registeredUsers[userIndex];
      // Update fields when provided
      if (updatedData.avatarImage !== undefined) ru.avatarImage = updatedData.avatarImage;
      if (updatedData.name !== undefined) ru.name = updatedData.name;
      if (updatedData.role !== undefined) ru.role = updatedData.role;
      if (updatedData.subscriptionPlan !== undefined) ru.subscriptionPlan = updatedData.subscriptionPlan;
      registeredUsers[userIndex] = ru;
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(registeredUsers));
      } catch (e) {
        console.warn('Could not update registered users', e);
      }
    }

    // Update remote profile if available
    if (isSupabase && supabase) {
      try {
        supabase.from('profiles').update({
          full_name: updated.name,
          avatar_url: updated.avatarImage || null,
          target_role: updated.targetRole,
          skills: updated.skills,
          role: updated.role,
          subscription_plan: updated.subscriptionPlan
        }).eq('email', updated.email).catch((e: any) => {
          console.warn('Supabase update failed', e);
        });
      } catch (e) {
        console.warn('Supabase update error', e);
      }
    }

    return updated;
  } catch (error) {
    console.error('updateUserProfile error:', error);
    return null;
  }
};

