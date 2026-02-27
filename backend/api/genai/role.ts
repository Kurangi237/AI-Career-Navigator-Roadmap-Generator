// Use plain types to avoid requiring @vercel/node types in local dev
import { GoogleGenAI, Type, Schema } from '@google/genai';

export default async function handler(req: any, res: any) {
  try {
    const key = process.env.GENAI_API_KEY;
    if (!key) return res.status(500).json({ error: 'GENAI_API_KEY not set' });

    const { roleName } = req.body || {};
    if (!roleName) return res.status(400).json({ error: 'missing roleName' });

    const ai = new GoogleGenAI({ apiKey: key });

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
      required: ['role', 'overview', 'required_skills', 'salary_range', 'responsibilities']
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain the job role: ${roleName}. Include salary ranges (Global/US average), daily tasks, and skills.`,
      config: { responseMimeType: 'application/json', responseSchema: schema }
    });

    const payload = JSON.parse(response.text || '{}');
    res.status(200).json(payload);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'server error' });
  }
}
