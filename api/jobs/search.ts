type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  source: string;
  link: string;
  posted_at: string;
  tags: string[];
  description: string;
  employment_type?: string;
  salary?: string;
  visa_sponsorship?: 'Yes' | 'No' | 'Unknown';
};

type ProviderMeta = {
  name: string;
  status: 'ok' | 'empty' | 'failed' | 'skipped';
  count: number;
  error?: string;
};

const COUNTRY_CODE_MAP: Record<string, string> = {
  All: 'us',
  USA: 'us',
  UK: 'gb',
  India: 'in',
  Australia: 'au',
  Dubai: 'ae',
};

const CURATED_FALLBACK: Record<string, Array<{ title: string; source: string; link: string; location: string; country: string }>> = {
  All: [
    { title: 'Software Engineer Openings', source: 'LinkedIn', link: 'https://www.linkedin.com/jobs/search/?keywords=software%20engineer', location: 'Global', country: 'Global' },
    { title: 'IT & Non-IT Jobs', source: 'Indeed', link: 'https://www.indeed.com/jobs?q=software+engineer', location: 'Global', country: 'Global' },
    { title: 'Remote Developer Jobs', source: 'Remotive', link: 'https://remotive.com/remote-jobs/software-dev', location: 'Remote', country: 'Remote' },
  ],
  India: [
    { title: 'Software Engineer Jobs in India', source: 'Naukri', link: 'https://www.naukri.com/software-engineer-jobs', location: 'India', country: 'India' },
    { title: 'Developer Jobs in India', source: 'Foundit', link: 'https://www.foundit.in/srp/results?query=software%20engineer', location: 'India', country: 'India' },
    { title: 'Internships & Fresher Roles', source: 'Internshala', link: 'https://internshala.com/jobs', location: 'India', country: 'India' },
  ],
  USA: [
    { title: 'Software Engineer Jobs in USA', source: 'Indeed', link: 'https://www.indeed.com/jobs?q=software+engineer&l=United+States', location: 'USA', country: 'USA' },
    { title: 'LinkedIn USA Openings', source: 'LinkedIn', link: 'https://www.linkedin.com/jobs/search/?keywords=software%20engineer&location=United%20States', location: 'USA', country: 'USA' },
    { title: 'Federal Tech Openings', source: 'USAJobs', link: 'https://www.usajobs.gov/Search/Results?k=software', location: 'USA', country: 'USA' },
  ],
  UK: [
    { title: 'Software Engineer Jobs UK', source: 'Indeed', link: 'https://uk.indeed.com/jobs?q=software+engineer', location: 'UK', country: 'UK' },
    { title: 'Developer Roles UK', source: 'Reed', link: 'https://www.reed.co.uk/jobs/software-engineer-jobs', location: 'UK', country: 'UK' },
    { title: 'UK Public Jobs', source: 'GOV.UK Jobs', link: 'https://www.gov.uk/find-a-job', location: 'UK', country: 'UK' },
  ],
  Australia: [
    { title: 'Software Engineer Jobs AU', source: 'Indeed', link: 'https://au.indeed.com/jobs?q=software+engineer', location: 'Australia', country: 'Australia' },
    { title: 'Tech Jobs Australia', source: 'Seek', link: 'https://www.seek.com.au/software-engineer-jobs', location: 'Australia', country: 'Australia' },
    { title: 'Australia Jobs Aggregator', source: 'Jora', link: 'https://au.jora.com/Software-Engineer-jobs', location: 'Australia', country: 'Australia' },
  ],
  Dubai: [
    { title: 'Software Engineer Jobs Dubai', source: 'Indeed', link: 'https://ae.indeed.com/jobs?q=software+engineer', location: 'Dubai, UAE', country: 'Dubai' },
    { title: 'Middle East Tech Roles', source: 'Bayt', link: 'https://www.bayt.com/en/uae/jobs/software-engineer-jobs/', location: 'Dubai, UAE', country: 'Dubai' },
    { title: 'Gulf Professional Jobs', source: 'GulfTalent', link: 'https://www.gulftalent.com/uae/jobs', location: 'Dubai, UAE', country: 'Dubai' },
  ],
};

