# Sprint Tracker

**Sprint**: MVP2 - Semantic Linking & Portal Search
**Version Target**: v1.1.0
**Last Updated**: 2026-01-13

## Status Flow
```
[ ] → [~] → [x] → [L] → [D] → [S] → [E] → [P]
Pending → In Progress → Merged → Local E2E → SAT Deployed → SAT Verified → Elevated → PROD OK
```

## Status Legend
```
[ ] Pending      [~] In Progress   [x] Merged
[L] Local E2E OK [D] SAT Deployed  [S] SAT Verified
[E] Elevated     [P] PROD OK
```

**Chrome E2E is the trusted verification gate.** Bruno tests are sanity checks only.

---

## Epic: Semantic Linking APIs (3)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| API-301 | Embedding/Vector Storage | 6h | [L] | Needs SAT Chrome E2E |
| API-302 | Semantic Search Endpoint | 4h | [L] | Needs SAT Chrome E2E |
| API-303 | Concept Extraction | 3h | [L] | Bruno tests passed, merged PR #77 |

## Epic: Silent Auto-Reorg (2)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3407 | Auto-Reorg Foundation | 5h | [L] | Needs SAT Chrome E2E |
| EDITOR-3408 | Auto-Reorg Integration | 4h | [ ] | Backlog, depends: API-302 |

## Epic: Cmd+S Portal Search (2)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3409 | Portal Search Modal | 6h | [L] | Needs SAT Chrome E2E |
| EDITOR-3410 | Search Modal Integration | 4h | [L] | Needs SAT Chrome E2E |

## Epic: Portal Enhancements (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3406 | Runtime Orphan Detection | 3h | [L] | Needs SAT Chrome E2E |

## Epic: Background Sync (3)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3501 | Background Embedding Sync | 4h | [L] | Needs SAT Chrome E2E |
| EDITOR-3601 | Tab Trigger Generation | 3h | [L] | Needs SAT Chrome E2E |
| EDITOR-3602 | Auto-Generate After Descriptor | 2h | [L] | Needs SAT Chrome E2E |

## Epic: Settings UI (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| FE-501 | Semantic Linking Settings | 4h | [L] | Needs SAT Chrome E2E |

## Epic: Left Panel Navigation (2)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| FE-503 | Left Panel with Favorites | 15h | [x] | Merged PR #107 |
| FE-504 | Left Panel Cleanup | 2h | [L] | PR #114, Local E2E OK |

## Epic: Inline Formatting (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3506 | Inline Formatting Toolbar | 10h | [L] | Bold/Italic/Underline/Strike + Highlight dropdown |

## Epic: Editor UX (7)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3507 | Bullet Drag-and-Drop | 8h | [x] | Affine grip handle + drag behavior (shared with 3508), merged PR #100 |
| EDITOR-3508 | Focus Mode Zoom | 6h | [x] | Affine grip handle + click=zoom (do first, shared UI with 3507) |
| EDITOR-3509 | Collapsible Inline Preview | 2h | [x] | Clickable dash separator to hide/show inline preview, merged PR #106 |
| EDITOR-3510 | Block Type System | 8h | [x] | Checkbox, numbered list, bullet, headings + slash menu + markdown |
| EDITOR-3511 | Ghost Bullet Suggestions | 6h | [x] | Merged PR #104, Chrome E2E pending |
| EDITOR-3512 | Add Block Button UX | 3h | [x] | Fix unclear state + position shift during typing, merged PR #111 |
| EDITOR-3706 | Remove Bullet Markers | 1h | [ ] | Hide dirty bullet symbols (•, ◦, ▪, ▫) from list items |

## Epic: Bug Fixes (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3701 | Fix Drag Drift Near Parent | 3h | [x] | Merged PR #118 - Fixed drag drift near parent |

## Epic: Left Panel Enhancements (2)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| FE-508 | All Bullets Filter | 2h | [ ] | Only show bullets with children/descriptors |
| FE-503-E2E | Verify Favorite Reorder | 1h | [ ] | Chrome E2E test for drag-to-reorder |

## Epic: Navigation (2)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| FE-505 | Breadcrumb Navigation | 6h | [L] | Added 26 unit tests, Chrome E2E OK |
| FE-506 | Back/Forward Buttons | 4h | [L] | PR #124, Chrome E2E OK, moved to done/ |

## Epic: Cheat Sheet / Dashing Button (2)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3702 | Ghost Question Delayed Reveal | 6h | [L] | PR #126, E2E OK, moved to done/ |
| EDITOR-3703 | == Syntax for Dashing | 4h | [x] | Merged, manual E2E pending |

## Epic: AI Features (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3704 | Auto AI Summarize | 8h | [ ] | >30 words → notation, configurable |

## Epic: Onboarding (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| FE-507 | New User Onboarding Page | 6h | [ ] | Tutorial page for new users |

---

## Quick Filter

