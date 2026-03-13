import { getCacheRecord, setCacheRecord } from '../../services/jobCacheDb';
import { ingestJobsForEvents } from '../../services/jobRealtime';

type NormalizedJob = {
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

type ProviderStatus = {
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

const COUNTRY_ALIASES: Record<string, string[]> = {
  India: ['india', 'in', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'mumbai', 'delhi', 'chennai'],
  UK: ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'london', 'manchester'],
  USA: ['usa', 'united states', 'us', 'america', 'new york', 'california', 'texas'],
  Australia: ['australia', 'au', 'sydney', 'melbourne', 'brisbane'],
  Dubai: ['dubai', 'uae', 'united arab emirates', 'abu dhabi', 'sharjah'],
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasToken = (text: string, token: string) => {
  const rx = new RegExp(`\\b${escapeRegex(token)}\\b`, 'i');
  return rx.test(text);
};

const COUNTRY_PORTAL_HINTS: Record<string, string[]> = {
  India: ['Naukri', 'LinkedIn', 'Indeed India', 'Internshala', 'Foundit', 'Apna', 'WorkIndia', 'Shine', 'Freshersworld', 'Cutshort', 'Superset'],
  USA: ['Indeed', 'LinkedIn', 'Glassdoor', 'ZipRecruiter', 'Monster', 'CareerBuilder', 'USAJobs'],
  UK: ['Indeed UK', 'LinkedIn', 'Reed', 'Totaljobs', 'CV-Library', 'GOV.UK Jobs'],
  Australia: ['Indeed Australia', 'LinkedIn', 'Seek', 'Jora', 'CareerOne', 'Government Jobs Australia'],
  Dubai: ['Indeed UAE', 'LinkedIn', 'GulfTalent', 'Bayt', 'Dubai Careers', 'Naukri Gulf'],
};

const IT_KEYWORDS = [
  'software', 'developer', 'engineer', 'frontend', 'backend', 'full stack', 'devops', 'cloud',
  'data', 'machine learning', 'ai', 'qa', 'sre', 'security', 'it ', 'java', 'python', 'react', 'node',
];

const NON_IT_KEYWORDS = [
  'sales', 'marketing', 'hr', 'human resources', 'finance', 'account', 'operations', 'support',
  'customer', 'content', 'designer', 'product manager', 'business analyst', 'recruiter',
];

const normalizeCountry = (location: string): string => {
  const raw = (location || '').toLowerCase();
  if (!raw) return 'Global';
  if (COUNTRY_ALIASES.India.some((x) => hasToken(raw, x))) return 'India';
  if (COUNTRY_ALIASES.UK.some((x) => hasToken(raw, x))) return 'UK';
  if (COUNTRY_ALIASES.USA.some((x) => hasToken(raw, x))) return 'USA';
  if (COUNTRY_ALIASES.Australia.some((x) => hasToken(raw, x))) return 'Australia';
  if (COUNTRY_ALIASES.Dubai.some((x) => hasToken(raw, x))) return 'Dubai';
  if (raw.includes('remote')) return 'Remote';
  return 'Global';
};

const cleanDescription = (htmlOrText: string) => {
  if (!htmlOrText) return '';
  return htmlOrText
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|br)>/gi, '\n')
    .replace(/<li>/gi, '\n- ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 16000);
};

const inferVisaSponsorship = (text: string): 'Yes' | 'No' | 'Unknown' => {
  const hay = (text || '').toLowerCase();
  if (!hay.trim()) return 'Unknown';
  if (/(visa sponsorship|h-1b sponsorship|h1b sponsorship|sponsorship available|will sponsor)/i.test(hay) && !/(no sponsorship|without sponsorship|cannot sponsor|not sponsor)/i.test(hay)) return 'Yes';
  if (/(no sponsorship|without sponsorship|cannot sponsor|not sponsor|must have work authorization|does not require sponsorship)/i.test(hay)) return 'No';
  return 'Unknown';
};

const safeFetchJson = async (url: string, headers: Record<string, string> = {}) => {
  try {
    const resp = await fetch(url, {
      headers: {
        'user-agent': 'KBV-Job-Aggregator/2.0',
        accept: 'application/json',
        ...headers,
      },
    });
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
};

const matchesQuery = (text: string, query: string) => {
  const q = (query || '').toLowerCase().trim();
  if (!q) return true;
  const hay = (text || '').toLowerCase();
  if (hay.includes(q)) return true;
  const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
  return tokens.some((t) => hay.includes(t));
};

const isITJob = (job: NormalizedJob) => {
  const hay = `${job.title} ${job.tags.join(' ')} ${job.description}`.toLowerCase();
  return IT_KEYWORDS.some((k) => hay.includes(k));
};

const isNonITJob = (job: NormalizedJob) => {
  const hay = `${job.title} ${job.tags.join(' ')} ${job.description}`.toLowerCase();
  return NON_IT_KEYWORDS.some((k) => hay.includes(k));
};

const matchesCountry = (job: NormalizedJob, country: string) => {
  if (!country || country === 'All') return true;
  if (job.country === country) return true;
  const aliases = COUNTRY_ALIASES[country] || [country.toLowerCase()];
  const hay = `${job.location} ${job.description}`.toLowerCase();
  return aliases.some((x) => hasToken(hay, x));
};

const matchesWorkMode = (job: NormalizedJob, workMode: string) => {
  const mode = (workMode || 'Any').toLowerCase();
  if (mode === 'any') return true;
  const hay = `${job.location} ${job.title} ${job.description}`.toLowerCase();
  if (mode === 'remote') return hay.includes('remote');
  if (mode === 'hybrid') return hay.includes('hybrid');
  if (mode === 'onsite') return !hay.includes('remote') && !hay.includes('hybrid');
  return true;
};

const sourceFromUrl = (url: string) => {
  const host = (url || '').toLowerCase();
  if (host.includes('linkedin')) return 'LinkedIn';
  if (host.includes('indeed')) return 'Indeed';
  if (host.includes('naukri.com')) return 'Naukri';
  if (host.includes('foundit') || host.includes('monsterindia')) return 'Foundit';
  if (host.includes('internshala')) return 'Internshala';
  if (host.includes('apna')) return 'Apna';
  if (host.includes('workindia')) return 'WorkIndia';
  if (host.includes('shine')) return 'Shine';
  if (host.includes('freshersworld')) return 'Freshersworld';
  if (host.includes('cutshort')) return 'Cutshort';
  if (host.includes('superset') || host.includes('joinsuperset')) return 'Superset';
  if (host.includes('glassdoor')) return 'Glassdoor';
  if (host.includes('ziprecruiter')) return 'ZipRecruiter';
  if (host.includes('monster.com')) return 'Monster';
  if (host.includes('careerbuilder')) return 'CareerBuilder';
  if (host.includes('usajobs')) return 'USAJobs';
  if (host.includes('reed.co.uk')) return 'Reed';
  if (host.includes('totaljobs')) return 'Totaljobs';
  if (host.includes('cv-library')) return 'CV-Library';
  if (host.includes('gov.uk')) return 'GOV.UK Jobs';
  if (host.includes('seek.com.au')) return 'Seek';
  if (host.includes('jora')) return 'Jora';
  if (host.includes('careerone')) return 'CareerOne';
  if (host.includes('gulftalent')) return 'GulfTalent';
  if (host.includes('bayt')) return 'Bayt';
  if (host.includes('dubaicareers')) return 'Dubai Careers';
  if (host.includes('naukrigulf')) return 'Naukri Gulf';
  return 'JSearch';
};

const fromArbeitnow = async (query: string): Promise<NormalizedJob[]> => {
  const data: any = await safeFetchJson('https://www.arbeitnow.com/api/job-board-api');
  const items = Array.isArray(data?.data) ? data.data : [];
  return items
    .filter((j: any) => matchesQuery(`${j.title} ${j.company_name} ${(j.tags || []).join(' ')}`, query))
    .slice(0, 150)
    .map((j: any) => {
      const description = cleanDescription(j.description || '');
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
        visa_sponsorship: inferVisaSponsorship(description),
      };
    });
};

const fromRemotive = async (query: string): Promise<NormalizedJob[]> => {
  const data: any = await safeFetchJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`);
  const items = Array.isArray(data?.jobs) ? data.jobs : [];
  return items.slice(0, 250).map((j: any) => {
    const description = cleanDescription(j.description || '');
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
      visa_sponsorship: inferVisaSponsorship(description),
    };
  });
};

const fromJobicy = async (query: string): Promise<NormalizedJob[]> => {
  const data: any = await safeFetchJson('https://jobicy.com/api/v2/remote-jobs?count=500');
  const items = Array.isArray(data?.jobs) ? data.jobs : [];
  return items
    .filter((j: any) => matchesQuery(`${j.jobTitle || ''} ${j.companyName || ''} ${(j.jobIndustry || []).join(' ')}`, query))
    .slice(0, 250)
    .map((j: any) => {
      const description = cleanDescription(j.jobDescription || '');
      return {
        id: `jobicy-${j.id || j.url}`,
        title: j.jobTitle || 'Role',
        company: j.companyName || 'Company',
        location: j.jobGeo || 'Remote',
        country: normalizeCountry(j.jobGeo || ''),
        source: 'Jobicy',
        link: j.url || '#',
        posted_at: j.pubDate || new Date().toISOString(),
        tags: Array.isArray(j.jobTags) ? j.jobTags : [],
        description,
        employment_type: j.jobType || '',
        salary: j.annualSalaryMin && j.annualSalaryMax ? `${j.annualSalaryMin} - ${j.annualSalaryMax}` : '',
        visa_sponsorship: inferVisaSponsorship(description),
      };
    });
};

const fromTheMuse = async (query: string): Promise<NormalizedJob[]> => {
  const pages = [1, 2, 3, 4, 5];
  const out: NormalizedJob[] = [];
  for (const page of pages) {
    const data: any = await safeFetchJson(`https://www.themuse.com/api/public/jobs?page=${page}&descending=true`);
    const items = Array.isArray(data?.results) ? data.results : [];
    for (const j of items) {
      const hay = `${j?.name || ''} ${j?.company?.name || ''} ${(j?.levels || []).map((x: any) => x?.name || '').join(' ')}`.toLowerCase();
      if (!matchesQuery(hay, query)) continue;
      const description = cleanDescription(j.contents || '');
      out.push({
        id: `themuse-${j.id}`,
        title: j.name || 'Role',
        company: j?.company?.name || 'Company',
        location: (Array.isArray(j?.locations) && j.locations[0]?.name) ? j.locations[0].name : 'Remote',
        country: normalizeCountry((Array.isArray(j?.locations) && j.locations[0]?.name) ? j.locations[0].name : ''),
        source: 'TheMuse',
        link: j.refs?.landing_page || '#',
        posted_at: j.publication_date || new Date().toISOString(),
        tags: Array.isArray(j?.categories) ? j.categories.map((c: any) => c?.name).filter(Boolean) : [],
        description,
        employment_type: Array.isArray(j?.type) ? j.type.map((x: any) => x?.name).join(', ') : '',
        salary: '',
        visa_sponsorship: inferVisaSponsorship(description),
      });
      if (out.length >= 350) break;
    }
    if (out.length >= 350) break;
  }
  return out;
};

