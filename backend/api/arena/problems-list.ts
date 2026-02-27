import { getAdminClient } from '../../lib/database';

const mapProblem = (row: any) => ({
  id: row.id,
  uniqueId: row.unique_id,
  title: row.title,
  slug: row.slug,
  difficulty: row.difficulty,
  topic: row.topic,
  tags: Array.isArray(row.tags) ? row.tags : [],
  acceptanceRate: row.acceptance_rate ?? 0,
  submissionsCount: row.submissions_count ?? 0,
});

export default async function handler(req: any, res: any) {
  try {
    const page = Math.max(1, Number(req.query?.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query?.pageSize || 25)));
    const q = `${req.query?.q || ''}`.trim();
    const difficulty = `${req.query?.difficulty || ''}`.trim();
    const topic = `${req.query?.topic || ''}`.trim();

    const client = getAdminClient();
    let query = client.from('problems').select('*', { count: 'exact' }).eq('visibility', 'public');

    if (difficulty && difficulty !== 'All') query = query.eq('difficulty', difficulty);
    if (topic && topic !== 'All') query = query.eq('topic', topic);
    if (q) query = query.ilike('title', `%${q}%`);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;

    return res.status(200).json({
      page,
      pageSize,
      total: count || 0,
      items: (data || []).map(mapProblem),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to list problems' });
  }
}