const clean = (text: string) =>
  (text || '')
    .replace(/<\/(p|div|li|br|h1|h2|h3|h4|h5|h6)>/gi, '\n')
    .replace(/<li>/gi, '\n- ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, 16000);

const inferVisa = (text: string): 'Yes' | 'No' | 'Unknown' => {
  const t = (text || '').toLowerCase();
  if (!t) return 'Unknown';
  if (/(visa sponsorship|h-1b|h1b|will sponsor|sponsorship available)/.test(t) && !/(no sponsorship|without sponsorship|cannot sponsor|not sponsor)/.test(t)) return 'Yes';
  if (/(no sponsorship|without sponsorship|cannot sponsor|not sponsor|work authorization)/.test(t)) return 'No';
  return 'Unknown';
};

const normalizeCountry = (location: string, explicitCountry = '') => {
  const c = explicitCountry.toLowerCase().trim();
  if (['in', 'india'].includes(c)) return 'India';
  if (['us', 'usa', 'united states', 'united states of america'].includes(c)) return 'USA';
  if (['uk', 'gb', 'gbr', 'united kingdom'].includes(c)) return 'UK';
  if (['au', 'australia'].includes(c)) return 'Australia';
  if (['ae', 'uae', 'united arab emirates', 'dubai'].includes(c)) return 'Dubai';

  const raw = (location || '').toLowerCase();
  if (/\b(remote|worldwide)\b/.test(raw)) return 'Remote';
  if (/\b(india|bangalore|bengaluru|hyderabad|mumbai|delhi|chennai|pune)\b/.test(raw)) return 'India';
  if (/\b(usa|united states|new york|california|texas|chicago|san francisco|seattle|boston)\b/.test(raw) || /,\s*us\b/.test(raw)) return 'USA';
  if (/\b(uk|united kingdom|england|scotland|wales|london|manchester)\b/.test(raw) || /,\s*gb\b/.test(raw)) return 'UK';
  if (/\b(australia|sydney|melbourne|brisbane|perth)\b/.test(raw) || /,\s*au\b/.test(raw)) return 'Australia';
  if (/\b(dubai|uae|united arab emirates|abu dhabi|sharjah)\b/.test(raw) || /,\s*ae\b/.test(raw)) return 'Dubai';
  return 'Global';
};

const safeFetch = async (url: string, headers: Record<string, string> = {}) => {
  try {
    const r = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'KBV-Job-Aggregator/2.1', ...headers } });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
};

const sourceFromUrl = (url: string) => {
  const u = (url || '').toLowerCase();
  if (u.includes('linkedin')) return 'LinkedIn';
  if (u.includes('indeed')) return 'Indeed';
  if (u.includes('naukri')) return 'Naukri';
  if (u.includes('foundit') || u.includes('monsterindia')) return 'Foundit';
  if (u.includes('internshala')) return 'Internshala';
  if (u.includes('superset') || u.includes('joinsuperset')) return 'Superset';
  if (u.includes('reed.co.uk')) return 'Reed';
  if (u.includes('seek.com.au')) return 'Seek';
  if (u.includes('bayt')) return 'Bayt';
  if (u.includes('gulftalent')) return 'GulfTalent';
  return 'JSearch';
};

