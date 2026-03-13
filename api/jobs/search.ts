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

const COUNTRY_CODE_MAP: Record<string, string[]> = {
  All: ['us', 'in', 'gb', 'au', 'ae'],
  USA: ['us'],
  UK: ['gb'],
  India: ['in'],
  Australia: ['au'],
  Dubai: ['ae'],
};

const COUNTRY_ALIASES: Record<string, string[]> = {
  India: ['india', 'in', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'mumbai', 'delhi', 'chennai'],
  UK: ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'london', 'manchester'],
  USA: ['usa', 'united states', 'us', 'america', 'new york', 'california', 'texas', 'seattle'],
  Australia: ['australia', 'au', 'sydney', 'melbourne', 'brisbane', 'perth'],
  Dubai: ['dubai', 'uae', 'united arab emirates', 'abu dhabi', 'sharjah'],
};

const IT_KEYWORDS = ['software', 'developer', 'engineer', 'frontend', 'backend', 'full stack', 'devops', 'cloud', 'data', 'qa', 'security', 'java', 'python', 'react', 'node'];
const NON_IT_KEYWORDS = ['sales', 'marketing', 'hr', 'human resources', 'finance', 'operations', 'support', 'customer', 'content', 'recruiter', 'account'];

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

const hasToken = (text: string, token: string) => new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);

const normalizeCountry = (location: string, explicitCountry = '') => {
  const c = explicitCountry.toLowerCase().trim();
  if (['in', 'india'].includes(c)) return 'India';
  if (['us', 'usa', 'united states', 'united states of america'].includes(c)) return 'USA';
  if (['uk', 'gb', 'gbr', 'united kingdom'].includes(c)) return 'UK';
  if (['au', 'australia'].includes(c)) return 'Australia';
  if (['ae', 'uae', 'united arab emirates', 'dubai'].includes(c)) return 'Dubai';
  const raw = (location || '').toLowerCase();
  if (/remote|worldwide/.test(raw)) return 'Remote';
  if (COUNTRY_ALIASES.India.some((x) => hasToken(raw, x))) return 'India';
  if (COUNTRY_ALIASES.UK.some((x) => hasToken(raw, x))) return 'UK';
  if (COUNTRY_ALIASES.USA.some((x) => hasToken(raw, x))) return 'USA';
  if (COUNTRY_ALIASES.Australia.some((x) => hasToken(raw, x))) return 'Australia';
  if (COUNTRY_ALIASES.Dubai.some((x) => hasToken(raw, x))) return 'Dubai';
  return 'Global';
};

const safeFetch = async (url: string, headers: Record<string, string> = {}) => {
  try {
    const r = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'KBV-Job-Aggregator/3.0', ...headers } });
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
  if (u.includes('glassdoor')) return 'Glassdoor';
  if (u.includes('ziprecruiter')) return 'ZipRecruiter';
  if (u.includes('usajobs')) return 'USAJobs';
  if (u.includes('reed.co.uk')) return 'Reed';
  if (u.includes('seek.com.au')) return 'Seek';
  if (u.includes('bayt')) return 'Bayt';
  if (u.includes('gulftalent')) return 'GulfTalent';
  if (u.includes('remotive')) return 'Remotive';
  if (u.includes('arbeitnow')) return 'Arbeitnow';
  return 'JSearch';
};

const dedupe = (jobs: Job[]) => {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const k = `${j.title}|${j.company}|${j.location}|${j.link}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const matchesCountry = (job: Job, country: string) => {
  if (!country || country === 'All') return true;
  if (job.country === country) return true;
  const aliases = COUNTRY_ALIASES[country] || [country.toLowerCase()];
  const hay = `${job.location} ${job.description}`.toLowerCase();
  return aliases.some((x) => hasToken(hay, x));
};

const isITJob = (job: Job) => {
  const hay = `${job.title} ${job.tags.join(' ')} ${job.description}`.toLowerCase();
  return IT_KEYWORDS.some((k) => hay.includes(k));
};
const isNonITJob = (job: Job) => {
  const hay = `${job.title} ${job.tags.join(' ')} ${job.description}`.toLowerCase();
  return NON_IT_KEYWORDS.some((k) => hay.includes(k));
};

const runProvider = async (name: string, fn: () => Promise<Job[]>): Promise<{ jobs: Job[]; meta: ProviderMeta }> => {
  try {
    const jobs = await fn();
    return { jobs, meta: { name, status: jobs.length ? 'ok' : 'empty', count: jobs.length } };
  } catch (e: any) {
    return { jobs: [], meta: { name, status: 'failed', count: 0, error: e?.message || 'failed' } };
  }
};

const fromRemotive = async (query: string): Promise<Job[]> => {
  const d: any = await safeFetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`);
  const rows = Array.isArray(d?.jobs) ? d.jobs : [];
  return rows.slice(0, 250).map((j: any) => {
    const description = clean(j.description || '');
    return { id: `remotive-${j.id}`, title: j.title || 'Role', company: j.company_name || 'Company', location: j.candidate_required_location || 'Remote', country: normalizeCountry(j.candidate_required_location || ''), source: 'Remotive', link: j.url || '#', posted_at: j.publication_date || new Date().toISOString(), tags: Array.isArray(j.tags) ? j.tags : [], description, employment_type: j.job_type || '', salary: j.salary || '', visa_sponsorship: inferVisa(description) };
  });
};

