# Release Workflow

**SAT**: https://frontend-taylorye.vercel.app/
**PROD**: https://hydranote.vercel.app/

## Quick Start

```bash
# Backend tests
cd backend && python3 -m pytest tests/ -v

# Frontend tests + build
cd frontend && npm run test:run && npm run build

# Bruno API tests (sanity check only)
cd bruno && bru run collections/<name> --env sat   # SAT
cd bruno && bru run collections/<name> --env prod  # PROD
```

## Status Legend

```
[ ] Pending      [~] In Progress   [x] Merged
[L] Local E2E OK [D] SAT Deployed  [S] SAT Verified
[E] Elevated     [P] PROD OK
```

## Release Flow

```
MERGE + Local E2E → [x] → [L]
    ↓
(Vercel auto-deploys to SAT) → [L] → [D]
    ↓
User: "test remaining tickets in SAT"
    → Chrome E2E on SAT for each [D] ticket
    → PASS: [D] → [S]
    → FAIL: create bug ticket
    ↓
User: "elevate now"
    → Generate release notes
    → Deploy to PROD
    → Chrome E2E on PROD
    → PASS: [S] → [E] → [P]
    → FAIL: rollback + PROD-xxx ticket
```

**Chrome E2E is the trusted gate.** Bruno tests are sanity checks only.

## User Triggers

| Command | Action |
|---------|--------|
| "test remaining tickets in SAT" | Chrome E2E all [D] tickets |
| "elevate now" | Generate notes, deploy PROD, Chrome E2E PROD |
| "rollback" | Rollback + create PROD-xxx ticket |

## Folder Structure

```
docs/release/
├── sprint-tracker.md      # Single source of truth (status column)
├── thread-scheduler.md    # Parallel worker scheduling
├── queues/
│   └── done.md            # Version history only
├── versions/
│   ├── NEXT/release-notes.md
│   └── v1.0.0/release-notes.md
├── rollback/
└── prod-support/
```

## Versioning

- `vMAJOR.MINOR.PATCH`
- MINOR bump per MVP/epic
- PATCH bump for hotfixes
