import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
type JudgeQueueJob = any;

const ROOT = path.join(os.tmpdir(), 'KBV-judge-queue');
const FILE = path.join(ROOT, 'jobs.json');

const ensure = async () => {
  await fs.mkdir(ROOT, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, '[]', 'utf8');
  }
};

export const readJobs = async (): Promise<JudgeQueueJob[]> => {
  await ensure();
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return JSON.parse(raw) as JudgeQueueJob[];
  } catch {
    return [];
  }
};

export const writeJobs = async (jobs: JudgeQueueJob[]) => {
  await ensure();
  await fs.writeFile(FILE, JSON.stringify(jobs), 'utf8');
};

export const enqueueJob = async (job: JudgeQueueJob) => {
  const jobs = await readJobs();
  jobs.unshift(job);
  await writeJobs(jobs);
};

export const getJob = async (id: string) => {
  const jobs = await readJobs();
  return jobs.find((j) => j.id === id) || null;
};

export const updateJob = async (id: string, patch: Partial<JudgeQueueJob>) => {
  const jobs = await readJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  jobs[idx] = { ...jobs[idx], ...patch, updatedAt: Date.now() };
  await writeJobs(jobs);
  return jobs[idx];
};

export const claimNextQueuedJob = async (): Promise<JudgeQueueJob | null> => {
  const jobs = await readJobs();
  const idx = jobs.findIndex((j) => j.status === 'queued');
  if (idx < 0) return null;
  jobs[idx] = { ...jobs[idx], status: 'running', updatedAt: Date.now() };
  await writeJobs(jobs);
  return jobs[idx];
};

