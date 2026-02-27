import { Contest, ContestEntry, ContestProblem, ContestRoom, ContestStatus, ContestSubmission, ContestResult, LeaderboardRow, UserProfile } from '@shared/types';
import { uuidv4 } from '../utils/uuid';

const CONTEST_KEY = 'KBV_contests_v2';
const REG_KEY = 'KBV_contest_registrations_v2';
const SUB_KEY = 'KBV_contest_submissions_v2';
const ENTRY_KEY = 'KBV_contest_entries_v2';

type ContestRegistration = {
  contestId: string;
  userId: string;
  username: string;
  registeredAt: number;
};

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = <T>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));

const scoreByOrder = (order: number): 3 | 4 | 5 | 7 => {
  if (order === 1) return 3;
  if (order === 2) return 4;
  if (order === 3) return 5;
  return 7;
};

export const getContestStatus = (contest: Pick<Contest, 'startTime' | 'durationMinutes'>): ContestStatus => {
  const now = Date.now();
  const endTime = contest.startTime + contest.durationMinutes * 60 * 1000;
  if (now < contest.startTime) return 'upcoming';
  if (now >= contest.startTime && now < endTime) return 'live';
  return 'ended';
};

const hydrateContest = (contest: Contest): Contest => {
  const regs = read<ContestRegistration[]>(REG_KEY, []).filter((r) => r.contestId === contest.id);
  return {
    ...contest,
    status: getContestStatus(contest),
    registeredCount: regs.length,
  };
};

const sortContests = (items: Contest[]) => {
  return [...items].sort((a, b) => a.startTime - b.startTime);
};

export const createContest = (
  title: string,
  startTime: number,
  durationMinutes: number,
  problemIds: string[],
  createdBy: string,
): Contest => {
  const problems: ContestProblem[] = problemIds.slice(0, 4).map((problemId, idx) => ({
    problemId,
    order: (idx + 1) as 1 | 2 | 3 | 4,
    basePoints: scoreByOrder(idx + 1),
  }));
  const contest: Contest = {
    id: uuidv4(),
    title,
    startTime,
    durationMinutes,
    problems,
    status: 'upcoming',
    registeredCount: 0,
    createdBy,
  };
  const contests = read<Contest[]>(CONTEST_KEY, []);
  write(CONTEST_KEY, [...contests, contest]);
  return hydrateContest(contest);
};

export const listContests = (): Contest[] => {
  const contests = read<Contest[]>(CONTEST_KEY, []).map(hydrateContest);
  return sortContests(contests);
};

export const getUpcomingContests = (): Contest[] => {
  return listContests().filter((c) => c.status !== 'ended');
};

export const registerForContest = (userId: string, contestId: string, username: string): ContestRegistration => {
  const regs = read<ContestRegistration[]>(REG_KEY, []);
  const existing = regs.find((r) => r.contestId === contestId && r.userId === userId);
  if (existing) return existing;
  const row: ContestRegistration = {
    contestId,
    userId,
    username,
    registeredAt: Date.now(),
  };
  write(REG_KEY, [row, ...regs]);
  return row;
};

export const getRegisteredUsers = (contestId: string): ContestRegistration[] => {
  return read<ContestRegistration[]>(REG_KEY, [])
    .filter((r) => r.contestId === contestId)
    .sort((a, b) => a.registeredAt - b.registeredAt);
};

export const recordContestSubmission = (
  contestId: string,
  userId: string,
  username: string,
  problemId: string,
  status: ContestSubmission['status'],
  submittedAt = Date.now(),
): ContestSubmission => {
  const row: ContestSubmission = {
    id: uuidv4(),
    contestId,
    userId,
    problemId,
    status,
    submittedAt,
    penaltyApplied: status !== 'AC',
  };
  const all = read<ContestSubmission[]>(SUB_KEY, []);
  write(SUB_KEY, [row, ...all]);

  const regs = getRegisteredUsers(contestId);
  if (!regs.some((r) => r.userId === userId)) {
    registerForContest(userId, contestId, username);
  }

  return row;
};

const buildEntry = (contest: Contest, userId: string, username: string, rows: ContestSubmission[], virtual: boolean): ContestEntry => {
  const contestStart = contest.startTime;
  const byProblem = contest.problems.map((p) => {
    const attempts = rows
      .filter((r) => r.problemId === p.problemId)
      .sort((a, b) => a.submittedAt - b.submittedAt);
    const ac = attempts.find((a) => a.status === 'AC');
    const wrongSubmissions = ac
      ? attempts.filter((a) => a.submittedAt <= ac.submittedAt && a.status !== 'AC').length
      : attempts.filter((a) => a.status !== 'AC').length;
    return {
      problemId: p.problemId,
      solved: Boolean(ac),
      points: ac ? p.basePoints : 0,
      wrongSubmissions,
      solvedAt: ac ? Math.max(0, ac.submittedAt - contestStart) : undefined,
    };
  });

  const totalPoints = byProblem.reduce((sum, p) => sum + p.points, 0);
  const penaltyMinutes = byProblem.reduce((sum, p) => sum + p.wrongSubmissions * 5, 0);
  const finishTime = byProblem.reduce((max, p) => (p.solvedAt && p.solvedAt > max ? p.solvedAt : max), 0);
  const tiebreaker = finishTime + penaltyMinutes * 60 * 1000;

  return {
    id: uuidv4(),
    contestId: contest.id,
    userId,
    username,
    problemScores: byProblem,
    totalPoints,
    penaltyMinutes,
    finishTime,
    tiebreaker,
    submittedAt: Date.now(),
    virtual,
  };
};

