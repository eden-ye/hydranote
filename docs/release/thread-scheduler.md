# Thread Scheduler

**Sprint**: MVP2 - Semantic Linking & Portal Search
**Last Updated**: 2026-01-13

## Thread Status Overview

```
TESTING THREADS (Priority - verify merged work):
🧪 Thread T1 (Chrome E2E - Merged Tickets):
   FE-503-E2E (1h) → EDITOR-3507 E2E → EDITOR-3508 E2E → EDITOR-3509 E2E →
   EDITOR-3510 E2E → EDITOR-3511 E2E → EDITOR-3512 E2E
   Status: READY - these tickets are merged [x] but need Chrome E2E to become [L]

🧪 Thread T2 (SAT Testing - Local E2E OK Tickets):
   API-301, API-302, API-303, EDITOR-3406, EDITOR-3407, EDITOR-3409, EDITOR-3410,
   EDITOR-3501, EDITOR-3506, EDITOR-3601, EDITOR-3602, FE-501, FE-504
   Status: WAITING - needs Vercel SAT deployment first

DEVELOPMENT THREADS:
🔴 Thread 1 (Bug Fixes - 3h):
   EDITOR-3701 (3h) - Fix Drag Drift
   Status: READY - critical bug fix

🟢 Thread 2 (Navigation - 10h):
   FE-505 (6h) → FE-506 (4h)
   Status: READY - breadcrumb depends on back/forward

🔵 Thread 3 (Cheat Sheet UX - 6h):
   EDITOR-3702 (2h) → EDITOR-3703 (4h)
   Status: READY - position fix before == syntax

🟣 Thread 4 (AI Features - 8h):
   EDITOR-3704 (8h) - Auto AI Summarize
   Status: READY - independent

🟡 Thread 5 (Left Panel - 2h):
   FE-508 (2h) - All Bullets Filter
   Status: READY - independent

🟠 Thread 6 (Onboarding - 6h):
   FE-507 (6h) - New User Onboarding Page
   Status: READY - independent

⬛ Thread 7 (Blocked - 4h):
   EDITOR-3408 (4h) - Auto-Reorg Integration
   Status: BLOCKED - depends on API-302 SAT verification
```

Strikethrough (`~~ticket~~`) = completed

---

## Local E2E Testing Checklist

### Merged [x] → Need Chrome E2E to become [L]

- [ ] **FE-503**: Left Panel with Favorites (drag-to-reorder, Cmd+\)
- [ ] **EDITOR-3507**: Bullet Drag-and-Drop (grip handle, drag behavior)
- [ ] **EDITOR-3508**: Focus Mode Zoom (click grip = zoom)
- [ ] **EDITOR-3509**: Collapsible Inline Preview (dash separator toggle)
- [ ] **EDITOR-3510**: Block Type System (checkbox, numbered, headings, slash menu)
- [ ] **EDITOR-3511**: Ghost Bullet Suggestions (inline grey bullets, click to convert)
- [ ] **EDITOR-3512**: Add Block Button UX (state clarity, position stability)

### Test Scenarios per Ticket

**FE-503 (Left Panel)**:
1. Toggle sidebar with Cmd+\
2. Add bullet to favorites (star button)
3. Drag-to-reorder favorites
4. Click favorite → enters focus mode
5. Verify persistence after refresh

**EDITOR-3507 (Drag-and-Drop)**:
1. Hover bullet → grip handle visible
2. Drag bullet to new position
3. Drop indicator shows correct location
4. Verify hierarchy maintained after drop

**EDITOR-3508 (Focus Mode Zoom)**:
1. Click grip handle → zooms into bullet
2. Breadcrumb shows zoom path (if implemented)
3. Click breadcrumb level → zooms out

**EDITOR-3509 (Inline Preview)**:
1. Click dash separator → hides/shows inline content
2. State persists after refresh (if applicable)

**EDITOR-3510 (Block Types)**:
1. Type `- [ ]` → creates checkbox
2. Type `1.` → creates numbered list
3. Type `#` → creates heading
4. Slash menu shows block type options
5. Convert between types works

**EDITOR-3511 (Ghost Bullets)**:
1. Bullet with content shows ghost suggestions below
2. Click ghost → converts to real bullet
3. AI expansion triggers on conversion
4. Dismiss button works

**EDITOR-3512 (Add Block Button)**:
1. Add button visible and clear
2. No position shift during typing
3. Click creates new bullet below

---

## Priority Order

### Priority 1: Testing (Verify Merged Work)
| Thread | Tickets | Est | Notes |
|--------|---------|-----|-------|
| T1 | FE-503-E2E + 6 merged EDITOR tickets | ~4h | Chrome E2E to move [x] → [L] |
| T2 | 13 [L] tickets | ~3h | SAT E2E after Vercel deploy |

### Priority 2: Bug Fixes
| Thread | Tickets | Est | Notes |
|--------|---------|-----|-------|
| 1 | EDITOR-3701 | 3h | Fix drag drift near parent |

