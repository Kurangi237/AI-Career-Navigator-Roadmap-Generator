# Supabase Database Setup Guide

This guide explains how to set up and connect Supabase to your AI Career Navigator application.

---

## 1. CREATE SUPABASE PROJECT

### Step 1: Go to Supabase
1. Visit [https://supabase.com](https://supabase.com)
2. Click **"Create a new project"** or sign in
3. Click **"New Project"**

### Step 2: Configure Project
- **Project Name**: `ai-career-navigator` (or your preferred name)
- **Database Password**: Create a strong password (save this!)
- **Region**: Choose closest to your location
- Click **Create new project**

### Step 3: Wait for Setup
- Supabase will create your PostgreSQL database
- This takes 2-3 minutes
- You'll see a green checkmark when ready

---

## 2. GET YOUR CREDENTIALS

Once your project is created:

1. Go to **Settings** (⚙️ icon, bottom left)
2. Click **API** in the sidebar
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Public Key**: `eyJxxxxx...`

Save these values!

---

## 3. SET UP ENVIRONMENT VARIABLES

### Create `.env.local` file in project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### In `.env` file in backend:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
```

---

## 4. CREATE DATABASE TABLES

Go to **SQL Editor** in Supabase and run these queries:

### Table 1: Users Profile
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  full_name VARCHAR,
  role VARCHAR DEFAULT 'student',
  subscription_plan VARCHAR DEFAULT 'starter',
  avatar_url TEXT,
  target_role VARCHAR,
  skills TEXT,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_profiles_email ON profiles(email);
```

### Table 2: Roadmaps (Saved)
```sql
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  duration_weeks INTEGER,
  availability VARCHAR,
  skills TEXT,
  roadmap_data JSONB, -- Stores the full roadmap
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_email) REFERENCES profiles(email)
);

CREATE INDEX idx_roadmaps_email ON roadmaps(user_email);
CREATE INDEX idx_roadmaps_created ON roadmaps(created_at);
```

### Table 3: Resume Drafts
```sql
CREATE TABLE IF NOT EXISTS resume_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR NOT NULL,
  name VARCHAR,
  template_id VARCHAR,
  full_name VARCHAR,
  title VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  location VARCHAR,
  links JSONB, -- Array of links
  summary TEXT,
  skills JSONB, -- Array of skills
  experience JSONB, -- Array of experience entries
  projects JSONB, -- Array of projects
  education JSONB, -- Array of education
  certifications JSONB, -- Array of certs
  achievements JSONB, -- Array of achievements
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_email) REFERENCES profiles(email)
);

CREATE INDEX idx_resume_drafts_email ON resume_drafts(user_email);
CREATE INDEX idx_resume_drafts_updated ON resume_drafts(updated_at);
```

### Table 4: Saved Resume Scans
```sql
CREATE TABLE IF NOT EXISTS resume_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR NOT NULL,
  file_name VARCHAR,
  skills_identified JSONB, -- Array of skills found
  missing_skills JSONB, -- Array of missing skills
  has_jd_context BOOLEAN DEFAULT FALSE,
  scan_data JSONB, -- Full analysis result
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_email) REFERENCES profiles(email)
);

CREATE INDEX idx_resume_scans_email ON resume_scans(user_email);
```

### Table 5: Registered Users (for signup)
```sql
CREATE TABLE IF NOT EXISTS registered_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR, -- NOTE: Use proper bcrypt in production!
  name VARCHAR,
  role VARCHAR DEFAULT 'student',
  subscription_plan VARCHAR DEFAULT 'starter',
  avatar_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_registered_users_email ON registered_users(email);
```

---

## 5. ENABLE ROW LEVEL SECURITY (RLS)

This restricts users to only see their own data:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy for profiles: Users can only update their own profile
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- RLS Policy for roadmaps: Users can only see/update their own
CREATE POLICY roadmaps_user_access ON roadmaps
  FOR ALL USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- RLS Policy for resume drafts: Users can only see/update their own
CREATE POLICY resume_drafts_user_access ON resume_drafts
  FOR ALL USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- RLS Policy for resume scans: Users can only see/update their own
CREATE POLICY resume_scans_user_access ON resume_scans
  FOR ALL USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);
