import { CodingTestCase, JudgeResponse } from '@shared/types';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;

export const runCode = async (
  code: string,
  language: 'javascript' | 'python' | 'java' | 'c' | 'cpp',
  testCases: CodingTestCase[],
  mode: 'function' | 'stdin',
  functionName?: string,
): Promise<JudgeResponse> => {
  const resp = await fetch(getApiUrl('/api/judge/run'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language, testCases, mode, functionName }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Judge API failed with ${resp.status}. Ensure backend is running with npm run dev:all.`);
  }
  const json = await resp.json();
  if (json?.status === 'error' && json?.error) {
    throw new Error(json.error);
  }
  return json;
};

export const submitCodeToQueue = async (payload: {
  code: string;
  language: 'javascript' | 'python' | 'java' | 'c' | 'cpp';
  testCases: CodingTestCase[];
  mode: 'function' | 'stdin';
  functionName?: string;
  telemetry?: any;
}): Promise<{ jobId: string; status: string }> => {
  const resp = await fetch(getApiUrl('/api/judge/submit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`Queue submit failed (${resp.status})`);
  return resp.json();
};

export const getQueuedJudgeStatus = async (jobId: string): Promise<any> => {
  const resp = await fetch(getApiUrl(`/api/judge/status?id=${encodeURIComponent(jobId)}`));
  if (!resp.ok) throw new Error(`Queue status failed (${resp.status})`);
  return resp.json();
};

