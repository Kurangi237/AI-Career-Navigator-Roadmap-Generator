import { ExamMcq, ExamRoomConfig, ProblemSummary } from '@shared/types';
import { uuidv4 } from '../utils/uuid';
import { listProblemSummaries } from './problemLibraryService';

const EXAM_KEY = 'KBV_exam_rooms';

const read = (): ExamRoomConfig[] => {
  try {
    const raw = localStorage.getItem(EXAM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (rooms: ExamRoomConfig[]) => localStorage.setItem(EXAM_KEY, JSON.stringify(rooms));

export const listExamRooms = (): ExamRoomConfig[] => read().sort((a, b) => b.id.localeCompare(a.id));

export const createExamRoom = (payload: Omit<ExamRoomConfig, 'id'>): ExamRoomConfig => {
  const room: ExamRoomConfig = { ...payload, id: uuidv4() };
  write([room, ...read()]);
  return room;
};

export const buildTemplateExam = (
  mode: 'daily' | 'weekly',
  durationMinutes: 90 | 180,
  topics: string[],
  allowHard: boolean,
): ExamRoomConfig => {
  const layout = durationMinutes === 90
    ? { mcq: 5, easy: 1, med: 1, hard: 0 }
    : { mcq: 10, easy: 1, med: 2, hard: 1 };

  const pool = listProblemSummaries({ difficulty: 'All', page: 1, pageSize: 400, allowHard }).items
    .filter((p) => topics.length === 0 || topics.includes(p.topic));

  const pick = (difficulty: 'Easy' | 'Medium' | 'Hard', count: number): ProblemSummary[] =>
    pool.filter((p) => p.difficulty === difficulty).slice(0, count);

  const coding = [
    ...pick('Easy', layout.easy),
    ...pick('Medium', layout.med),
    ...pick('Hard', allowHard ? layout.hard : 0),
  ];

  return {
    id: '',
    title: `${mode === 'daily' ? 'Daily' : 'Weekly'} Exam ${durationMinutes}m`,
    mode,
    durationMinutes,
    codingProblemIds: coding.map((x) => x.id),
    mcqCount: layout.mcq,
    topics: topics.length ? topics : ['General'],
    instructions: [
      'Read all instructions before starting.',
      'Keep camera and microphone active.',
      'Do not switch tabs or connect extra devices.',
      'Any suspicious activity may auto-submit/close exam.',
    ],
  };
};

export const generateMcqSet = (topics: string[], count: number): ExamMcq[] => {
  const base = topics.length ? topics : ['General CS'];
  return Array.from({ length: count }).map((_, i) => ({
    id: `mcq-${i + 1}`,
    topic: base[i % base.length],
    question: `MCQ ${i + 1}: Which concept is most suitable for optimizing time complexity in ${base[i % base.length]}?`,
    options: ['Brute Force', 'Hashing/Indexing', 'Nested loops always', 'Ignore constraints'],
    answerIndex: 1,
  }));
};