- **Local E2E OK [L]**: API-301, API-302, API-303, EDITOR-3406, EDITOR-3407, EDITOR-3409, EDITOR-3410, EDITOR-3501, EDITOR-3506, EDITOR-3601, EDITOR-3602, EDITOR-3702, FE-501, FE-504, FE-505, FE-506
- **SAT Deployed [D]**: (none - awaiting Vercel deploy)
- **Ready for Elevation [S]**: (none)
- **Needs PROD E2E [E]**: (none)
- **PROD OK [P]**: (none)
- **Merged [x]**: EDITOR-3507, EDITOR-3508, EDITOR-3509, EDITOR-3510, EDITOR-3511, EDITOR-3512, EDITOR-3701, EDITOR-3703, FE-503
- **In Progress [~]**: (none)
- **Backlog [ ]**: EDITOR-3408, FE-508, FE-503-E2E, EDITOR-3704, EDITOR-3706, FE-507

---

## Active Bugs

| Ticket | Title | Status |
|--------|-------|--------|
| BUG-EDITOR-3064 | Null Model Render Error | [L] Local E2E OK - version-based cleanup implemented |
| BUG-EDITOR-3510 | Markdown Shortcuts Not Converting | [x] PR #121 |
| BUG-EDITOR-3707 | Grandchild Indentation Misalignment | [L] Local E2E OK - placeholder fix |
| BUG-EDITOR-3708 | Memory Leak in Event Listeners | [L] Local E2E OK - disconnectedCallback cleanup |
| BUG-EDITOR-3709 | Prevent Root-Level Typing | [ ] Pending |

---

# MVP3 Backlog: Multi-Device Sync

**Target Version**: v1.2.0
**Architecture**: AFFiNE-style Yjs sync (y-websocket + MongoDB)
**Total Estimate**: ~36h across 12 tickets

## Epic: Sync Server Setup (3)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| SYNC-101 | y-websocket Server | 4h | [ ] | Node.js server with y-websocket |
| SYNC-102 | Server Persistence | 4h | [ ] | Store Yjs updates to MongoDB |
| SYNC-103 | Railway Deployment | 2h | [ ] | Deploy sync server |

## Epic: Frontend Sync Provider (3)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| SYNC-201 | Add y-websocket Provider | 3h | [ ] | WebsocketProvider in Editor |
| SYNC-202 | Auth Token Handling | 3h | [ ] | JWT auth for WebSocket |
| SYNC-203 | Sync Status UI | 3h | [ ] | Connecting/synced/offline indicator |

## Epic: User Experience (3)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| SYNC-301 | Document List API | 3h | [ ] | GET /api/documents endpoint |
| SYNC-302 | Sync Toggle | 2h | [ ] | Enable/disable sync per doc |
| SYNC-303 | Conflict Indicator | 2h | [ ] | Visual CRDT merge indicator |

## Epic: Testing & Migration (3)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| SYNC-401 | Multi-Device E2E | 4h | [ ] | Test sync across browsers |
| SYNC-402 | Offline Behavior Test | 3h | [ ] | Test offline + reconnect |
| SYNC-403 | Migration Tool | 3h | [ ] | Migrate local docs to cloud |

---

# MVP3 Backlog: New Features

**Total Estimate**: ~52h across 8 tickets

## Epic: Daily Review - CRUCIAL (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| FE-601 | Today Document Waterfall | 10h | [ ] | Daily portals for updated bullets, 4-level dedup |

## Epic: Learning Features - CRUCIAL (2)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3801 | User Output Evaluation | 12h | [ ] | Shift+Tab paste, AI scoring, color squares |
| FE-602 | Flashcard List | 8h | [ ] | Timestamp-sorted review list |

## Epic: Portal Enhancements (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3802 | Portal Descriptor Parent | 3h | [ ] | Show parent bullet in descriptor portals |

## Epic: Settings (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| FE-603 | User API Key Settings | 6h | [ ] | Client-side API key configuration |

## Epic: Block Types (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3803 | Multiline Block | 6h | [ ] | Hotkey, paste as single block, no drag |

## Epic: Editor Core (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3804 | Multi-Block Copy Paste | 4h | [ ] | Correct multi-block copy-paste |

## Epic: UI Polish (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3805 | Descriptor UI Polish | 3h | [ ] | Round grey box background |

---

## MVP3 Quick Filter

- **All Pending [ ]**: SYNC-101, SYNC-102, SYNC-103, SYNC-201, SYNC-202, SYNC-203, SYNC-301, SYNC-302, SYNC-303, SYNC-401, SYNC-402, SYNC-403, FE-601, EDITOR-3801, FE-602, EDITOR-3802, FE-603, EDITOR-3803, EDITOR-3804, EDITOR-3805

---

## References

- **Plan Document**: `/Users/taylorye/.claude/plans/binary-growing-teapot.md`
- **AFFiNE Reference**: https://github.com/toeverything/AFFiNE
- **y-websocket**: https://github.com/yjs/y-websocket
