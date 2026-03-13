import { RoadmapResponse, Course, SavedRoadmap, SavedCourse, SavedResumeScan, SkillAnalysisResponse } from '@shared/types';

const KEYS = {
  ROADMAPS: 'AI_Career_saved_roadmaps',
  COURSES: 'AI_Career_saved_courses',
  RESUME_SCANS: 'AI_Career_saved_resume_scans',
  RESUME_DRAFTS: 'AI_Career_saved_resume_drafts',
  SAVED_JOBS: 'AI_Career_saved_jobs',
};

export type JobApplicationStage =
  | 'saved'
  | 'applied'
  | 'aptitude_round'
  | 'technical_round'
  | 'interview_round'
  | 'offer_letter';

export interface SavedJob {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  country: string;
  source: string;
  link: string;
  postedAt: string;
  description: string;
  employmentType?: string;
  salary?: string;
  stage: JobApplicationStage;
  notes?: string;
  savedAt: number;
  updatedAt: number;
}

export interface ResumeExperience {
  role: string;
  company: string;
  duration: string;
  points: string[];
}

export interface ResumeProject {
  name: string;
  tech: string;
  points: string[];
  link?: string;
}

export interface ResumeEducation {
  institute: string;
  degree: string;
  year: string;
  score?: string;
}

export interface ResumeDraft {
  id: string;
  name: string;
  templateId: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  certifications: string[];
  achievements: string[];
  createdAt: number;
  updatedAt: number;
}

let supabase: any = null;
const isSupabase = false;

// --- Roadmap Operations ---

export const saveRoadmapToStorage = async (roadmap: RoadmapResponse): Promise<void> => {
  const savedItem: SavedRoadmap = {
    ...roadmap,
    id: Date.now().toString(),
    timestamp: Date.now()
  };

  if (!isSupabase || !supabase) {
    const existing = getSavedRoadmaps();
    const updated = [savedItem, ...existing];
    localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(updated));
    return;
  }

  try {
    await supabase.from('roadmaps').insert({
      id: savedItem.id,
      role: savedItem.role,
      duration_weeks: (savedItem as any).duration_weeks || (savedItem as any).weeks || 0,
      weekly_plan: JSON.stringify((savedItem as any).weekly_plan || (savedItem as any).plan || []),
      timestamp: savedItem.timestamp,
      raw: JSON.stringify(savedItem),
    });
  } catch (e) {
    console.error('Supabase saveRoadmap error', e);
    // fallback to local
    const existing = getSavedRoadmaps();
    const updated = [savedItem, ...existing];
    localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(updated));
  }
};

export const getSavedRoadmaps = (): SavedRoadmap[] => {
  if (!isSupabase || !supabase) {
    const data = localStorage.getItem(KEYS.ROADMAPS);
    return data ? JSON.parse(data) : [];
  }

  // For simplicity, return localStorage copy if remote fetch isn't desired synchronously.
  const data = localStorage.getItem(KEYS.ROADMAPS);
  return data ? JSON.parse(data) : [];
};

export const deleteSavedRoadmap = async (id: string): Promise<void> => {
  if (!isSupabase || !supabase) {
    const existing = getSavedRoadmaps();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(updated));
    return;
  }

  try {
    await supabase.from('roadmaps').delete().eq('id', id);
  } catch (e) {
    console.error('Supabase deleteSavedRoadmap error', e);
  }
};

// --- Course Operations ---

export const saveCourseToStorage = async (course: Course): Promise<void> => {
  const savedItem: SavedCourse = {
    ...course,
    id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
    timestamp: Date.now()
  };

  if (!isSupabase || !supabase) {
    const existing = getSavedCourses();
    const isDuplicate = existing.some(c => c.link === course.link && c.title === course.title);
    if (!isDuplicate) {
      const updated = [savedItem, ...existing];
      localStorage.setItem(KEYS.COURSES, JSON.stringify(updated));
    }
    return;
  }

  try {
    await supabase.from('courses').insert({
      id: savedItem.id,
      title: savedItem.title,
      platform: savedItem.platform || null,
      link: savedItem.link,
      timestamp: savedItem.timestamp,
      raw: JSON.stringify(savedItem)
    });
  } catch (e) {
    console.error('Supabase saveCourse error', e);
    const existing = getSavedCourses();
    const isDuplicate = existing.some(c => c.link === course.link && c.title === course.title);
    if (!isDuplicate) {
      const updated = [savedItem, ...existing];
      localStorage.setItem(KEYS.COURSES, JSON.stringify(updated));
    }
  }
};

