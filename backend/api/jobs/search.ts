type NormalizedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  link: string;
  posted_at: string;
  tags: string[];
};

const fromArbeitnow = async (query: string): Promise<NormalizedJob[]> => {
  const resp = await fetch('https://www.arbeitnow.com/api/job-board-api');
  if (!resp.ok) return [];
  const data: any = await resp.json();
  const items = Array.isArray(data?.data) ? data.data : [];
  const q = query.toLowerCase();
  return items
    .filter((j: any) => `${j.title} ${j.company_name} ${(j.tags || []).join(' ')}`.toLowerCase().includes(q))
    .slice(0, 20)
    .map((j: any) => ({
      id: `arbeitnow-${j.slug}`,
      title: j.title || 'Role',
      company: j.company_name || 'Company',
      location: j.location || 'Remote',
      source: 'Arbeitnow',
      link: j.url || '#',
      posted_at: j.created_at || new Date().toISOString(),
      tags: Array.isArray(j.tags) ? j.tags : [],
    }));
};

const fromRemotive = async (query: string): Promise<NormalizedJob[]> => {
  const resp = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`);
  if (!resp.ok) return [];
  const data: any = await resp.json();
  const items = Array.isArray(data?.jobs) ? data.jobs : [];
  return items.slice(0, 20).map((j: any) => ({
    id: `remotive-${j.id}`,
    title: j.title || 'Role',
    company: j.company_name || 'Company',
    location: j.candidate_required_location || 'Remote',
    source: 'Remotive',
    link: j.url || '#',
    posted_at: j.publication_date || new Date().toISOString(),
    tags: Array.isArray(j.tags) ? j.tags : [],
  }));
};

export default async function handler(req: any, res: any) {
  try {
    const query = `${req.query?.q || ''}`.trim();
    if (!query) return res.status(400).json({ error: 'missing query q' });

    const [a, r] = await Promise.allSettled([fromArbeitnow(query), fromRemotive(query)]);
    const jobs = [
      ...(a.status === 'fulfilled' ? a.value : []),
      ...(r.status === 'fulfilled' ? r.value : []),
    ].slice(0, 30);

    return res.status(200).json({ jobs, total: jobs.length, query });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.message || 'server error' });
  }
}
