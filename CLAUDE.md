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

### Local Development

For local development, run backend and frontend **natively** (without Docker):
```bash
# Backend: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Frontend: npm run dev
```

### TDD Workflow (MUST FOLLOW)

For each task/feature, execute this sequence:

```
1. BEFORE CODING
   □ Write unit tests (pytest/vitest)
   □ Check Bruno collection for related endpoints
   □ Write E2E expectation (e2e/expectations/*.md)
        ↓
2. IMPLEMENTATION
   □ Write code to make tests pass
        ↓
3. UNIT TESTS
   $ pytest backend/tests/ -v
   $ npm run test --prefix frontend
   → Must pass before continuing
        ↓
4. BUILD (Required before commit - ensures CI/CD compatibility)
   $ npm run build --prefix frontend
   $ docker build -t hydra-backend ./backend
   → Must succeed before continuing
   → Docker build catches platform-specific issues
        ↓
5. BRUNO API TESTS
   $ bru run bruno/collections --env local
   → Validates all API endpoints
        ↓
6. CHROME E2E (via Claude-in-Chrome MCP)
   □ Execute scenarios from e2e/expectations/
   □ Screenshot evidence saved to e2e/results/
        ↓
7. COMMIT & PUSH (only after all tests pass)
   $ git add <files>
   $ git commit -m "type: description"
   $ git push origin <branch>
   → If push fails due to conflicts:
     $ git pull --rebase origin <branch>
     → Resolve conflicts, then continue rebase
     $ git push origin <branch>
```

See `docs/design/testing-workflow.md` for full details.

## CI/CD

GitHub Actions in `.github/workflows/`:
- `ci.yml` - Tests and lint on PRs
- `deploy-backend.yml` - Railway deployment
- `deploy-frontend.yml` - Vercel deployment

Required secrets: `RAILWAY_TOKEN`, `VERCEL_TOKEN`, Supabase and API keys

## YOU MUST

- NEVER commit `docs/api/` to git - contains sensitive API documentation (in .gitignore)
- NEVER include API keys, secrets, or credentials in any documentation

## Documentation Requirements

**CRITICAL**: Documentation is a MANDATORY part of every task. You MUST proactively update documentation and ask the user to confirm updates.

**CRITICAL**: You should check `docs/tasks/current.md` and identify which task/bug you are working on. If you cannot find existing one, you should proactively create markdown for either task or bug, based on `docs/README.md` template.

### Documentation is Non-Negotiable

Treat documentation updates with the same importance as code commits. Undocumented work is incomplete work. Always proactively offer to update documentation - do not wait for the user to ask.

### Documentation Structure

All project documentation is in the `docs/` folder:
- `docs/roadmap.md` - **Development phases and priorities**
- `docs/features/` - Feature development logs (requirements, tasks, commits, timeline)
- `docs/bugs/` - Bug fix documentation (symptoms, attempts, solution, prevention)
- `docs/design/` - Design documents and architecture
- `docs/api/` - API documentation (backend and frontend)
- `docs/tasks/current.md` - **Active tasks and next steps** (rolling update)
- `docs/tasks/` - Active task tickets
- `docs/tasks/backlog/` - **Future tasks** (can be picked up if have capacity)
- `docs/tasks/done/` - **Completed tasks** (permanent record)
- `docs/tasks/archive/` - **Obsolete tasks** (no longer on plan due to roadmap changes)

See `docs/README.md` for complete documentation guide.

### Task Folder Organization

**CRITICAL**: Follow this task lifecycle for all ticket files.

#### Task Lifecycle: Backlog → Active → Done (or Archive)

```
docs/tasks/
├── *.md                    ← Active: Currently working on or up next
├── backlog/
│   └── *.md               ← Future: Can be picked up if have capacity
├── done/
│   └── *.md               ← Finished: Completed tasks (permanent)
└── archive/
    └── OBSOLETE_*.md      ← Obsolete: No longer on plan (roadmap changed)
```

#### When to Move Tasks Between Folders

**backlog/ → Active:**
- When starting a new phase (e.g., Phase 1 complete → move Phase 2 tasks to active)
- When previous phase completion criteria are met
- When dependencies are resolved
- **When have capacity** to pick up the task

**Active → done/:**
- Task is fully completed and tested
- All commits have been made
- Documentation has been updated
- Task is no longer "active" or "in progress"
- **Examples**: Completed features, resolved bugs, finished infrastructure setup
- **Note**: Tasks stay in `done/` permanently (not time-based)

**Active/Backlog → archive/:**
- Task approach was replaced by a better solution
- Roadmap changed and task is no longer relevant
- Architecture change made task obsolete
- **Examples**: OBSOLETE_0013-0017 (replaced by RAG-Anything approach)
- **Archive to**: `docs/tasks/archive/OBSOLETE_[number]_[name].md`
- **Note**: Archive is for roadmap changes, NOT for old completed tasks

