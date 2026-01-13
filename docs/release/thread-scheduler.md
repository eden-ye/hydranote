# Thread Scheduler

**Sprint**: MVP2 - Semantic Linking & Portal Search
**Last Updated**: 2026-01-13

## Thread Status

```
🔴 Thread 1 (Critical Path - 14h):
   ~~API-301 (6h)~~ → ~~API-302 (4h)~~ → EDITOR-3408 (4h)
   Status: BLOCKED (waiting for API-303)

🟢 Thread 2 (Support Path - 8h):
   API-303 (3h) → EDITOR-3407 (5h)
   Status: ~~API-303~~ → ~~EDITOR-3407~~ ✓ COMPLETE

🔵 Thread 3 (Editor UX - 43h):
   ~~EDITOR-3409 (6h)~~ → ~~EDITOR-3410 (4h)~~ → EDITOR-3508 (6h) → EDITOR-3507 (8h) → EDITOR-3509 (2h) → EDITOR-3512 (3h)
   Status: READY (next: EDITOR-3508)

🟣 Thread 4 (Inline Formatting - 10h):
   EDITOR-3506 (10h)
   Status: READY (independent, can run parallel with Thread 3)

🟡 Thread 5 (Block Types & AI - 14h):
   EDITOR-3510 (8h) → EDITOR-3511 (6h)
   Status: READY (independent, can run parallel with Thread 3 & 4)

🟠 Thread 6 (Frontend - 15h):
   FE-503 (15h)
   Status: READY (independent, safe with all EDITOR threads)
```

Strikethrough (`~~ticket~~`) = completed

## Dependency Graph

```
                    ┌─────────────┐
                    │   API-301   │ ✓ done
                    │ Embeddings  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   API-302   │ ✓ done
                    │  Search EP  │
                    └──────┬──────┘
                           │
   ┌───────────────┐       │       ┌───────────────┐
   │   API-303     │───────┼───────│ EDITOR-3408   │ □ backlog
   │  Extraction   │       │       │ Real APIs     │
   └───────┬───────┘       │       └───────────────┘
           │ □ backlog     │
   ┌───────▼───────┐       │
   │ EDITOR-3407   │───────┘
   │ Mock Reorg    │ ✓ done
   └───────────────┘

   ┌───────────────┐       ┌───────────────┐
   │ EDITOR-3409   │──────▶│ EDITOR-3410   │
   │ Search Modal  │       │ Integration   │
   └───────────────┘       └───────────────┘
         ✓ done                 ✓ done

   Editor UX Chain (Thread 3):
   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
   │ EDITOR-3508   │──────▶│ EDITOR-3507   │──────▶│ EDITOR-3509   │──────▶│ EDITOR-3512   │
   │ Focus Zoom    │       │ Drag-Drop     │       │ Inline Preview│       │ Add Btn UX    │
   └───────────────┘       └───────────────┘       └───────────────┘       └───────────────┘
     □ do first           □ shared UI w/3508        □ independent          □ independent

   Independent Tickets (can parallelize):
   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
   │ EDITOR-3506   │       │ EDITOR-3510   │──────▶│ EDITOR-3511   │       │   FE-503      │
   │ Inline Format │       │ Block Types   │       │ Ghost Bullets │       │ Left Panel    │
   └───────────────┘       └───────────────┘       └───────────────┘       └───────────────┘
     □ Thread 4             □ Thread 5              □ after 3510           □ Thread 6
```

## Legend
- `✓` = Completed
- `□` = Pending/Backlog
- `○` = In Progress
- `✗` = Blocked

## Parallelism Rules

| Combination | Safety |
|-------------|--------|
| AUTH + API | CAUTION (same backend) |
| AUTH + EDITOR/FE | SAFE |
| API + EDITOR/FE | SAFE |
| EDITOR + FE | SAFE |
| Same prefix | SEQUENTIAL |

## New Ticket Summary

| Thread | Tickets | Total Est | Notes |
|--------|---------|-----------|-------|
| Thread 3 | EDITOR-3508 → 3507 → 3509 → 3512 | 19h | 3508 first (shared UI with 3507) |
| Thread 4 | EDITOR-3506 | 10h | Inline formatting, independent |
| Thread 5 | EDITOR-3510 → 3511 | 14h | Block types → ghost bullets |
| Thread 6 | FE-503 | 15h | Left panel, safe with EDITOR |
