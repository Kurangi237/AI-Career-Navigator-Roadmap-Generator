import { getAdminClient } from '../../lib/database';

export default async function handler(_req: any, res: any) {
  try {
    const client = getAdminClient();
    const { data, error } = await client
      .from('contests')
      .select('id, title, start_time, end_time, difficulty, visibility')
      .order('start_time', { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.status(200).json({ items: data || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to list contests' });
  }
}