### Priority 3: New Features (Parallel Safe)
| Thread | Tickets | Est | Notes |
|--------|---------|-----|-------|
| 2 | FE-505 → FE-506 | 10h | Navigation (breadcrumb + back/forward) |
| 3 | EDITOR-3702 → EDITOR-3703 | 6h | Cheat sheet UX improvements |
| 4 | EDITOR-3704 | 8h | Auto AI summarize |
| 5 | FE-508 | 2h | All bullets filter |
| 6 | FE-507 | 6h | New user onboarding |

### Priority 4: Blocked
| Thread | Tickets | Est | Notes |
|--------|---------|-----|-------|
| 7 | EDITOR-3408 | 4h | Needs API-302 verified in SAT |

## Recommended Execution Plan

### Phase 1: Testing First (Critical)
```
Day 1:
├── Thread T1: Chrome E2E for merged tickets
│   ├── FE-503-E2E: Verify favorite reorder
│   ├── EDITOR-3507: Bullet drag-and-drop
│   ├── EDITOR-3508: Focus mode zoom
│   ├── EDITOR-3509: Collapsible inline preview
│   ├── EDITOR-3510: Block type system
│   ├── EDITOR-3511: Ghost bullet suggestions
│   └── EDITOR-3512: Add block button UX
└── All [x] tickets should become [L] after E2E passes
```

### Phase 2: Bug Fix + Quick Wins (Parallel)
```
Day 1-2:
├── Thread 1: EDITOR-3701 (drag drift fix) - 3h
├── Thread 5: FE-508 (all bullets filter) - 2h
└── Total: 5h
```

### Phase 3: Core Features (Parallel)
```
Day 2-4:
├── Thread 2: FE-505 → FE-506 (navigation) - 10h
├── Thread 3: EDITOR-3702 → EDITOR-3703 (cheat sheet) - 6h
└── Total: 16h parallel
```

### Phase 4: AI + Onboarding (Parallel)
```
Day 4-5:
├── Thread 4: EDITOR-3704 (auto AI summarize) - 8h
├── Thread 6: FE-507 (onboarding page) - 6h
└── Total: 14h parallel
```

### Phase 5: SAT Testing + Unblock
```
After Vercel Deploy:
├── Thread T2: SAT E2E for all [L] tickets
├── Thread 7: EDITOR-3408 (unblocked after API-302 SAT verified)
└── Total: ~7h
```

## Dependency Graph

```
TESTING DEPENDENCIES:
┌─────────────────────────────────────────────────────────────────┐
│ MERGED [x] → Chrome E2E → LOCAL E2E [L] → SAT Deploy → SAT [S] │
└─────────────────────────────────────────────────────────────────┘

   Thread T1 (Chrome E2E for merged):
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │FE-503-E2E│ │EDITOR-   │ │EDITOR-   │ │EDITOR-   │
   │Fav Reord │ │3507 D&D  │ │3508 Zoom │ │3509 Prev │
   └──────────┘ └──────────┘ └──────────┘ └──────────┘
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │EDITOR-   │ │EDITOR-   │ │EDITOR-   │
   │3510 Types│ │3511 Ghost│ │3512 AddBtn│
   └──────────┘ └──────────┘ └──────────┘

DEVELOPMENT DEPENDENCIES:
   Thread 1 (Bug Fix):
   ┌──────────────┐
   │ EDITOR-3701  │ ← No deps, highest priority
   │ Drag Drift   │
   └──────────────┘

   Thread 2 (Navigation):
   ┌──────────────┐       ┌──────────────┐
   │   FE-505     │──────▶│   FE-506     │
   │ Breadcrumb   │       │ Back/Forward │
   └──────────────┘       └──────────────┘

   Thread 3 (Cheat Sheet):
   ┌──────────────┐       ┌──────────────┐
   │ EDITOR-3702  │──────▶│ EDITOR-3703  │
   │ Dash Position│       │ == Syntax    │
   └──────────────┘       └──────────────┘

   Independent Threads:
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │ EDITOR-3704  │   │   FE-508     │   │   FE-507     │
   │ AI Summarize │   │ All Bullets  │   │ Onboarding   │
   └──────────────┘   └──────────────┘   └──────────────┘
      Thread 4           Thread 5           Thread 6

   Blocked Thread:
   ┌──────────────┐       ┌──────────────┐
   │   API-302    │──────▶│ EDITOR-3408  │
   │ (SAT verify) │       │ Auto-Reorg   │
   └──────────────┘       └──────────────┘
                            Thread 7
```

## Parallelism Matrix

| Thread | T1 | T2 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|--------|----|----|---|---|---|---|---|---|---|
| T1 | - | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| T2 | ⚠️ | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 1 | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ |
| 4 | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ |
| 5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ |
| 6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| 7 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |

✅ = Safe to run in parallel
⚠️ = Caution (same environment)
❌ = Blocked/Dependency

## Legend
- `✓` = Completed
- `□` = Pending/Backlog
- `○` = In Progress
- `✗` = Blocked
- `🧪` = Testing thread

