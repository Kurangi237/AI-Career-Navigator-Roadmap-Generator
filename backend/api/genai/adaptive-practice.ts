import { GoogleGenAI, Schema, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  try {
    const key = process.env.GENAI_API_KEY;
    if (!key) return res.status(500).json({ error: 'GENAI_API_KEY not set' });

    const { targetRole, weakTopics, recentSubmissions } = req.body || {};
    if (!targetRole) return res.status(400).json({ error: 'missing targetRole' });

    const ai = new GoogleGenAI({ apiKey: key });
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
              reason: { type: Type.STRING },
            },
            required: ['title', 'topic', 'difficulty', 'reason'],
          },
        },
      },
      required: ['items'],
    };

    const prompt = [
      'Generate a concise adaptive coding practice plan for today.',
      `Target role: ${targetRole}`,
      `Weak topics: ${Array.isArray(weakTopics) && weakTopics.length ? weakTopics.join(', ') : 'None identified yet'}`,
      `Recent submissions: ${JSON.stringify(recentSubmissions || []).slice(0, 1200)}`,
      'Return exactly 5 items with realistic interview-style titles.',
      'Difficulty mix target: 1 easy, 3 medium, 1 hard.',
      'Each reason should explain why this problem improves weak areas.',
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const payload = JSON.parse(response.text || '{}');
    res.status(200).json(payload);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'server error' });
  }
}
