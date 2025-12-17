import { RoadmapResponse, Course, SavedRoadmap, SavedCourse } from "../types";

const KEYS = {
  ROADMAPS: 'kare26_saved_roadmaps',
  COURSES: 'kare26_saved_courses'
};

// --- Roadmap Operations ---

export const saveRoadmapToStorage = (roadmap: RoadmapResponse): void => {
  const savedItem: SavedRoadmap = {
    ...roadmap,
    id: Date.now().toString(),
    timestamp: Date.now()
  };

  const existing = getSavedRoadmaps();
  // Prevent duplicate saves of the exact same role/plan if wanted, but simple append is fine for now
  const updated = [savedItem, ...existing];
  localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(updated));
};

export const getSavedRoadmaps = (): SavedRoadmap[] => {
  const data = localStorage.getItem(KEYS.ROADMAPS);
  return data ? JSON.parse(data) : [];
};

export const deleteSavedRoadmap = (id: string): void => {
  const existing = getSavedRoadmaps();
  const updated = existing.filter(item => item.id !== id);
  localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(updated));
};

// --- Course Operations ---

export const saveCourseToStorage = (course: Course): void => {
  const savedItem: SavedCourse = {
    ...course,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };

  const existing = getSavedCourses();
  // Avoid saving duplicates based on title and link
  const isDuplicate = existing.some(c => c.link === course.link && c.title === course.title);
  
  if (!isDuplicate) {
    const updated = [savedItem, ...existing];
    localStorage.setItem(KEYS.COURSES, JSON.stringify(updated));
  }
};

export const getSavedCourses = (): SavedCourse[] => {
  const data = localStorage.getItem(KEYS.COURSES);
  return data ? JSON.parse(data) : [];
};

export const deleteSavedCourse = (id: string): void => {
  const existing = getSavedCourses();
  const updated = existing.filter(item => item.id !== id);
  localStorage.setItem(KEYS.COURSES, JSON.stringify(updated));
};
