// Use plain types to avoid requiring @vercel/node types in local dev
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  try {
    const key = process.env.GENAI_API_KEY;
    if (!key) return res.status(500).json({ error: 'GENAI_API_KEY not set' });

    const { history, message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'missing message' });

    const ai = new GoogleGenAI({ apiKey: key });

    const chat = ai.chats.create({ model: 'gemini-2.5-flash', history: history || [], config: { systemInstruction: "You are KARE26 Students AI, a helpful, encouraging, and knowledgeable career coach. Keep answers concise." } });

    const result = await chat.sendMessage({ message });
    res.status(200).json({ text: result.text || '' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'server error' });
  }
}
