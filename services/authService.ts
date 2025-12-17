import { UserProfile } from "../types";

const USER_KEY = 'kare26_user_profile';

export const loginUser = (name: string, email: string): UserProfile => {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newUser: UserProfile = {
    name,
    email,
    targetRole: 'Software Engineer', // Default
    skills: '',
    joinedDate: Date.now(),
    avatarColor: randomColor
  };

  localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  return newUser;
};

export const logoutUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = (): UserProfile | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const updateUserProfile = (updatedData: Partial<UserProfile>): UserProfile | null => {
  const current = getCurrentUser();
  if (!current) return null;

  const updated = { ...current, ...updatedData };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
};