const dedupe = (jobs: Job[]) => {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const k = `${j.title}|${j.company}|${j.link}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const isITJob = (job: Job) => {
  const hay = `${job.title} ${job.tags.join(' ')} ${job.description}`.toLowerCase();
  return /(software|developer|engineer|frontend|backend|full stack|devops|cloud|data|qa|sre|security|react|node|java|python)/.test(hay);
};

const isNonITJob = (job: Job) => {
  const hay = `${job.title} ${job.tags.join(' ')} ${job.description}`.toLowerCase();
  return /(sales|marketing|hr|human resources|finance|operations|support|customer|content|recruiter|account)/.test(hay);
};

const fromRemotive = async (query: string): Promise<Job[]> => {
  const remotive: any = await safeFetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`);
  const rows = Array.isArray(remotive?.jobs) ? remotive.jobs : [];
  return rows.slice(0, 250).map((j: any) => {
    const description = clean(j.description || '');
    return {
      id: `remotive-${j.id}`,
      title: j.title || 'Role',
      company: j.company_name || 'Company',
      location: j.candidate_required_location || 'Remote',
      country: normalizeCountry(j.candidate_required_location || ''),
      source: 'Remotive',
      link: j.url || '#',
      posted_at: j.publication_date || new Date().toISOString(),
      tags: Array.isArray(j.tags) ? j.tags : [],
      description,
      employment_type: j.job_type || '',
      salary: j.salary || '',
      visa_sponsorship: inferVisa(description),
    };
  });
};

const fromArbeitnow = async (query: string): Promise<Job[]> => {
  const arbeit: any = await safeFetch('https://www.arbeitnow.com/api/job-board-api');
  const rows = Array.isArray(arbeit?.data) ? arbeit.data : [];
  return rows
    .slice(0, 250)
    .map((j: any) => {
      const description = clean(j.description || '');
      return {
        id: `arbeitnow-${j.slug || j.url}`,
        title: j.title || 'Role',
        company: j.company_name || 'Company',
        location: j.location || 'Remote',
        country: normalizeCountry(j.location || ''),
        source: 'Arbeitnow',
        link: j.url || '#',
        posted_at: j.created_at || new Date().toISOString(),
        tags: Array.isArray(j.tags) ? j.tags : [],
        description,
        employment_type: j.job_types || '',
        salary: '',
        visa_sponsorship: inferVisa(description),
      };
    });
};

const fallbackJobs = (country: string, query: string): Job[] => {
  const bucket = CURATED_FALLBACK[country] || CURATED_FALLBACK.All;
  const q = query || 'jobs';
  return bucket.map((x, idx) => ({
    id: `fallback-${country}-${idx}`,
    title: x.title,
    company: `${x.source} Listings`,
    location: x.location,
    country: x.country,
    source: x.source,
    link: x.link,
    posted_at: new Date().toISOString(),
    tags: ['fallback', q],
    description: `Fallback listing route for ${q}. Open source link for live openings.`,
    employment_type: '',
    salary: '',
    visa_sponsorship: 'Unknown',
  }));
};

