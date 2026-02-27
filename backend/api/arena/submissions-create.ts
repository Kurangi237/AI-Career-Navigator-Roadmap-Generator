import { getAdminClient } from '../../lib/database';

type SubmissionStatus = 'AC' | 'WA' | 'TLE' | 'RE' | 'CE' | 'pending';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const {
      userId,
      problemId,
      language,
      code,
      status,
      verdict,
      runtimeMs,
      memoryUsed,
    } = req.body || {};

    if (!userId || !problemId || !language || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const safeStatus: SubmissionStatus = status || 'pending';
    const client = getAdminClient();
    const { data, error } = await client
      .from('code_submissions')
      .insert([
        {
          user_id: userId,
          problem_id: problemId,
          language,
          code,
          status: safeStatus,
          verdict: verdict || null,
          runtime_ms: runtimeMs || null,
          memory_used: memoryUsed || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ item: data });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to create submission' });
  }
}
