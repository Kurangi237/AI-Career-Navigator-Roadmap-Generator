import { CodeSubmissionRecord, PlagiarismCheckResult, UserProfile } from '@shared/types';
import { uuidv4 } from '../utils/uuid';

const KEY = 'KBV_code_submissions';

const read = (): CodeSubmissionRecord[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (items: CodeSubmissionRecord[]) => localStorage.setItem(KEY, JSON.stringify(items));

const tokenize = (src: string) =>
  src
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter(Boolean);

const jaccard = (a: string[], b: string[]) => {
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const token of sa) if (sb.has(token)) inter += 1;
  const union = new Set([...sa, ...sb]).size || 1;
  return inter / union;
};

const simpleDiff = (prev: string, curr: string): string[] => {
  const a = prev.split('\n').map((x) => x.trim()).filter(Boolean);
  const b = curr.split('\n').map((x) => x.trim()).filter(Boolean);
  const removed = a.filter((line) => !b.includes(line)).slice(0, 3).map((line) => `- ${line}`);
  const added = b.filter((line) => !a.includes(line)).slice(0, 3).map((line) => `+ ${line}`);
  return [...removed, ...added];
};

export const recordCodeSubmission = (
  user: UserProfile,
  payload: Omit<CodeSubmissionRecord, 'id' | 'userEmail' | 'createdAt'> & { code: string },
): { record: CodeSubmissionRecord; plagiarism: PlagiarismCheckResult } => {
  const all = read();
  const currentTokens = tokenize(payload.code);
  let best: CodeSubmissionRecord | null = null;
  let bestScore = 0;

  for (const row of all) {
    if (row.problemId !== payload.problemId) continue;
    if (row.userEmail === user.email) continue;
    const score = jaccard(currentTokens, tokenize(row.code));
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }

  const record: CodeSubmissionRecord = {
    id: uuidv4(),
    userEmail: user.email,
    createdAt: Date.now(),
    ...payload,
  };
  write([record, ...all]);

  const plagiarism: PlagiarismCheckResult = {
    flagged: bestScore >= 0.82,
    similarity: Math.round(bestScore * 100),
    matchedUser: best?.userEmail,
    matchedSubmissionId: best?.id,
    diffSummary: best ? simpleDiff(best.code, payload.code) : [],
  };
  return { record, plagiarism };
};

export const getSubmissionHistory = (problemId: string, userEmail?: string): CodeSubmissionRecord[] => {
  return read()
    .filter((x) => x.problemId === problemId && (!userEmail || x.userEmail === userEmail))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const getAllCodeSubmissions = (userEmail?: string): CodeSubmissionRecord[] => {
  return read()
    .filter((x) => (!userEmail || x.userEmail === userEmail))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const compareLastTwo = (problemId: string, userEmail: string): string[] => {
  const rows = getSubmissionHistory(problemId, userEmail);
  if (rows.length < 2) return [];
  return simpleDiff(rows[1].code, rows[0].code);
};

