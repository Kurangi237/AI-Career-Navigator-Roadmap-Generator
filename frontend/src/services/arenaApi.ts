import type { CodingProblem } from '@shared/types';
import { getProblemById, listProblemSummaries } from './problemLibraryService';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export interface ArenaProblemSummary {
  id: string;
  uniqueId?: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  tags: string[];
  acceptanceRate?: number;
  submissionsCount?: number;
}

export interface ArenaContestSummary {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  difficulty: string;
  visibility: string;
}

export interface ArenaSubmission {
  id: string;
  user_id: string;
  problem_id: string;
  language: string;
  status: string;
  runtime_ms?: number;
  memory_used?: number;
  submitted_at: string;
}

const fallbackListProblems = (params: {
  page: number;
  pageSize: number;
  q: string;
  difficulty: 'All' | 'Easy' | 'Medium' | 'Hard';
}) => {
  const data = listProblemSummaries({
    page: params.page,
    pageSize: params.pageSize,
    query: params.q,
    difficulty: params.difficulty,
  });

  const items: ArenaProblemSummary[] = data.items.map((x) => ({
    id: x.id,
    title: x.title,
    slug: x.id,
    difficulty: x.difficulty,
    topic: x.topic,
    tags: x.tags,
  }));
  return { items, total: data.total };
};

export const listArenaProblems = async (params: {
  page: number;
  pageSize: number;
  q: string;
  difficulty: 'All' | 'Easy' | 'Medium' | 'Hard';
}) => {
  try {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      q: params.q,
      difficulty: params.difficulty,
    });
    const resp = await fetch(apiUrl(`/api/arena/problems/list?${query.toString()}`));
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return (await resp.json()) as { items: ArenaProblemSummary[]; total: number; page: number; pageSize: number };
  } catch {
    const fallback = fallbackListProblems(params);
    return { ...fallback, page: params.page, pageSize: params.pageSize };
  }
};

export const getArenaProblem = async (id: string): Promise<CodingProblem | null> => {
  try {
    const resp = await fetch(apiUrl(`/api/arena/problems/get?id=${encodeURIComponent(id)}`));
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return (await resp.json()) as CodingProblem;
  } catch {
    return getProblemById(id);
  }
};

export const listArenaSubmissions = async (userId: string): Promise<ArenaSubmission[]> => {
  try {
    const resp = await fetch(apiUrl(`/api/arena/submissions/list?userId=${encodeURIComponent(userId)}`));
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = (await resp.json()) as { items: ArenaSubmission[] };
    return json.items || [];
  } catch {
    return [];
  }
};

export const createArenaSubmission = async (payload: {
  userId: string;
  problemId: string;
  language: 'javascript' | 'python' | 'java' | 'c' | 'cpp';
  code: string;
  status: string;
  verdict?: string;
  runtimeMs?: number;
  memoryUsed?: number;
}) => {
  const resp = await fetch(apiUrl('/api/arena/submissions/create'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `HTTP ${resp.status}`);
  }
  return resp.json();
};

export const listArenaContests = async (): Promise<ArenaContestSummary[]> => {
  try {
    const resp = await fetch(apiUrl('/api/arena/contests/list'));
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = (await resp.json()) as { items: ArenaContestSummary[] };
    return json.items || [];
  } catch {
    return [];
  }
};

