// Simple local API server for development.
// This runs backend API handlers without Vercel CLI.

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

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

if (!API_KEY) {
  console.error('ERROR: GENAI_API_KEY not set');
  process.exit(1);
}

console.log('API key loaded');

async function loadHandler(modulePath) {
  try {
    const module = await import(modulePath);
    return module.default;
  } catch (error) {
    console.error(`Failed to load ${modulePath}:`, error.message);
    throw error;
  }
}

function createHandler(handlerFn) {
  return async (req, res) => {
    try {
      req.headers.authorization = `Bearer ${API_KEY}`;
      const originalKey = process.env.GENAI_API_KEY;
      process.env.GENAI_API_KEY = API_KEY;
      await handlerFn(req, res);
      process.env.GENAI_API_KEY = originalKey;
    } catch (error) {
      console.error('Handler error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    }
  };
}

async function setupRoutes() {
  const routes = [
    { method: 'post', path: '/api/genai/roadmap', file: './backend/api/genai/roadmap.ts' },
    { method: 'post', path: '/api/genai/courses', file: './backend/api/genai/courses.ts' },
    { method: 'post', path: '/api/genai/analyze', file: './backend/api/genai/analyze.ts' },
    { method: 'post', path: '/api/genai/role', file: './backend/api/genai/role.ts' },
    { method: 'post', path: '/api/genai/chat', file: './backend/api/genai/chat.ts' },
    { method: 'post', path: '/api/genai/adaptive-practice', file: './backend/api/genai/adaptive-practice.ts' },
    { method: 'post', path: '/api/judge/run', file: './backend/api/judge/run.ts' },
    { method: 'post', path: '/api/judge/submit', file: './backend/api/judge/submit.ts' },
    { method: 'get', path: '/api/judge/status', file: './backend/api/judge/status.ts' },
    { method: 'post', path: '/api/judge/worker-claim', file: './backend/api/judge/worker-claim.ts' },
    { method: 'post', path: '/api/judge/worker-complete', file: './backend/api/judge/worker-complete.ts' },
    { method: 'get', path: '/api/arena/problems/list', file: './backend/api/arena/problems-list.ts' },
    { method: 'get', path: '/api/arena/problems/get', file: './backend/api/arena/problem-get.ts' },
    { method: 'get', path: '/api/arena/submissions/list', file: './backend/api/arena/submissions-list.ts' },
    { method: 'post', path: '/api/arena/submissions/create', file: './backend/api/arena/submissions-create.ts' },
    { method: 'get', path: '/api/arena/contests/list', file: './backend/api/arena/contests-list.ts' },
    { method: 'get', path: '/api/jobs/search', file: './backend/api/jobs/search.ts' },
  ];

  for (const { method, path: routePath, file } of routes) {
    try {
      const handler = await loadHandler(file);
      app[method](routePath, createHandler(handler));
      console.log(`Registered ${method.toUpperCase()} ${routePath}`);
    } catch (error) {
      console.error(`Failed to register ${routePath}`);
    }
  }
}

app.get('/', (_req, res) => {
  res.json({ status: 'API server running', timestamp: new Date().toISOString() });
});

setupRoutes().then(() => {
  const PORT = 3004;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API server started on http://localhost:${PORT}`);
    console.log('Routes:');
    console.log('POST /api/genai/roadmap');
    console.log('POST /api/genai/courses');
    console.log('POST /api/genai/analyze');
    console.log('POST /api/genai/role');
    console.log('POST /api/genai/chat');
    console.log('POST /api/genai/adaptive-practice');
    console.log('POST /api/judge/run');
    console.log('POST /api/judge/submit');
    console.log('GET /api/judge/status?id=...');
    console.log('POST /api/judge/worker-claim');
    console.log('POST /api/judge/worker-complete');
    console.log('GET /api/arena/problems/list?page=1&pageSize=25&q=&difficulty=All');
    console.log('GET /api/arena/problems/get?id=...');
    console.log('GET /api/arena/submissions/list?userId=...');
    console.log('POST /api/arena/submissions/create');
    console.log('GET /api/arena/contests/list');
    console.log('GET /api/jobs/search?q=react');
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