const fromArbeitnow = async (_query: string): Promise<Job[]> => {
  const d: any = await safeFetch('https://www.arbeitnow.com/api/job-board-api');
  const rows = Array.isArray(d?.data) ? d.data : [];
  return rows.slice(0, 180).map((j: any) => {
    const description = clean(j.description || '');
    return { id: `arbeitnow-${j.slug || j.url}`, title: j.title || 'Role', company: j.company_name || 'Company', location: j.location || 'Remote', country: normalizeCountry(j.location || ''), source: 'Arbeitnow', link: j.url || '#', posted_at: j.created_at || new Date().toISOString(), tags: Array.isArray(j.tags) ? j.tags : [], description, employment_type: j.job_types || '', salary: '', visa_sponsorship: inferVisa(description) };
  });
};

const fromJobicy = async (query: string): Promise<Job[]> => {
  const d: any = await safeFetch('https://jobicy.com/api/v2/remote-jobs?count=500');
  const rows = Array.isArray(d?.jobs) ? d.jobs : [];
  return rows.slice(0, 250).map((j: any) => {
    const description = clean(j.jobDescription || '');
    return { id: `jobicy-${j.id || j.url}`, title: j.jobTitle || 'Role', company: j.companyName || 'Company', location: j.jobGeo || 'Remote', country: normalizeCountry(j.jobGeo || ''), source: 'Jobicy', link: j.url || '#', posted_at: j.pubDate || new Date().toISOString(), tags: Array.isArray(j.jobTags) ? j.jobTags : [], description, employment_type: j.jobType || '', salary: j.annualSalaryMin && j.annualSalaryMax ? `${j.annualSalaryMin} - ${j.annualSalaryMax}` : '', visa_sponsorship: inferVisa(description) };
  }).filter((j) => `${j.title} ${j.company} ${j.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
};

const fromTheMuse = async (query: string): Promise<Job[]> => {
  const out: Job[] = [];
  for (const page of [1, 2, 3, 4]) {
    const d: any = await safeFetch(`https://www.themuse.com/api/public/jobs?page=${page}&descending=true`);
    const rows = Array.isArray(d?.results) ? d.results : [];
    for (const j of rows) {
      const hay = `${j?.name || ''} ${j?.company?.name || ''}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) continue;
      const location = (Array.isArray(j?.locations) && j.locations[0]?.name) ? j.locations[0].name : 'Remote';
      const description = clean(j.contents || '');
      out.push({ id: `themuse-${j.id}`, title: j.name || 'Role', company: j?.company?.name || 'Company', location, country: normalizeCountry(location), source: 'TheMuse', link: j.refs?.landing_page || '#', posted_at: j.publication_date || new Date().toISOString(), tags: Array.isArray(j?.categories) ? j.categories.map((c: any) => c?.name).filter(Boolean) : [], description, employment_type: '', salary: '', visa_sponsorship: inferVisa(description) });
      if (out.length >= 240) break;
    }
    if (out.length >= 240) break;
  }
  return out;
};

const fromRemoteOK = async (query: string): Promise<Job[]> => {
  const d: any = await safeFetch('https://remoteok.com/api');
  const rows = Array.isArray(d) ? d.slice(1) : [];
  return rows.slice(0, 220).map((j: any) => {
    const description = clean(j.description || '');
    return { id: `remoteok-${j.id || j.slug}`, title: j.position || 'Role', company: j.company || 'Company', location: j.location || 'Remote', country: normalizeCountry(j.location || ''), source: 'RemoteOK', link: j.url || '#', posted_at: j.date || new Date().toISOString(), tags: Array.isArray(j.tags) ? j.tags : [], description, employment_type: '', salary: j.salary_min && j.salary_max ? `${j.salary_min} - ${j.salary_max}` : '', visa_sponsorship: inferVisa(description) };
  }).filter((j) => `${j.title} ${j.company} ${j.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
};

const fromAdzuna = async (query: string, country: string): Promise<Job[]> => {
  const appId = process.env.ADZUNA_APP_ID || '';
  const appKey = process.env.ADZUNA_APP_KEY || '';
  if (!appId || !appKey) return [];
  const codes = COUNTRY_CODE_MAP[country] || ['us'];
  const all: Job[] = [];
  for (const cc of codes) {
    for (const page of [1, 2, 3, 4, 5]) {
      const d: any = await safeFetch(`https://api.adzuna.com/v1/api/jobs/${cc}/search/${page}?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=50&what=${encodeURIComponent(query)}&content-type=application/json`);
      const rows = Array.isArray(d?.results) ? d.results : [];
      for (const j of rows) {
        const description = clean(j.description || '');
        all.push({
          id: `adzuna-${j.id || j.redirect_url}`,
          title: j.title || 'Role',
          company: j?.company?.display_name || 'Company',
          location: j?.location?.display_name || 'Remote',
          country: normalizeCountry(j?.location?.display_name || ''),
          source: 'Adzuna',
          link: j.redirect_url || '#',
          posted_at: j.created || new Date().toISOString(),
          tags: [j?.category?.label].filter(Boolean),
          description,
          employment_type: '',
          salary: (j.salary_min || j.salary_max) ? `${j.salary_min || ''}${j.salary_min && j.salary_max ? ' - ' : ''}${j.salary_max || ''}` : '',
          visa_sponsorship: inferVisa(description),
        });
      }
      if (!rows.length) break;
    }
  }
  return all.slice(0, 1200);
};

const fromJSearch = async (query: string, country: string): Promise<Job[]> => {
  const key = process.env.RAPIDAPI_JSEARCH_KEY || '';
  if (!key) return [];
  const codes = COUNTRY_CODE_MAP[country] || ['us'];
  const hints: Record<string, string[]> = {
    India: ['naukri', 'foundit', 'internshala', 'superset', 'indeed india', 'linkedin india'],
    USA: ['linkedin usa', 'indeed usa', 'glassdoor', 'usajobs'],
    UK: ['linkedin uk', 'indeed uk', 'reed', 'totaljobs'],
    Australia: ['linkedin australia', 'indeed australia', 'seek', 'jora'],
    Dubai: ['linkedin uae', 'indeed uae', 'bayt', 'gulftalent', 'naukri gulf'],
    All: ['linkedin', 'indeed', 'naukri', 'foundit'],
  };
  const queries = Array.from(new Set([query, `${query} jobs`, `${query} hiring`, `${query} developer`, ...((hints[country] || []).map((h) => `${query} ${h}`))]));
  const raw: any[] = [];
  for (const cc of codes) {
    for (const q of queries.slice(0, 8)) {
      const d: any = await safeFetch(`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(q)}&page=1&num_pages=4&country=${cc}&date_posted=all`, { 'x-rapidapi-host': 'jsearch.p.rapidapi.com', 'x-rapidapi-key': key });
      const rows = Array.isArray(d?.data) ? d.data : [];
      raw.push(...rows);
    }
  }
  return dedupe(raw.map((j: any) => {
    const description = clean(j.job_description || '');
    const location = [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || 'Remote';
    const applyLinks = Array.isArray(j.job_apply_link?.job_apply_links) ? j.job_apply_link.job_apply_links : [];
    const firstApply = applyLinks[0]?.job_apply_link || j.job_apply_link || j.job_google_link || '#';
    return {
      id: `jsearch-${j.job_id || firstApply}`,
      title: j.job_title || 'Role',
      company: j.employer_name || 'Company',
      location,
      country: normalizeCountry(location, j.job_country || ''),
      source: sourceFromUrl(firstApply),
      link: firstApply,
      posted_at: j.job_posted_at_datetime_utc || new Date().toISOString(),
      tags: Array.isArray(j.job_highlights?.Qualifications) ? j.job_highlights.Qualifications.slice(0, 8) : [],
      description,
      employment_type: j.job_employment_type || '',
      salary: j.job_salary || '',
      visa_sponsorship: inferVisa(description),
    } as Job;
  })).slice(0, 2200);
};

const fallbackJobs = (country: string, query: string): Job[] => {
  const c = country === 'All' ? 'Global' : country;
  const title = `${query || 'Jobs'} - ${c} Openings`;
  return [
    { id: `fallback-1-${country}`, title, company: 'LinkedIn Listings', location: c, country: country === 'All' ? 'Global' : country, source: 'LinkedIn', link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query || 'software engineer')}`, posted_at: new Date().toISOString(), tags: ['fallback'], description: 'Fallback listing. Open source link for live jobs.', employment_type: '', salary: '', visa_sponsorship: 'Unknown' },
    { id: `fallback-2-${country}`, title: `${query || 'Jobs'} - Indeed`, company: 'Indeed Listings', location: c, country: country === 'All' ? 'Global' : country, source: 'Indeed', link: `https://www.indeed.com/jobs?q=${encodeURIComponent(query || 'software engineer')}`, posted_at: new Date().toISOString(), tags: ['fallback'], description: 'Fallback listing. Open source link for live jobs.', employment_type: '', salary: '', visa_sponsorship: 'Unknown' },
    { id: `fallback-3-${country}`, title: `${query || 'Jobs'} - Naukri/Foundit`, company: 'India Aggregated Listings', location: 'India', country: 'India', source: 'Naukri', link: `https://www.naukri.com/${encodeURIComponent((query || 'software engineer').replace(/\s+/g, '-'))}-jobs`, posted_at: new Date().toISOString(), tags: ['fallback'], description: 'Fallback listing. Open source link for live jobs.', employment_type: '', salary: '', visa_sponsorship: 'Unknown' },
  ];
};

export default async function handler(req: any, res: any) {
  try {
    const query = `${req.query?.q || ''}`.trim();
    const country = `${req.query?.country || 'All'}`.trim();
    const roleType = `${req.query?.roleType || 'All'}`.trim();
    const visa = `${req.query?.visa || 'Any'}`.trim();
    const workMode = `${req.query?.workMode || 'Any'}`.trim();
    const roleFocus = `${req.query?.roleFocus || 'All Roles'}`.trim();
    const maxJobs = Math.min(3000, Math.max(120, Number(req.query?.max || 3000)));
    if (!query) return res.status(400).json({ error: 'missing query q' });

    const runs = await Promise.all([
      runProvider('JSearch', () => fromJSearch(query, country)),
      runProvider('Adzuna', () => fromAdzuna(query, country)),
      runProvider('Arbeitnow', () => fromArbeitnow(query)),
      runProvider('Remotive', () => fromRemotive(query)),
      runProvider('Jobicy', () => fromJobicy(query)),
      runProvider('TheMuse', () => fromTheMuse(query)),
      runProvider('RemoteOK', () => fromRemoteOK(query)),
    ]);
    const providers = runs.map((r) => r.meta);

    let jobs = dedupe(runs.flatMap((r) => r.jobs));
    if (country !== 'All') jobs = jobs.filter((j) => matchesCountry(j, country));
    if (roleType === 'IT') jobs = jobs.filter(isITJob);
    if (roleType === 'Non-IT') jobs = jobs.filter((j) => isNonITJob(j) || !isITJob(j));
    if (roleFocus && !/^all/i.test(roleFocus)) {
      const rf = roleFocus.toLowerCase();
      jobs = jobs.filter((j) => `${j.title} ${j.description} ${j.tags.join(' ')}`.toLowerCase().includes(rf));
    }
    if (visa === 'Sponsorship') jobs = jobs.filter((j) => j.visa_sponsorship === 'Yes');
    if (workMode === 'Remote') jobs = jobs.filter((j) => /remote/i.test(`${j.location} ${j.description}`));
    if (workMode === 'Hybrid') jobs = jobs.filter((j) => /hybrid/i.test(`${j.location} ${j.description}`));
    if (workMode === 'Onsite') jobs = jobs.filter((j) => !/remote|hybrid/i.test(`${j.location} ${j.description}`));

    const allProvidersEmpty = providers.every((p) => p.count === 0);
    if (!jobs.length) jobs = fallbackJobs(country, query);
    jobs = jobs.slice(0, maxJobs);

    const bySource = jobs.reduce((acc: Record<string, number>, j) => {
      acc[j.source] = (acc[j.source] || 0) + 1;
      return acc;
    }, {});

    const warnings: string[] = [];
    if (!process.env.RAPIDAPI_JSEARCH_KEY) warnings.push('LinkedIn/Indeed/Naukri/Foundit ingestion needs RAPIDAPI_JSEARCH_KEY');
    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) warnings.push('Adzuna keys missing: set ADZUNA_APP_ID and ADZUNA_APP_KEY');
    if (allProvidersEmpty) warnings.push('External providers returned 0 results in this runtime window; fallback feed is shown.');

    return res.status(200).json({
      jobs,
      total: jobs.length,
      query,
      country,
      providers,
      bySource,
      configWarnings: warnings,
      updatedAt: new Date().toISOString(),
      cache: { hit: false, maxAgeMs: 0 },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'server error' });
  }
}

