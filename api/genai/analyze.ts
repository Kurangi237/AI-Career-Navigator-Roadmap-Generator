// Use plain types to avoid requiring @vercel/node types in local dev
import { GoogleGenAI, Type, Schema } from '@google/genai';

export default async function handler(req: any, res: any) {
  try {
    const key = process.env.GENAI_API_KEY;
    if (!key) return res.status(500).json({ error: 'GENAI_API_KEY not set' });

    const { base64Data, mimeType } = req.body || {};
    if (!base64Data || !mimeType) return res.status(400).json({ error: 'missing data' });

    const ai = new GoogleGenAI({ apiKey: key });

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        skills_identified: { type: Type.ARRAY, items: { type: Type.STRING } },
        missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggested_roles: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvement_plan: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['skills_identified', 'missing_skills', 'suggested_roles', 'improvement_plan']
    };

    const prompt = `Analyze this document. Identify current skills, missing skills, suggested roles, and an improvement plan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: 'application/json', responseSchema: schema }
    });

    const payload = JSON.parse(response.text || '{}');
    res.status(200).json(payload);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'server error' });
  }
}
