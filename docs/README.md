# Documentation Guide

This folder contains all project documentation for Hydra Notes. Documentation is local-only and NOT committed to git.

## Structure

```
docs/
├── README.md           ← This file
├── roadmap.md          ← Development phases and priorities
├── api/                ← API documentation (backend and frontend)
├── bugs/               ← Bug fix documentation
├── design/             ← Design documents and architecture
├── features/           ← Feature development logs
├── release/            ← Release workflow (NEW)
│   ├── README.md       ← Quick start & workflow guide
│   ├── sprint-tracker.md  ← Active tasks (replaces tasks/current.md)
│   ├── thread-scheduler.md ← Parallel worker scheduling
│   ├── queues/         ← Release pipeline stages
│   │   ├── ready-to-test-in-sat.md
│   │   ├── ready-to-elevate.md
│   │   ├── ready-to-test-in-prod.md
│   │   └── done.md
│   ├── versions/       ← Release notes by version
│   ├── rollback/       ← Rollback tickets
│   └── prod-support/   ← Production support tickets
└── tasks/
    ├── *.md            ← Active task tickets
    ├── backlog/        ← Future tasks
    ├── done/           ← Completed tasks (permanent)
    └── archive/        ← Obsolete tasks
```

## Templates

### Feature Documentation (`docs/features/[feature-name].md`)

```markdown
# Feature: [Name]

## Overview
Brief description of the feature.

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Tasks
- [ ] Task 1
- [ ] Task 2

## Commits
- `abc1234` - Commit message

## Timeline
- **Started**: YYYY-MM-DD
- **Completed**: YYYY-MM-DD
```

### Bug Documentation (`docs/bugs/BUG-###-[name].md`)

```markdown
# BUG-###: [Title]

## Symptoms
What the user experiences.

## Root Cause
What caused the issue.

## Investigation
Steps taken to diagnose.

## Solution
How it was fixed.

## Prevention
How to prevent similar issues.

## Commits
- `abc1234` - Fix description
```

### Task Ticket (`docs/tasks/[PREFIX]-[NUMBER]_[name].md`)

Use component-based prefixes: `AUTH-1XX`, `API-2XX`, `EDITOR-3XX`, `FE-4XX`

```markdown
# [PREFIX]-[NUMBER]: [Title]

## Description
What needs to be done.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Dependencies
- List any tickets this depends on (e.g., EDITOR-301)

## Parallel Safe With
- List prefixes this can run in parallel with (e.g., AUTH-*, API-*)

## Notes
Any relevant context.

## Status
- **Created**: YYYY-MM-DD
- **Status**: pending | in_progress | completed
```

See `CLAUDE.md` for full ticket naming convention and worktree mapping.

## Task Lifecycle

```
backlog/ → Active → done/
                  ↘ archive/ (if obsolete)
```

- **backlog/**: Future tasks, move to active when starting
- **Active** (root): Currently working or up next
- **done/**: Completed tasks (permanent)
- **archive/**: Obsolete tasks with `OBSOLETE_` prefix
