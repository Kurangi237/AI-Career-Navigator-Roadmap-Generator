export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  ROADMAP = 'ROADMAP',
  COURSES = 'COURSES',
  RESUME = 'RESUME',
  CHAT = 'CHAT',
  ROLE_INTEL = 'ROLE_INTEL',
  SAVED_ITEMS = 'SAVED_ITEMS',
  JOB_SEARCH = 'JOB_SEARCH',
  PROFILE = 'PROFILE'
}

export interface UserProfile {
  name: string;
  email: string;
  targetRole: string;
  skills: string;
  joinedDate: number;
  avatarColor?: string;
  avatarImage?: string;
  socialMedia?: SocialMediaProfile[];
}

export interface Resource {
  title: string;
  link: string;
}

export interface WeeklyPlan {
  week: number;
  topic: string;
  resources: Resource[];
  project: string;
}

export interface RoadmapResponse {
  role: string;
  duration_weeks: number;
  weekly_plan: WeeklyPlan[];
}

export interface SavedRoadmap extends RoadmapResponse {
  id: string;
  timestamp: number;
}

export interface Course {
  title: string;
  platform: string;
  duration: string;
  difficulty: string;
  link: string;
  reason: string;
}

export interface SavedCourse extends Course {
  id: string;
  timestamp: number;
}

export interface CourseResponse {
  courses: Course[];
}

export interface SkillAnalysisResponse {
  skills_identified: string[];
  missing_skills: string[];
  suggested_roles: string[];
  improvement_plan: string[];
}

export interface JobRoleResponse {
  role: string;
  overview: string;
  required_skills: string[];
  salary_range: string;
  responsibilities: string[];
  roadmap_summary: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  type: 'course' | 'job' | 'linkedin' | 'system' | 'reminder';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: 'schedule' | 'deadline' | 'opportunity' | 'update';
}

export interface CourseSchedule {
  id: string;
  courseTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  reminderSent: boolean;
  completed: boolean;
}

export interface JobOpening {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  postedDate: string;
  source: 'linkedin' | 'career_page' | 'job_portal';
  link: string;
  saved: boolean;
}

export interface SocialMediaProfile {
  platform: 'linkedin' | 'github' | 'leetcode' | 'geeksforgeeks';
  username: string;
  url: string;
}

