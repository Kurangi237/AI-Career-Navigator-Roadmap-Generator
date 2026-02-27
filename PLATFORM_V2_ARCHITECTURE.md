# Coding Arena V2 Architecture (Launch Plan)

## Goal
Build a LeetCode-style business platform that can launch publicly and scale to `10,000+` active users with predictable performance.

## Product Scope (V2 baseline)
- Problem discovery with filters, pagination, and topic taxonomy.
- Problem workspace with statement + code editor + judge execution.
- Submission persistence and history.
- Contest discovery.
- Admin-ready API boundaries (problem/submission/contest domains).

## Code Structure
```
backend/
  api/
    arena/
      problems-list.ts
      problem-get.ts
      submissions-list.ts
      submissions-create.ts
      contests-list.ts
    judge/
      run.ts
      submit.ts
      status.ts
      worker-claim.ts
      worker-complete.ts
  lib/
    database.ts
  server.mjs

frontend/src/
  components/features/
    CodingArena.tsx          # v2 shell
    CodeEditor.tsx
  services/
    arenaApi.ts              # API client for arena domain
    judgeService.ts          # judge APIs
```

## Working Process (Request Flow)

### 1. Problem list
1. UI calls `GET /api/arena/problems/list`.
2. Backend queries `problems` table with pagination and filters.
3. UI renders list and selects one problem.

### 2. Problem details
1. UI calls `GET /api/arena/problems/get?id=...`.
2. Backend returns canonical problem shape + test cases.
3. UI renders statement and initializes editor template.

### 3. Run / Submit
1. UI runs code via `POST /api/judge/run`.
2. Result is shown immediately (pass/fail/runtime).
3. UI persists attempt via `POST /api/arena/submissions/create`.
4. User history refreshes via `GET /api/arena/submissions/list`.

### 4. Contest discovery
1. UI calls `GET /api/arena/contests/list`.
2. Backend returns active/upcoming contests.

## Scale Plan for 10,000+ Users

## Infrastructure
- Frontend: Vercel (global CDN edge).
- Backend API: Railway/Render/Kubernetes (horizontal autoscaling).
- DB: Supabase Postgres (read replicas for query-heavy endpoints).
- Queue: Redis for judge job queue.
- Judge workers: isolated Docker workers with CPU/memory limits.

## Performance controls
- API pagination (`page`, `pageSize`) mandatory for list endpoints.
- Caching:
  - problem list cache TTL 60s
  - problem detail cache TTL 300s
  - contest list cache TTL 30s
- DB indexes:
  - `problems(difficulty, topic, created_at)`
  - `code_submissions(user_id, submitted_at desc)`
  - `contests(start_time desc)`

## Reliability controls
- Rate limits:
  - judge run: per-user token bucket
  - submission create: per-user + IP throttle
- Circuit breakers for judge and DB timeouts.
- Structured logs (requestId, userId, endpoint, latency).
- Monitoring:
  - p95 API latency
  - judge queue depth
  - worker failure rate
  - DB slow query count

## Security
- Auth required for writes (`submissions-create` and future contest registration).
- Row-level security policies in Supabase.
- Input validation on every API route.
- Strict sandbox execution in judge workers (`--network=none`, memory/CPU limits, timeout).

## Next Build Steps (Priority)
1. Add API auth middleware + role checks.
2. Move judge run to async queue-only for production (`submit/status` path).
3. Add Redis caches for `arena` list/detail endpoints.
4. Add admin CRUD APIs for problem lifecycle (draft/publish/archive).
5. Add leaderboard aggregation service for contests.
6. Add payment gating and feature flags for freemium plans.

