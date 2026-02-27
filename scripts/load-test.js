/**
 * Load Testing Script
 * Simulates 10K+ DAU for stress testing
 * Run with: k6 run scripts/load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const apiDuration = new Trend('api_duration');
const codeSubmissions = new Counter('code_submissions');
const errors = new Counter('errors');
const activeUsers = new Gauge('active_users');

export const options = {
  vus: 100, // Start with 100 virtual users
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 500 }, // Ramp up to 500 users
    { duration: '5m', target: 1000 }, // Spike to 1000
    { duration: '10m', target: 1000 }, // Stay at 1000
    { duration: '3m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.1'], // Error rate < 10%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';
const API_KEY = __ENV.API_KEY || 'test-key';

// Test data
const problems = [
  'prob-001',
  'prob-002',
  'prob-003',
  'prob-004',
  'prob-005',
];

const solutions = {
  javascript: 'function solve(n) { return n * 2; }',
  python: 'def solve(n):\n    return n * 2',
  java: 'public class Solution { public int solve(int n) { return n * 2; } }',
};

export default function () {
  activeUsers.add(1);

  group('Get Problem', () => {
    const problemId = problems[Math.floor(Math.random() * problems.length)];
    const res = http.get(`${BASE_URL}/problems/${problemId}`);

    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time OK': (r) => r.timings.duration < 500,
    });

    apiDuration.add(res.timings.duration);
    if (res.status !== 200) errors.add(1);
  });

  sleep(1);

  group('Submit Code', () => {
    const problemId = problems[Math.floor(Math.random() * problems.length)];
    const language = Object.keys(solutions)[Math.floor(Math.random() * 3)];

    const payload = {
      problem_id: problemId,
      language: language,
      code: solutions[language as keyof typeof solutions],
    };

    const res = http.post(`${BASE_URL}/submissions`, JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    check(res, {
      'status is 200': (r) => r.status === 200,
      'has submission id': (r) => JSON.parse(r.body).id !== undefined,
      'response time OK': (r) => r.timings.duration < 2000,
    });

    apiDuration.add(res.timings.duration);
    codeSubmissions.add(1);
    if (res.status !== 200) errors.add(1);
  });

  sleep(2);

  group('Get Leaderboard', () => {
    const res = http.get(`${BASE_URL}/contests/live/leaderboard?limit=100`);

    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time OK': (r) => r.timings.duration < 500,
    });

    apiDuration.add(res.timings.duration);
    if (res.status !== 200) errors.add(1);
  });

  sleep(1);

  group('Get Discussions', () => {
    const problemId = problems[Math.floor(Math.random() * problems.length)];
    const res = http.get(
      `${BASE_URL}/problems/${problemId}/discussions?limit=20`
    );

    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time OK': (r) => r.timings.duration < 500,
    });

    apiDuration.add(res.timings.duration);
    if (res.status !== 200) errors.add(1);
  });

  sleep(2);

  group('Create Discussion', () => {
    const problemId = problems[Math.floor(Math.random() * problems.length)];

    const payload = {
      problem_id: problemId,
      title: `Question about problem ${problemId}`,
      content: 'Can someone help me understand the approach?',
    };

    const res = http.post(
      `${BASE_URL}/discussions`,
      JSON.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      }
    );

    check(res, {
      'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'response time OK': (r) => r.timings.duration < 1000,
    });

    apiDuration.add(res.timings.duration);
    if (res.status !== 200 && res.status !== 201) errors.add(1);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', percentiles: ['p(99.9)'] }),
    'summary.html': htmlReport(data),
  };
}

// Helper function for text summary
function textSummary(data, options) {
  return JSON.stringify(data, null, 2);
}

// Helper function for HTML report
function htmlReport(data) {
  return `
    <html>
      <body>
        <h1>Load Test Report</h1>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </body>
    </html>
  `;
}