#### Folder Purposes

**backlog/** - Future tasks:
- Contains tasks for Phase 2, Phase 3, Phase 4+
- Tasks that **can** be picked up if have capacity
- Not necessarily tasks that **must** be done
- Move to active folder when ready to start
- See `docs/tasks/backlog/README.md`

**done/** - Completed tasks (permanent):
- Permanent record of finished work
- Historical reference for accomplishments
- Documentation of completed features and fixes
- **Tasks stay here permanently**, not moved based on time
- See `docs/tasks/done/README.md`

**archive/** - Obsolete tasks:
- Tasks no longer on plan due to roadmap changes
- Replaced approaches or architecture changes
- Kept for historical reference only
- **NOT for old completed tasks** - only for obsolete ones

#### Example Workflow

**Starting Phase 2:**
```bash
# Move Phase 2 tasks from backlog to active
mv docs/tasks/backlog/0028_raganything-setup.md docs/tasks/
mv docs/tasks/backlog/0029_multimodal-processing.md docs/tasks/
# ... etc

# Move completed Phase 1 tasks to done (they stay there permanently)
mv docs/tasks/0001_initial-project-setup.md docs/tasks/done/
mv docs/tasks/0002_flask-backend-structure.md docs/tasks/done/
# ... etc
```

**When roadmap changes (obsolete tasks):**
```bash
# Move obsolete tasks to archive with OBSOLETE prefix
mv docs/tasks/backlog/0020_lightrag-neo4j-setup.md docs/tasks/archive/OBSOLETE_0020_lightrag-neo4j-setup.md
# Reason: Replaced by RAG-Anything approach
```

### Ticket Naming Convention

Use component-based prefixes that map to git worktrees:

| Prefix | Component | Directory | Number Range |
|--------|-----------|-----------|--------------|
| AUTH-  | Backend Auth | `backend/app/` | 100-199 |
| API-   | Backend Services | `backend/app/` | 200-299 |
| EDITOR-| Editor Core (BlockSuite) | `frontend/src/blocks/` | 300-399 |
| FE-    | Frontend (non-editor) | `frontend/src/` (excl. blocks) | 400-499 |

**Worktree Mapping:**
- `auth` worktree → AUTH-* tickets
- `api` worktree → API-* tickets
- `editor` worktree → EDITOR-* tickets
- `fe` worktree → FE-* tickets

**Parallelism Rules:**
- AUTH + API = CAUTION (same backend, different dirs)
- AUTH + EDITOR = SAFE (backend vs frontend)
- AUTH + FE = SAFE (backend vs frontend)
- API + EDITOR = SAFE (backend vs frontend)
- API + FE = SAFE (backend vs frontend)
- EDITOR + FE = SAFE (different frontend dirs)
- Same prefix = SEQUENTIAL (use same worktree)

**Examples:**
- `AUTH-101_supabase-client.md` → auth worktree
- `API-201_claude-service.md` → api worktree
- `EDITOR-301_blocksuite-integration.md` → editor worktree
- `FE-401_supabase-client-frontend.md` → fe worktree

### When to Update Documentation

**ALWAYS update documentation after:**
1. Completing any feature or significant task
2. Fixing any bug that required investigation
3. Making architectural or design changes
4. Adding/modifying API endpoints or components
5. Starting, pausing, or completing work sessions
6. Completing phase deliverables (update `docs/roadmap.md`)

### Required Documentation Workflow

**After completing ANY task, you MUST:**

1. **Ask the user explicitly**: "Should I update the documentation for this work?"
2. **Suggest which docs to update** based on the work done:
   - Features: Create/update `docs/features/[feature-name].md`
   - Bugs: Create/update `docs/bugs/BUG-###-[name].md`
   - APIs: Update `docs/api/backend-api.md` or `docs/api/frontend-api.md`
   - Design: Update `docs/design/architecture.md`
   - Phase deliverables: Check boxes in `docs/roadmap.md`
   - **ALWAYS**: Update `docs/tasks/current.md`

3. **Propose specific updates**:
   - List commits with hashes and messages
   - Add timestamps for completed tasks
   - Update task status and progress
   - Document next steps or blockers

4. **Wait for confirmation** before updating docs

### Starting Work

**When asked to "continue work" or "finish recent task":**
1. **FIRST** read `docs/roadmap.md` to understand the current development phase
2. Read `docs/tasks/current.md` to understand context
3. Check the "For Claude Code" section for quick start instructions
4. Review related feature/bug docs if referenced
5. Proceed with the documented "Next Steps"