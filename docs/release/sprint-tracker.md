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

---

## Quick Filter

- **Local E2E OK [L]**: API-301, API-302, EDITOR-3406, EDITOR-3407, EDITOR-3409, EDITOR-3410, EDITOR-3501, EDITOR-3601, EDITOR-3602, FE-501
- **SAT Deployed [D]**: (none - awaiting Vercel deploy)
- **Ready for Elevation [S]**: (none)
- **Needs PROD E2E [E]**: (none)
- **PROD OK [P]**: (none)
- **Backlog [ ]**: API-303, EDITOR-3408

---

## Active Bugs

| Ticket | Title | Status |
|--------|-------|--------|
| BUG-EDITOR-3064 | Null Model Render Error | open |
