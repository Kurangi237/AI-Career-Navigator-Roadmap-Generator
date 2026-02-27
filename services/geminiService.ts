// Switch to serverless endpoints so keys stay secret on Vercel
import { RoadmapResponse, CourseResponse, SkillAnalysisResponse, JobRoleResponse } from "../types";

const callApi = async (path: string, body: any) => {
  const resp = await fetch(`/api/genai/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GenAI proxy error: ${resp.status} ${text}`);
  }
  return resp.json();
};

export const generateRoadmap = async (role: string, currentSkills: string, availability: string): Promise<RoadmapResponse> => {
  return callApi('roadmap', { role, currentSkills, availability }) as Promise<RoadmapResponse>;
};

export const getCourseRecommendations = async (role: string, level: string, budget: string): Promise<CourseResponse> => {
  return callApi('courses', { role, level, budget }) as Promise<CourseResponse>;
};

export const analyzeDocument = async (base64Data: string, mimeType: string): Promise<SkillAnalysisResponse> => {
  return callApi('analyze', { base64Data, mimeType }) as Promise<SkillAnalysisResponse>;
};

export const getJobRoleDetails = async (roleName: string): Promise<JobRoleResponse> => {
  return callApi('role', { roleName }) as Promise<JobRoleResponse>;
};

export const sendChatMessage = async (history: any[], message: string): Promise<string> => {
  const data = await callApi('chat', { history, message });
  return data.text || '';
};