export const buildLeaderboard = (contestId: string): LeaderboardRow[] => {
  const contest = listContests().find((c) => c.id === contestId);
  if (!contest) return [];
  const regs = getRegisteredUsers(contestId);
  const submissions = read<ContestSubmission[]>(SUB_KEY, []).filter((s) => s.contestId === contestId);
  const entries = regs.map((reg) => {
    const rows = submissions.filter((s) => s.userId === reg.userId);
    return buildEntry(contest, reg.userId, reg.username, rows, false);
  });

  const sorted = entries.sort((a, b) => (b.totalPoints - a.totalPoints) || (a.tiebreaker - b.tiebreaker));
  return sorted.map((entry, idx) => {
    const problemResults: LeaderboardRow['problemResults'] = {};
    entry.problemScores.forEach((p) => {
      problemResults[p.problemId] = {
        ac: p.solved,
        attempts: p.wrongSubmissions + (p.solved ? 1 : 0),
        solvedAt: p.solvedAt,
        points: p.points,
      };
    });
    return {
      rank: idx + 1,
      userId: entry.userId,
      username: entry.username,
      totalPoints: entry.totalPoints,
      penaltyMinutes: entry.penaltyMinutes,
      finishTime: entry.finishTime,
      tiebreaker: entry.tiebreaker,
      problemResults,
    };
  });
};

export const finalizeContestEntry = (contestId: string, userId: string, username: string, virtual = false): ContestEntry | null => {
  const contest = listContests().find((c) => c.id === contestId);
  if (!contest) return null;
  const rows = read<ContestSubmission[]>(SUB_KEY, [])
    .filter((s) => s.contestId === contestId && s.userId === userId);
  const entry = buildEntry(contest, userId, username, rows, virtual);
  const all = read<ContestEntry[]>(ENTRY_KEY, []);
  const filtered = all.filter((x) => !(x.contestId === contestId && x.userId === userId && x.virtual === virtual));
  write(ENTRY_KEY, [entry, ...filtered]);
  return entry;
};

export const getContestEntries = (contestId: string): ContestEntry[] => {
  return read<ContestEntry[]>(ENTRY_KEY, [])
    .filter((x) => x.contestId === contestId)
    .sort((a, b) => (b.totalPoints - a.totalPoints) || (a.tiebreaker - b.tiebreaker));
};

export const startVirtualContest = (contestId: string, user: UserProfile): Contest | null => {
  const original = listContests().find((c) => c.id === contestId);
  if (!original) return null;
  const copy: Contest = {
    id: `${contestId}:virtual:${user.email}`,
    title: `${original.title} (Virtual)`,
    startTime: Date.now(),
    durationMinutes: original.durationMinutes,
    problems: original.problems,
    status: 'live',
    registeredCount: 1,
    createdBy: user.email,
  };
  const contests = read<Contest[]>(CONTEST_KEY, []);
  const filtered = contests.filter((c) => c.id !== copy.id);
  write(CONTEST_KEY, [...filtered, copy]);
  registerForContest(user.email, copy.id, user.name);
  return copy;
};

export const subscribeContestLeaderboard = (contestId: string, onChange: (rows: LeaderboardRow[]) => void) => {
  const handler = () => onChange(buildLeaderboard(contestId));
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
};

// Legacy compatibility wrappers used by existing UI paths.
export const createContestRoom = async (
  user: UserProfile,
  name: string,
  durationMinutes: number,
  problemIds: string[],
): Promise<ContestRoom> => {
  const contest = createContest(name, Date.now(), durationMinutes, problemIds, user.email);
  registerForContest(user.email, contest.id, user.name);
  const end = contest.startTime + contest.durationMinutes * 60 * 1000;
  return {
    id: contest.id,
    name: contest.title,
    hostEmail: user.email,
    durationMinutes: contest.durationMinutes,
    problemIds: contest.problems.map((p) => p.problemId),
    startedAt: contest.startTime,
    endsAt: end,
  };
};

export const listContestRooms = async (): Promise<ContestRoom[]> => {
  return listContests().map((contest) => ({
    id: contest.id,
    name: contest.title,
    hostEmail: contest.createdBy,
    durationMinutes: contest.durationMinutes,
    problemIds: contest.problems.map((p) => p.problemId),
    startedAt: contest.startTime,
    endsAt: contest.startTime + contest.durationMinutes * 60 * 1000,
  }));
};

export const submitContestScore = async (
  roomId: string,
  user: UserProfile,
  solved: number,
  total: number,
  score: number,
): Promise<ContestResult> => {
  const row: ContestResult = {
    id: uuidv4(),
    contestId: roomId,
    userEmail: user.email,
    userName: user.name,
    solved,
    total,
    score,
    submittedAt: Date.now(),
  };
  const key = 'KBV_contest_entries_legacy';
  const all = read<ContestResult[]>(key, []);
  const filtered = all.filter((x) => !(x.contestId === roomId && x.userEmail === user.email));
  write(key, [row, ...filtered]);
  return row;
};

export const getRoomLeaderboard = async (roomId: string): Promise<ContestResult[]> => {
  return buildLeaderboard(roomId).map((row, i) => ({
    id: `${roomId}-${row.userId}-${i}`,
    contestId: roomId,
    userEmail: row.userId,
    userName: row.username,
    solved: Object.values(row.problemResults).filter((p) => p.ac).length,
    total: Object.keys(row.problemResults).length,
    score: row.totalPoints,
    submittedAt: Date.now() + row.tiebreaker,
  }));
};

export const subscribeRoomLeaderboard = (roomId: string, onChange: (rows: ContestResult[]) => void) => {
  const handler = () => {
    getRoomLeaderboard(roomId).then(onChange).catch(() => {});
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
};

