# INFRA-501: Fix CI/CD Deployment Duplication and Environment Strategy

**Type:** Infrastructure
**Priority:** High
**Status:** Open
**Created:** 2026-01-10

## Problem Statement

The current CI/CD setup has deployment issues observed in GitHub checks:

### Issue 1: Duplicate Backend Deployments
Railway's **built-in deployment** triggers on every push, in addition to GitHub Actions workflows. This causes:
- `hydra-backend-prod - hydranote` (Railway built-in) runs alongside
- `Deploy Backend to Railway (Production) / deploy` (GitHub Actions)

Both mechanisms attempt to deploy the same code, wasting resources and causing potential race conditions.

### Issue 2: SAT Auto-Deployment Not Working as Expected
Current triggers:
- **Backend SAT** (`deploy-backend-sat.yml`): Triggers on `pull_request` only
- **Frontend SAT** (`deploy-frontend-sat.yml`): Triggers on `pull_request` only

This means pushes to branches don't auto-deploy to SAT - only PR creation does.

### Issue 3: Production Should Require Review
Currently, production workflows trigger automatically on `push` to `main`. There's no approval gate before production deployment.

## Current Architecture

```
GitHub Push/PR
     │
     ├─► Railway Built-in Deploy (auto-triggered)
     │      ├── hydra-backend-prod (on main push)
     │      └── hydra-backend-sat (on PR/branch)
     │
     └─► GitHub Actions
            ├── deploy-backend-prod.yml (on main push)
            ├── deploy-backend-sat.yml (on PR to main)
            ├── deploy-frontend-prod.yml (on main push)
            └── deploy-frontend-sat.yml (on PR to main)
```

**Result:** Double deployment attempts for backend, potential conflicts and failures.

## Proposed Solution

### 1. Disable Railway Built-in Deployments
Railway should be configured to NOT auto-deploy on GitHub push. Deployment should ONLY happen via GitHub Actions.

**Action Required (Railway Dashboard):**
- Go to Railway project settings
- Disable "Automatic Deployments" for both `hydra-backend-prod` and `hydra-backend-sat` services
- Keep GitHub integration connected (for Railway CLI auth) but disable auto-triggers

### 2. Revise Deployment Triggers

| Environment | Trigger | Approval |
|-------------|---------|----------|
| Backend SAT | Push to any branch + PR to main | Auto |
| Frontend SAT | Push to any branch + PR to main | Auto |
| Backend Prod | Push to main | **Manual approval** |
| Frontend Prod | Push to main | **Manual approval** |

### 3. Updated Workflow Configuration

**SAT Workflows** - Auto-deploy on push (not just PR):
```yaml
on:
  push:
    branches:
      - '**'           # Any branch except main
      - '!main'        # Exclude main (production)
    paths:
      - 'backend/**'   # or frontend/**
  pull_request:
    branches: [main]
  workflow_dispatch:
```

**Production Workflows** - Add environment protection:
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production  # Requires approval in GitHub settings
```

**GitHub Repository Settings:**
- Go to Settings → Environments → production
- Enable "Required reviewers"
- Add designated approvers

## Proposed Architecture (After Fix)

```
GitHub Push to feature branch
     │
     └─► GitHub Actions
            ├── deploy-backend-sat.yml → Railway SAT (auto)
            └── deploy-frontend-sat.yml → Vercel preview (auto)

GitHub Push to main (after PR merge)
     │
     └─► GitHub Actions
            ├── deploy-backend-prod.yml → Railway Prod (needs approval)
            └── deploy-frontend-prod.yml → Vercel Prod (needs approval)
```

## Tasks

- [ ] **Task 1:** Disable Railway auto-deployment in Railway dashboard
  - Disable for `hydra-backend-prod`
  - Disable for `hydra-backend-sat`

- [ ] **Task 2:** Update SAT workflow triggers to include branch pushes
  - Modify `deploy-backend-sat.yml`
  - Modify `deploy-frontend-sat.yml`

- [ ] **Task 3:** Add environment protection for production
  - Configure GitHub environment protection rules
  - Add required reviewers for production environment

- [ ] **Task 4:** Test deployment flow
  - Push to feature branch → SAT auto-deploys
  - Create PR → SAT deploys on PR update
  - Merge to main → Production waits for approval
  - Approve → Production deploys

## Questions for User

1. **Railway Dashboard Access:** Do you have admin access to Railway to disable auto-deployment?
2. **Approvers:** Who should be required reviewers for production deployment?
3. **Branch Strategy:** Should SAT deploy on ALL branch pushes, or only specific prefixes (e.g., `feature/*`, `editor/*`)?

## Files to Modify

- `.github/workflows/deploy-backend-sat.yml`
- `.github/workflows/deploy-frontend-sat.yml`
- `.github/workflows/deploy-backend-prod.yml` (add environment protection)
- `.github/workflows/deploy-frontend-prod.yml` (add environment protection)

## References

- Current workflows: `.github/workflows/`
- Railway config: `backend/railway.json`
- Vercel config: `frontend/vercel.json`