const fromRemoteOK = async (query: string): Promise<NormalizedJob[]> => {
  const data: any = await safeFetchJson('https://remoteok.com/api');
  const items = Array.isArray(data) ? data.slice(1) : [];
  return items
    .filter((j: any) => matchesQuery(`${j.position || ''} ${j.company || ''} ${(j.tags || []).join(' ')}`, query))
    .slice(0, 200)
    .map((j: any) => {
      const description = cleanDescription(j.description || '');
      return {
        id: `remoteok-${j.id || j.slug}`,
        title: j.position || 'Role',
        company: j.company || 'Company',
        location: j.location || 'Remote',
        country: normalizeCountry(j.location || ''),
        source: 'RemoteOK',
        link: j.url || '#',
        posted_at: j.date || new Date().toISOString(),
        tags: Array.isArray(j.tags) ? j.tags : [],
        description,
        employment_type: '',
        salary: j.salary_min && j.salary_max ? `${j.salary_min} - ${j.salary_max}` : '',
        visa_sponsorship: inferVisaSponsorship(description),
      };
    });
};

const fromAdzuna = async (query: string, country: string): Promise<NormalizedJob[]> => {
  const appId = process.env.ADZUNA_APP_ID || '';
  const appKey = process.env.ADZUNA_APP_KEY || '';
  if (!appId || !appKey) return [];

  const cc = COUNTRY_CODE_MAP[country] || 'us';
  const pages = [1, 2, 3, 4, 5, 6];
  const rows: any[] = [];
  for (const page of pages) {
    const data: any = await safeFetchJson(`https://api.adzuna.com/v1/api/jobs/${cc}/search/${page}?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=50&what=${encodeURIComponent(query)}&content-type=application/json`);
    const items = Array.isArray(data?.results) ? data.results : [];
    rows.push(...items);
    if (!items.length) break;
  }
  return rows.slice(0, 300).map((j: any) => {
    const description = cleanDescription(j.description || '');
    return {
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
      visa_sponsorship: inferVisaSponsorship(description),
    };
  });
};

