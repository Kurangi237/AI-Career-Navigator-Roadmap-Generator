# AI Career Navigator & Roadmap Generator

This repository contains the frontend for the AI Career Navigator & Roadmap Generator.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in your values locally (do NOT commit `.env.local`).

```bash
cp .env.example .env.local
# edit .env.local and add real keys
```

2. Install and run locally:

```bash
npm install
npm run dev
```

## Required environment variables

- `VITE_API_KEY` — Google GenAI / Gemini API key (Vite env prefix ensures the key is available in client code if intentionally used). Prefer server-side proxy for sensitive keys.
- `VITE_SUPABASE_URL` — Supabase project URL (optional)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (optional)

Important: do not commit API keys or `.env.local` to the repository. Use your hosting provider's environment variables or GitHub Actions secrets for deployments.

## Deployment (recommended)

- For Vercel / Netlify: set the above variables in the project's Environment UI (Project Settings → Environment Variables).
- For GitHub Actions deploys: add repo `Secrets` with those names and reference them in your workflow.

## Quick CI check

This repo includes a simple GitHub Actions workflow that runs `npm install` and `npm run build` on push and pull requests to catch build regressions early.

If you'd like, I can also add a serverless proxy (API route) so the GenAI key never goes to the browser; tell me which platform you prefer (Vercel, Netlify, or GitHub Actions) and I'll scaffold it.
 
<!-- CI retrigger note -->
<!-- Triggered: 2026-01-03 -->
