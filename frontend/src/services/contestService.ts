import { ContestResult, CodingProblem } from '@shared/types';
import { uuidv4 } from '../utils/uuid';

const KEY = 'KBV_contest_results';

const read = (): ContestResult[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (items: ContestResult[]) => localStorage.setItem(KEY, JSON.stringify(items));

export const saveContestResult = (
  contestId: string,
  userEmail: string,
  userName: string,
  solved: number,
  total: number,
  score: number,
) => {
  const result: ContestResult = {
    id: uuidv4(),
    contestId,
    userEmail,
    userName,
    solved,
    total,
    score,
    submittedAt: Date.now(),
  };
  const all = [result, ...read()];
  write(all);
  return result;
};

export const getLeaderboard = (contestId?: string): ContestResult[] => {
  const items = read();
  const filtered = contestId ? items.filter((x) => x.contestId === contestId) : items;
  return filtered.sort((a, b) => (b.score - a.score) || (a.submittedAt - b.submittedAt)).slice(0, 20);
};

export const getContestProblemSet = (problems: CodingProblem[], allowHard: boolean): CodingProblem[] => {
  const pool = allowHard ? problems : problems.filter((p) => p.difficulty !== 'Hard');
  const easy = pool.find((p) => p.difficulty === 'Easy');
  const medium = pool.find((p) => p.difficulty === 'Medium');
  const hard = pool.find((p) => p.difficulty === 'Hard') || medium;
  return [easy, medium, hard].filter(Boolean) as CodingProblem[];
};

