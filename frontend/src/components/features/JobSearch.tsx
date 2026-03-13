import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sendChatMessage } from '../../services/geminiService';
import AdvancedFilterDrawer from '../common/AdvancedFilterDrawer';
import {
  getSavedJobs,
  JobApplicationStage,
  saveJobToStorage,
  updateSavedJobStage,
  type SavedJob,
} from '../../services/storageService';

interface Props {
  onBack: () => void;
  onNotifyJobs?: (jobs: { title: string; company?: string; location?: string; link: string }[]) => void;
  selectedJobLink?: string | null;
  onClearSelected?: () => void;
  onGoToResumeWithJob?: (jobDescription: string) => void;
  initialCountry?: CountryFilter;
  onCountryRouteChange?: (country: CountryFilter) => void;
}

type LiveJob = {
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

type SortBy = 'relevance' | 'newest' | 'company';
type ProviderMeta = { name: string; status: 'ok' | 'empty' | 'failed' | 'skipped'; count: number; error?: string };
type CountryFilter = 'All' | 'India' | 'UK' | 'USA' | 'Australia' | 'Dubai';
type RoleTypeFilter = 'All' | 'IT' | 'Non-IT';
type SourceFilter =
  | 'All' | 'Remotive' | 'Arbeitnow' | 'Jobicy' | 'TheMuse' | 'RemoteOK' | 'Adzuna' | 'JSearch'
  | 'LinkedIn' | 'Indeed' | 'Naukri' | 'Foundit' | 'Internshala' | 'Apna' | 'WorkIndia'
  | 'Shine' | 'Freshersworld' | 'Cutshort' | 'Superset' | 'Glassdoor' | 'ZipRecruiter'
  | 'Monster' | 'CareerBuilder' | 'USAJobs' | 'Reed' | 'Totaljobs' | 'CV-Library'
  | 'GOV.UK Jobs' | 'Seek' | 'Jora' | 'CareerOne' | 'GulfTalent' | 'Bayt'
  | 'Dubai Careers' | 'Naukri Gulf';
type VisaFilter = 'Any' | 'Sponsorship';
type WorkModeFilter = 'Any' | 'Remote' | 'Onsite' | 'Hybrid';

const TRENDING_QUERIES = ['Software Engineer', 'Data Scientist', 'Product Manager', 'Data Analyst'];
const TRENDING_LOCATIONS = ['Remote', 'San Francisco', 'New York'];
const COUNTRY_BOARDS: Array<{ key: CountryFilter; label: string; hint: string }> = [
  { key: 'All', label: 'All Countries', hint: 'Global multi-platform feed' },
  { key: 'India', label: 'India', hint: 'Naukri, Foundit, Internshala, Superset' },
  { key: 'USA', label: 'USA', hint: 'Indeed, LinkedIn, Glassdoor, USAJobs' },
  { key: 'UK', label: 'UK', hint: 'Indeed UK, Reed, Totaljobs, GOV.UK' },
  { key: 'Australia', label: 'Australia', hint: 'Indeed AU, Seek, Jora, CareerOne' },
  { key: 'Dubai', label: 'Dubai', hint: 'Indeed UAE, GulfTalent, Bayt, Naukri Gulf' },
];
const IT_ROLE_OPTIONS = ['All IT Roles', 'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'DevOps Engineer', 'QA Engineer', 'Cloud Engineer', 'Cyber Security'];
const NON_IT_ROLE_OPTIONS = ['All Non-IT Roles', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Customer Support', 'Business Analyst', 'Content Writer', 'Recruiter'];

const STAGE_OPTIONS: Array<{ value: JobApplicationStage; label: string }> = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'aptitude_round', label: 'Aptitude Round' },
  { value: 'technical_round', label: 'Technical Round' },
  { value: 'interview_round', label: 'Interview Round' },
  { value: 'offer_letter', label: 'Offer Letter' },
];

const CURATED_FALLBACK_JOBS: LiveJob[] = [
  {
    id: 'curated-linkedin-se',
    title: 'Software Engineer',
    company: 'Global Listings',
    location: 'Remote',
    country: 'Global',
    source: 'LinkedIn',
    link: 'https://www.linkedin.com/jobs/search/?keywords=software%20engineer',
    posted_at: new Date().toISOString(),
    tags: ['software', 'engineering', 'it'],
    description: 'Curated fallback listing from LinkedIn job search results.',
    employment_type: 'Full-time',
    salary: '',
  },
  {
    id: 'curated-indeed-it',
    title: 'IT and Non-IT Openings',
    company: 'Global Listings',
    location: 'Global',
    country: 'Global',
    source: 'Indeed',
    link: 'https://www.indeed.com/jobs?q=software+engineer',
    posted_at: new Date().toISOString(),
    tags: ['it', 'non-it', 'global'],
    description: 'Curated fallback listing from Indeed search results.',
    employment_type: '',
    salary: '',
  },
  {
    id: 'curated-naukri-india',
    title: 'Software and Non-IT Jobs',
    company: 'India Listings',
    location: 'India',
    country: 'India',
    source: 'Naukri',
    link: 'https://www.naukri.com/software-engineer-jobs',
    posted_at: new Date().toISOString(),
    tags: ['india', 'software', 'jobs'],
    description: 'Curated fallback listing from Naukri.',
    employment_type: '',
    salary: '',
  },
];

const getCuratedFallbackJobs = (country: CountryFilter, visa: VisaFilter): LiveJob[] => {
  let items = [...CURATED_FALLBACK_JOBS];
  if (country !== 'All') {
    items = items.filter((j) => j.country === country);
  }
  if (visa === 'Sponsorship') {
    items = items.filter((j) => j.visa_sponsorship === 'Yes');
  }
  return items;
};

const formatTimeAgo = (dateIso: string) => {
  const d = new Date(dateIso).getTime();
  if (Number.isNaN(d)) return 'Recently';
  const diffMin = Math.max(1, Math.floor((Date.now() - d) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
};

const getFreshness = (dateIso: string): { label: string; tone: string } => {
  const d = new Date(dateIso).getTime();
  if (Number.isNaN(d)) return { label: 'Recent', tone: 'bg-slate-100 text-slate-700' };
  const ageHours = (Date.now() - d) / 3600000;
  if (ageHours <= 24) return { label: 'Fresh', tone: 'bg-emerald-100 text-emerald-700' };
  if (ageHours <= 72) return { label: 'Recent', tone: 'bg-blue-100 text-blue-700' };
  return { label: 'Older', tone: 'bg-amber-100 text-amber-700' };
};

const getRelevanceScore = (job: LiveJob, query: string, location: string) => {
  const q = query.trim().toLowerCase();
  const l = location.trim().toLowerCase();
  const hay = `${job.title} ${job.company} ${job.tags.join(' ')}`.toLowerCase();
  let score = 0;
  if (q && hay.includes(q)) score += 4;
  if (q && job.title.toLowerCase().includes(q)) score += 4;
  if (l && job.location.toLowerCase().includes(l)) score += 2;
  if (job.tags.some((t) => q && t.toLowerCase().includes(q))) score += 2;
  return score;
};

const getMatchPercent = (job: LiveJob, query: string, location: string, roleFocus: string) => {
  const q = query.trim().toLowerCase();
  const l = location.trim().toLowerCase();
  const r = roleFocus.trim().toLowerCase();
  const hay = `${job.title} ${job.company} ${job.description} ${job.tags.join(' ')}`.toLowerCase();

  let score = 40;
  if (q && hay.includes(q)) score += 28;
  if (q && job.title.toLowerCase().includes(q)) score += 12;
  if (l && job.location.toLowerCase().includes(l)) score += 10;
  if (r && r !== 'all roles' && r !== 'all it roles' && r !== 'all non-it roles' && hay.includes(r)) score += 10;
  if (job.visa_sponsorship === 'Yes') score += 3;
  if (/remote/i.test(job.location)) score += 2;
  return Math.max(35, Math.min(99, Math.round(score)));
};

const stageLabel = (stage: JobApplicationStage) =>
  STAGE_OPTIONS.find((x) => x.value === stage)?.label || 'Saved';

const toSavedJobInput = (job: LiveJob) => ({
  jobId: job.id,
  title: job.title,
  company: job.company,
  location: job.location,
  country: job.country || 'Global',
  source: job.source,
  link: job.link,
  postedAt: job.posted_at,
  description: job.description || '',
  employmentType: job.employment_type,
  salary: job.salary,
});

const JobSearch: React.FC<Props> = ({ onBack, onNotifyJobs, selectedJobLink, onClearSelected, onGoToResumeWithJob, initialCountry = 'All', onCountryRouteChange }) => {
  const [query, setQuery] = useState('software engineer');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState<CountryFilter>(initialCountry);
  const [roleType, setRoleType] = useState<RoleTypeFilter>('All');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('All');
  const [visaFilter, setVisaFilter] = useState<VisaFilter>('Any');
  const [workMode, setWorkMode] = useState<WorkModeFilter>('Any');
  const [roleFocus, setRoleFocus] = useState('All Roles');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loadingLive, setLoadingLive] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [providers, setProviders] = useState<ProviderMeta[]>([]);
  const [bySource, setBySource] = useState<Record<string, number>>({});
  const [configWarnings, setConfigWarnings] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [stageDraft, setStageDraft] = useState<JobApplicationStage>('applied');
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterError, setCoverLetterError] = useState('');
  const [listScrollTop, setListScrollTop] = useState(0);
  const [listHeight, setListHeight] = useState(680);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedJobLink) return;
    window.open(selectedJobLink, '_blank', 'noopener');
    onClearSelected && onClearSelected();
  }, [selectedJobLink, onClearSelected]);

  useEffect(() => {
    if (initialCountry !== country) setCountry(initialCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCountry]);

  useEffect(() => {
    onCountryRouteChange && onCountryRouteChange(country);
  }, [country, onCountryRouteChange]);

  useEffect(() => {
    setSavedJobs(getSavedJobs());
  }, []);

  const loadLiveJobs = async () => {
    if (!query.trim()) return;
    try {
      setLoadingLive(true);
      setError('');
      const effectiveQ = `${query.trim()} ${location.trim()}`.trim();
      const resp = await fetch(`/api/jobs/search?q=${encodeURIComponent(effectiveQ)}&country=${encodeURIComponent(country)}&roleType=${encodeURIComponent(roleType)}&visa=${encodeURIComponent(visaFilter)}&workMode=${encodeURIComponent(workMode)}&roleFocus=${encodeURIComponent(roleFocus)}&max=3000`);
      if (!resp.ok) throw new Error(`Live jobs error ${resp.status}`);
      const data = await resp.json();
      let jobs = Array.isArray(data?.jobs) ? (data.jobs as LiveJob[]) : [];
      if (!jobs.length) {
        const retryResp = await fetch(`/api/jobs/search?q=${encodeURIComponent('developer')}&country=${encodeURIComponent(country)}&roleType=${encodeURIComponent(roleType)}&visa=${encodeURIComponent(visaFilter)}&workMode=${encodeURIComponent(workMode)}&roleFocus=${encodeURIComponent(roleFocus)}&max=3000`);
        if (retryResp.ok) {
          const retryData = await retryResp.json();
          jobs = Array.isArray(retryData?.jobs) ? (retryData.jobs as LiveJob[]) : [];
          if (!jobs.length) jobs = getCuratedFallbackJobs(country, visaFilter);
          setProviders(Array.isArray(retryData?.providers) ? retryData.providers : []);
          setBySource(retryData?.bySource && typeof retryData.bySource === 'object' ? retryData.bySource : {});
          setConfigWarnings(Array.isArray(retryData?.configWarnings) ? retryData.configWarnings : []);
        } else {
          jobs = getCuratedFallbackJobs(country, visaFilter);
        }
      }
      setProviders(Array.isArray(data?.providers) ? data.providers : []);
      setBySource(data?.bySource && typeof data.bySource === 'object' ? data.bySource : {});
      setConfigWarnings(Array.isArray(data?.configWarnings) ? data.configWarnings : []);
      setLiveJobs(jobs);
      setLastUpdated(Date.now());
      if (!selectedJobId && jobs.length) setSelectedJobId(jobs[0].id);
      onNotifyJobs?.(jobs.slice(0, 8).map((j) => ({ title: j.title, company: j.company, location: j.location, link: j.link })));
    } catch (e: any) {
      setError(e?.message || 'Unable to fetch live jobs');
      setLiveJobs([]);
    } finally {
      setLoadingLive(false);
    }
  };

  useEffect(() => {
    loadLiveJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      loadLiveJobs();
    }, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, query, location, country, roleType, visaFilter, workMode, roleFocus]);

  useEffect(() => {
    if (roleType === 'IT' && !IT_ROLE_OPTIONS.includes(roleFocus)) setRoleFocus('All IT Roles');
    if (roleType === 'Non-IT' && !NON_IT_ROLE_OPTIONS.includes(roleFocus)) setRoleFocus('All Non-IT Roles');
    if (roleType === 'All' && roleFocus !== 'All Roles') setRoleFocus('All Roles');
  }, [roleType, roleFocus]);

  useEffect(() => {
    const updateHeight = () => {
      if (listRef.current) setListHeight(listRef.current.clientHeight || 680);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const displayedJobs = useMemo(() => {
    let jobs = [...liveJobs];
    if (sourceFilter !== 'All') {
      jobs = jobs.filter((j) => j.source.toLowerCase() === sourceFilter.toLowerCase());
    }
    if (location.trim()) {
      jobs = jobs.filter((j) => j.location.toLowerCase().includes(location.trim().toLowerCase()));
    }

    if (sortBy === 'newest') {
      jobs.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
    } else if (sortBy === 'company') {
      jobs.sort((a, b) => a.company.localeCompare(b.company));
    } else {
      jobs.sort((a, b) => getRelevanceScore(b, query, location) - getRelevanceScore(a, query, location));
    }

    if (!jobs.length && sourceFilter !== 'All') {
      const fallback = [...liveJobs];
      if (location.trim()) {
        return fallback
          .filter((j) => j.location.toLowerCase().includes(location.trim().toLowerCase()))
          .sort((a, b) => getRelevanceScore(b, query, location) - getRelevanceScore(a, query, location));
      }
      return fallback.sort((a, b) => getRelevanceScore(b, query, location) - getRelevanceScore(a, query, location));
    }

    return jobs;
  }, [liveJobs, sourceFilter, location, sortBy, query]);

  const ROW_HEIGHT = 134;
  const OVERSCAN = 6;
  const startIndex = Math.max(0, Math.floor(listScrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(listHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(displayedJobs.length, startIndex + visibleCount);
  const virtualJobs = displayedJobs.slice(startIndex, endIndex);
  const padTop = startIndex * ROW_HEIGHT;
  const padBottom = Math.max(0, (displayedJobs.length - endIndex) * ROW_HEIGHT);

  const selectedJob = displayedJobs.find((j) => j.id === selectedJobId) || displayedJobs[0] || null;
  const selectedSaved = selectedJob ? savedJobs.find((x) => x.jobId === selectedJob.id || x.link === selectedJob.link) : null;
  const selectedMatchPercent = selectedJob ? getMatchPercent(selectedJob, query, location, roleFocus) : 0;
  const selectedFreshness = selectedJob ? getFreshness(selectedJob.posted_at) : { label: 'Recent', tone: 'bg-slate-100 text-slate-700' };
  const isLikelyIT = (job: LiveJob) => /software|developer|engineer|frontend|backend|full stack|devops|data|ai|ml|java|python|react|node|cloud|qa|sre/i.test(`${job.title} ${job.tags.join(' ')} ${job.description}`);
  const itRolesSummary = Array.from(new Set(displayedJobs.filter(isLikelyIT).map((j) => j.title))).slice(0, 10);
  const nonItRolesSummary = Array.from(new Set(displayedJobs.filter((j) => !isLikelyIT(j)).map((j) => j.title))).slice(0, 10);
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    liveJobs.forEach((j) => {
      counts[j.country || 'Global'] = (counts[j.country || 'Global'] || 0) + 1;
    });
    return counts;
  }, [liveJobs]);

  const handleSave = () => {
    if (!selectedJob) return;
    saveJobToStorage(toSavedJobInput(selectedJob));
    setSavedJobs(getSavedJobs());
  };

  const handleTrack = () => {
    if (!selectedJob) return;
    const existing = savedJobs.find((x) => x.jobId === selectedJob.id || x.link === selectedJob.link);
    if (!existing) {
      const created = saveJobToStorage({ ...toSavedJobInput(selectedJob), stage: stageDraft });
      setSavedJobs(getSavedJobs());
      setStageDraft(created.stage);
      return;
    }
    updateSavedJobStage(existing.id, stageDraft);
    setSavedJobs(getSavedJobs());
  };

  const handleCoverLetter = async () => {
    if (!selectedJob) return;
    setCoverLetterLoading(true);
    setCoverLetterError('');
    try {
      const prompt = `Write a professional cover letter for this job. Keep it concise and job-specific.
Return plain text only.
Job Title: ${selectedJob.title}
Company: ${selectedJob.company}
Location: ${selectedJob.location}
Employment Type: ${selectedJob.employment_type || 'Not specified'}
Job Description:
${selectedJob.description || 'Not provided'}`;
      const text = await sendChatMessage([], prompt);
      setCoverLetter(text.trim() || 'Unable to generate cover letter text.');
    } catch (e: any) {
      setCoverLetterError(e?.message || 'Cover letter generation failed.');
    } finally {
      setCoverLetterLoading(false);
    }
  };

  const handleAiResume = () => {
    if (!selectedJob) return;
    const jd = `Role: ${selectedJob.title}
Company: ${selectedJob.company}
Location: ${selectedJob.location}
Source: ${selectedJob.source}

Job Description:
${selectedJob.description || 'Description not available.'}`;
    onGoToResumeWithJob?.(jd);
  };

  return (
    <div className="space-y-4 premium-page">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-xl border border-slate-700 shadow-sm overflow-hidden text-white">
        <div className="p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Country Job Boards</h3>
              <p className="text-xs text-blue-100 mt-1">Open country-specific job boards inside this section.</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20">
              Active: {COUNTRY_BOARDS.find((x) => x.key === country)?.label}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {COUNTRY_BOARDS.map((b) => (
              <button
                key={b.key}
                onClick={() => setCountry(b.key)}
                className={`text-left px-3 py-2 rounded-lg border transition-all ${country === b.key ? 'bg-blue-500/30 border-blue-300 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/15 hover:bg-white/10 text-blue-100'}`}
              >
                <p className="text-sm font-semibold">{b.label}</p>
                <p className="text-[11px] mt-1 opacity-90">{b.hint}</p>
                <p className="text-[10px] mt-1 text-blue-200">Jobs: {b.key === 'All' ? liveJobs.length : (countryCounts[b.key] || 0)}</p>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => { setRoleType('IT'); setRoleFocus('All IT Roles'); }}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${roleType === 'IT' ? 'bg-cyan-400/25 border-cyan-200 text-cyan-100' : 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/15'}`}
            >
              IT Focus
            </button>
            <button
              onClick={() => { setRoleType('Non-IT'); setRoleFocus('All Non-IT Roles'); }}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${roleType === 'Non-IT' ? 'bg-emerald-400/25 border-emerald-200 text-emerald-100' : 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/15'}`}
            >
              Non-IT Focus
            </button>
            <button
              onClick={() => setWorkMode('Remote')}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${workMode === 'Remote' ? 'bg-indigo-400/25 border-indigo-200 text-indigo-100' : 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/15'}`}
            >
              Remote Only
            </button>
            <button
              onClick={() => setVisaFilter('Sponsorship')}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${visaFilter === 'Sponsorship' ? 'bg-amber-400/25 border-amber-200 text-amber-100' : 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/15'}`}
            >
              Visa Sponsorship
            </button>
            <button
              onClick={() => { setRoleType('All'); setRoleFocus('All Roles'); setWorkMode('Any'); setVisaFilter('Any'); setSourceFilter('All'); }}
              className="px-3 py-1.5 text-xs rounded-full border bg-white/10 border-white/20 text-blue-100 hover:bg-white/15 transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden premium-card">
        <div className="p-4 border-b border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search and find your dream job"
              className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 outline-none lg:col-span-2 transition-all focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, state, or remote"
              className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 outline-none lg:col-span-2 transition-all focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryFilter)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-slate-700"
            >
              <option value="All">All Countries</option>
              <option value="India">India</option>
              <option value="UK">UK</option>
              <option value="USA">USA</option>
              <option value="Australia">Australia</option>
              <option value="Dubai">Dubai</option>
            </select>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value as RoleTypeFilter)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-slate-700"
            >
              <option value="All">All Roles</option>
              <option value="IT">IT</option>
              <option value="Non-IT">Non-IT</option>
            </select>
            <select
              value={roleFocus}
              onChange={(e) => setRoleFocus(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-slate-700"
            >
              {roleType === 'IT' && IT_ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              {roleType === 'Non-IT' && NON_IT_ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              {roleType === 'All' && <option value="All Roles">All Roles</option>}
            </select>
            <select
              value={visaFilter}
              onChange={(e) => setVisaFilter(e.target.value as VisaFilter)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-slate-700"
            >
              <option value="Any">Visa: Any</option>
              <option value="Sponsorship">Visa Sponsorship</option>
            </select>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as WorkModeFilter)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-slate-700"
            >
              <option value="Any">Work Mode: Any</option>
              <option value="Remote">Remote</option>
              <option value="Onsite">Onsite</option>
              <option value="Hybrid">Hybrid</option>
            </select>
            <button onClick={loadLiveJobs} disabled={loadingLive} className="bg-blue-600 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60">
              {loadingLive ? 'Loading...' : 'Search'}
            </button>
            <button
              onClick={() => setAdvancedOpen(true)}
              className="rounded-lg px-4 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Filters
            </button>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-slate-700 lg:col-span-1"
            >
              <option value="All">All Sources</option>
              <option value="Remotive">Remotive</option>
              <option value="Arbeitnow">Arbeitnow</option>
              <option value="Jobicy">Jobicy</option>
              <option value="TheMuse">TheMuse</option>
              <option value="RemoteOK">RemoteOK</option>
              <option value="Adzuna">Adzuna</option>
              <option value="JSearch">JSearch</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Indeed">Indeed</option>
              <option value="Naukri">Naukri</option>
              <option value="Foundit">Foundit</option>
              <option value="Internshala">Internshala</option>
              <option value="Apna">Apna</option>
              <option value="WorkIndia">WorkIndia</option>
              <option value="Shine">Shine</option>
              <option value="Freshersworld">Freshersworld</option>
              <option value="Cutshort">Cutshort</option>
              <option value="Superset">Superset</option>
              <option value="Glassdoor">Glassdoor</option>
              <option value="ZipRecruiter">ZipRecruiter</option>
              <option value="Monster">Monster</option>
              <option value="CareerBuilder">CareerBuilder</option>
              <option value="USAJobs">USAJobs</option>
              <option value="Reed">Reed</option>
              <option value="Totaljobs">Totaljobs</option>
              <option value="CV-Library">CV-Library</option>
              <option value="GOV.UK Jobs">GOV.UK Jobs</option>
              <option value="Seek">Seek</option>
              <option value="Jora">Jora</option>
              <option value="CareerOne">CareerOne</option>
              <option value="GulfTalent">GulfTalent</option>
              <option value="Bayt">Bayt</option>
              <option value="Dubai Careers">Dubai Careers</option>
              <option value="Naukri Gulf">Naukri Gulf</option>
            </select>
            <button
              onClick={() => setAutoRefresh((s) => !s)}
              className={`rounded-lg px-4 py-3 border ${autoRefresh ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-300 text-slate-700'}`}
            >
              {autoRefresh ? 'Live On' : 'Live Off'}
            </button>
          </div>

          <div className="mt-3 text-sm text-slate-600 flex flex-wrap items-center gap-2">
            <span className="text-slate-500">Trending:</span>
            {TRENDING_QUERIES.map((t) => (
              <button key={t} onClick={() => setQuery(t)} className="hover:text-blue-700">{t}</button>
            ))}
            <span className="text-slate-400">|</span>
            {TRENDING_LOCATIONS.map((t) => (
              <button key={t} onClick={() => setLocation(t)} className="hover:text-blue-700">{t}</button>
            ))}
            <span className="ml-auto text-xs text-slate-500">
              {lastUpdated ? `Updated ${formatTimeAgo(new Date(lastUpdated).toISOString())}` : 'Not updated yet'}
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Country filter is strict. {country === 'All' ? 'Showing all country openings.' : `Showing only ${country} openings in this board.`}
          </p>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-blue-50 border border-blue-100">
              <p className="text-blue-800 font-semibold">IT Roles (Top)</p>
              <p className="text-blue-700 mt-1">{itRolesSummary.length ? itRolesSummary.join(', ') : 'No IT roles in current filters'}</p>
            </div>
            <div className="p-2 rounded bg-emerald-50 border border-emerald-100">
              <p className="text-emerald-800 font-semibold">Non-IT Roles (Top)</p>
              <p className="text-emerald-700 mt-1">{nonItRolesSummary.length ? nonItRolesSummary.join(', ') : 'No Non-IT roles in current filters'}</p>
            </div>
          </div>
        </div>

        {error && <p className="px-4 py-2 text-sm text-red-600 border-b border-red-100 bg-red-50">{error}</p>}
        {!error && providers.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500">Platforms:</span>
              {providers.map((p) => (
                <span
                  key={p.name}
                  title={p.error || ''}
                  className={`px-2 py-1 rounded ${
                    p.status === 'ok'
                      ? 'bg-emerald-100 text-emerald-700'
                      : p.status === 'empty'
                      ? 'bg-slate-200 text-slate-700'
                      : p.status === 'skipped'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {p.name}: {p.count}
                </span>
              ))}
            </div>
          </div>
        )}
        {!error && configWarnings.length > 0 && (
          <div className="px-4 py-2 border-b border-amber-100 bg-amber-50">
            {configWarnings.map((w) => (
              <p key={w} className="text-xs text-amber-700">{w}</p>
            ))}
          </div>
        )}
        {!error && sourceFilter !== 'All' && liveJobs.length > 0 && displayedJobs.length > 0 && !displayedJobs.some((j) => j.source.toLowerCase() === sourceFilter.toLowerCase()) && (
          <p className="px-4 py-2 text-xs text-amber-700 border-b border-amber-100 bg-amber-50">
            No matches in {sourceFilter}. Showing jobs from all sources.
          </p>
        )}
        {!error && liveJobs.some((j) => j.id.startsWith('curated-')) && (
          <p className="px-4 py-2 text-xs text-blue-700 border-b border-blue-100 bg-blue-50">
            Live provider results were low. Showing curated backup job links so listings remain visible.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] min-h-[640px]">
          <div
            ref={listRef}
            onScroll={(e) => setListScrollTop((e.target as HTMLDivElement).scrollTop)}
            className="border-r border-slate-200 max-h-[76vh] overflow-y-auto"
          >
            <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-800">{displayedJobs.length.toLocaleString()} jobs</p>
              <div className="text-xs text-slate-500 hidden md:block">
                {Object.keys(bySource).length ? Object.entries(bySource).map(([k, v]) => `${k}:${v}`).join(' · ') : 'No source breakdown'}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="text-sm border border-slate-300 rounded px-2 py-1"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="company">Company</option>
              </select>
            </div>

            <div className="premium-stagger" style={{ paddingTop: padTop, paddingBottom: padBottom }}>
            {virtualJobs.map((job) => {
              const active = selectedJob?.id === job.id;
              const tracked = savedJobs.find((x) => x.jobId === job.id || x.link === job.link);
              const matchPercent = getMatchPercent(job, query, location, roleFocus);
              const freshness = getFreshness(job.posted_at);
              return (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 premium-card ${active ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <p className="text-xs text-slate-500">{job.company}</p>
                  <h4 className="text-base font-semibold text-slate-900 mt-1">{job.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{job.location}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{job.source}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{job.country || 'Global'}</span>
                    <span className={`px-2 py-0.5 rounded ${job.visa_sponsorship === 'Yes' ? 'bg-emerald-100 text-emerald-700' : job.visa_sponsorship === 'No' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                      Visa: {job.visa_sponsorship || 'Unknown'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">Match {matchPercent}%</span>
                    <span className={`px-2 py-0.5 rounded ${freshness.tone}`}>{freshness.label}</span>
                    <span className="text-slate-500">{formatTimeAgo(job.posted_at)}</span>
                    {tracked ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{stageLabel(tracked.stage)}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
            </div>

            {displayedJobs.length === 0 && (
              <p className="p-4 text-sm text-slate-500">No jobs found. Try a different query or location.</p>
            )}
          </div>

          <div className="p-5 max-h-[76vh] overflow-y-auto">
            {!selectedJob ? (
              <p className="text-slate-500">Select a job from the list to view details.</p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{selectedJob.company} · Posted {formatTimeAgo(selectedJob.posted_at)}</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-1">{selectedJob.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
                      <span className="px-2 py-1 rounded bg-slate-100">{selectedJob.location}</span>
                      <span className="px-2 py-1 rounded bg-slate-100">{selectedJob.country || 'Global'}</span>
                      <span className="px-2 py-1 rounded bg-slate-100">{selectedJob.source}</span>
                      {selectedJob.employment_type ? <span className="px-2 py-1 rounded bg-slate-100">{selectedJob.employment_type}</span> : null}
                      {selectedJob.salary ? <span className="px-2 py-1 rounded bg-slate-100">{selectedJob.salary}</span> : null}
                      <span className={`px-2 py-1 rounded ${selectedJob.visa_sponsorship === 'Yes' ? 'bg-emerald-100 text-emerald-700' : selectedJob.visa_sponsorship === 'No' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                        Visa: {selectedJob.visa_sponsorship || 'Unknown'}
                      </span>
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">Match {selectedMatchPercent}%</span>
                      <span className={`px-2 py-1 rounded ${selectedFreshness.tone}`}>{selectedFreshness.label}</span>
                      {selectedJob.tags.slice(0, 4).map((tag) => <span key={tag} className="px-2 py-1 rounded bg-blue-50 text-blue-700">{tag}</span>)}
                    </div>
                    {selectedSaved ? (
                      <p className="text-xs text-emerald-700 mt-2">
                        Tracked stage: <span className="font-semibold">{stageLabel(selectedSaved.stage)}</span>
                      </p>
                    ) : null}
                  </div>
                  <button onClick={onBack} className="text-sm text-slate-600 hover:text-slate-900">Back</button>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <a href={selectedJob.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700">Apply Now</a>
                  <button onClick={handleSave} className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
                    {selectedSaved ? 'Saved' : 'Save'}
                  </button>
                  <select
                    value={stageDraft}
                    onChange={(e) => setStageDraft(e.target.value as JobApplicationStage)}
                    className="px-3 py-2 rounded border border-slate-300 text-slate-700"
                  >
                    {STAGE_OPTIONS.filter((s) => s.value !== 'saved').map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button onClick={handleTrack} className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Track</button>
                  <button onClick={handleCoverLetter} disabled={coverLetterLoading} className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    {coverLetterLoading ? 'Generating...' : 'Cover Letter'}
                  </button>
                  <button onClick={handleAiResume} className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">AI Resume</button>
                </div>

                {(coverLetter || coverLetterError) && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">AI Cover Letter</p>
                      {coverLetter ? (
                        <button
                          onClick={() => navigator.clipboard.writeText(coverLetter)}
                          className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-white"
                        >
                          Copy
                        </button>
                      ) : null}
                    </div>
                    {coverLetterError ? (
                      <p className="text-sm text-red-600 mt-2">{coverLetterError}</p>
                    ) : (
                      <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{coverLetter}</p>
                    )}
                  </div>
                )}

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-2xl font-bold text-slate-900 mb-3">Job Description</h4>
                  <p className="text-slate-700 leading-8 whitespace-pre-wrap">
                    {selectedJob.description || 'Description not available from source. Please open the application page for full details.'}
                  </p>
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Application Details</p>
                    <p className="text-sm text-slate-700 mt-1">Platform: {selectedJob.source}</p>
                    <p className="text-sm text-slate-700">Visa Sponsorship: {selectedJob.visa_sponsorship || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdvancedFilterDrawer
        open={advancedOpen}
        title="Advanced Job Filters"
        onClose={() => setAdvancedOpen(false)}
      >
        <div className="space-y-2">
          <label className="block text-xs text-slate-300">Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
            className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 on-dark-input"
          >
            <option value="All">All Sources</option>
            <option value="Remotive">Remotive</option>
            <option value="Arbeitnow">Arbeitnow</option>
            <option value="Jobicy">Jobicy</option>
            <option value="TheMuse">TheMuse</option>
            <option value="RemoteOK">RemoteOK</option>
            <option value="Adzuna">Adzuna</option>
            <option value="JSearch">JSearch</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Indeed">Indeed</option>
            <option value="Naukri">Naukri</option>
            <option value="Foundit">Foundit</option>
            <option value="Internshala">Internshala</option>
            <option value="Apna">Apna</option>
            <option value="WorkIndia">WorkIndia</option>
            <option value="Shine">Shine</option>
            <option value="Freshersworld">Freshersworld</option>
            <option value="Cutshort">Cutshort</option>
            <option value="Superset">Superset</option>
            <option value="Glassdoor">Glassdoor</option>
            <option value="ZipRecruiter">ZipRecruiter</option>
            <option value="Monster">Monster</option>
            <option value="CareerBuilder">CareerBuilder</option>
            <option value="USAJobs">USAJobs</option>
            <option value="Reed">Reed</option>
            <option value="Totaljobs">Totaljobs</option>
            <option value="CV-Library">CV-Library</option>
            <option value="GOV.UK Jobs">GOV.UK Jobs</option>
            <option value="Seek">Seek</option>
            <option value="Jora">Jora</option>
            <option value="CareerOne">CareerOne</option>
            <option value="GulfTalent">GulfTalent</option>
            <option value="Bayt">Bayt</option>
            <option value="Dubai Careers">Dubai Careers</option>
            <option value="Naukri Gulf">Naukri Gulf</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-slate-300">Role Type</label>
          <select
            value={roleType}
            onChange={(e) => setRoleType(e.target.value as RoleTypeFilter)}
            className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 on-dark-input"
          >
            <option value="All">All Roles</option>
            <option value="IT">IT</option>
            <option value="Non-IT">Non-IT</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-slate-300">Role Focus</label>
          <select
            value={roleFocus}
            onChange={(e) => setRoleFocus(e.target.value)}
            className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 on-dark-input"
          >
            {roleType === 'IT' && IT_ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            {roleType === 'Non-IT' && NON_IT_ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            {roleType === 'All' && <option value="All Roles">All Roles</option>}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-slate-300">Visa</label>
          <select
            value={visaFilter}
            onChange={(e) => setVisaFilter(e.target.value as VisaFilter)}
            className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 on-dark-input"
          >
            <option value="Any">Any</option>
            <option value="Sponsorship">Sponsorship</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-slate-300">Work Mode</label>
          <select
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value as WorkModeFilter)}
            className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 on-dark-input"
          >
            <option value="Any">Any</option>
            <option value="Remote">Remote</option>
            <option value="Onsite">Onsite</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
        <button
          onClick={() => { setRoleType('All'); setRoleFocus('All Roles'); setWorkMode('Any'); setVisaFilter('Any'); setSourceFilter('All'); }}
          className="w-full text-xs px-3 py-2 rounded border border-slate-600 text-slate-200 hover:bg-slate-700/40"
        >
          Reset Advanced Filters
        </button>
      </AdvancedFilterDrawer>
    </div>
  );
};

export default JobSearch;

