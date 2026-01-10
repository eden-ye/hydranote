# Branch Protection Setup

## Required Status Checks for `main` Branch

To enforce the rule that PR can only merge after CI and SAT deployments succeed, configure the following required status checks in GitHub repository settings:

### Steps to Configure

1. Go to **Settings** → **Branches** → **Branch protection rules**
2. Add/Edit rule for `main` branch
3. Enable **"Require status checks to pass before merging"**
4. Search and add these required checks:
   - `test-backend` (from ci.yml)
   - `test-frontend` (from ci.yml)
   - `lint` (from ci.yml)
   - `deploy / Deploy Backend to Railway (SAT)` (from deploy-backend-sat.yml)
   - `deploy / Deploy Frontend to Vercel (SAT)` (from deploy-frontend-sat.yml)

### Workflow Behavior

**When PR is opened/updated:**
- ✅ CI runs (test-backend, test-frontend, lint)
- ✅ Backend SAT deploys (if backend/** changed)
- ✅ Frontend SAT deploys (if frontend/** changed)
- ⏸️ **Merge blocked** until all checks pass

**After PR merges to main:**
- ✅ Backend PROD deploys (if backend/** changed)
- ✅ Frontend PROD deploys (if frontend/** changed)

### Path-Based Deployment Logic

- Backend changes (`backend/**`) → Only backend workflows run
- Frontend changes (`frontend/**`) → Only frontend workflows run
- Both changed → Both workflows run
- Workflow file changes → Respective workflow runs

### Notes

- SAT deployments use `staging` environment
- PROD deployments use `production` environment
- All deployments can be manually triggered via `workflow_dispatch`
- Path filters prevent unnecessary deployments
