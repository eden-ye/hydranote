# INFRA-001: SAT/PROD Deployment Separation

**Created**: 2026-01-09
**Status**: in_progress
**Priority**: High (blocking deployments)

## Problem

GitHub Actions deployment to Railway is failing because:
1. `RAILWAY_TOKEN` secret is not configured
2. Current workflow deploys directly to production on every push to main
3. No staging (SAT) environment for testing before production

**Error from failed run (20866246963)**:
```
RAILWAY_TOKEN:
Project Token not found
```

**UPDATE (2026-01-09)**: Old Railway projects were deleted. New projects created:
- SAT: `hydra-backend-sat` (Project ID: 09d56c95-2e3e-4064-ab5f-33f8455b6f78)
- PROD: `hydra-backend-prod` (Project ID: 46c68c7f-48f7-480e-8c3d-b2c2f5fd9714)

Old tokens (b3f8f29d... and 5da3ead9...) are now obsolete. New tokens must be generated from Railway dashboard.

## Requirements

### Railway (Backend)
- **SAT**: Auto-deploy on push to `main`
- **PROD**: Manual deploy only (workflow_dispatch with approval)

### Vercel (Frontend)
- **SAT**: Auto-deploy on push to `main`
- **PROD**: Manual deploy only (workflow_dispatch with approval)

## Solution Design

### GitHub Environments Setup

Create two GitHub Environments in repo Settings > Environments:
1. `staging` - No protection rules (auto-deploy)
2. `production` - Required reviewers + deployment approval

### GitHub Secrets Required

#### Repository-level secrets (Settings > Secrets > Actions)

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VERCEL_TOKEN` | (existing) | Vercel API token |
| `VERCEL_ORG_ID` | (get from Vercel) | Vercel organization/team ID |

#### Environment: `staging`

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `RAILWAY_TOKEN_SAT` | (get from Railway dashboard) | Railway SAT project token - see "Railway GitHub Integration Setup" section |
| `VERCEL_PROJECT_ID_SAT` | (get from Vercel) | Vercel SAT project ID |
| `VITE_SUPABASE_URL_SAT` | (Supabase SAT URL) | Supabase SAT project URL |
| `VITE_SUPABASE_ANON_KEY_SAT` | (Supabase SAT key) | Supabase SAT anon key |
| `VITE_API_URL_SAT` | (Railway SAT URL) | Backend API URL for SAT - get after first deployment |
| `VITE_WS_URL_SAT` | (Railway SAT WS URL) | WebSocket URL for SAT - get after first deployment |

#### Environment: `production`

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `RAILWAY_TOKEN_PROD` | (get from Railway dashboard) | Railway PROD project token - see "Railway GitHub Integration Setup" section |
| `VERCEL_PROJECT_ID_PROD` | (get from Vercel) | Vercel PROD project ID |
| `VITE_SUPABASE_URL_PROD` | (Supabase PROD URL) | Supabase PROD project URL |
| `VITE_SUPABASE_ANON_KEY_PROD` | (Supabase PROD key) | Supabase PROD anon key |
| `VITE_API_URL_PROD` | (Railway PROD URL) | Backend API URL for PROD - get after first deployment |
| `VITE_WS_URL_PROD` | (Railway PROD WS URL) | WebSocket URL for PROD - get after first deployment |

## Workflow Changes (COMPLETED)

### deploy-backend.yml
- `deploy-sat` job: Triggers on push to main, deploys to Railway SAT
- `deploy-prod` job: workflow_dispatch only, requires selecting "production"

### deploy-frontend.yml
- `deploy-sat` job: Triggers on push to main, deploys to Vercel SAT
- `deploy-prod` job: workflow_dispatch only, requires selecting "production"

## Quick Setup Guide

**What this fixes:**
- ✅ SAT auto-deploys on every merge to `main`
- ✅ PROD only deploys when you manually trigger it (no more accidental prod deploys!)
- ✅ Separate Railway projects for SAT vs PROD
- ✅ Separate Vercel projects for SAT vs PROD

**What you need to do:**
1. Clean up existing messy GitHub environments (delete all 7)
2. Disable Vercel's auto-deployment (if active)
3. Create fresh `staging` and `production` environments
4. Add secrets (Railway tokens, Vercel IDs, Supabase keys)
5. Get Vercel Project IDs for SAT and PROD
6. Add Railway URLs after first deployment
7. Test SAT and PROD deployments

Follow the numbered steps below to complete setup.

---

## Manual Steps Required

### 1. Clean Up Existing GitHub Environments

**Current messy state (7 environments):**
- `Preview – hydranote-sat` ❌ Delete (Vercel auto-created)
- `Preview – hydranote` ❌ Delete (Vercel auto-created)
- `Production – hydranote-sat` ❌ Delete (Confusing name)
- `attractive-rebirth / SAT` ❌ Delete (Legacy/unclear)
- `attractive-rebirth / production` ❌ Delete (Legacy/unclear)
- `Preview` ❌ Delete (Not needed)
- `production` ❌ Delete (Will recreate with proper config)

**Target clean state (2 environments only):**
- `staging` ✅ Create fresh
- `production` ✅ Create fresh

**Why cleanup?** The workflows explicitly reference `staging` and `production` (lowercase, simple names). Other environments will cause confusion and aren't used by our GitHub Actions.

**How to delete:**
1. Go to: `https://github.com/[owner]/hydra/settings/environments`
2. For each environment: Click name → Scroll down → "Delete environment" → Confirm
3. Delete ALL 7 existing environments

