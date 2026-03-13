import { UserProfile, UserRole, SubscriptionPlan } from '@shared/types';

const USER_KEY = 'KBV_user_profile';
const USERS_KEY = 'KBV_registered_users';
const LEGACY_USER_KEY = 'kare26_user_profile';
const LEGACY_USERS_KEY = 'kare26_registered_users';

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
  const validCredentials = [
    { email: 'admin@kbv.com', password: 'password123', name: 'Admin User', role: 'admin' as UserRole, subscriptionPlan: 'business' as SubscriptionPlan },
    { email: 'student@kbv.com', password: 'student123', name: 'Student User', role: 'student' as UserRole, subscriptionPlan: 'starter' as SubscriptionPlan },
    { email: 'demo@kbv.com', password: 'demo123', name: 'Mentor Demo', role: 'mentor' as UserRole, subscriptionPlan: 'pro' as SubscriptionPlan }
  ];

  const validDemoUser = validCredentials.find((cred) => cred.email === normalizedEmail && cred.password === password);
  if (validDemoUser) {
    const userName = name.trim() === validDemoUser.name ? name : validDemoUser.name;
    return createAndSaveUser(userName, normalizedEmail, validDemoUser.role, validDemoUser.subscriptionPlan);
  }

  const registeredUsers = getRegisteredUsers();
  const registeredUser = registeredUsers.find((user) => user.email.toLowerCase() === normalizedEmail && user.password === password);
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

  if (registeredUsers.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Email already registered');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

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

  return createAndSaveUser(name.trim(), normalizedEmail, newUser.role, newUser.subscriptionPlan, newUser.avatarImage);
};

const createAndSaveUser = (
  name: string,
  email: string,
  role: UserRole,
  subscriptionPlan: SubscriptionPlan,
  avatarImage?: string
): UserProfile => {
  const existingUser = getCurrentUser();
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newUser: UserProfile = {
    name,
    email,
    role,
    subscriptionPlan,
    targetRole: 'Software Engineer',
    skills: '',
    joinedDate: Date.now(),
    avatarColor: randomColor,
    avatarImage: avatarImage || existingUser?.avatarImage || undefined
  };

  localStorage.setItem(USER_KEY, JSON.stringify(newUser));
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
  return null;
};

export const updateUserProfile = (updatedData: Partial<UserProfile>): UserProfile | null => {
  const current = getCurrentUser();
  if (!current) return null;

  const updated: UserProfile = {
    ...current,
    ...updatedData,
    email: current.email,
    role: updatedData.role || current.role,
    subscriptionPlan: updatedData.subscriptionPlan || current.subscriptionPlan,
    joinedDate: current.joinedDate,
    avatarColor: current.avatarColor,
  };

  try {
    const serialized = JSON.stringify(updated);
    localStorage.setItem(USER_KEY, serialized);
    localStorage.setItem(LEGACY_USER_KEY, serialized);

    const registeredUsers = getRegisteredUsers();
    const userIndex = registeredUsers.findIndex((user) => user.email === updated.email);
    if (userIndex !== -1) {
      const ru = registeredUsers[userIndex];
      if (updatedData.avatarImage !== undefined) ru.avatarImage = updatedData.avatarImage;
      if (updatedData.name !== undefined) ru.name = updatedData.name;
      if (updatedData.role !== undefined) ru.role = updatedData.role;
      if (updatedData.subscriptionPlan !== undefined) ru.subscriptionPlan = updatedData.subscriptionPlan;
      registeredUsers[userIndex] = ru;
      localStorage.setItem(USERS_KEY, JSON.stringify(registeredUsers));
    }

    return updated;
  } catch (error) {
    console.error('updateUserProfile error:', error);
    return null;
  }
};
