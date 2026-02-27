import { getAdminClient } from '../../lib/database';

export default async function handler(req: any, res: any) {
  try {
    const userId = `${req.query?.userId || ''}`.trim();
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit || 25)));
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const client = getAdminClient();
    const { data, error } = await client
      .from('code_submissions')
      .select('id, user_id, problem_id, language, status, runtime_ms, memory_used, submitted_at')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return res.status(200).json({ items: data || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to list submissions' });
  }
}
