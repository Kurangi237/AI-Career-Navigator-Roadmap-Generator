import { AdaptivePracticeItem, MentorReview, PracticeStats, PracticeSubmission, SubmissionStatus, UserProfile } from '@shared/types';
import { uuidv4 } from '../utils/uuid';

const LOCAL_KEYS = {
  submissions: 'KBV_practice_submissions',
  reviews: 'KBV_practice_reviews',
  adaptive: 'KBV_adaptive_history',
};

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getSubmissionsLocal = (): PracticeSubmission[] => readJson(LOCAL_KEYS.submissions, []);
const getReviewsLocal = (): MentorReview[] => readJson(LOCAL_KEYS.reviews, []);

const getDayKey = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const calcStreak = (timestamps: number[]): number => {
  if (!timestamps.length) return 0;
  const daySet = new Set(timestamps.map(getDayKey));
  const now = new Date();
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let streak = 0;
  while (daySet.has(getDayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const calcStatsFromSubmissions = (items: PracticeSubmission[]): PracticeStats => {
  const attempted = items.length;
  const solved = items.filter((x) => x.status === 'solved').length;
  const accuracy = attempted ? Math.round((solved / attempted) * 100) : 0;
  const streakDays = calcStreak(items.map((x) => x.createdAt));
  const today = getDayKey(Date.now());
  const todayItems = items.filter((x) => getDayKey(x.createdAt) === today);
  const todayXp = todayItems.reduce((sum, item) => {
    const base = item.status === 'solved' ? 80 : 35;
    const difficultyBoost = item.difficulty === 'Hard' ? 30 : item.difficulty === 'Medium' ? 15 : 5;
    return sum + base + difficultyBoost;
  }, 0);

  const topicMap = new Map<string, { attempted: number; solved: number }>();
  for (const item of items) {
    const curr = topicMap.get(item.topic) || { attempted: 0, solved: 0 };
    curr.attempted += 1;
    if (item.status === 'solved') curr.solved += 1;
    topicMap.set(item.topic, curr);
  }
  const weakTopics = [...topicMap.entries()]
    .map(([topic, data]) => ({
      topic,
      ratio: data.attempted ? data.solved / data.attempted : 0,
      attempts: data.attempted,
    }))
    .filter((x) => x.attempts >= 2)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 3)
    .map((x) => x.topic);

  return { attempted, solved, accuracy, streakDays, todayXp, weakTopics };
};

export const listSubmissions = async (user: UserProfile): Promise<PracticeSubmission[]> => {
  return getSubmissionsLocal().filter((x) => x.userEmail === user.email || user.role !== 'student');
};

export const createSubmission = async (
  user: UserProfile,
  input: Omit<PracticeSubmission, 'id' | 'createdAt' | 'userEmail'>,
): Promise<PracticeSubmission> => {
  const submission: PracticeSubmission = {
    id: uuidv4(),
    userEmail: user.email,
    createdAt: Date.now(),
    ...input,
  };

  const local = getSubmissionsLocal();
  writeJson(LOCAL_KEYS.submissions, [submission, ...local]);
  return submission;
};

export const updateSubmissionStatus = async (
  user: UserProfile,
  submissionId: string,
  status: SubmissionStatus,
): Promise<void> => {
  const local = getSubmissionsLocal().map((item) => {
    if (item.id !== submissionId) return item;
    if (user.role === 'student' && item.userEmail !== user.email) return item;
    return { ...item, status };
  });
  writeJson(LOCAL_KEYS.submissions, local);
};

export const listMentorReviews = async (_user: UserProfile): Promise<MentorReview[]> => {
  return getReviewsLocal();
};

export const createMentorReview = async (
  user: UserProfile,
  submissionId: string,
  comment: string,
  rating: 1 | 2 | 3 | 4 | 5,
): Promise<MentorReview> => {
  const review: MentorReview = {
    id: uuidv4(),
    submissionId,
    reviewerEmail: user.email,
    reviewerRole: user.role,
    comment,
    rating,
    createdAt: Date.now(),
  };
  const local = getReviewsLocal();
  writeJson(LOCAL_KEYS.reviews, [review, ...local]);
  return review;
};

export const getPracticeStats = async (user: UserProfile): Promise<PracticeStats> => {
  const submissions = await listSubmissions(user);
  const scoped = user.role === 'student' ? submissions.filter((x) => x.userEmail === user.email) : submissions;
  return calcStatsFromSubmissions(scoped);
};

export const getPracticeStatsSync = (userEmail: string): PracticeStats => {
  const submissions = getSubmissionsLocal().filter((x) => x.userEmail === userEmail);
  return calcStatsFromSubmissions(submissions);
};

export const saveAdaptivePlanSnapshot = (userEmail: string, items: AdaptivePracticeItem[]) => {
  const history = readJson<Record<string, AdaptivePracticeItem[]>>(LOCAL_KEYS.adaptive, {});
  history[userEmail] = items;
  writeJson(LOCAL_KEYS.adaptive, history);
};

export const getAdaptivePlanSnapshot = (userEmail: string): AdaptivePracticeItem[] => {
  const history = readJson<Record<string, AdaptivePracticeItem[]>>(LOCAL_KEYS.adaptive, {});
  return history[userEmail] || [];
};
