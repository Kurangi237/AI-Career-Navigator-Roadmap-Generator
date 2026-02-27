# AI Career Navigator & Roadmap Generator - Project Structure

## Overview
This project has been restructured into a **Frontend-Backend-Shared** architecture for better separation of concerns and independent scalability.

---

## Project Directory Structure

```
AI-Career-Navigator-Roadmap-Generator/
├── frontend/                          # React Frontend Application
│   ├── src/                          # Source code
│   │   ├── components/
│   │   │   ├── common/              # Shared UI Components
│   │   │   │   ├── Login.tsx        # Authentication component
│   │   │   │   ├── Notifications.tsx # Notification display
│   │   │   │   └── Sidebar.tsx      # Navigation sidebar
│   │   │   └── features/            # Feature Components
│   │   │       ├── ChatAssistant.tsx       # AI chat feature
│   │   │       ├── CourseRecommender.tsx   # Course recommendations
│   │   │       ├── JobSearch.tsx           # Job portal search
│   │   │       ├── Profile.tsx             # User profile management
│   │   │       ├── ResumeAnalyzer.tsx      # Resume analysis
│   │   │       ├── RoadmapGenerator.tsx    # Career roadmap generation
│   │   │       ├── RoleIntel.tsx           # Job role intelligence
│   │   │       └── SavedItems.tsx          # Saved roadmaps/courses
│   │   ├── services/                # API & Data Services
│   │   │   ├── authService.ts       # Authentication logic
│   │   │   ├── geminiService.ts     # GenAI API client
│   │   │   ├── notificationService.ts # Notification management
│   │   │   └── storageService.ts    # Data persistence
│   │   ├── utils/                   # Utility Functions
│   │   │   └── uuid.ts              # UUID generation
│   │   ├── App.tsx                  # Main app component with routing
│   │   └── index.tsx                # React entry point
│   ├── index.html                   # HTML template
│   ├── vite.config.ts               # Vite build config
│   ├── tsconfig.json                # TypeScript config
│   ├── package.json                 # Dependencies
│   ├── package-lock.json            # Locked versions
│   └── .env.example                 # Environment variables template
│
├── backend/                         # Vercel Serverless Backend
│   ├── api/
│   │   └── genai/                   # GenAI API Endpoints
│   │       ├── roadmap.ts           # POST /api/genai/roadmap
│   │       ├── courses.ts           # POST /api/genai/courses
│   │       ├── analyze.ts           # POST /api/genai/analyze
│   │       ├── role.ts              # POST /api/genai/role
│   │       └── chat.ts              # POST /api/genai/chat
│   └── tsconfig.json                # Backend TypeScript config
│
├── shared/                          # Shared Types & Constants
│   └── types.ts                     # Shared TypeScript interfaces
│
├── package.json                     # Root package.json (orchestration)
├── package-lock.json                # Locked versions
├── .env.example                     # Environment template
└── README.md                        # Project documentation
```

---

## Component Organization

### Frontend Components Breakdown

#### 1. **Common Components** (`frontend/src/components/common/`)
Used across the application:
- **Login.tsx** - User authentication & registration
- **Sidebar.tsx** - Main navigation & notification panel
- **Notifications.tsx** - Notification display component

#### 2. **Feature Components** (`frontend/src/components/features/`)
Major feature pages:
- **RoadmapGenerator.tsx** - Create personalized career roadmaps
- **CourseRecommender.tsx** - Get course recommendations
- **ResumeAnalyzer.tsx** - Upload & analyze resumes
- **RoleIntel.tsx** - View job role details (salary, skills, responsibilities)
- **ChatAssistant.tsx** - AI-powered career coaching
- **JobSearch.tsx** - Search 100+ job portals & career pages
- **SavedItems.tsx** - Manage saved roadmaps & courses
- **Profile.tsx** - View & edit user profile

---

## Services Architecture

### Frontend Services (`frontend/src/services/`)

| Service | Responsibility |
|---------|-----------------|
| **authService.ts** | User authentication, registration, login state management |
| **geminiService.ts** | API client for backend `/api/genai/` endpoints |
| **storageService.ts** | Save/retrieve data from localStorage or Supabase |
| **notificationService.ts** | Manage notifications (localStorage or Supabase realtime) |

### Backend APIs (`backend/api/genai/`)

All endpoints use **Google Gemini 2.5-Flash** model:

