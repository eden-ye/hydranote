# Current Tasks

**Current Phase**: Phase 2 - Core Editor
**Last Updated**: 2026-01-10

## Recently Completed

| Ticket | Title | Status | Notes |
|--------|-------|--------|-------|
| EDITOR-306 | Keyboard Shortcuts | ✅ completed | Full BlockSuite integration, Tab/Shift+Tab, Enter, Cmd+Enter, arrows, Cmd+. |
| EDITOR-305 | IndexedDB Persistence | ✅ completed | y-indexeddb integration, loading indicator, error handling |
| EDITOR-304 | Inline Detail View | ✅ completed | Inline preview for collapsed bullets |
| EDITOR-303 | Folding/Collapse | ✅ completed | Keyboard shortcut (Cmd+.), accessibility, tests passing |
| EDITOR-302 | Bullet Block Schema | ✅ completed | Schema, component, spec, tests all passing |
| EDITOR-301 | BlockSuite Integration | ✅ completed | Foundation for editor |
| API-201 | Claude AI Service | ✅ completed | Full CRUD API, tests passing |
| API-202 | Prompt Builder | ✅ completed | Prompt templates for AI generation |

## Infrastructure (Blocking)

| Ticket | Title | Status | Notes |
|--------|-------|--------|-------|
| INFRA-001 | SAT/PROD Deployment Separation | 🔧 in_progress | Frontend ✅ live on Vercel, Backend ❌ Railway token missing |

**Deployment Status** (Verified 2026-01-10):
- **Frontend**: ✅ LIVE at https://frontend-taylorye.vercel.app
- **Backend**: ❌ FAILED - Missing RAILWAY_TOKEN secret in GitHub Actions
  - Custom domains (api.hydranote.app, api-sat.hydranote.app) not resolving
  - Action Required: Add RAILWAY_TOKEN to GitHub repository secrets

## Active (Phase 2 - EDITOR)

| Ticket | Title | Status | Deps |
|--------|-------|--------|------|
| EDITOR-307 | Editor Store | pending | EDITOR-301 ✅ |

**Next up**: EDITOR-307 (Editor Store)

**EDITOR-306 completed**: All keyboard shortcuts implemented using BlockSuite's bindHotKey system

## Parallel Work Opportunities

While Phase 2 (EDITOR) is in progress, these can start in parallel:

### AUTH (Phase 3) - Different worktree, backend focused
- AUTH-101: Supabase Client (Backend) - No deps, can start now
- AUTH-102, 103, 104 follow sequentially

### API (Phase 4) - Different worktree, backend focused
- ~~API-201: Claude AI Service~~ - ✅ COMPLETED
- ~~API-202: Prompt Builder~~ - ✅ COMPLETED
- API-203: WebSocket Streaming - Can start now
- API-204, 205 follow

### FE (Phase 3) - Different worktree, frontend services
- FE-401: Supabase Client (Frontend) - No deps, can start now
- FE-402, 403 follow

## Blocked
<!-- Items waiting on dependencies or decisions -->
None currently blocked.

## Notes for Claude Code

**Quick Start**:
1. EDITOR-301 through EDITOR-306 are complete
2. Remaining: EDITOR-307 (Editor Store)
3. Backend work (AUTH, API) can start in parallel immediately

**Infrastructure Completed**:
- MongoDB Atlas connected and working
- Blocks CRUD API implemented with tree queries
- Auth middleware ready (needs JWT validation wiring)
- IndexedDB persistence for local-first storage

**Worktree Commands**:
```bash
# Create worktrees for parallel development
git worktree add ../hydra-editor editor
git worktree add ../hydra-auth auth
git worktree add ../hydra-api api
git worktree add ../hydra-fe fe
```

**Test Commands**:
```bash
# Backend
cd backend && python3 -m pytest tests/ -v

# Frontend
cd frontend && npm run build

# Docker (requires Docker Desktop running)
docker build -t hydra-backend ./backend
```
