// Use plain types to avoid requiring @vercel/node types in local dev
import { GoogleGenAI, Type, Schema } from '@google/genai';

export default async function handler(req: any, res: any) {
  try {
    const key = process.env.GENAI_API_KEY;
    if (!key) return res.status(500).json({ error: 'GENAI_API_KEY not set' });

    const { role, level, budget } = req.body || {};
    if (!role) return res.status(400).json({ error: 'missing role' });

    const ai = new GoogleGenAI({ apiKey: key });

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        courses: { type: Type.ARRAY, items: { type: Type.OBJECT } }
      },
      required: ['courses']
    };

    const prompt = `Recommend top resources for ${role}. Level: ${level || 'any'}. Budget: ${budget || 'any'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema: schema }
    });

    const payload = JSON.parse(response.text || '{}');
    res.status(200).json(payload);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'server error' });
  }
}
