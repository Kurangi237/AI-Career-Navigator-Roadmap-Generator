# AI Career Navigator

AI Career Navigator is a full-stack career prep platform for students and early professionals.

## Core Modules
- MNC DSA Prep Hub (company-wise DSA practice)
- Personalized Roadmap Generator
- Courses and Resource Recommender
- Resume Builder + ATS checks
- Jobs Aggregator (multi-source, country filters)
- AI Coach (chat assistant)
- Portfolio Studio
- Saved Items
- Profile and Notifications
- Analytics Dashboard (admin)

## Tech Stack
- Frontend: React + Vite + TypeScript
- Backend: Node.js APIs (serverless-style routes)
- Data/Auth: Supabase (optional)

## Run Locally
```bash
npm install
npm run dev:all
```

Frontend: `http://localhost:3005`
API: `http://localhost:3004`

## Build
```bash
npm run build
```

## Demo Login
- `admin@KBV.com` / `password123`
- `student@KBV.com` / `student123`
- `demo@KBV.com` / `demo123`

## Environment
Use `.env` / `.env.local` as needed.

Common variables:
- `GENAI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`
- job API provider keys used by `backend/api/jobs/*`

## Notes
- Some premium integrations (external job sources, ATS tools) require valid API keys.
- App includes role-aware navigation and guarded views.
