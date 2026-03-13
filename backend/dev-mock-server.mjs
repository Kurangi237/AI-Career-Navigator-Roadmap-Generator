// Simple development API mock server
// Returns realistic mock data for testing the frontend

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import os from 'os';
import { promises as fsPromises } from 'fs';
import { spawn } from 'child_process';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

const readEnvValue = (key) => {
  try {
    const paths = [path.resolve(process.cwd(), '.env.local'), path.resolve(process.cwd(), '.env')];
    for (const envPath of paths) {
      if (!fs.existsSync(envPath)) continue;
      const envText = fs.readFileSync(envPath, 'utf8');
      const line = envText.split(/\r?\n/).find((row) => row.trim().startsWith(`${key}=`));
      if (line) return line.slice(`${key}=`.length).trim().replace(/^['"]|['"]$/g, '');
    }
    return '';
  } catch {
    return '';
  }
};

const API_KEY = process.env.GENAI_API_KEY || readEnvValue('GENAI_API_KEY');
const RAPIDAPI_JSEARCH_KEY = process.env.RAPIDAPI_JSEARCH_KEY || readEnvValue('RAPIDAPI_JSEARCH_KEY');
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || readEnvValue('ADZUNA_APP_ID');
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || readEnvValue('ADZUNA_APP_KEY');
const WORKER_TOKEN = process.env.JUDGE_WORKER_TOKEN || 'local-worker-token';
const judgeJobs = new Map();
const jobEvents = [];
const seenJobKeys = new Set();

if (!API_KEY) {
  console.error('GENAI_API_KEY is missing. Set it in your .env file for live chat.');
}

console.log('ðŸš€ Development API Mock Server');
console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
console.log('âœ“ CORS enabled for frontend');
console.log('âœ“ API Key configured');

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'Development API Mock Server active',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/genai/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'genai-mock',
    time: new Date().toISOString()
  });
});