export const getSavedCourses = (): SavedCourse[] => {
  if (!isSupabase || !supabase) {
    const data = localStorage.getItem(KEYS.COURSES);
    return data ? JSON.parse(data) : [];
  }

  const data = localStorage.getItem(KEYS.COURSES);
  return data ? JSON.parse(data) : [];
};

export const deleteSavedCourse = async (id: string): Promise<void> => {
  if (!isSupabase || !supabase) {
    const existing = getSavedCourses();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem(KEYS.COURSES, JSON.stringify(updated));
    return;
  }

  try {
    await supabase.from('courses').delete().eq('id', id);
  } catch (e) {
    console.error('Supabase deleteSavedCourse error', e);
  }
};

// --- Resume Scan Operations ---
export const saveResumeScanToStorage = (fileName: string, analysis: SkillAnalysisResponse, jdProvided: boolean): SavedResumeScan => {
  const item: SavedResumeScan = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 10),
    fileName,
    analyzedAt: Date.now(),
    jdProvided,
    analysis,
  };
  const existing = getSavedResumeScans();
  localStorage.setItem(KEYS.RESUME_SCANS, JSON.stringify([item, ...existing].slice(0, 100)));
  return item;
};

export const getSavedResumeScans = (): SavedResumeScan[] => {
  const raw = localStorage.getItem(KEYS.RESUME_SCANS);
  return raw ? JSON.parse(raw) : [];
};

export const deleteSavedResumeScan = (id: string): void => {
  const next = getSavedResumeScans().filter((x) => x.id !== id);
  localStorage.setItem(KEYS.RESUME_SCANS, JSON.stringify(next));
};

// --- Resume Builder Drafts ---
export const saveResumeDraftToStorage = (draft: Omit<ResumeDraft, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): ResumeDraft => {
  const existing = getSavedResumeDrafts();
  const now = Date.now();
  const next: ResumeDraft = {
    ...draft,
    id: draft.id || `${now}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: draft.id ? existing.find((x) => x.id === draft.id)?.createdAt || now : now,
    updatedAt: now,
  };
  const filtered = existing.filter((x) => x.id !== next.id);
  localStorage.setItem(KEYS.RESUME_DRAFTS, JSON.stringify([next, ...filtered].slice(0, 100)));
  return next;
};

export const getSavedResumeDrafts = (): ResumeDraft[] => {
  const raw = localStorage.getItem(KEYS.RESUME_DRAFTS);
  return raw ? JSON.parse(raw) : [];
};

export const deleteSavedResumeDraft = (id: string): void => {
  const next = getSavedResumeDrafts().filter((x) => x.id !== id);
  localStorage.setItem(KEYS.RESUME_DRAFTS, JSON.stringify(next));
};

// --- Saved Jobs / Tracking ---
export const getSavedJobs = (): SavedJob[] => {
  const raw = localStorage.getItem(KEYS.SAVED_JOBS);
  return raw ? JSON.parse(raw) : [];
};

export const saveJobToStorage = (
  job: Omit<SavedJob, 'id' | 'stage' | 'savedAt' | 'updatedAt'> & {
    stage?: JobApplicationStage;
    id?: string;
  }
): SavedJob => {
  const existing = getSavedJobs();
  const now = Date.now();
  const same = existing.find((x) => x.jobId === job.jobId || x.link === job.link);

  const next: SavedJob = {
    id: same?.id || job.id || `${now}-${Math.random().toString(36).slice(2, 8)}`,
    stage: job.stage || same?.stage || 'saved',
    savedAt: same?.savedAt || now,
    updatedAt: now,
    ...job,
  };

  const updated = [next, ...existing.filter((x) => x.id !== next.id)].slice(0, 300);
  localStorage.setItem(KEYS.SAVED_JOBS, JSON.stringify(updated));
  return next;
};

export const deleteSavedJob = (id: string): void => {
  const next = getSavedJobs().filter((x) => x.id !== id);
  localStorage.setItem(KEYS.SAVED_JOBS, JSON.stringify(next));
};

export const updateSavedJobStage = (id: string, stage: JobApplicationStage, notes?: string): SavedJob | null => {
  const existing = getSavedJobs();
  const target = existing.find((x) => x.id === id);
  if (!target) return null;

  const updatedJob: SavedJob = {
    ...target,
    stage,
    notes: notes ?? target.notes,
    updatedAt: Date.now(),
  };

  const updated = [updatedJob, ...existing.filter((x) => x.id !== id)];
  localStorage.setItem(KEYS.SAVED_JOBS, JSON.stringify(updated));
  return updatedJob;
};