### 2. Disable Vercel's Built-in GitHub Integration (if active)

If Vercel is currently auto-deploying on every push:
1. Go to your Vercel project → Settings → Git
2. Under "Production Branch", uncheck or disable auto-deployments
3. This prevents Vercel from deploying independently of GitHub Actions

Our GitHub Actions workflow will take over all deployments.

### 3. Create Fresh GitHub Environments

Go to: `https://github.com/[owner]/hydra/settings/environments`

1. Create `staging` environment (no protection rules)
2. Create `production` environment with:
   - Required reviewers (add yourself)
   - Optional: Wait timer (e.g., 5 min cooldown)

### 4. Add Secrets

**Repository secrets** (Settings > Secrets and variables > Actions > Repository secrets):
- `VERCEL_ORG_ID` - Get from Vercel dashboard > Settings > General > Team ID

**Environment secrets** (Settings > Environments > [env] > Environment secrets):

For `staging`:
- `RAILWAY_TOKEN_SAT` = `b3f8f29d-ee95-4615-9147-3494c0a5276e`
- `VERCEL_PROJECT_ID_SAT` = (from Vercel SAT project settings)
- `VITE_SUPABASE_URL_SAT`, `VITE_SUPABASE_ANON_KEY_SAT`, `VITE_API_URL_SAT`, `VITE_WS_URL_SAT`

For `production`:
- `RAILWAY_TOKEN_PROD` = `5da3ead9-4b92-4497-8aa1-fdaf90d406f8`
- `VERCEL_PROJECT_ID_PROD` = (from Vercel PROD project settings)
- `VITE_SUPABASE_URL_PROD`, `VITE_SUPABASE_ANON_KEY_PROD`, `VITE_API_URL_PROD`, `VITE_WS_URL_PROD`

### 5. Get Vercel Project IDs

You mentioned `hydranote-sat` already exists and is linked to GitHub. Here's how to get the required IDs:

**Get VERCEL_ORG_ID:**
1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Click Settings (team/org settings)
3. Under "General" tab, find your Team ID
4. Copy this value → Add as repo-level secret `VERCEL_ORG_ID`