const fromJSearch = async (query: string, country: string): Promise<NormalizedJob[]> => {
  const apiKey = process.env.RAPIDAPI_JSEARCH_KEY || '';
  if (!apiKey) return [];

  const cc = COUNTRY_CODE_MAP[country] || 'us';
  const roleVariants = [
    query,
    `${query} jobs`,
    `${query} hiring`,
    `${query} latest openings`,
  ];
  const portalHints = country !== 'All' ? (COUNTRY_PORTAL_HINTS[country] || []) : [];
  const hintQueries = portalHints.map((h) => `${query} ${h}`);
  const allQueries = Array.from(new Set([...roleVariants, ...hintQueries]));

  const out: any[] = [];
  for (const q of allQueries) {
    const data: any = await safeFetchJson(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(q)}&page=1&num_pages=3&country=${cc}&date_posted=all`,
      {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      }
    );
    const items = Array.isArray(data?.data) ? data.data : [];
    out.push(...items);
  }

  return out.slice(0, 2500).map((j: any) => {
    const description = cleanDescription(j.job_description || '');
    const location = [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || 'Remote';
    const applyLinks = Array.isArray(j.job_apply_link?.job_apply_links) ? j.job_apply_link.job_apply_links : [];
    const firstApply = applyLinks[0]?.job_apply_link || j.job_apply_link || j.job_google_link || '#';
    return {
      id: `jsearch-${j.job_id || firstApply}`,
      title: j.job_title || 'Role',
      company: j.employer_name || 'Company',
      location,
      country: normalizeCountry(location),
      source: sourceFromUrl(firstApply),
      link: firstApply,
      posted_at: j.job_posted_at_datetime_utc || new Date().toISOString(),
      tags: Array.isArray(j.job_highlights?.Qualifications) ? j.job_highlights.Qualifications.slice(0, 8) : [],
      description,
      employment_type: j.job_employment_type || '',
      salary: j.job_salary || '',
      visa_sponsorship: inferVisaSponsorship(description),
    };
  });
};

const runProvider = async (name: string, fn: () => Promise<NormalizedJob[]>): Promise<{ jobs: NormalizedJob[]; meta: ProviderStatus }> => {
  try {
    const jobs = await fn();
    if (!jobs.length) return { jobs: [], meta: { name, status: 'empty', count: 0 } };
    return { jobs, meta: { name, status: 'ok', count: jobs.length } };
  } catch (err: any) {
    return { jobs: [], meta: { name, status: 'failed', count: 0, error: err?.message || 'failed' } };
  }
};

const dedupeJobs = (jobs: NormalizedJob[]): NormalizedJob[] => {
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    const key = `${j.title}|${j.company}|${j.location}|${(j.link || '').toLowerCase()}`.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(j);
  }
  return out;
};

const rankJobs = (jobs: NormalizedJob[]) => {
  const sourceBoost: Record<string, number> = {
    LinkedIn: 30,
    Indeed: 28,
    Naukri: 27,
    Foundit: 26,
    Glassdoor: 24,
    ZipRecruiter: 23,
    JSearch: 18,
    Adzuna: 16,
    TheMuse: 14,
    Arbeitnow: 12,
    Remotive: 10,
    RemoteOK: 9,
    Jobicy: 8,
  };
  return [...jobs].sort((a, b) => {
    const tA = new Date(a.posted_at).getTime() || 0;
    const tB = new Date(b.posted_at).getTime() || 0;
    const daysA = Math.max(0, (Date.now() - tA) / 86400000);
    const daysB = Math.max(0, (Date.now() - tB) / 86400000);
    const scoreA = (sourceBoost[a.source] || 5) + Math.max(0, 15 - daysA) + Math.min(8, (a.description?.length || 0) / 900);
    const scoreB = (sourceBoost[b.source] || 5) + Math.max(0, 15 - daysB) + Math.min(8, (b.description?.length || 0) / 900);
    return scoreB - scoreA;
  });
};

const applyFilters = (
  jobsInput: NormalizedJob[],
  country: string,
  roleType: string,
  visaMode: 'Any' | 'Sponsorship',
  workMode: string,
  roleFocus: string
) => {
  let jobs = [...jobsInput];
  if (country !== 'All') jobs = jobs.filter((j) => matchesCountry(j, country));
  if (roleType === 'IT') jobs = jobs.filter(isITJob);
  if (roleType === 'Non-IT') jobs = jobs.filter((j) => isNonITJob(j) || !isITJob(j));
  if (visaMode === 'Sponsorship') jobs = jobs.filter((j) => j.visa_sponsorship === 'Yes');
  jobs = jobs.filter((j) => matchesWorkMode(j, workMode));
  if (roleFocus && !/^all /i.test(roleFocus) && roleFocus !== 'All Roles') {
    const rf = roleFocus.toLowerCase();
    jobs = jobs.filter((j) => `${j.title} ${j.description} ${j.tags.join(' ')}`.toLowerCase().includes(rf));
  }
  return jobs;
};

export default async function handler(req: any, res: any) {
  try {
    const query = `${req.query?.q || ''}`.trim();
    const country = `${req.query?.country || 'All'}`.trim();
    const roleType = `${req.query?.roleType || 'All'}`.trim();
    const visaMode = `${req.query?.visa || 'Any'}`.trim() === 'Sponsorship' ? 'Sponsorship' : 'Any';
    const workMode = `${req.query?.workMode || 'Any'}`.trim();
    const roleFocus = `${req.query?.roleFocus || 'All Roles'}`.trim();
    const maxJobs = Math.min(3000, Math.max(120, Number(req.query?.max || 3000)));
    const forceSync = `${req.query?.forceSync || 'false'}`.trim().toLowerCase() === 'true';
    const cacheKey = JSON.stringify({ q: query.toLowerCase(), country, roleType, visaMode, workMode, roleFocus, maxJobs });
    if (!query) return res.status(400).json({ error: 'missing query q' });

    const cached = !forceSync ? getCacheRecord<any>(cacheKey, 90_000) : null;
    if (cached) {
      return res.status(200).json({
        ...cached,
        cache: { hit: true, maxAgeMs: 90_000 },
      });
    }

    const providersRun = await Promise.all([
      runProvider('JSearch', () => fromJSearch(query, country)),
      runProvider('Adzuna', () => fromAdzuna(query, country)),
      runProvider('Arbeitnow', () => fromArbeitnow(query)),
      runProvider('Remotive', () => fromRemotive(query)),
      runProvider('Jobicy', () => fromJobicy(query)),
      runProvider('TheMuse', () => fromTheMuse(query)),
      runProvider('RemoteOK', () => fromRemoteOK(query)),
    ]);

    const providersMeta = providersRun.map((p) => p.meta);
    const configWarnings: string[] = [];
    if (!process.env.RAPIDAPI_JSEARCH_KEY) {
      const idx = providersMeta.findIndex((x) => x.name === 'JSearch');
      if (idx >= 0) providersMeta[idx] = { name: 'JSearch', status: 'skipped', count: 0, error: 'Set RAPIDAPI_JSEARCH_KEY to enable' };
      configWarnings.push('LinkedIn/Indeed/Naukri/Foundit and more portal ingestion needs RAPIDAPI_JSEARCH_KEY in .env.local');
    }
    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
      const idx = providersMeta.findIndex((x) => x.name === 'Adzuna');
      if (idx >= 0) providersMeta[idx] = { name: 'Adzuna', status: 'skipped', count: 0, error: 'Set ADZUNA_APP_ID and ADZUNA_APP_KEY to enable' };
      configWarnings.push('Adzuna is disabled. Set ADZUNA_APP_ID and ADZUNA_APP_KEY in .env.local');
    }

    let jobs = providersRun.flatMap((p) => p.jobs);
    jobs = rankJobs(applyFilters(dedupeJobs(jobs), country, roleType, visaMode, workMode, roleFocus)).slice(0, maxJobs);

    if (jobs.length === 0) {
      const fallbackRun = await Promise.all([
        runProvider('JSearch', () => fromJSearch('developer', country)),
        runProvider('Adzuna', () => fromAdzuna('developer', country)),
        runProvider('Arbeitnow', () => fromArbeitnow('developer')),
        runProvider('Remotive', () => fromRemotive('developer')),
      ]);
      jobs = rankJobs(applyFilters(dedupeJobs(fallbackRun.flatMap((x) => x.jobs)), country, roleType, visaMode, workMode, roleFocus)).slice(0, maxJobs);
    }

    const bySource = jobs.reduce((acc: Record<string, number>, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {});

    const payload = {
      jobs,
      total: jobs.length,
      query,
      country,
      roleType,
      roleFocus,
      visa: visaMode,
      workMode,
      providers: providersMeta,
      configWarnings,
      bySource,
      updatedAt: new Date().toISOString(),
      cache: { hit: false, maxAgeMs: 90_000 },
    };

    setCacheRecord(cacheKey, payload);
    ingestJobsForEvents(jobs.slice(0, 1500).map((j) => ({
      title: j.title,
      company: j.company,
      location: j.location,
      link: j.link,
      source: j.source,
    })));

    return res.status(200).json(payload);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.message || 'server error' });
  }
}
