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

🔵 Thread 3 (Independent - 10h):
   ~~EDITOR-3409 (6h)~~ → ~~EDITOR-3410 (4h)~~
   Status: ✓ IDLE (available for new work)
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
