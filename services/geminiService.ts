import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RoadmapResponse, CourseResponse, SkillAnalysisResponse, JobRoleResponse } from "../types";

// Helper to initialize client safely in both Vite and Node environments
const getClient = () => {
  let apiKey = '';
  
  // Try accessing via Vite's import.meta.env
  try {
    // @ts-ignore - Vite specific
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      apiKey = import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error if import.meta is not available
  }

  // Fallback to process.env for other environments
  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = process.env.API_KEY || '';
  }

  if (!apiKey) {
    console.error("API Key is missing. Make sure VITE_API_KEY is set in .env file.");
    throw new Error("API Key is missing");
  }

  return new GoogleGenAI({ apiKey });
};

// 1. Generate Career Roadmap
export const generateRoadmap = async (
  role: string,
  currentSkills: string,
  availability: string
): Promise<RoadmapResponse> => {
  const ai = getClient();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      role: { type: Type.STRING },
      duration_weeks: { type: Type.INTEGER },
      weekly_plan: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            week: { type: Type.INTEGER },
            topic: { type: Type.STRING },
            resources: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  link: { type: Type.STRING }
                }
              } 
            },
            project: { type: Type.STRING }
          }
        }
      }
    },
    required: ["role", "duration_weeks", "weekly_plan"]
  };

  const prompt = `
    Create a detailed career roadmap for a user wanting to become a ${role}.
    Current Skills: ${currentSkills}.
    Time Availability: ${availability}.
    
    Provide a structured weekly plan.
    
    CRITICAL LINK RULES (To prevent 404s):
    1. **GeeksforGeeks**: If you are not 100% sure of the exact article URL, use the search pattern: "https://www.geeksforgeeks.org/search?q=TOPIC+NAME".
    2. **JavaTPoint**: Use the main language index page (e.g., "https://www.javatpoint.com/java-tutorial") if specific topic links are risky.
    3. **W3Schools**: URLs are usually stable (e.g., "https://www.w3schools.com/java/").
    4. **YouTube**: ALWAYS use the search URL pattern: "https://www.youtube.com/results?search_query=TOPIC+NAME+tutorial".
    
    Example Resource format:
    Title: "Learn Arrays (GeeksforGeeks Search)"
    Link: "https://www.geeksforgeeks.org/search?q=Arrays+in+Java"
    
    Ensure all links start with https://.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const text = response.text || "{}";
  return JSON.parse(text) as RoadmapResponse;
};

// 2. Course Recommendations
export const getCourseRecommendations = async (
  role: string,
  level: string,
  budget: string
): Promise<CourseResponse> => {
  const ai = getClient();

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      courses: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            platform: { type: Type.STRING },
            duration: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            link: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      }
    },
    required: ["courses"]
  };

  const prompt = `
    Recommend top 10 best resources/courses for someone wanting to learn ${role}.
    Level: ${level}.
    Budget: ${budget}.
    
    CRITICAL SOURCE PREFERENCES:
    1. GeeksforGeeks (Articles/Courses)
    2. HackerRank (Practice)
    3. LeetCode (Practice)
    4. W3Schools (Tutorials)
    5. JavaTPoint (Tutorials)
    6. YouTube (Specific Playlists or Channels)
    
    LINK SAFETY RULES (PREVENT BROKEN LINKS):
    - **GeeksforGeeks**: Use "https://www.geeksforgeeks.org/search?q=TOPIC" if the specific article URL is complex.
    - **YouTube**: ALWAYS use "https://www.youtube.com/results?search_query=TOPIC+tutorial".
    - **General**: If unsure, link to the main documentation page or the platform's search page for that topic.
    
    Ensure the 'link' property is a valid, absolute URL (starting with http:// or https://).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  return JSON.parse(response.text || "{}") as CourseResponse;
};

// 3. Document Analysis (Multimodal)
export const analyzeDocument = async (
  base64Data: string,
  mimeType: string
): Promise<SkillAnalysisResponse> => {
  const ai = getClient();

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      skills_identified: { type: Type.ARRAY, items: { type: Type.STRING } },
      missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
      suggested_roles: { type: Type.ARRAY, items: { type: Type.STRING } },
      improvement_plan: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["skills_identified", "missing_skills", "suggested_roles", "improvement_plan"]
  };

  const prompt = `
    Analyze this document (Resume/Certificate/Syllabus).
    Identify current skills, missing critical skills for modern tech roles, suggested job roles, and a quick improvement plan.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  return JSON.parse(response.text || "{}") as SkillAnalysisResponse;
};

// 4. Job Role Intelligence
export const getJobRoleDetails = async (roleName: string): Promise<JobRoleResponse> => {
  const ai = getClient();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      role: { type: Type.STRING },
      overview: { type: Type.STRING },
      required_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
      salary_range: { type: Type.STRING },
      responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
      roadmap_summary: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["role", "overview", "required_skills", "salary_range", "responsibilities"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Explain the job role: ${roleName}. Include salary ranges (Global/US average), daily tasks, and skills.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || "{}") as JobRoleResponse;
};

// 5. Chat Assistant
export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
    const ai = getClient();
    
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: {
            systemInstruction: "You are KARE26 Students AI, a helpful, encouraging, and knowledgeable career coach. Keep answers concise. STRICTLY use plain text only. Do NOT use Markdown formatting (no asterisks *, no hashes #, no bolding). Use simple spacing and dashes for lists if needed.",
        }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I couldn't generate a response.";
};
