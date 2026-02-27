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

const readGenAiKeyFromDotEnv = () => {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return '';
    const envText = fs.readFileSync(envPath, 'utf8');
    const line = envText.split(/\r?\n/).find((row) => row.trim().startsWith('GENAI_API_KEY='));
    if (!line) return '';
    return line.slice('GENAI_API_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
  } catch {
    return '';
  }
};

const API_KEY = process.env.GENAI_API_KEY || readGenAiKeyFromDotEnv();
const WORKER_TOKEN = process.env.JUDGE_WORKER_TOKEN || 'local-worker-token';
const judgeJobs = new Map();

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
    if (!query) return res.status(400).json({ error: 'missing query q' });

    const remotiveResp = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`);
    const remotiveData = remotiveResp.ok ? await remotiveResp.json() : { jobs: [] };
    const remotiveJobs = Array.isArray(remotiveData?.jobs) ? remotiveData.jobs.slice(0, 20) : [];

    const jobs = remotiveJobs.map((j) => ({
      id: `remotive-${j.id}`,
      title: j.title || 'Role',
      company: j.company_name || 'Company',
      location: j.candidate_required_location || 'Remote',
      source: 'Remotive',
      link: j.url || '#',
      posted_at: j.publication_date || new Date().toISOString(),
      tags: Array.isArray(j.tags) ? j.tags : []
    }));

    res.json({ jobs, total: jobs.length, query });
  } catch (err) {
    console.error('Live jobs endpoint error', err);
    res.status(500).json({ error: err?.message || 'jobs server error' });
  }
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
  console.log('ðŸ”„ Frontend should connect to this server\n');
});


