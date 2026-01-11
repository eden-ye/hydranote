# Current Tasks

**Current Phase**: Phase 2 - Core Editor (Keyboard Behaviors Complete)
**Last Updated**: 2026-01-11

## Summary

**Completed**: 32 tickets in `done/`
**Active**: 9 tickets remaining (5 MVP1 + 4 needs_integration)
**Backlog (MVP2)**: 23 tickets (ready after MVP1 complete)
**Archived**: 2 obsolete tickets

## Recently Completed (moved to done/)

All keyboard behavior tickets (EDITOR-3051-3063) are now complete:
- Enter key: creates sibling, splits text, creates first child when parent has children
- Backspace: merges with previous, navigates to last visible descendant, handles selection
- Delete: merges with next, unindents children instead of deleting them
- Arrow keys: normal text navigation (no expand/collapse on arrows)
- Cmd+Enter: toggles fold

Also completed: API-203 (WebSocket streaming), FE-401-404 (Supabase, auth store, login UI, spotlight)

**2026-01-11**: FE-405 (AI Generation Store) - Integrated into App.tsx, Spotlight shows "50 remaining"

## Infrastructure (Blocking)

| Ticket | Title | Status | Notes |
|--------|-------|--------|-------|
| INFRA-001 | SAT/PROD Deployment Separation | 🔧 in_progress | Frontend ✅ live on Vercel, Backend ❌ Railway token missing |

**Deployment Status** (Verified 2026-01-10):
- **Frontend**: ✅ LIVE at https://frontend-taylorye.vercel.app
- **Backend**: ❌ FAILED - Missing RAILWAY_TOKEN secret in GitHub Actions
  - Custom domains (api.hydranote.app, api-sat.hydranote.app) not resolving
  - Action Required: Add RAILWAY_TOKEN to GitHub repository secrets

## Active Tickets (10)

### MVP1 Core (5)

| Ticket | Title | Status | Notes |
|--------|-------|--------|-------|
| BUG-EDITOR-3064 | Null Model Render Error | open | "Cannot read properties of null" in production |
| EDITOR-307 | Editor Store | pending | Zustand store for document/selection state |
| EDITOR-3056 | Inline Formatting | pending | Bold/italic/underline (Cmd+B/I/U) support |
| INFRA-001 | SAT/PROD Deployment | in_progress | Needs GitHub secrets added |
| INFRA-501 | CI/CD Duplication Fix | open | Railway auto-deploy + GitHub Actions both running |

### Needs Integration (4) - Code Complete, Not Wired

| Ticket | Title | Status | Notes |
|--------|-------|--------|-------|
| FE-406 | Focus Mode Navigation | needs_integration | Hook/store exist, not wired in Editor.tsx |
| FE-407 | Breadcrumb Component | needs_integration | Component exists, not rendered in Editor.tsx |
| FE-408 | Expand Button Logic | needs_integration | Hook exists, expand button not added to bullets |
| FE-409 | Ghost Questions | needs_integration | Component exists, not rendered in Editor.tsx |

## Next Steps

1. **INFRA-001**: Add GitHub secrets (RAILWAY_TOKEN, etc.) - user action required
2. **INFRA-501**: Disable Railway auto-deploy or GitHub Actions workflow
3. **EDITOR-307**: Create editor Zustand store
4. **EDITOR-3056**: Enable inline formatting on rich-text

## Recently Verified Complete (Phase 3)

### AUTH (Phase 3) - Backend ✅
- AUTH-101, 102, 103, 104: All completed with 125 backend tests passing

### FE (Phase 4-5) - Integration In Progress
- FE-405: ✅ DONE - Integrated into App.tsx (PR #40)
- FE-406-409: Unit tests pass (223 frontend tests) but NOT integrated into UI
- See "Needs Integration" section above for specific integration tasks

## Notes for Claude Code

**Quick Start**:
1. Phase 2-5 keyboard behaviors and auth are complete
2. Active MVP1: BUG-EDITOR-3064, EDITOR-307, EDITOR-3056, INFRA-001, INFRA-501
3. Needs Integration: FE-406-409 (code complete, not wired into UI)
4. FE-405 ✅ DONE - AI Store integrated into Spotlight
5. Backlog: 23 MVP2 tickets (ready after MVP1 complete)

**Test Commands**:
```bash
# Backend (125 tests)
cd backend && python3 -m pytest tests/ -v

# Frontend (219 tests)
cd frontend && npm run test:run

# Build
cd frontend && npm run build
```

**Ticket Folders**:
- `docs/tasks/*.md` - Active tickets (10)
- `docs/tasks/done/*.md` - Completed tickets (31)
- `docs/tasks/backlog/*.md` - MVP2 tickets (23)
- `docs/tasks/archive/*.md` - Obsolete tickets (2)

---

## MVP2 Backlog (23 tickets)

**Prerequisites**: Complete MVP1 first (EDITOR-307, EDITOR-3056, INFRA-001, INFRA-501)

| Epic | Tickets | Count |
|------|---------|-------|
| Background Coloring | EDITOR-3101 to 3103 | 3 |
| Descriptor System | EDITOR-3201 to 3204 | 4 |
| Cheatsheet | EDITOR-3301 to 3304 | 4 |
| Portal | EDITOR-3401 to 3405 | 5 |
| Semantic Linking | API-301, API-302, EDITOR-3501, FE-501 | 4 |
| Auto AI Generation | EDITOR-3601, 3602, FE-502 | 3 |

See `docs/roadmap.md` for full MVP2 feature breakdown.