app.get('/api/jobs/search', async (req, res) => {
  try {
    const query = `${req.query?.q || ''}`.trim();
    const country = `${req.query?.country || 'All'}`.trim();
    const roleType = `${req.query?.roleType || 'All'}`.trim();
    const visa = `${req.query?.visa || 'Any'}`.trim() === 'Sponsorship' ? 'Sponsorship' : 'Any';
    const workMode = `${req.query?.workMode || 'Any'}`.trim();
    const roleFocus = `${req.query?.roleFocus || 'All Roles'}`.trim();
    const maxJobs = Math.min(3000, Math.max(120, Number(req.query?.max || 3000)));
    if (!query) return res.status(400).json({ error: 'missing query q' });

    const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hasToken = (text = '', token = '') => {
      const rx = new RegExp(`\\b${escapeRegex(token)}\\b`, 'i');
      return rx.test(text);
    };
    const normalizeCountry = (location = '') => {
      const raw = location.toLowerCase();
      if (!raw) return 'Global';
      if (['india', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'mumbai', 'delhi'].some((t) => hasToken(raw, t))) return 'India';
      if (['uk', 'united kingdom', 'london'].some((t) => hasToken(raw, t))) return 'UK';
      if (['united states', 'usa', 'new york', 'california', 'texas'].some((t) => hasToken(raw, t))) return 'USA';
      if (['australia', 'sydney', 'melbourne'].some((t) => hasToken(raw, t))) return 'Australia';
      if (['dubai', 'uae', 'united arab emirates'].some((t) => hasToken(raw, t))) return 'Dubai';
      if (raw.includes('remote')) return 'Remote';
      return 'Global';
    };
    const cleanDescription = (htmlOrText = '') =>
      htmlOrText
        .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|br)>/gi, '\n')
        .replace(/<li>/gi, '\n• ')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, 12000);
    const inferVisa = (text = '') => {
      const t = text.toLowerCase();
      if (!t) return 'Unknown';
      if (/(visa sponsorship|h-1b sponsorship|h1b sponsorship|sponsorship available|will sponsor)/i.test(t) && !/(no sponsorship|without sponsorship|cannot sponsor|not sponsor)/i.test(t)) return 'Yes';
      if (/(no sponsorship|without sponsorship|cannot sponsor|not sponsor|must have work authorization|does not require sponsorship)/i.test(t)) return 'No';
      return 'Unknown';
    };
    const matchesQuery = (text = '', q = '') => {
      const queryLower = q.toLowerCase().trim();
      if (!queryLower) return true;
      const hay = text.toLowerCase();
      if (hay.includes(queryLower)) return true;
      const tokens = queryLower.split(/\s+/).filter((x) => x.length >= 3);
      return tokens.some((x) => hay.includes(x));
    };
    const safeFetchJson = async (url, headers = {}) => {
      try {
        const resp = await fetch(url, { headers: { accept: 'application/json', ...headers } });
        if (!resp.ok) return null;
        return resp.json();
      } catch {
        return null;
      }
    };

    const providers = [];

    const remotiveData = await safeFetchJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`);
    const remotiveJobs = (Array.isArray(remotiveData?.jobs) ? remotiveData.jobs : []).slice(0, 30).map((j) => {
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
        visa_sponsorship: inferVisa(description),
      };
    });
    providers.push({ name: 'Remotive', status: remotiveJobs.length ? 'ok' : 'empty', count: remotiveJobs.length });

    const arbeitData = await safeFetchJson('https://www.arbeitnow.com/api/job-board-api');
    const arbeitJobs = (Array.isArray(arbeitData?.data) ? arbeitData.data : [])
      .filter((j) => matchesQuery(`${j.title || ''} ${j.company_name || ''} ${(j.tags || []).join(' ')}`, query))
      .slice(0, 30)
      .map((j) => {
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
          visa_sponsorship: inferVisa(description),
        };
      });
    providers.push({ name: 'Arbeitnow', status: arbeitJobs.length ? 'ok' : 'empty', count: arbeitJobs.length });

    const COUNTRY_PORTAL_HINTS = {
      India: ['Naukri', 'LinkedIn', 'Indeed India', 'Internshala', 'Foundit', 'Apna', 'WorkIndia', 'Shine', 'Freshersworld', 'Cutshort', 'Superset'],
      USA: ['Indeed', 'LinkedIn', 'Glassdoor', 'ZipRecruiter', 'Monster', 'CareerBuilder', 'USAJobs'],
      UK: ['Indeed UK', 'LinkedIn', 'Reed', 'Totaljobs', 'CV-Library', 'GOV.UK jobs'],
      Australia: ['Indeed Australia', 'LinkedIn', 'Seek', 'Jora', 'CareerOne', 'Government Jobs Australia'],
      Dubai: ['Indeed UAE', 'LinkedIn', 'GulfTalent', 'Bayt', 'Dubai Careers', 'Naukri Gulf'],
    };

    let jsearchJobs = [];
    if (RAPIDAPI_JSEARCH_KEY) {
      const countryCodeMap = { All: 'us', USA: 'us', UK: 'gb', India: 'in', Australia: 'au', Dubai: 'ae' };
      const countryCode = countryCodeMap[country] || 'us';
      const portalHints = country !== 'All' ? (COUNTRY_PORTAL_HINTS[country] || []) : [];
      const queryList = [query, ...portalHints.map((h) => `${query} ${h}`)];
      const jsearchResponses = await Promise.all(queryList.map((qv) => safeFetchJson(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(qv)}&page=1&num_pages=3&country=${countryCode}&date_posted=all`,
        {
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_JSEARCH_KEY,
        }
      )));
      const jsearchRows = jsearchResponses.flatMap((r) => (Array.isArray(r?.data) ? r.data : []));

      jsearchJobs = jsearchRows.slice(0, 2500).map((j) => {
        const description = cleanDescription(j.job_description || '');
        const location = [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || 'Remote';
        const apply = Array.isArray(j.job_apply_link?.job_apply_links) ? (j.job_apply_link.job_apply_links[0]?.job_apply_link || j.job_google_link || '#') : (j.job_apply_link || j.job_google_link || '#');
        const host = String(apply).toLowerCase();
        const source =
          host.includes('linkedin') ? 'LinkedIn' :
          host.includes('indeed') ? 'Indeed' :
          host.includes('naukri') ? 'Naukri' :
          host.includes('foundit') || host.includes('monsterindia') ? 'Foundit' :
          host.includes('internshala') ? 'Internshala' :
          host.includes('apna') ? 'Apna' :
          host.includes('workindia') ? 'WorkIndia' :
          host.includes('shine') ? 'Shine' :
          host.includes('freshersworld') ? 'Freshersworld' :
          host.includes('cutshort') ? 'Cutshort' :
          host.includes('joinsuperset') || host.includes('superset') ? 'Superset' :
          host.includes('glassdoor') ? 'Glassdoor' :
          host.includes('ziprecruiter') ? 'ZipRecruiter' :
          host.includes('monster.com') ? 'Monster' :
          host.includes('careerbuilder') ? 'CareerBuilder' :
          host.includes('usajobs') ? 'USAJobs' :
          host.includes('reed.co.uk') ? 'Reed' :
          host.includes('totaljobs') ? 'Totaljobs' :
          host.includes('cv-library') ? 'CV-Library' :
          host.includes('gov.uk') ? 'GOV.UK Jobs' :
          host.includes('seek.com.au') ? 'Seek' :
          host.includes('jora') ? 'Jora' :
          host.includes('careerone') ? 'CareerOne' :
          host.includes('gulftalent') ? 'GulfTalent' :
          host.includes('bayt') ? 'Bayt' :
          host.includes('dubaicareers') ? 'Dubai Careers' :
          host.includes('naukrigulf') ? 'Naukri Gulf' :
          'JSearch';
        return {
          id: `jsearch-${j.job_id || apply}`,
          title: j.job_title || 'Role',
          company: j.employer_name || 'Company',
          location,
          country: normalizeCountry(location),
          source,
          link: apply,
          posted_at: j.job_posted_at_datetime_utc || new Date().toISOString(),
          tags: [],
          description,
          employment_type: j.job_employment_type || '',
          salary: j.job_salary || '',
          visa_sponsorship: inferVisa(description),
        };
      });
      providers.push({ name: 'JSearch', status: jsearchJobs.length ? 'ok' : 'empty', count: jsearchJobs.length });
    } else {
      providers.push({ name: 'JSearch', status: 'skipped', count: 0, error: 'Set RAPIDAPI_JSEARCH_KEY in .env.local' });
    }

    let adzunaJobs = [];
    if (ADZUNA_APP_ID && ADZUNA_APP_KEY) {
      const ccMap = { All: 'us', USA: 'us', UK: 'gb', India: 'in', Australia: 'au', Dubai: 'ae' };
      const cc = ccMap[country] || 'us';
      const adzunaData = await safeFetchJson(`https://api.adzuna.com/v1/api/jobs/${cc}/search/1?app_id=${encodeURIComponent(ADZUNA_APP_ID)}&app_key=${encodeURIComponent(ADZUNA_APP_KEY)}&results_per_page=30&what=${encodeURIComponent(query)}&content-type=application/json`);
      adzunaJobs = (Array.isArray(adzunaData?.results) ? adzunaData.results : []).map((j) => {
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
          visa_sponsorship: inferVisa(description),
        };
      });
      providers.push({ name: 'Adzuna', status: adzunaJobs.length ? 'ok' : 'empty', count: adzunaJobs.length });
    } else {
      providers.push({ name: 'Adzuna', status: 'skipped', count: 0, error: 'Set ADZUNA_APP_ID and ADZUNA_APP_KEY in .env.local' });
    }

    const matchesCountry = (job) => {
      if (country === 'All') return true;
      if (job.country === country) return true;
      const hay = `${job.location} ${job.description}`.toLowerCase();
      const aliases = country === 'India'
        ? ['india']
        : country === 'USA'
          ? ['usa', 'united states', 'us']
          : country === 'UK'
            ? ['uk', 'united kingdom']
            : country === 'Australia'
              ? ['australia']
              : country === 'Dubai'
                ? ['dubai', 'uae', 'united arab emirates']
                : [country.toLowerCase()];
      return aliases.some((a) => hasToken(hay, a));
    };
    const isIT = (job) => /software|developer|engineer|frontend|backend|full stack|devops|data|ai|ml|java|python|react|node|cloud|sre|qa|security|it /i.test(`${job.title} ${(job.tags || []).join(' ')} ${job.description || ''}`);
    const isNonIT = (job) => /sales|marketing|hr|finance|operations|support|content|recruiter|business analyst|product manager|designer/i.test(`${job.title} ${(job.tags || []).join(' ')} ${job.description || ''}`);
    const matchesWorkMode = (job) => {
      if (workMode === 'Any') return true;
      const hay = `${job.location} ${job.title} ${job.description}`.toLowerCase();
      if (workMode === 'Remote') return hay.includes('remote');
      if (workMode === 'Hybrid') return hay.includes('hybrid');
      if (workMode === 'Onsite') return !hay.includes('remote') && !hay.includes('hybrid');
      return true;
    };

    const dedupe = (items) => {
      const seen = new Set();
      return items.filter((j) => {
        const key = `${j.title}|${j.company}|${j.location}|${j.link}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    let jobs = dedupe([...jsearchJobs, ...adzunaJobs, ...arbeitJobs, ...remotiveJobs]).filter(matchesCountry);
    if (roleType === 'IT') jobs = jobs.filter(isIT);
    if (roleType === 'Non-IT') jobs = jobs.filter((j) => isNonIT(j) || !isIT(j));
    if (roleFocus && !/^all /i.test(roleFocus)) jobs = jobs.filter((j) => `${j.title} ${j.description}`.toLowerCase().includes(roleFocus.toLowerCase()));
    if (visa === 'Sponsorship') jobs = jobs.filter((j) => j.visa_sponsorship === 'Yes');
    jobs = jobs.filter(matchesWorkMode);

    jobs = jobs
      .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
      .slice(0, maxJobs);

    const bySource = jobs.reduce((acc, j) => {
      acc[j.source] = (acc[j.source] || 0) + 1;
      return acc;
    }, {});

    const now = Date.now();
    for (const j of jobs.slice(0, 1500)) {
      const key = `${j.title}|${j.company}|${j.link}`.toLowerCase();
      if (seenJobKeys.has(key)) continue;
      seenJobKeys.add(key);
      jobEvents.push({
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        title: j.title,
        company: j.company,
        location: j.location,
        link: j.link,
        source: j.source,
      });
    }
    if (jobEvents.length > 8000) {
      jobEvents.splice(0, jobEvents.length - 8000);
    }

    const configWarnings = [];
    if (!RAPIDAPI_JSEARCH_KEY) configWarnings.push('LinkedIn/Indeed/Naukri/Foundit ingestion via JSearch is disabled. Set RAPIDAPI_JSEARCH_KEY in .env.local.');
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) configWarnings.push('Adzuna is disabled. Set ADZUNA_APP_ID and ADZUNA_APP_KEY in .env.local.');

    res.json({ jobs, total: jobs.length, query, country, roleType, roleFocus, visa, workMode, providers, bySource, configWarnings, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Live jobs endpoint error', err);
    res.status(500).json({ error: err?.message || 'jobs server error' });
  }
});

app.get('/api/jobs/events', (req, res) => {
  const cursor = Number(req.query?.cursor || 0);
  const limit = Math.max(1, Math.min(300, Number(req.query?.limit || 100)));
  const events = jobEvents.filter((e) => e.createdAt > cursor).slice(-limit);
  const nextCursor = events.length ? events[events.length - 1].createdAt : cursor;
  res.json({ events, cursor: nextCursor, updatedAt: new Date().toISOString() });
});

app.get('/api/jobs/stream', (req, res) => {
  let cursor = Number(req.query?.cursor || 0);
  if (!Number.isFinite(cursor)) cursor = 0;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send({ type: 'ready', cursor, ts: Date.now() });

  const timer = setInterval(() => {
    const events = jobEvents.filter((e) => e.createdAt > cursor).slice(-120);
    if (events.length > 0) {
      cursor = events[events.length - 1].createdAt;
      send({ type: 'events', cursor, events, ts: Date.now() });
    } else {
      send({ type: 'heartbeat', cursor, ts: Date.now() });
    }
  }, 5000);

  req.on('close', () => {
    clearInterval(timer);
    try { res.end(); } catch { /* ignore */ }
  });
});

// Roadmap endpoint
app.post('/api/genai/roadmap', (req, res) => {
  const { role, currentSkills, availability } = req.body;

  res.json({
    role: role || 'Software Engineer',
    duration_weeks: 12,
    weekly_plan: [
      {
        week: 1,
        topic: 'Fundamentals & Setup',
        resources: [
          { title: 'Learn Git & GitHub', link: 'https://github.com' },
          { title: 'JavaScript Basics', link: 'https://javascript.info' }
        ],
        project: 'Setup development environment'
      },
      {
        week: 2,
        topic: 'Core Programming Concepts',
        resources: [
          { title: 'Variables, Data Types', link: 'https://javascript.info/types' },
          { title: 'Functions & Scope', link: 'https://javascript.info/function-basics' }
        ],
        project: 'Build a calculator app'
      },
      {
        week: 3,
        topic: 'DOM & Web APIs',
        resources: [
          { title: 'DOM Manipulation', link: 'https://developer.mozilla.org/en-US/docs/Web/API/DOM' },
          { title: 'Fetch API', link: 'https://javascript.info/fetch' }
        ],
        project: 'Build weather app with API'
      }
    ]
  });
});

// Courses endpoint
app.post('/api/genai/courses', (req, res) => {
  const { role, level, budget } = req.body;

  res.json({
    courses: [
      {
        title: 'The Complete JavaScript Course 2024',
        platform: 'Udemy',
        duration: '69 hours',
        difficulty: 'Beginner to Advanced',
        link: 'https://udemy.com',
        reason: 'Comprehensive JavaScript fundamentals'
      },
      {
        title: 'React - The Complete Guide',
        platform: 'Udemy',
        duration: '48 hours',
        difficulty: 'Intermediate',
        link: 'https://udemy.com',
        reason: 'Master React for modern web development'
      },
      {
        title: 'Web Development Bootcamp',
        platform: 'Codecademy',
        duration: '6 months',
        difficulty: 'Beginner',
        link: 'https://codecademy.com',
        reason: 'Full-stack development skills'
      },
      {
        title: 'Free JavaScript Tutorial',
        platform: 'W3Schools',
        duration: 'Self-paced',
        difficulty: 'Beginner',
        link: 'https://w3schools.com/js/',
        reason: 'Free, interactive JavaScript learning'
      }
    ]
  });
});

// Resume analysis endpoint
app.post('/api/genai/analyze', (req, res) => {
  const { jobDescription } = req.body || {};
  const jdKeywords = (jobDescription || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter(Boolean);
  const skillSet = ['javascript', 'react', 'node.js', 'html', 'css', 'mongodb', 'git', 'typescript', 'docker', 'aws'];
  const overlap = jdKeywords.filter((k) => skillSet.includes(k)).length;
  const matchScore = jobDescription ? Math.min(95, 35 + overlap * 10) : 0;

  res.json({
    skills_identified: [
      'JavaScript',
      'React',
      'Node.js',
      'HTML/CSS',
      'MongoDB',
      'Git'
    ],
    missing_skills: [
      'TypeScript',
      'Docker',
      'AWS',
      'System Design',
      'Testing (Jest/Mocha)'
    ],
    suggested_roles: [
      'Full Stack Developer',
      'Frontend Developer',
      'Junior Software Engineer',
      'MERN Stack Developer'
    ],
    improvement_plan: [
      'Learn TypeScript for type safety',
      'Practice system design patterns',
      'Build 3-5 production projects',
      'Contribute to open source',
      'Study data structures & algorithms'
    ],
    jd_match_score: matchScore,
    jd_feedback: jobDescription ? [
      'Resume aligns with core engineering stack requirements.',
      'Add project impact metrics to improve shortlist probability.',
      'Highlight production debugging and deployment experience.'
    ] : []
  });
});

// Role intelligence endpoint
app.post('/api/genai/role', (req, res) => {
  const { roleName } = req.body;

  res.json({
    role: roleName || 'Software Engineer',
    overview: 'A Software Engineer designs, builds, and maintains software applications and systems.',
    required_skills: [
      'Programming Languages (Java, Python, JavaScript, C++)',
      'Data Structures & Algorithms',
      'System Design',
      'Database Design',
      'Version Control (Git)',
      'Software Development Lifecycle',
      'Problem Solving',
      'Communication Skills'
    ],
    salary_range: '$80,000 - $150,000+',
    responsibilities: [
      'Write clean, maintainable code',
      'Design system architecture',
      'Debug and optimize applications',
      'Collaborate with product and design teams',
      'Review peer code',
      'Participate in system design discussions',
      'Document code and architecture'
    ],
    roadmap_summary: [
      'Master core programming language',
      'Learn data structures and algorithms',
      'Understand system design principles',
      'Build real-world projects',
      'Learn testing and deployment',
      'Develop soft skills for teamwork'
    ]
  });
});

// Chat endpoint (real Gemini responses for development)
app.post('/api/genai/chat', async (req, res) => {
  try {
    const { history, message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'missing message' });
    if (!API_KEY) return res.status(500).json({ error: 'GENAI_API_KEY not set' });

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const contents = [...(history || []), { role: 'user', parts: [{ text: message }] }];
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction:
          'You are a general-purpose AI assistant. Answer naturally and directly. If a query needs current information, use available web grounding when possible.',
        tools: [{ googleSearch: {} }]
      }
    });

    res.json({ text: result.text || '', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: err?.message || 'chat server error' });
  }
});

app.post('/api/genai/adaptive-practice', async (req, res) => {
  try {
    const { targetRole, weakTopics, recentSubmissions } = req.body || {};
    if (!targetRole) return res.status(400).json({ error: 'missing targetRole' });
    if (!API_KEY) return res.status(500).json({ error: 'GENAI_API_KEY not set' });

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const prompt = [
      'Generate exactly 5 adaptive coding tasks for today.',
      `Target role: ${targetRole}`,
      `Weak topics: ${Array.isArray(weakTopics) && weakTopics.length ? weakTopics.join(', ') : 'None'}`,
      `Recent submissions: ${JSON.stringify(recentSubmissions || []).slice(0, 1200)}`,
      'Return strict JSON object: { "items": [{ "title": "...", "topic": "...", "difficulty": "Easy|Medium|Hard", "reason": "..." }] }',
      'Difficulty split should be 1 Easy, 3 Medium, 1 Hard.',
    ].join('\n');

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const payload = JSON.parse(result.text || '{}');
    const items = Array.isArray(payload?.items) ? payload.items.slice(0, 5) : [];
    res.json({ items });
  } catch (err) {
    console.error('Adaptive practice endpoint error:', err);
    res.status(500).json({ error: err?.message || 'adaptive practice server error' });
  }
});

const runProcess = (command, args, cwd, stdin = '', timeoutMs = 4000) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { cwd, shell: false });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });

const getFileConfig = (language) => {
  switch (language) {
    case 'javascript': return { file: 'Main.js', compile: null, run: ['node', ['Main.js']] };
    case 'python': return { file: 'main.py', compile: null, run: ['python', ['main.py']] };
    case 'java': return { file: 'Main.java', compile: ['javac', ['Main.java']], run: ['java', ['Main']] };
    case 'c': return { file: 'main.c', compile: ['gcc', ['main.c', '-O2', '-std=c17', '-o', 'main']], run: [process.platform === 'win32' ? 'main.exe' : './main', []] };
    case 'cpp': return { file: 'main.cpp', compile: ['g++', ['main.cpp', '-O2', '-std=c++17', '-o', 'main']], run: [process.platform === 'win32' ? 'main.exe' : './main', []] };
    default: throw new Error(`Unsupported language: ${language}`);
  }
};

app.post('/api/judge/run', async (req, res) => {
  try {
    const { code, testCases, language = 'javascript', mode = 'stdin', functionName } = req.body || {};
    if (!code || !Array.isArray(testCases)) {
      return res.status(400).json({ error: 'missing code/testCases' });
    }

    if (mode === 'function') {
      if (!functionName) return res.status(400).json({ error: 'missing functionName for function mode' });
      const runner = new Function(`
${code}
if (typeof ${functionName} !== "function") throw new Error("Function not found: ${functionName}");
return ${functionName};
`)();
      const normalize = (v) => JSON.stringify(v);
      const started = Date.now();
      const results = testCases.map((test) => {
        try {
          const input = Array.isArray(test.input) ? test.input : [];
          const actual = runner(...input);
          const passed = normalize(actual) === normalize(test.expected);
          return { passed, expected: test.expected, actual };
        } catch (error) {
          return { passed: false, expected: test.expected, actual: null, error: error?.message || 'runtime error' };
        }
      });
      const passed = results.filter((x) => x.passed).length;
      const total = results.length;
      const runtime = Date.now() - started;
      const telemetry = req.body?.telemetry || {};
      const antiCheat = {
        riskScore: Math.min(100, (telemetry.pasteEvents || 0) * 3 + (telemetry.tabSwitches || 0) * 2),
        flags: [
          ...((telemetry.pasteEvents || 0) > 8 ? ['high_paste_activity'] : []),
          ...((telemetry.tabSwitches || 0) > 12 ? ['frequent_tab_switching'] : []),
        ],
        fingerprint: telemetry.userAgentHash || 'unknown'
      };
      const failingCaseIndex = results.findIndex((x) => !x.passed);
      const verdict = passed === total ? 'Accepted' : results.some((x) => x.error) ? 'Runtime Error' : 'Wrong Answer';
      return res.json({
        passed, total, results, status: passed === total ? 'accepted' : 'failed',
        runtimeMs: runtime, antiCheat, verdict,
        failingCaseIndex: failingCaseIndex >= 0 ? failingCaseIndex : undefined,
        percentileRuntime: Math.max(1, Math.min(99, 100 - Math.round(runtime / 4))),
        percentileMemory: 60 + Math.floor(Math.random() * 35),
        stdout: failingCaseIndex >= 0 ? String(results[failingCaseIndex].actual ?? '') : ''
      });
    }

    const cfg = getFileConfig(language);
    const tmp = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'judge-dev-'));
    try {
      await fsPromises.writeFile(path.join(tmp, cfg.file), code, 'utf8');
      if (cfg.compile) {
        const [compileCmd, compileArgs] = cfg.compile;
        const compileOut = await runProcess(compileCmd, compileArgs, tmp);
        if (compileOut.code !== 0) {
          return res.json({
            passed: 0,
            total: testCases.length,
            results: testCases.map((t) => ({ passed: false, expected: t.expected, actual: '', error: (compileOut.stderr || compileOut.stdout || 'compile failed').trim() })),
            status: 'error',
            runtimeMs: 0
          });
        }
      }

      const [runCmd, runArgs] = cfg.run;
      const normalize = (v) => typeof v === 'string' ? v.trim() : JSON.stringify(v);
      const started = Date.now();
      const results = [];
      for (const t of testCases) {
        const stdin = Array.isArray(t.input) ? String(t.input[0] ?? '') : '';
        const out = await runProcess(runCmd, runArgs, tmp, stdin);
        const actual = (out.stdout || '').trim();
        const expected = normalize(t.expected);
        const passed = out.code === 0 && normalize(actual) === expected;
        results.push({ passed, expected: t.expected, actual, error: out.code === 0 ? undefined : (out.stderr || out.stdout || `exit ${out.code}`).trim() });
      }
      const passed = results.filter((x) => x.passed).length;
      const runtime = Date.now() - started;
      const telemetry = req.body?.telemetry || {};
      const antiCheat = {
        riskScore: Math.min(100, (telemetry.pasteEvents || 0) * 3 + (telemetry.tabSwitches || 0) * 2),
        flags: [
          ...((telemetry.pasteEvents || 0) > 8 ? ['high_paste_activity'] : []),
          ...((telemetry.tabSwitches || 0) > 12 ? ['frequent_tab_switching'] : []),
        ],
        fingerprint: telemetry.userAgentHash || 'unknown'
      };
      const failingCaseIndex = results.findIndex((x) => !x.passed);
      const hasTimeout = results.some((x) => /time limit exceeded/i.test(x.error || ''));
      const hasRuntime = results.some((x) => x.error && !/time limit exceeded/i.test(x.error));
      const verdict = passed === results.length ? 'Accepted' : hasTimeout ? 'Time Limit Exceeded' : hasRuntime ? 'Runtime Error' : 'Wrong Answer';
      return res.json({
        passed,
        total: results.length,
        results,
        status: passed === results.length ? 'accepted' : 'failed',
        runtimeMs: runtime,
        antiCheat,
        verdict,
        failingCaseIndex: failingCaseIndex >= 0 ? failingCaseIndex : undefined,
        percentileRuntime: Math.max(1, Math.min(99, 100 - Math.round(runtime / 6))),
        percentileMemory: 58 + Math.floor(Math.random() * 38),
        stdout: failingCaseIndex >= 0 ? String(results[failingCaseIndex].actual ?? '') : ''
      });
    } finally {
      await fsPromises.rm(tmp, { recursive: true, force: true });
    }
  } catch (error) {
    return res.json({ passed: 0, total: 0, results: [], status: 'error', runtimeMs: 0, error: error?.message || 'judge error' });
  }
});

app.post('/api/judge/submit', (req, res) => {
  try {
    const { code, testCases } = req.body || {};
    if (!code || !Array.isArray(testCases)) return res.status(400).json({ error: 'missing code/testCases' });
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    judgeJobs.set(id, { id, ...req.body, status: 'queued', createdAt: now, updatedAt: now });
    return res.json({ jobId: id, status: 'queued' });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'submit queue error' });
  }
});

app.get('/api/judge/status', (req, res) => {
  const id = `${req.query?.id || ''}`.trim();
  if (!id) return res.status(400).json({ error: 'missing id' });
  const job = judgeJobs.get(id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  return res.json(job);
});

app.post('/api/judge/worker-claim', (req, res) => {
  const token = `${req.headers?.['x-worker-token'] || ''}`;
  if (token !== WORKER_TOKEN) return res.status(401).json({ error: 'unauthorized worker' });
  const next = [...judgeJobs.values()].find((j) => j.status === 'queued');
  if (!next) return res.json({ job: null });
  next.status = 'running';
  next.updatedAt = Date.now();
  judgeJobs.set(next.id, next);
  return res.json({ job: next });
});

app.post('/api/judge/worker-complete', (req, res) => {
  const token = `${req.headers?.['x-worker-token'] || ''}`;
  if (token !== WORKER_TOKEN) return res.status(401).json({ error: 'unauthorized worker' });
  const { id, result, error } = req.body || {};
  if (!id) return res.status(400).json({ error: 'missing id' });
  const job = judgeJobs.get(id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  job.status = error ? 'failed' : 'completed';
  job.error = error || undefined;
  job.result = result || undefined;
  job.updatedAt = Date.now();
  judgeJobs.set(id, job);
  return res.json({ ok: true });
});

const PORT = 3004;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nâœ“ Mock API Server running on http://localhost:${PORT}`);
  console.log('\nEndpoints:');
  console.log('  POST /api/genai/roadmap   â†’ Career roadmap');
  console.log('  POST /api/genai/courses   â†’ Course recommendations');
  console.log('  POST /api/genai/analyze   â†’ Resume analysis');
  console.log('  POST /api/genai/role      â†’ Role intelligence');
  console.log('  POST /api/genai/chat      â†’ AI chat');
  console.log('  POST /api/genai/adaptive-practice â†’ Adaptive daily practice');
  console.log('  POST /api/judge/run â†’ Run coding submission');
  console.log('  POST /api/judge/submit â†’ Queue submission');
  console.log('  GET  /api/judge/status?id=... â†’ Queue status');
  console.log('  POST /api/judge/worker-claim â†’ Worker claim');
  console.log('  POST /api/judge/worker-complete â†’ Worker complete');
  console.log('');
  console.log('  GET  /api/jobs/search?q=python    â†’ Live jobs search\n');
  console.log('  GET  /api/jobs/events?cursor=0    â†’ Job event queue\n');
  console.log('  GET  /api/jobs/stream?cursor=0    â†’ Job SSE stream\n');
  console.log('ðŸ”„ Frontend should connect to this server\n');
});


