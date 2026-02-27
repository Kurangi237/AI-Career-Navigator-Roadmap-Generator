# AI Career Navigator & Roadmap Generator - MNC DSA Prep Hub

An intelligent web application that helps engineering students and job seekers prepare for top MNC company interviews. Access company-specific DSA problem collections, 12-week learning roadmaps, personalized preparation guides, resume optimization, and AI-powered interview coaching.

**Focus**: Master DSA topics asked by Google, Meta, Amazon, Microsoft, Apple, Uber, Goldman Sachs and other top tech companies.

**Project Status**: ✅ Fully Restructured & Running (MNC DSA Focus Edition)

---

## 🚀 Quick Start

### Run Everything
```bash
npm run dev:all
```

This starts:
- Frontend dev server (http://localhost:3005)
- Mock API server (http://localhost:3004)
- Auto-reload enabled

### Login with Demo Credentials
```
Email: admin@KBV.com       | Password: password123
Email: student@KBV.com     | Password: student123
Email: demo@KBV.com        | Password: demo123
```

---

## 📚 New Documentation - MNC DSA Preparation

This project now focuses on helping users crack MNC interviews through structured DSA preparation:

### Key Documentation Files
- **CODEARENA_PRD.md** - MNC DSA Prep Hub product specification with 12-week roadmap
- **MNC_COMPANIES_DSA_FOCUS.md** - Detailed focus areas, interview patterns, and must-solve problems for each top MNC company
- **12_WEEK_LEARNING_ROADMAP.md** - Complete week-by-week preparation plan with daily schedules, problem lists, and metrics
- **TOP_DSA_PROBLEMS_BY_COMPANY.md** - 100+ must-solve problems organized by company with difficulty and frequency
- **PREPARATION_RESOURCES.md** - Comprehensive list of free and paid resources, behavioral interview guides, system design resources

### Start Here 👇
1. **New to interview prep?** → Read `12_WEEK_LEARNING_ROADMAP.md` for complete roadmap
2. **Targeting specific company?** → Read `MNC_COMPANIES_DSA_FOCUS.md` for their focus areas
3. **Need problem recommendations?** → Check `TOP_DSA_PROBLEMS_BY_COMPANY.md` for company-wise problems
4. **Looking for resources?** → See `PREPARATION_RESOURCES.md` for curated learning platforms

---

## 🧠 Startup Upgrade (2026)

This codebase is now moving toward a **startup-grade full-stack platform**:

- Futuristic dashboard shell and design tokens (`frontend/index.css`)
- Motion-enabled UX with GSAP loaded via CDN (`frontend/index.html`, `frontend/src/App.tsx`)
- Resilient API client with timeout + retry + request IDs (`frontend/src/services/geminiService.ts`)
- API health endpoint for service checks (`backend/dev-mock-server.mjs`)
- MNC-focused DSA prep with company-specific content

### Product Direction (Suggested)

1. Company-specific problem recommendations engine ✅ (Documented in PRD)
2. Adaptive difficulty progression based on user performance
3. Mock interview simulation with real interview timing
4. AI-powered solution explanation and optimization tips
5. Real-time progress tracking with weak topic identification
6. Integration with LeetCode accounts for problem sync
7. Community discussion forum for approaches and solutions
8. Subscription + billing (Stripe) for premium features

---

## 📖 Project Structure

```
AI-Career-Navigator-Roadmap-Generator/
├── frontend/                      # React UI Application (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Shared UI (Login, Sidebar, Notifications)
│   │   │   └── features/         # Feature components (DSA Prep, Roadmap, Courses, etc)
│   │   ├── services/             # API clients & services
│   │   ├── utils/                # Helper functions
│   │   ├── App.tsx               # Main component
│   │   └── index.tsx             # Entry point
│   ├── vite.config.ts            # Vite + API proxy config
│   └── index.html
│
├── backend/                       # Vercel Serverless APIs
│   ├── api/genai/                # AI endpoints
│   │   ├── roadmap.ts            # Career roadmap generation
│   │   ├── courses.ts            # Course recommendations
│   │   ├── analyze.ts            # Resume analysis
│   │   ├── role.ts               # Job role intelligence
│   │   └── chat.ts               # AI chat assistant
│   ├── api/arena/                # DSA Arena APIs
│   │   ├── problems-list.ts
│   │   ├── problem-get.ts
│   │   ├── contests-list.ts
│   │   └── submissions-*
│   └── dev-mock-server.mjs       # Development mock server
│
├── shared/                        # Shared Types
│   └── types.ts                  # TypeScript interfaces
│
├── 📄 Documentation Files:
│   ├── CODEARENA_PRD.md          # MNC DSA Prep specification
│   ├── MNC_COMPANIES_DSA_FOCUS.md
│   ├── 12_WEEK_LEARNING_ROADMAP.md
│   ├── TOP_DSA_PROBLEMS_BY_COMPANY.md
│   ├── PREPARATION_RESOURCES.md
│   ├── README.md                 # Main documentation
│   └── Others...
│
├── docker-compose.yml            # Local development with judge
├── package.json                  # Root package with scripts
├── vercel.json                   # Vercel configuration
└── .env                          # Environment variables
```

---

## ✨ Features & Module Status

### MNC DSA Prep Hub (Main Feature)
- Company-Specific Problem Collections
- 12-Week Structured Learning Roadmap
- DSA Topic Mastery Paths
- Company Interview Pattern Analysis
- Adaptive Progress Tracking
- Problem difficulty and frequency analysis

| Feature | Status | Location |
|---------|--------|----------|
| **MNC DSA Prep Hub** | ✅ | `frontend/src/components/features/CodingArena.tsx` |
| Company-Specific Paths | ✅ | `MNC_COMPANIES_DSA_FOCUS.md` |
| 12-Week Roadmap | ✅ | `12_WEEK_LEARNING_ROADMAP.md` |
| Top Problems Database | ✅ | `TOP_DSA_PROBLEMS_BY_COMPANY.md` |
| Prep Resources | ✅ | `PREPARATION_RESOURCES.md` |
| Coding Practice Judge | ✅ | `frontend/src/components/features/CodeEditor.tsx` |
| Career Roadmap Generator | ✅ | `frontend/src/components/features/RoadmapGenerator.tsx` |
| Course Recommender | ✅ | `frontend/src/components/features/CourseRecommender.tsx` |
| Resume Analyzer | ✅ | `frontend/src/components/features/ResumeAnalyzer.tsx` |
| Job Role Intelligence | ✅ | `frontend/src/components/features/RoleIntel.tsx` |
| AI Chat Assistant | ✅ | `frontend/src/components/features/ChatAssistant.tsx` |
| Job Search (100+ portals) | ✅ | `frontend/src/components/features/JobSearch.tsx` |
| Saved Items Management | ✅ | `frontend/src/components/features/SavedItems.tsx` |
| User Authentication | ✅ | `frontend/src/components/common/Login.tsx` |
| Profile Management | ✅ | `frontend/src/components/features/Profile.tsx` |
| Notifications System | ✅ | `frontend/src/components/common/Notifications.tsx` |

### Judge & Code Execution
- Multi-language support (JavaScript, Python, Java, C, C++)
- Async secure judge queue
- Worker pool for execution
- Real-time status tracking

---

## 📝 Available npm Scripts

```bash
npm run dev:all      # Start frontend + API server (RECOMMENDED)
npm run dev          # Frontend only (port 3005)
npm run dev:api      # API server only (port 3004)
npm run dev:runner   # Judge worker process
npm run build        # Build frontend for production
npm run preview      # Preview production build
```

---

## 🔧 Environment Setup

### Local Development

```bash
# Install dependencies (one-time)
npm install

# Start development servers
npm run dev:all

# Access at http://localhost:3005
```

### Environment Variables

Create `.env` file in root directory:
```
GENAI_API_KEY=your_google_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url (optional)
VITE_SUPABASE_ANON_KEY=your_supabase_key (optional)
VITE_API_BASE_URL= (optional, set when frontend and API are on different hosts)
```

---

## 📱 Auth + RBAC Baseline (Implemented)

- Roles added in app model: `admin`, `mentor`, `student`
- Frontend role guards:
  - Navigation only shows authorized modules
  - Direct view access is blocked and redirected safely
- Demo logins:
  - `admin@KBV.com` → `admin`
  - `demo@KBV.com` → `mentor`
  - `student@KBV.com` → `student`
- Supabase SQL migration added:
  - `supabase/001_auth_rbac.sql`
  - Creates `profiles` + `notifications` tables
  - Enables RLS policies by role
  - Adds trigger to auto-create profile on `auth.users` signup

---

## 🚀 Production Deployment

### Deploy to Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Auto-deploys on push

### Required Environment Variables (Production)
```
GENAI_API_KEY                 # Google Gemini API key
VITE_SUPABASE_URL            # (optional)
VITE_SUPABASE_ANON_KEY       # (optional)
```

---

## 🛡️ Security Notes

⚠️ **Do NOT commit:**
- `.env.local` files
- API keys in code
- Sensitive credentials

✅ **Best practices:**
- Use `.env` for local development
- Set vars in hosting provider dashboard for production
- Use GitHub Actions secrets for CI/CD
- Keep backend API keys server-side only

---

## 🏗️ Architecture

### Frontend → Backend Flow
```
User Browser (React)
    ↓
Vite Dev Server (http://localhost:3005)
    ↓ [API request to /api/genai/*, /api/arena/*]
Vite Proxy Config (localhost:3004)
    ↓
Mock API Server (localhost:3004) [development]
or
Vercel Serverless (production)
    ↓
Google Gemini AI / Judge Engine
    ↓
JSON Response
    ↓
Frontend UI Updates
```

---

## 📊 Tech Stack

- **Frontend**: React 19, Vite 6, TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions, Google Gemini 2.5-Flash
- **Database**: localStorage (default), Supabase (optional) with PostgreSQL
- **Judge**: Docker workers, Redis queue, Multi-language execution
- **Dev Tools**: Express, Concurrently, Vite Proxy

---

## 🛠 Troubleshooting

### "Cannot find module" errors
```bash
npm install
npm run dev:all
```

### Port already in use
Vite automatically uses next available port (3001, 3002, etc.)

### API not responding
Ensure both servers are running:
```bash
npm run dev:all  # Runs both simultaneously
```

### Hot reload not working
1. Check Vite is running on correct port
2. Refresh browser (Ctrl+R or Cmd+R)
3. Clear browser cache if needed

---

## 📞 Support & Resources

For interview prep questions:
1. **Confused where to start?** → `12_WEEK_LEARNING_ROADMAP.md`
2. **Company-specific guidance?** → `MNC_COMPANIES_DSA_FOCUS.md`
3. **Problem list?** → `TOP_DSA_PROBLEMS_BY_COMPANY.md`
4. **Resources?** → `PREPARATION_RESOURCES.md`

For technical issues, check:
1. RUNNING.md - Quick start guide
2. DEVELOPMENT.md - Dev workflow
3. PROJECT_STRUCTURE.md - Architecture

---

## 📄 License

Internal project - All rights reserved

---

**Ready to crack MNC interviews? Start with:** `npm run dev:all` 🚀

Then read: `12_WEEK_LEARNING_ROADMAP.md` 📚
