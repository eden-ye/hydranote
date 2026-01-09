# Documentation Guide

This folder contains all project documentation for Hydra Notes. Documentation is local-only and NOT committed to git.

## Structure

```
docs/
├── README.md           ← This file
├── roadmap.md          ← Development phases and priorities (RAG → Graph → Quiz)
├── api/                ← API documentation (backend and frontend)
│   └── supabase_setup.md
├── bugs/               ← Bug fix documentation
├── design/             ← Design documents and architecture
├── features/           ← Feature development logs
└── tasks/
    ├── current.md      ← Active tasks and next steps (rolling update)
    ├── *.md            ← Active task tickets
    ├── backlog/        ← Future tasks (can be picked up if have capacity)
    ├── done/           ← Completed tasks (permanent record)
    └── archive/        ← Obsolete tasks (roadmap changes only)
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

### Task Ticket (`docs/tasks/####_[name].md`)

```markdown
# Task ####: [Title]

## Description
What needs to be done.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
Any relevant context.

## Status
- **Created**: YYYY-MM-DD
- **Status**: pending | in_progress | completed
```

## Task Lifecycle

```
backlog/ → Active → done/
                  ↘ archive/ (if obsolete)
```

- **backlog/**: Future tasks, move to active when starting
- **Active** (root): Currently working or up next
- **done/**: Completed tasks (permanent)
- **archive/**: Obsolete tasks with `OBSOLETE_` prefix
