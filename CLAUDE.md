# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hydra Notes is an AI-powered hierarchical note-taking application. It uses a React + BlockSuite frontend with a FastAPI backend, Supabase for auth/database, and Claude API for AI features.

## Build & Development Commands

### Frontend (in `frontend/`)
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173)
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run (CI)
```

### Backend (in `backend/`)
```bash
pip install -r requirements.txt                           # Install deps
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000  # Dev server
pytest tests/ -v                                          # Run tests
pytest tests/test_auth.py -v                              # Single test file
```

### Full Stack (Docker)
```bash
docker-compose up --build  # Backend :8000, Frontend :5173, Redis :6379
```

## Architecture

### Frontend Stack
- **React 19** + TypeScript + Vite
- **BlockSuite** for block-based hierarchical editor
- **Zustand** for state management (stores in `src/stores/`)
- **Y-indexeddb** for local-first persistence with Yjs
- **Tailwind CSS v4** (uses `@import "tailwindcss"` syntax and `@tailwindcss/postcss` plugin)

### Backend Stack
- **FastAPI** + Python 3.12 + Pydantic v2
- **Supabase** for PostgreSQL + Auth (Google OAuth)
- **Anthropic Claude API** for AI generation
- **Redis** for rate limiting

### Key Architectural Decisions
1. **Local-first with cloud sync**: Notes stored in IndexedDB via Y-indexeddb, synced to Supabase
2. **SAT/PROD isolation**: Separate Supabase projects for staging vs production
3. **AI rate limiting**: 50 generations per user (tracked in `user_profiles.ai_generations_used`)
4. **BlockSuite integration**: Custom block schemas in `frontend/src/blocks/`

## Environment Configuration

Three environments: `.env.local`, `.env.sat`, `.env.prod`

Key variables:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` - Frontend Supabase
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` - Backend Supabase (service key has elevated privileges)
- `ANTHROPIC_API_KEY` - Claude API
- `JWT_SECRET` - Must differ per environment

## Database Schema

Schema in `database/schema.sql`. Key elements:
- `user_profiles` table extends `auth.users` with AI generation tracking
- Row Level Security enabled - users can only access their own data
- `handle_new_user()` trigger auto-creates profile on signup
- `increment_ai_generation()` function for atomic usage tracking

## Path Aliases

Frontend uses `@/*` → `./src/*` (configured in `tsconfig.app.json` and `vite.config.ts`)

## Testing

- **Frontend**: Vitest + React Testing Library, config in `vitest.config.ts`
- **Backend**: Pytest + pytest-asyncio, config in `pytest.ini`
- Test files mirror source structure in `__tests__/` (frontend) and `tests/` (backend)

## CI/CD

GitHub Actions in `.github/workflows/`:
- `ci.yml` - Tests and lint on PRs
- `deploy-backend.yml` - Railway deployment
- `deploy-frontend.yml` - Vercel deployment

Required secrets: `RAILWAY_TOKEN`, `VERCEL_TOKEN`, Supabase and API keys