**Get VERCEL_PROJECT_ID_SAT:**
1. Go to your `hydranote-sat` project on Vercel
2. Click Settings
3. Under "General" tab, find Project ID
4. Copy this value → Add to `staging` environment as `VERCEL_PROJECT_ID_SAT`

**For PROD project:**
- **If you have a separate prod project**: Get its Project ID the same way → `VERCEL_PROJECT_ID_PROD`
- **If you only have `hydranote-sat`**: Create a new project `hydranote-prod` and link it to the same repo

**Important**: The workflows are already configured to:
- ✅ Auto-deploy to SAT on every push to `main`
- ✅ PROD requires manual trigger via "Actions" tab → "Deploy Frontend to Vercel" → "Run workflow" → Select "production"

This means PROD will **NOT** auto-deploy on merges anymore - you have full control.

### 6. Railway URLs for API_URL and WS_URL

After Railway projects are deployed, you'll get URLs like:
- SAT: `https://hydra-backend-sat.up.railway.app`
- PROD: `https://hydra-backend-prod.up.railway.app`

Use these to set:
- `VITE_API_URL_SAT` = `https://[your-sat-url].up.railway.app`
- `VITE_API_URL_PROD` = `https://[your-prod-url].up.railway.app`
- `VITE_WS_URL_SAT` = `wss://[your-sat-url].up.railway.app/ws`
- `VITE_WS_URL_PROD` = `wss://[your-prod-url].up.railway.app/ws`

### 7. Test Deployment

After secrets are configured:
```bash
# Test SAT deployment
gh workflow run deploy-backend.yml

# Test PROD deployment (will require approval)
gh workflow run deploy-backend.yml -f environment=production
```

## Implementation Status

**Code changes (completed):**
- [x] Create INFRA-001 ticket
- [x] Update deploy-backend.yml with SAT/PROD separation
- [x] Update deploy-frontend.yml with SAT/PROD separation