---

# MVP2 New Tickets Summary

| Thread | Tickets | Total Est | Status |
|--------|---------|-----------|--------|
| T1 | FE-503-E2E + 6 E2E tests | ~4h | READY |
| T2 | 13 SAT tests | ~3h | WAITING (Vercel) |
| 1 | EDITOR-3701 | 3h | READY |
| 2 | FE-505 → FE-506 | 10h | READY |
| 3 | EDITOR-3702 → EDITOR-3703 | 6h | READY |
| 4 | EDITOR-3704 | 8h | READY |
| 5 | FE-508 | 2h | READY |
| 6 | FE-507 | 6h | READY |
| 7 | EDITOR-3408 | 4h | BLOCKED |
| **Total** | **17 tickets** | **~46h** | |

---

# MVP3 Thread Planning: Multi-Device Sync

**Target Version**: v1.2.0
**Total Estimate**: ~36h across 12 tickets (Sync) + ~52h across 8 tickets (Features)
**Architecture**: AFFiNE-style Yjs sync (y-websocket + MongoDB)

## MVP3 Sync Threads

```
🔴 Thread S1 (Server - 10h):
   SYNC-101 (4h) → SYNC-102 (4h) → SYNC-103 (2h)
   Status: □ PENDING
   Note: New Node.js sync server

🟢 Thread S2 (Frontend - 9h):
   SYNC-201 (3h) → SYNC-202 (3h) → SYNC-203 (3h)
   Status: □ PENDING (depends on SYNC-101)
   Note: Frontend integration

🔵 Thread S3 (UX - 7h):
   SYNC-301 (3h) → SYNC-302 (2h) → SYNC-303 (2h)
   Status: □ PENDING (depends on SYNC-102)
   Note: User experience features

🟡 Thread S4 (Testing - 10h):
   SYNC-401 (4h) → SYNC-402 (3h) → SYNC-403 (3h)
   Status: □ PENDING (depends on all above)
   Note: E2E testing and migration
```

## MVP3 Feature Threads

```
🔴 Thread F1 (CRUCIAL - Daily Review - 10h):
   FE-601 (10h) - Today Document Waterfall
   Status: □ PENDING

🟢 Thread F2 (CRUCIAL - Learning - 20h):
   EDITOR-3801 (12h) → FE-602 (8h)
   Status: □ PENDING
   Note: User evaluation → Flashcard list

🔵 Thread F3 (Enhancements - 9h):
   EDITOR-3802 (3h) + EDITOR-3803 (6h)
   Status: □ PENDING
   Note: Portal parent + Multiline block (parallel)

🟣 Thread F4 (Settings - 6h):
   FE-603 (6h) - User API Key Settings
   Status: □ PENDING

🟡 Thread F5 (Editor - 7h):
   EDITOR-3804 (4h) + EDITOR-3805 (3h)
   Status: □ PENDING
   Note: Copy-paste + Descriptor UI (parallel)
```

## MVP3 Dependency Graph

```
              ┌─────────────┐
              │  SYNC-101   │
              │ WS Server   │
              └──────┬──────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
 ┌──────▼──────┐ ┌───▼────┐ ┌─────▼─────┐
 │  SYNC-102   │ │SYNC-201│ │ SYNC-301  │
 │ Persistence │ │Provider│ │ Doc List  │
 └──────┬──────┘ └───┬────┘ └─────┬─────┘
        │            │            │
 ┌──────▼──────┐ ┌───▼────┐ ┌─────▼─────┐
 │  SYNC-103   │ │SYNC-202│ │ SYNC-302  │
 │  Deploy     │ │  Auth  │ │  Toggle   │
 └─────────────┘ └───┬────┘ └─────┬─────┘
                     │            │
                 ┌───▼────┐ ┌─────▼─────┐
                 │SYNC-203│ │ SYNC-303  │
                 │Status UI│ │ Indicator │
                 └────────┘ └───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
 ┌──────▼──────┐          ┌───────▼───────┐
 │  SYNC-401   │          │   SYNC-402    │
 │ Multi-Dev E2E│          │ Offline Test  │
 └──────┬──────┘          └───────────────┘
        │
 ┌──────▼──────┐
 │  SYNC-403   │
 │  Migration  │
 └─────────────┘
```

## Recommended MVP3 Execution Order

1. **Phase 1**: SYNC-101 (server foundation)
2. **Phase 2**: SYNC-102 + SYNC-201 (parallel - persistence + provider)
3. **Phase 3**: SYNC-103 + SYNC-202 + SYNC-301 (parallel - deploy + auth + API)
4. **Phase 4**: SYNC-203 + SYNC-302 + SYNC-303 (parallel - UX)
5. **Phase 5**: SYNC-401 → SYNC-402 → SYNC-403 (sequential - testing)
6. **Phase 6**: FE-601 + EDITOR-3801 (CRUCIAL features)
7. **Phase 7**: Remaining feature threads (parallel)
