// Switch to serverless endpoints so keys stay secret on Vercel
import { AdaptivePracticeItem, RoadmapResponse, CourseResponse, SkillAnalysisResponse, JobRoleResponse } from '@shared/types';

const API_TIMEOUT_MS = 20000;
const MAX_RETRIES = 2;
const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getApiUrl = (path: string) => `${API_BASE_URL}/api/genai/${path}`;

const callApi = async (path: string, body: any) => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const resp = await fetch(getApiUrl(path), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': `${path}-${Date.now()}-${attempt}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!resp.ok) {
        const text = await resp.text();
        const trimmed = text.trim();
        const suffix = trimmed || (resp.status === 500
          ? 'API server may be down. Start `npm run dev:all` (or `npm run dev:api`).'
          : resp.statusText || 'Unknown API error');
        throw new Error(`GenAI proxy error: ${resp.status} ${suffix}`);
      }

      return resp.json();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(350 * (attempt + 1));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof Error) {
    if (/Failed to fetch|NetworkError|fetch failed/i.test(lastError.message)) {
      throw new Error('Unable to reach AI API. Start backend with `npm run dev:api` or `npm run dev:all`.');
    }
    throw lastError;
  }
  throw new Error('Unknown API error');
};

export const generateRoadmap = async (role: string, currentSkills: string, availability: string): Promise<RoadmapResponse> => {
  return callApi('roadmap', { role, currentSkills, availability }) as Promise<RoadmapResponse>;
};

export const getCourseRecommendations = async (role: string, level: string, budget: string): Promise<CourseResponse> => {
  return callApi('courses', { role, level, budget }) as Promise<CourseResponse>;
};

export const analyzeDocument = async (
  base64Data: string,
  mimeType: string,
  jobDescription?: string
): Promise<SkillAnalysisResponse> => {
  return callApi('analyze', { base64Data, mimeType, jobDescription }) as Promise<SkillAnalysisResponse>;
};

export const getJobRoleDetails = async (roleName: string): Promise<JobRoleResponse> => {
  return callApi('role', { roleName }) as Promise<JobRoleResponse>;
};

export const sendChatMessage = async (history: any[], message: string): Promise<string> => {
  const data = await callApi('chat', { history, message });
  return data.text || '';
};

export const getAdaptivePracticePlan = async (
  targetRole: string,
  weakTopics: string[],
  recentSubmissions: Array<{ topic: string; difficulty: string; status: string }>,
): Promise<AdaptivePracticeItem[]> => {
  const data = await callApi('adaptive-practice', { targetRole, weakTopics, recentSubmissions });
  return Array.isArray(data?.items) ? data.items : [];
};

