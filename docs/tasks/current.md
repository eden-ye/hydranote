# Current Tasks

**Current Phase**: Phase 2 - Core Editor (Keyboard Behaviors Complete)
**Last Updated**: 2026-01-11

## Summary

**Completed**: 39 tickets in `done/`
**Active**: 3 tickets remaining (3 MVP1)
**Backlog (MVP2)**: 22 tickets (ready after MVP1 complete)
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

**2026-01-11**: FE-406-409 (Integration) - Focus mode, breadcrumb, expand button, ghost questions (#42)
- FE-406: Double-click enters focus mode, Escape exits
- FE-407: Breadcrumb shows in focus mode with ancestor path
- FE-408: Expand button (+) appears on bullet hover
- FE-409: Ghost questions render in focus mode

**2026-01-11**: INFRA-001 & INFRA-501 - Deployment infrastructure complete

**2026-01-11**: EDITOR-3101 (Color Palette System) - First MVP2 ticket completed (#43)
- Defined 6 colors with semantic names and hex values
- Created color-palette.ts utility with helper functions
- Added CSS styles for data-v-highlight attribute

## Active Tickets (3)

### MVP1 Core (3)

| Ticket | Title | Status | Notes |
|--------|-------|--------|-------|
| BUG-EDITOR-3064 | Null Model Render Error | open | "Cannot read properties of null" in production |
| EDITOR-307 | Editor Store | pending | Zustand store for document/selection state |
| EDITOR-3056 | Inline Formatting | done | Bold/italic/underline (Cmd+B/I/U) support - already completed |

## Next Steps

1. **BUG-EDITOR-3064**: Fix null model render error in production
2. **EDITOR-307**: Create editor Zustand store

## Recently Verified Complete (Phase 3)

### AUTH (Phase 3) - Backend ✅
- AUTH-101, 102, 103, 104: All completed with 125 backend tests passing

### FE (Phase 4-5) - Integration Complete ✅
- FE-405: ✅ DONE - Integrated into App.tsx (PR #40)
- FE-406-409: ✅ DONE - Integrated into Editor.tsx (PR #42)
  - Focus mode, breadcrumb, expand button, ghost questions all working

### INFRA - Deployment Complete ✅
- INFRA-001: ✅ DONE - SAT/PROD deployment separation
- INFRA-501: ✅ DONE - CI/CD duplication fixed

## Notes for Claude Code

**Quick Start**:
1. Phase 2-5 keyboard behaviors and auth are complete
2. Active MVP1: BUG-EDITOR-3064, EDITOR-307
3. FE-405-409 ✅ ALL DONE - Full UI integration complete
4. INFRA-001, INFRA-501 ✅ DONE - Deployment complete
5. Backlog: 23 MVP2 tickets (ready after MVP1 complete)

**Test Commands**:
```bash
# Backend (125 tests)
cd backend && python3 -m pytest tests/ -v

# Frontend (290 tests)
cd frontend && npm run test:run

# Build
cd frontend && npm run build
```

**Ticket Folders**:
- `docs/tasks/*.md` - Active tickets (3)
- `docs/tasks/done/*.md` - Completed tickets (39)
- `docs/tasks/backlog/*.md` - MVP2 tickets (22)
- `docs/tasks/archive/*.md` - Obsolete tickets (2)

---

## MVP2 Backlog (22 tickets)

**Prerequisites**: Complete MVP1 first (BUG-EDITOR-3064, EDITOR-307)

| Epic | Tickets | Count |
|------|---------|-------|
| Background Coloring | EDITOR-3102 to 3103 (3101 done) | 2 |
| Descriptor System | EDITOR-3201 to 3204 | 4 |
| Cheatsheet | EDITOR-3301 to 3304 | 4 |
| Portal | EDITOR-3401 to 3405 | 5 |
| Semantic Linking | API-301, API-302, EDITOR-3501, FE-501 | 4 |
| Auto AI Generation | EDITOR-3601, 3602, FE-502 | 3 |

See `docs/roadmap.md` for full MVP2 feature breakdown.