| Endpoint | Purpose | Request | Response |
|----------|---------|---------|----------|
| **POST /api/genai/roadmap** | Generate career roadmap | `{role, currentSkills, availability}` | `{role, duration_weeks, weekly_plan}` |
| **POST /api/genai/courses** | Recommend courses | `{role, level, budget}` | `{courses[]}` |
| **POST /api/genai/analyze** | Resume analysis | `{base64Data, mimeType}` | `{skills_identified, missing_skills, suggested_roles}` |
| **POST /api/genai/role** | Job role details | `{roleName}` | `{overview, required_skills, salary_range, responsibilities}` |
| **POST /api/genai/chat** | AI chat assistant | `{history, message}` | `{text}` |

---

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend Framework** | React 19.2.3 |
| **Language** | TypeScript 5.8 |
| **Build Tool** | Vite 6.2 |
| **Styling** | Tailwind CSS (CDN) + Inter Font |
| **AI/ML** | Google Gemini 2.5-Flash API |
| **Backend** | Vercel Serverless Functions |
| **Database/Storage** | localStorage (default) + Supabase (optional) |

---

## Import Paths Guide

### Frontend imports reference shared types:
```typescript
// Importing from shared types
import { ViewState, UserProfile } from '../../../../shared/types';

// Component imports (relative within frontend)
import RoadmapGenerator from '../features/RoadmapGenerator';

// Service imports
import { generateRoadmap } from '../services/geminiService';
```

### Backend files are independent:
```typescript
// Backend doesn't import frontend types
// Each endpoint defines its own response schemas
import { GoogleGenAI, Type, Schema } from '@google/genai';
```

---

## Development Workflow

### Running the Development Server

```bash
# Root directory
npm install          # Install all dependencies (runs in frontend via scripts)
npm run dev          # Start Vite dev server (frontend)
npm run build        # Build frontend
npm run preview      # Preview production build
```

### Environment Variables

**Frontend** (`.env.example`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

**Backend** (`.env.local` or Vercel environment):
```
GENAI_API_KEY=your_google_genai_key
```

---

## File Organization Benefits

### ✅ Advantages of this Structure:

1. **Clear Separation of Concerns**
   - Frontend code isolated in `/frontend`
   - Backend APIs isolated in `/backend`
   - Shared types in `/shared`

2. **Independent Deployment**
   - Frontend deploys to Vercel (static build)
   - Backend deploys as serverless functions
   - Services maintain independent versioning

3. **Scalability**
   - Add backend APIs without touching frontend
   - Scale frontend independently
   - Easy to add new feature components

4. **Maintainability**
   - Clear folder hierarchy
   - Easy to locate components and services
   - Type safety with shared interfaces

5. **Testing**
   - Services can be tested independently
   - Components can be tested in isolation
   - Backend endpoints have clear schemas

---

## Key Features Implemented

### Frontend Features:
- ✅ Career Roadmap Generation (AI-powered, week-by-week)
- ✅ Course Recommendations (GeeksforGeeks, W3Schools, YouTube)
- ✅ Resume Analysis (skill extraction, role matching)
- ✅ Job Role Intelligence (salary, skills, responsibilities)
- ✅ AI Chat Assistant (career coaching)
- ✅ Job Search (100+ portals & career pages)
- ✅ Saved Items Management
- ✅ User Authentication & Registration
- ✅ Profile Management
- ✅ Notifications System

### Backend APIs:
- ✅ Roadmap Generation
- ✅ Course Recommendations
- ✅ Document Analysis (PDF, Images)
- ✅ Job Role Intelligence
- ✅ AI Chat Conversations

---

## Authentication

**Demo Credentials** (hardcoded in `authService.ts`):
- `admin@kare26.com` / `password123` → Admin User
- `student@kare26.com` / `student123` → Student User
- `demo@kare26.com` / `demo123` → Demo User

---

## Data Persistence

- **Without Supabase**: All data stored in browser's localStorage
- **With Supabase**: Syncs to remote database for cross-device access

---

## Next Steps

1. **Install Dependencies**: `npm install` in root directory
2. **Set Environment Variables**: Create `.env` files
3. **Run Development Server**: `npm run dev`
4. **Build for Production**: `npm run build`
5. **Deploy Frontend**: Push to Vercel
6. **Deploy Backend**: Vercel automatically deploys `/api` folder

---

## File Modifications Made

- ✅ Updated all import paths from relative to shared types
- ✅ Reorganized components into `common/` and `features/` subdirectories
- ✅ Created backend and frontend directory structures
- ✅ Updated `vite.config.ts` with correct path aliases
- ✅ Updated `tsconfig.json` for both frontend and backend
- ✅ Updated `package.json` scripts to reference frontend directory
- ✅ Updated `index.html` script entry point
- ✅ Created shared types directory

---

**Project successfully restructured! All features are working and properly organized.**
