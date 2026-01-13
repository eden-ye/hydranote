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
| API-303 | Concept Extraction | 3h | [ ] | Backlog |

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

## Epic: Left Panel Navigation (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| FE-503 | Left Panel with Favorites | 15h | [ ] | Sidebar, favorites, drag-to-reorder |

## Epic: Inline Formatting (1)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3506 | Inline Formatting Toolbar | 10h | [ ] | Bold/Italic/Underline/Strike + Highlight dropdown |

## Epic: Editor UX (6)

| Ticket | Title | Est | Status | Notes |
|--------|-------|-----|--------|-------|
| EDITOR-3507 | Bullet Drag-and-Drop | 8h | [x] | Affine grip handle + drag behavior (shared with 3508), merged PR #100 |
| EDITOR-3508 | Focus Mode Zoom | 6h | [x] | Affine grip handle + click=zoom (do first, shared UI with 3507) |
| EDITOR-3509 | Collapsible Inline Preview | 2h | [x] | Clickable dash separator to hide/show inline preview, merged PR #106 |
| EDITOR-3510 | Block Type System | 8h | [x] | Checkbox, numbered list, bullet, headings + slash menu + markdown |
| EDITOR-3511 | Ghost Bullet Suggestions | 6h | [ ] | Inline grey bullets under parents, click to convert + AI expand |
| EDITOR-3512 | Add Block Button UX | 3h | [ ] | Fix unclear state + position shift during typing |

---

## Quick Filter

- **Local E2E OK [L]**: API-301, API-302, EDITOR-3406, EDITOR-3407, EDITOR-3409, EDITOR-3410, EDITOR-3501, EDITOR-3601, EDITOR-3602, FE-501
- **SAT Deployed [D]**: (none - awaiting Vercel deploy)
- **Ready for Elevation [S]**: (none)
- **Needs PROD E2E [E]**: (none)
- **PROD OK [P]**: (none)
- **Merged [x]**: EDITOR-3507, EDITOR-3508, EDITOR-3509, EDITOR-3510
- **Backlog [ ]**: API-303, EDITOR-3408, FE-503, EDITOR-3506, EDITOR-3511, EDITOR-3512

---

## Active Bugs

| Ticket | Title | Status |
|--------|-------|--------|
| BUG-EDITOR-3064 | Null Model Render Error | open |

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

## MVP3 Quick Filter

- **All Pending [ ]**: SYNC-101, SYNC-102, SYNC-103, SYNC-201, SYNC-202, SYNC-203, SYNC-301, SYNC-302, SYNC-303, SYNC-401, SYNC-402, SYNC-403

---

## References

- **Plan Document**: `/Users/taylorye/.claude/plans/binary-growing-teapot.md`
- **AFFiNE Reference**: https://github.com/toeverything/AFFiNE
- **y-websocket**: https://github.com/yjs/y-websocket
