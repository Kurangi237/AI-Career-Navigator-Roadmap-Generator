import React, { useEffect, useMemo, useState } from 'react';

interface Props {
  onBack: () => void;
  onNotifyJobs?: (jobs: { title: string; company?: string; location?: string; link: string }[]) => void;
  selectedJobLink?: string | null;
  onClearSelected?: () => void;
}

type CareerProfile = {
  id: string;
  platform: string;
  profileUrl: string;
  keywords: string;
};

type LiveJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  link: string;
  posted_at: string;
  tags: string[];
};

const PROFILE_KEY = 'KBV_job_profiles';
const CAREER_PAGES = [
  { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/' },
  { name: 'Naukri', url: 'https://www.naukri.com/' },
  { name: 'Indeed', url: 'https://www.indeed.com/' },
  { name: 'Wellfound', url: 'https://wellfound.com/jobs' },
  { name: 'Remotive', url: 'https://remotive.com/' },
  { name: 'Arbeitnow', url: 'https://www.arbeitnow.com/' },
  { name: 'Google Careers', url: 'https://careers.google.com/' },
  { name: 'Microsoft Careers', url: 'https://jobs.careers.microsoft.com/' },
  { name: 'Amazon Jobs', url: 'https://www.amazon.jobs/' },
  { name: 'Meta Careers', url: 'https://www.metacareers.com/' },
  { name: 'Netflix Jobs', url: 'https://jobs.netflix.com/' },
  { name: 'Atlassian Careers', url: 'https://www.atlassian.com/company/careers' },
  { name: 'Zoho Careers', url: 'https://careers.zohocorp.com/' },
  { name: 'Freshworks Careers', url: 'https://www.freshworks.com/company/careers/' },
  { name: 'Razorpay Careers', url: 'https://razorpay.com/jobs/' },
  { name: 'Flipkart Careers', url: 'https://www.flipkartcareers.com/' },
];

const readProfiles = (): CareerProfile[] => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeProfiles = (items: CareerProfile[]) => localStorage.setItem(PROFILE_KEY, JSON.stringify(items));

const JobSearch: React.FC<Props> = ({ onBack, onNotifyJobs, selectedJobLink, onClearSelected }) => {
  const [query, setQuery] = useState('software engineer');
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState<CareerProfile[]>(() => readProfiles());
  const [platform, setPlatform] = useState('LinkedIn');
  const [profileUrl, setProfileUrl] = useState('');
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    if (!selectedJobLink) return;
    window.open(selectedJobLink, '_blank', 'noopener');
    onClearSelected && onClearSelected();
  }, [selectedJobLink]);

  const profileKeywords = useMemo(() => profiles.flatMap((p) => p.keywords.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)), [profiles]);

  const recommendedJobs = useMemo(() => {
    if (!profileKeywords.length) return liveJobs;
    return liveJobs.filter((job) => {
      const hay = `${job.title} ${job.company} ${job.tags.join(' ')}`.toLowerCase();
      return profileKeywords.some((kw) => hay.includes(kw));
    });
  }, [liveJobs, profileKeywords]);

  const loadLiveJobs = async () => {
    if (!query.trim()) return;
    try {
      setLoadingLive(true);
      setError('');
      const resp = await fetch(`/api/jobs/search?q=${encodeURIComponent(query.trim())}`);
      if (!resp.ok) throw new Error(`Live jobs error ${resp.status}`);
      const data = await resp.json();
      const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
      setLiveJobs(jobs);
      onNotifyJobs?.(jobs.slice(0, 6).map((j: LiveJob) => ({ title: j.title, company: j.company, location: j.location, link: j.link })));
    } catch (e: any) {
      setError(e?.message || 'Unable to fetch live jobs');
      setLiveJobs([]);
    } finally {
      setLoadingLive(false);
    }
  };

  const addProfile = () => {
    if (!profileUrl.trim()) return;
    const next: CareerProfile = {
      id: `p-${Date.now()}`,
      platform,
      profileUrl: profileUrl.trim(),
      keywords: keywords.trim(),
    };
    const all = [next, ...profiles];
    setProfiles(all);
    writeProfiles(all);
    setProfileUrl('');
    setKeywords('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-orange-600">Job Search & Career Profile Sync</h2>
            <p className="text-sm text-slate-600 mt-1">Connect profiles and receive matched direct application links.</p>
          </div>
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 font-medium">Back</button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles (java backend, python, c++ developer...)"
            className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 outline-none"
          />
          <button onClick={loadLiveJobs} disabled={loadingLive} className="bg-orange-600 text-white rounded-lg px-5 py-3 font-medium hover:bg-orange-700 disabled:opacity-60">
            {loadingLive ? 'Loading...' : 'Fetch Jobs'}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Connected Career Profiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="border border-slate-300 rounded px-3 py-2 text-sm">
            <option>LinkedIn</option><option>Naukri</option><option>Indeed</option><option>Wellfound</option><option>Other</option>
          </select>
          <input value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} className="border border-slate-300 rounded px-3 py-2 text-sm md:col-span-2" placeholder="Profile URL" />
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="border border-slate-300 rounded px-3 py-2 text-sm" placeholder="Keywords (comma separated)" />
        </div>
        <button onClick={addProfile} className="mt-2 px-3 py-2 rounded bg-slate-900 text-white text-sm hover:bg-slate-800">Connect Profile</button>
        <div className="mt-3 space-y-1 text-sm text-slate-700">
          {profiles.map((p) => <p key={p.id}>{p.platform}: {p.profileUrl} Â· keywords: {p.keywords || 'none'}</p>)}
          {profiles.length === 0 && <p>No profiles connected yet.</p>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Recommended Direct Job Links ({recommendedJobs.length})</h3>
        {recommendedJobs.length === 0 ? (
          <p className="text-sm text-slate-500 mt-2">No jobs yet. Fetch jobs and add profile keywords for matching.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedJobs.map((job) => (
              <a key={job.id} href={job.link} target="_blank" rel="noopener noreferrer" className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <p className="text-xs uppercase tracking-wide text-slate-500">{job.source}</p>
                <h4 className="text-base font-semibold text-slate-900 mt-1">{job.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{job.company} Â· {job.location}</p>
                <p className="text-xs text-slate-400 mt-2">Direct Apply Link</p>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Career Pages</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {CAREER_PAGES.map((c) => (
            <a key={c.name} href={c.url} target="_blank" rel="noopener noreferrer" className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
              <p className="font-medium text-slate-900">{c.name}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobSearch;

