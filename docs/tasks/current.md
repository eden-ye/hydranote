# Current Tasks

**Current Phase**: Phase 2 - Core Editor
**Last Updated**: 2026-01-09

## Recently Completed

| Ticket | Title | Status | Notes |
|--------|-------|--------|-------|
| API-201 | MongoDB Schema Implementation | ✅ completed | Full CRUD API, tests passing |

## Active (Phase 2 - EDITOR)

| Ticket | Title | Status | Deps |
|--------|-------|--------|------|
| EDITOR-301 | BlockSuite Integration | pending | None |
| EDITOR-302 | Bullet Block Schema | pending | EDITOR-301 |
| EDITOR-303 | Folding/Collapse | pending | EDITOR-302 |
| EDITOR-304 | Inline Detail View | pending | EDITOR-302 |
| EDITOR-305 | IndexedDB Persistence | pending | EDITOR-301 |
| EDITOR-306 | Keyboard Shortcuts | pending | EDITOR-301 |
| EDITOR-307 | Editor Store | pending | EDITOR-301 |

**Start with**: EDITOR-301 (foundation, no dependencies)

**After EDITOR-301**: Can parallel EDITOR-302, 305, 306, 307

## Parallel Work Opportunities

While Phase 2 (EDITOR) is in progress, these can start in parallel:

### AUTH (Phase 3) - Different worktree, backend focused
- AUTH-101: Supabase Client (Backend) - No deps, can start now
- AUTH-102, 103, 104 follow sequentially

### API (Phase 4) - Different worktree, backend focused
- ~~API-201: MongoDB Schema~~ - ✅ COMPLETED
- API-202: Claude AI Service - No deps, can start now
- API-203, 204, 205 follow

### FE (Phase 3) - Different worktree, frontend services
- FE-401: Supabase Client (Frontend) - No deps, can start now
- FE-402, 403 follow

## Blocked
<!-- Items waiting on dependencies or decisions -->
None currently blocked.

## Notes for Claude Code

**Quick Start**:
1. Start with EDITOR-301 (BlockSuite Integration)
2. This unlocks 6 parallel tickets: EDITOR-302 through EDITOR-307
3. Backend work (AUTH, API) can start in parallel immediately

**Infrastructure Completed**:
- MongoDB Atlas connected and working
- Blocks CRUD API implemented with tree queries
- Auth middleware ready (needs JWT validation wiring)

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