const fromJSearch = async (query: string, country: string): Promise<Job[]> => {
  const rapidKey = process.env.RAPIDAPI_JSEARCH_KEY || '';
  if (!rapidKey) return [];
  const cc = COUNTRY_CODE_MAP[country] || 'us';
  const hints: Record<string, string[]> = {
    India: ['naukri', 'foundit', 'internshala', 'superset', 'indeed india', 'linkedin india'],
    USA: ['linkedin usa', 'indeed usa', 'glassdoor', 'usajobs'],
    UK: ['linkedin uk', 'indeed uk', 'reed', 'totaljobs'],
    Australia: ['linkedin australia', 'indeed australia', 'seek', 'jora'],
    Dubai: ['linkedin uae', 'indeed uae', 'bayt', 'gulftalent', 'naukri gulf'],
    All: ['linkedin', 'indeed', 'naukri', 'foundit'],
  };

  const queries = [`${query} jobs`, `${query} developer`, `${query} engineer`, ...((hints[country] || []).map((h) => `${query} ${h}`))];
  const out: any[] = [];

  for (const q of queries.slice(0, 8)) {
    const data: any = await safeFetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(q)}&page=1&num_pages=6&country=${cc}&date_posted=all`,
      { 'x-rapidapi-host': 'jsearch.p.rapidapi.com', 'x-rapidapi-key': rapidKey }
    );
    const rows = Array.isArray(data?.data) ? data.data : [];
    out.push(...rows);
  }

  return dedupe(out).slice(0, 2600).map((j: any) => {
    const location = [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || 'Remote';
    const description = clean(j.job_description || '');
    const link = j.job_apply_link || j.job_google_link || '#';
    return {
      id: `jsearch-${j.job_id || link}`,
      title: j.job_title || 'Role',
      company: j.employer_name || 'Company',
      location,
      country: normalizeCountry(location, j.job_country || ''),
      source: sourceFromUrl(link),
      link,
      posted_at: j.job_posted_at_datetime_utc || new Date().toISOString(),
      tags: Array.isArray(j.job_highlights?.Qualifications) ? j.job_highlights.Qualifications.slice(0, 8) : [],
      description,
      employment_type: j.job_employment_type || '',
      salary: j.job_salary || '',
      visa_sponsorship: inferVisa(description),
    };
  });
};

export default async function handler(req: any, res: any) {
  try {
    const query = `${req.query?.q || ''}`.trim();
    const country = `${req.query?.country || 'All'}`.trim();
    const roleType = `${req.query?.roleType || 'All'}`.trim();
    const visa = `${req.query?.visa || 'Any'}`.trim();
    const workMode = `${req.query?.workMode || 'Any'}`.trim();
    const roleFocus = `${req.query?.roleFocus || 'All Roles'}`.trim();
    const maxJobs = Math.min(3000, Math.max(50, Number(req.query?.max || 3000)));
    if (!query) return res.status(400).json({ error: 'missing query q' });

    const providers: ProviderMeta[] = [];
    const [jsearch, remotive, arbeit] = await Promise.all([
      fromJSearch(query, country),
      fromRemotive(query),
      fromArbeitnow(query),
    ]);

    providers.push({ name: 'JSearch', status: jsearch.length ? 'ok' : (process.env.RAPIDAPI_JSEARCH_KEY ? 'empty' : 'skipped'), count: jsearch.length, error: process.env.RAPIDAPI_JSEARCH_KEY ? undefined : 'Set RAPIDAPI_JSEARCH_KEY' });
    providers.push({ name: 'Remotive', status: remotive.length ? 'ok' : 'empty', count: remotive.length });
    providers.push({ name: 'Arbeitnow', status: arbeit.length ? 'ok' : 'empty', count: arbeit.length });

    let out = dedupe([...jsearch, ...remotive, ...arbeit]);

    if (country !== 'All') out = out.filter((x) => x.country === country);
    if (roleType === 'IT') out = out.filter(isITJob);
    if (roleType === 'Non-IT') out = out.filter(isNonITJob);
    if (roleFocus && !/^all/i.test(roleFocus)) {
      const rf = roleFocus.toLowerCase();
      out = out.filter((j) => `${j.title} ${j.description} ${j.tags.join(' ')}`.toLowerCase().includes(rf));
    }
    if (visa === 'Sponsorship') out = out.filter((j) => j.visa_sponsorship === 'Yes');
    if (workMode === 'Remote') out = out.filter((j) => /remote/i.test(`${j.location} ${j.description}`));
    if (workMode === 'Hybrid') out = out.filter((j) => /hybrid/i.test(`${j.location} ${j.description}`));
    if (workMode === 'Onsite') out = out.filter((j) => !/remote|hybrid/i.test(`${j.location} ${j.description}`));

    const allProvidersEmpty = providers.every((p) => p.count === 0);
    if (!out.length) {
      out = fallbackJobs(country, query);
    }

    out = out.slice(0, maxJobs);

    const bySource = out.reduce((acc: Record<string, number>, j) => {
      acc[j.source] = (acc[j.source] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      jobs: out,
      total: out.length,
      query,
      country,
      providers,
      bySource,
      configWarnings: [
        ...(process.env.RAPIDAPI_JSEARCH_KEY ? [] : ['LinkedIn/Indeed/Naukri/Foundit ingestion needs RAPIDAPI_JSEARCH_KEY']),
        ...(allProvidersEmpty ? ['External providers returned 0 results in this runtime window; fallback feed is shown.'] : []),
      ],
      updatedAt: new Date().toISOString(),
      cache: { hit: false, maxAgeMs: 0 },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'server error' });
  }
}