```

---

## 6. HOW IT WORKS

### Connection Flow:

```
Frontend (React)
    ↓
authService.ts
    ↓ (checks if Supabase configured)
    ↓
Supabase Client (supabase-js)
    ↓
Supabase Backend (PostgreSQL Database)
    ↓
Your Tables (profiles, roadmaps, resume_drafts, etc.)
```

### Data Storage:

| Feature | Storage | How It Works |
|---------|---------|-------------|
| **User Profile** | `profiles` table | Saved when user logs in or updates profile |
| **Roadmap** | `roadmaps` table | Saved when user clicks "Save Roadmap" |
| **Resume Draft** | `resume_drafts` table | Saved locally + Supabase when "Save Draft" clicked |
| **Resume Scan** | `resume_scans` table | Saved after analyzing a resume |
| **User Registration** | `registered_users` table | Saved when new user signs up |

---

## 7. UPDATE YOUR CODE

### In `frontend/src/services/authService.ts`:

The code already checks for Supabase:

```typescript
// At the top of authService.ts
let supabase: any = null;
let isSupabase = false;
try {
  const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
  const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (SUPABASE_URL && SUPABASE_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    isSupabase = true;
  }
} catch (e) {
  isSupabase = false;
}
```

### Install Supabase library:

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

---

## 8. TEST YOUR CONNECTION

### Check if Supabase is connected:

1. Open browser **Console** (F12)
2. Login to the app
3. If Supabase is connected, you'll see user data in the `profiles` table

### In Supabase Dashboard:

1. Go to **SQL Editor**
2. Run:
```sql
SELECT * FROM profiles;
```

You should see your logged-in user!

---

## 9. WHAT DATA IS STORED WHERE

### localStorage (Browser)
- User profile (quick access)
- Resume drafts (offline backup)
- Roadmaps (offline access)

### Supabase (Cloud Database)
- User accounts
- Saved roadmaps (persistent)
- Resume drafts (persistent)
- Resume scans
- User settings

### Why Both?
- **localStorage** = Fast, offline support
- **Supabase** = Persistent, multi-device access, backup

---

## 10. TROUBLESHOOTING

### Supabase not connecting?

**Check:**
1. `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Project is running on `localhost:3000` (dev) or deployed URL
3. Check browser console for errors (F12)

**Fix:**
```bash
# Restart dev server
npm run dev:all
```

### Data not saving?

1. Check **RLS Policies** are enabled
2. Make sure user is logged in (not anonymous)
3. Check Supabase **Auth** settings allow signups

### Performance slow?

- Add database indexes (already included in SQL)
- Cache frequently accessed data in localStorage
- Implement pagination for large datasets

---

## 11. PRODUCTION CHECKLIST

Before deploying to production:

- [ ] Environment variables set in hosting platform
- [ ] RLS Policies enabled and tested
- [ ] Backup strategy in place
- [ ] Database indexes created
- [ ] Authentication properly configured
- [ ] Test user registration and login
- [ ] Verify data persistence works
- [ ] Set up monitoring/alerts in Supabase

---

## 12. HELPFUL COMMANDS

```bash
# Check environment variables are set
cat .env.local

# Restart dev server
npm run dev:all

# Rebuild frontend
npm run build:frontend

# Connect to Supabase CLI (optional)
supabase login
supabase projects list
```

---

## QUICK REFERENCE

| What | Where |
|------|-------|
| **API URL** | Settings → API → Project URL |
| **API Keys** | Settings → API → Keys |
| **Database** | SQL Editor |
| **Users** | Authentication → Users |
| **Tables** | Table Editor |
| **RLS** | Table → RLS Policies |

---

Done! Your database is now set up and connected to your AI Career Navigator! 🚀
