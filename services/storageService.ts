import { RoadmapResponse, Course, SavedRoadmap, SavedCourse } from "../types";

const KEYS = {
  ROADMAPS: 'kare26_saved_roadmaps',
  COURSES: 'kare26_saved_courses'
};

let supabase: any = null;
let isSupabase = false;
try {
  const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
  const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (SUPABASE_URL && SUPABASE_KEY) {
    // lazy require to avoid bundler issues when env not set
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    isSupabase = true;
  }
} catch (e) {
  isSupabase = false;
}

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
      title: savedItem.title,
      role: savedItem.role,
      weeks: savedItem.weeks,
      timestamp: savedItem.timestamp,
      raw: JSON.stringify(savedItem)
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
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
      link: savedItem.link,
      source: savedItem.source || null,
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