**Railway Configuration (completed via CLI):**
- [x] Install Railway CLI
- [x] Create SAT Railway project (`hydra-backend-sat`)
- [x] Create PROD Railway project (`hydra-backend-prod`)
- [x] Configure SAT environment variables (Supabase, Anthropic, JWT)
- [x] Configure PROD environment variables (Supabase, Anthropic, JWT)
- [x] Deploy SAT project (https://hydra-backend-sat-production.up.railway.app)
- [x] Deploy PROD project (https://hydranote-production.up.railway.app)
- [x] Get Railway project tokens for GitHub Actions

**GitHub Configuration (user action required):**
- [x] Step 1: Clean up existing GitHub environments (delete all 7)
- [x] Step 2: Disable Vercel built-in GitHub integration (if active)
- [x] Step 3: Create fresh GitHub environments (staging, production)
- [ ] Step 4: Add `VERCEL_ORG_ID` to repo secrets
- [ ] Step 5: Add Railway tokens to environment secrets (`RAILWAY_TOKEN_SAT`, `RAILWAY_TOKEN_PROD`)
- [ ] Step 6: Add Supabase URLs/keys to environment secrets
- [ ] Step 7: Add Railway deployment URLs to environment secrets (`VITE_API_URL_*`, `VITE_WS_URL_*`)
- [ ] Step 8: Get Vercel Project IDs and add to environment secrets
- [ ] Step 9: Test SAT deployment via GitHub Actions
- [ ] Step 10: Test PROD deployment with approval flow

## Railway Deployment Configuration (COMPLETED)

### ✅ Projects Created and Deployed

Railway CLI has created, configured, and deployed two projects:

| Environment | Project Name | Project ID | Service | Deployment URL |
|-------------|--------------|------------|---------|----------------|
| **SAT** | `hydra-backend-sat` | `09d56c95-2e3e-4064-ab5f-33f8455b6f78` | `hydra-backend-sat` | https://hydra-backend-sat-production.up.railway.app |
| **PROD** | `hydra-backend-prod` | `46c68c7f-48f7-480e-8c3d-b2c2f5fd9714` | `hydranote-backend-prod` | https://hydranote-production.up.railway.app |

### 🔐 Railway Project Tokens (for GitHub Secrets)

**Critical**: Add these tokens to GitHub Environment secrets:
- **RAILWAY_TOKEN_SAT** = `0083b395-7ead-4f2f-aaba-0fd322b79988`
- **RAILWAY_TOKEN_PROD** = `42b48713-9f39-4231-8d4d-33d769920ead`

### ✅ Environment Variables Configured

Both Railway projects have been configured with:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_KEY`
- ✅ `ANTHROPIC_API_KEY`
- ✅ `JWT_SECRET`

**SAT Configuration**:
```
SUPABASE_URL=https://qqsqzujkdjerkvgwqahi.supabase.co
JWT_SECRET=sat-secret-rotate-regularly
```

**PROD Configuration**:
```
SUPABASE_URL=https://hpaehliuolapgsnyhpdb.supabase.co
JWT_SECRET=prod-secret-rotate-regularly
```

## GitHub Secrets Configuration (ACTION REQUIRED)

### Step 1: Add Repository-Level Secrets

Go to: `https://github.com/eden-ye/hydranote/settings/secrets/actions`

Click "New repository secret" and add:
- **Name**: `VERCEL_ORG_ID`
- **Value**: (Get from Vercel dashboard > Settings > General > Team ID)

### Step 2: Configure Environment Secrets for `staging`

Go to: `https://github.com/eden-ye/hydranote/settings/environments`
Click on `staging` environment → "Add secret"

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `RAILWAY_TOKEN_SAT` | `0083b395-7ead-4f2f-aaba-0fd322b79988` |
| `VERCEL_PROJECT_ID_SAT` | (Get from Vercel SAT project settings) |
| `VITE_SUPABASE_URL_SAT` | `https://qqsqzujkdjerkvgwqahi.supabase.co` |
| `VITE_SUPABASE_ANON_KEY_SAT` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxc3F6dWprZGplcmt2Z3dxYWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzUyMDYsImV4cCI6MjA4MzU1MTIwNn0.E4ki-0-aZEp9uLDKAA6zNDkh7SmfAjcg_GQd5FuRyw4` |
| `VITE_API_URL_SAT` | `https://hydra-backend-sat-production.up.railway.app` |
| `VITE_WS_URL_SAT` | `wss://hydra-backend-sat-production.up.railway.app/ws` |

### Step 3: Configure Environment Secrets for `production`

Click on `production` environment → "Add secret"

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `RAILWAY_TOKEN_PROD` | `42b48713-9f39-4231-8d4d-33d769920ead` |
| `VERCEL_PROJECT_ID_PROD` | (Get from Vercel PROD project settings) |
| `VITE_SUPABASE_URL_PROD` | `https://hpaehliuolapgsnyhpdb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY_PROD` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwYWVobGl1b2xhcGdzbnlocGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzMyODAsImV4cCI6MjA4MzU0OTI4MH0.eOCr0UwNT3KQeXqas-bjopaEvlL8YZsNIcirdnZZgro` |
| `VITE_API_URL_PROD` | `https://hydranote-production.up.railway.app` |
| `VITE_WS_URL_PROD` | `wss://hydranote-production.up.railway.app/ws` |

## Optional: Railway Dashboard GitHub Integration

If you want Railway to auto-deploy on push (in addition to GitHub Actions), complete these steps in the Railway dashboard:

#### For SAT Project (hydra-backend-sat)

1. **Open SAT project**: https://railway.com/project/09d56c95-2e3e-4064-ab5f-33f8455b6f78

2. **Add New Service**:
   - Click "+ New" → "GitHub Repo"
   - Authorize Railway to access your GitHub if not already done
   - Select repository: `eden-ye/hydranote`
   - Root directory: `/backend`
   - Branch: `main` (for auto-deploy on push to main)

3. **Configure Service**:
   - Service name: `backend-sat`
   - Railway will detect the `railway.json` and `Dockerfile` automatically
   - Click "Deploy"

4. **Get Project Token**:
   - In project settings → "Tokens" → "Create Token"
   - Name: "GitHub Actions SAT"
   - Copy the token → Add to GitHub environment secret `RAILWAY_TOKEN_SAT`

5. **Get Deployment URL**:
   - After first deployment, go to service settings → "Domains"
   - Railway auto-generates a domain like: `https://hydra-backend-sat.up.railway.app`
   - Copy this URL → Add to GitHub environment secrets:
     - `VITE_API_URL_SAT` = `https://[your-domain].up.railway.app`
     - `VITE_WS_URL_SAT` = `wss://[your-domain].up.railway.app/ws`

6. **Add Environment Variables** (in Railway service settings):
   - `SUPABASE_URL` = (Supabase SAT URL)
   - `SUPABASE_SERVICE_KEY` = (Supabase SAT service key)
   - `ANTHROPIC_API_KEY` = (Claude API key)
   - `JWT_SECRET` = (SAT-specific JWT secret)
   - `REDIS_URL` = (If using Railway Redis addon)

#### For PROD Project (hydra-backend-prod)

1. **Open PROD project**: https://railway.com/project/46c68c7f-48f7-480e-8c3d-b2c2f5fd9714

2. **Add New Service**:
   - Click "+ New" → "GitHub Repo"
   - Select repository: `eden-ye/hydranote`
   - Root directory: `/backend`
   - Branch: `main` (GitHub Actions will trigger deploys, not auto-deploy)

3. **Configure Service**:
   - Service name: `backend-prod`
   - Deploy manually for first time

4. **Get Project Token**:
   - In project settings → "Tokens" → "Create Token"
   - Name: "GitHub Actions PROD"
   - Copy the token → Add to GitHub environment secret `RAILWAY_TOKEN_PROD`

5. **Get Deployment URL**:
   - After first deployment, go to service settings → "Domains"
   - Railway auto-generates a domain like: `https://hydra-backend-prod.up.railway.app`
   - Copy this URL → Add to GitHub environment secrets:
     - `VITE_API_URL_PROD` = `https://[your-domain].up.railway.app`
     - `VITE_WS_URL_PROD` = `wss://[your-domain].up.railway.app/ws`

6. **Add Environment Variables** (in Railway service settings):
   - `SUPABASE_URL` = (Supabase PROD URL)
   - `SUPABASE_SERVICE_KEY` = (Supabase PROD service key)
   - `ANTHROPIC_API_KEY` = (Claude API key)
   - `JWT_SECRET` = (PROD-specific JWT secret - MUST be different from SAT)
   - `REDIS_URL` = (If using Railway Redis addon)

### GitHub Actions Integration

After completing the above steps:
1. The SAT project will auto-deploy on every push to `main` via Railway's GitHub integration
2. The PROD project will be deployed via GitHub Actions workflow_dispatch (manual trigger)
3. Both projects will have their tokens configured in GitHub environment secrets

## Summary

✅ **Railway Backend Deployment: COMPLETE**
- Both SAT and PROD Railway projects are created, configured, and deployed
- Environment variables are set correctly for both projects
- Deployment URLs are available

⏳ **GitHub Secrets: ACTION REQUIRED**
- You need to add the secrets to GitHub (see "GitHub Secrets Configuration" section above)
- All values are documented and ready to copy-paste

🔄 **Next Steps:**
1. Add GitHub secrets (10 minutes)
2. Test SAT auto-deployment by pushing to `main`
3. Test PROD manual deployment via GitHub Actions workflow_dispatch

## Commits

- Workflow files updated (2026-01-09)
- Railway projects created, configured, and deployed via CLI (2026-01-09)
- INFRA-001 ticket updated with complete setup guide (2026-01-09)
