# Development Setup Guide

## ✅ Environment Setup Complete

Your project now supports **two development modes**:

---

## **Option 1: Frontend Only (Quick Development)**

Best for UI/UX development when you don't need API responses.

```bash
npm run dev
```

**Access**: http://localhost:3000

**Note**: API calls will fail with "Failed to generate roadmap" error. This is expected in frontend-only mode.

---

## **Option 2: Full Stack Development (Recommended)**

Runs both frontend and backend APIs together. **This is what you need to test all features.**

```bash
npm run dev:full
```

**What this does**:
1. ✅ Starts Vite frontend dev server
2. ✅ Starts backend API server (Vercel serverless functions)
3. ✅ Handles API routing automatically

**Access**: http://localhost:3000

**All features**: ✅ Working (Roadmap, Courses, Resume, etc.)

---

## **Available Demo Credentials**

```
Email: admin@kare26.com
Password: password123

Email: student@kare26.com
Password: student123

Email: demo@kare26.com
Password: demo123
```

---

## **Environment Variables**

### Required
```
GENAI_API_KEY=AIzaSyDDHJrf8uYDk5k_gJSA-FoFshlpaWpP0O0
```

This is already set in `.env` file at the root.

### Optional (for notifications)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

---

## **Project Scripts**

| Command | Purpose |
|---------|---------|
| `npm run dev` | Frontend only (Vite dev server) |
| `npm run dev:full` | Full stack with APIs (Vercel dev) |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build locally |

---

## **Troubleshooting**

### "Failed to generate roadmap" Error
**Solution**: Use `npm run dev:full` instead of `npm run dev`

This ensures both frontend AND backend APIs are running.

### API Key Issues
Check that `.env` file exists in root directory with:
```
GENAI_API_KEY=AIzaSyDDHJrf8uYDk5k_gJSA-FoFshlpaWpP0O0
```

### Port Already in Use
Vercel dev will automatically use the next available port (3000, 3001, 3002, etc.)

---

## **Project Structure**

```
📦 Project Root
├── frontend/              # React Frontend
│   ├── src/              # Source code
│   ├── vite.config.ts    # Vite configuration
│   └── package.json
│
├── backend/              # Vercel Serverless APIs
│   ├── api/genai/        # GenAI endpoints
│   └── dev-server.ts     # Dev utilities
│
├── shared/               # Shared Types
│   └── types.ts
│
├── vercel.json           # Vercel configuration
├── package.json          # Root package (orchestration)
└── .env                  # Environment variables
```

---

## **Features Running**

✅ Career Roadmap Generator - Uses GenAI to create weekly roadmaps
✅ Course Recommender - Finds learning resources by role
✅ Resume Analyzer - Extracts skills and suggests roles
✅ Job Role Intelligence - Details, skills, salary for any role
✅ AI Chat Assistant - Career coaching chatbot
✅ Job Search - Browse 100+ job portals
✅ Saved Items - Manage your roadmaps and courses
✅ Authentication - Login/Register with demo credentials
✅ Notifications - Real-time job and course alerts
✅ Profile Management - Update your career info

---

## **Next Steps**

1. **Start Development**:
   ```bash
   npm run dev:full
   ```

2. **Login** with demo credentials

3. **Test Features**:
   - Go to "Roadmap" → Enter role "Software Engineer" → Click "Generate"
   - See the AI-generated career roadmap

4. **Make Changes**: Edit files in `frontend/src/` - changes auto-reload!

---

## **Deployment**

### To Firebase/Vercel:
1. Push code to GitHub
2. Connect repository to Vercel
3. Vercel auto-deploys on push
4. Set `GENAI_API_KEY` in Vercel dashboard environment variables

---

**Happy coding! 🚀**
