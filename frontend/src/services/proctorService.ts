import { ProctorIncident } from '@shared/types';
import { uuidv4 } from '../utils/uuid';

const KEY = 'KBV_proctor_incidents';

const read = (): ProctorIncident[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (items: ProctorIncident[]) => localStorage.setItem(KEY, JSON.stringify(items));

export const logIncident = (incident: Omit<ProctorIncident, 'id' | 'timestamp'>): ProctorIncident => {
  const next: ProctorIncident = {
    id: uuidv4(),
    timestamp: Date.now(),
    ...incident,
  };
  write([next, ...read()]);
  return next;
};

export const listIncidents = (examId?: string): ProctorIncident[] => {
  const items = read();
  return examId ? items.filter((x) => x.examId === examId) : items;
};

export const getRiskScoreForExam = (examId: string, userEmail: string): number => {
  const items = read().filter((x) => x.examId === examId && x.userEmail === userEmail);
  return items.reduce((sum, x) => sum + (x.severity === 'high' ? 30 : x.severity === 'medium' ? 15 : 6), 0);
};

