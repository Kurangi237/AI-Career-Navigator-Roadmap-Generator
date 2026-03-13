export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  ROADMAP = 'ROADMAP',
  COURSES = 'COURSES',
  RESUME = 'RESUME',
  CHAT = 'CHAT',
  ROLE_INTEL = 'ROLE_INTEL',
  SAVED_ITEMS = 'SAVED_ITEMS',
  CODING_ARENA = 'CODING_ARENA',
  JOB_SEARCH = 'JOB_SEARCH',
  PROFILE = 'PROFILE',
  PORTFOLIO = 'PORTFOLIO',
  ANALYTICS = 'ANALYTICS'
}

export type UserRole = 'admin' | 'mentor' | 'student';
export type SubscriptionPlan = 'starter' | 'pro' | 'business';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
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

export interface SavedResumeScan {
  id: string;
  fileName: string;
  analyzedAt: number;
  jdProvided: boolean;
  analysis: SkillAnalysisResponse;
}

export interface CourseResponse {
  courses: Course[];
}

export interface SkillAnalysisResponse {
  skills_identified: string[];
  missing_skills: string[];
  suggested_roles: string[];
  improvement_plan: string[];
  jd_match_score?: number;
  jd_feedback?: string[];
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
  platform: 'professional' | 'code_repo' | 'practice_profile' | 'learning_profile' | string;
  username: string;
  url: string;
}

export type SubmissionStatus = 'attempted' | 'solved';

export interface PracticeSubmission {
  id: string;
  userEmail: string;
  problemTitle: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: SubmissionStatus;
  notes?: string;
  createdAt: number;
}

export interface MentorReview {
  id: string;
  submissionId: string;
  reviewerEmail: string;
  reviewerRole: UserRole;
  comment: string;
  rating: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
}

export interface PracticeStats {
  attempted: number;
  solved: number;
  accuracy: number;
  streakDays: number;
  todayXp: number;
  weakTopics: string[];
}

export interface AdaptivePracticeItem {
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reason: string;
}

export interface CodingTestCase {
  input: any[];
  expected: any;
  explanation?: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  tags: string[];
  statement: string;
  constraints: string[];
  mode: 'function' | 'stdin';
  starterCode: {
    javascript: string;
    python: string;
    java: string;
    c: string;
    cpp: string;
  };
  functionName?: string;
  testCases: CodingTestCase[];
}

export interface ProblemSummary {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  tags: string[];
  source: 'catalog' | 'custom';
}

export interface JudgeCaseResult {
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
}

export interface JudgeResponse {
  passed: number;
  total: number;
  results: JudgeCaseResult[];
  status: 'accepted' | 'failed' | 'error';
  runtimeMs: number;
  error?: string;
  score?: number;
  antiCheat?: AntiCheatAssessment;
  verdict?: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded';
  failingCaseIndex?: number;
  percentileRuntime?: number;
  percentileMemory?: number;
  stdout?: string;
}

export interface ContestResult {
  id: string;
  contestId: string;
  userEmail: string;
  userName: string;
  solved: number;
  total: number;
  score: number;
  submittedAt: number;
}

export interface CompanySheet {
  id: string;
  company: string;
  roleTrack: string;
  problemIds: string[];
}

export interface ContestRoom {
  id: string;
  name: string;
  hostEmail: string;
  durationMinutes: number;
  problemIds: string[];
  startedAt: number;
  endsAt: number;
}

export type ContestStatus = 'upcoming' | 'live' | 'ended';

export interface ContestProblem {
  problemId: string;
  order: 1 | 2 | 3 | 4;
  basePoints: 3 | 4 | 5 | 7;
}

export interface Contest {
  id: string;
  title: string;
  startTime: number;
  durationMinutes: number;
  problems: ContestProblem[];
  status: ContestStatus;
  registeredCount: number;
  createdBy: string;
}

export interface ContestSubmission {
  id: string;
  userId: string;
  contestId: string;
  problemId: string;
  status: 'AC' | 'WA' | 'TLE' | 'RE';
  submittedAt: number;
  penaltyApplied: boolean;
  runtimeMs?: number;
}

export interface ContestProblemResult {
  ac: boolean;
  attempts: number;
  solvedAt?: number;
  points: number;
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  totalPoints: number;
  penaltyMinutes: number;
  finishTime: number;
  tiebreaker: number;
  delta?: number;
  problemResults: Record<string, ContestProblemResult>;
}

export interface ContestEntry {
  id: string;
  contestId: string;
  userId: string;
  username: string;
  problemScores: Array<{
    problemId: string;
    solved: boolean;
    points: number;
    wrongSubmissions: number;
    solvedAt?: number;
  }>;
  totalPoints: number;
  penaltyMinutes: number;
  finishTime: number;
  tiebreaker: number;
  submittedAt: number;
  virtual: boolean;
}

export interface CodeSubmissionRecord {
  id: string;
  problemId: string;
  userEmail: string;
  language: 'javascript' | 'python' | 'java' | 'c' | 'cpp';
  code: string;
  status: 'accepted' | 'failed' | 'error';
  passed: number;
  total: number;
  runtimeMs: number;
  createdAt: number;
  antiCheatRisk?: number;
  antiCheatFlags?: string[];
}

export interface PlagiarismCheckResult {
  flagged: boolean;
  similarity: number;
  matchedUser?: string;
  matchedSubmissionId?: string;
  diffSummary: string[];
}

export interface AntiCheatTelemetry {
  tabSwitches: number;
  pasteEvents: number;
  keyStrokes: number;
  avgKeyIntervalMs: number;
  focusLostMs: number;
  userAgentHash: string;
  sessionStartedAt: number;
  submittedAt: number;
}

export interface AntiCheatAssessment {
  riskScore: number;
  flags: string[];
  fingerprint: string;
}

export interface JudgeQueueJob {
  id: string;
  language: 'javascript' | 'python' | 'java' | 'c' | 'cpp';
  mode: 'function' | 'stdin';
  code: string;
  functionName?: string;
  testCases: CodingTestCase[];
  telemetry?: AntiCheatTelemetry;
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  result?: JudgeResponse;
  error?: string;
}

export interface EloRating {
  userEmail: string;
  rating: number;
  contestsPlayed: number;
  updatedAt: number;
}

export interface ProblemHintTier {
  tier: 1 | 2 | 3;
  label: string;
  content: string;
}

export interface ExamMcq {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  topic: string;
}

export interface ExamRoomConfig {
  id: string;
  title: string;
  mode: 'daily' | 'weekly' | 'custom';
  durationMinutes: 90 | 180 | number;
  codingProblemIds: string[];
  mcqCount: number;
  topics: string[];
  instructions: string[];
}

export interface ProctorIncident {
  id: string;
  examId: string;
  userEmail: string;
  type: 'tab_switch' | 'device_change' | 'multi_face' | 'mobile_detected' | 'focus_lost' | 'audio_missing' | 'camera_missing';
  severity: 'low' | 'medium' | 'high';
  details: string;
  timestamp: number;
}

