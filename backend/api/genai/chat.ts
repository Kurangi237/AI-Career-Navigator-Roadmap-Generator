// Use plain types to avoid requiring @vercel/node types in local dev
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  try {
    const key = process.env.GENAI_API_KEY;
    if (!key) return res.status(500).json({ error: 'GENAI_API_KEY not set' });

    const { history, message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'missing message' });

    const ai = new GoogleGenAI({ apiKey: key });

    const contents = [...(history || []), { role: 'user', parts: [{ text: message }] }];
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction:
          'You are a general-purpose AI assistant. Answer naturally and directly. If a query needs current information, use available web grounding when possible.',
        tools: [{ googleSearch: {} }],
      },
    });

    res.status(200).json({ text: result.text || '' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'server error' });
  }
}
