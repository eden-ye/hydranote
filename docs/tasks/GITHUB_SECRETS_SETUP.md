# GitHub Secrets Setup Guide

## Repository-Level Secrets
Go to: https://github.com/eden-ye/hydranote/settings/secrets/actions

| Secret Name | Secret Value |
|-------------|--------------|
| `VERCEL_ORG_ID` | *Get from Vercel Dashboard → Settings → General → Team ID* |

---

## Staging Environment Secrets
Go to: https://github.com/eden-ye/hydranote/settings/environments
Click on **staging** → Add secret

| Secret Name | Secret Value |
|-------------|--------------|
| `RAILWAY_TOKEN_SAT` | `0083b395-7ead-4f2f-aaba-0fd322b79988` |
| `VERCEL_PROJECT_ID_SAT` | *Get from Vercel SAT project → Settings → General → Project ID* |
| `VITE_SUPABASE_URL_SAT` | `https://qqsqzujkdjerkvgwqahi.supabase.co` |
| `VITE_SUPABASE_ANON_KEY_SAT` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxc3F6dWprZGplcmt2Z3dxYWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzUyMDYsImV4cCI6MjA4MzU1MTIwNn0.E4ki-0-aZEp9uLDKAA6zNDkh7SmfAjcg_GQd5FuRyw4` |
| `VITE_API_URL_SAT` | `https://hydra-backend-sat-production.up.railway.app` |
| `VITE_WS_URL_SAT` | `wss://hydra-backend-sat-production.up.railway.app/ws` |

---

## Production Environment Secrets
Go to: https://github.com/eden-ye/hydranote/settings/environments
Click on **production** → Add secret

| Secret Name | Secret Value |
|-------------|--------------|
| `RAILWAY_TOKEN_PROD` | `42b48713-9f39-4231-8d4d-33d769920ead` |
| `VERCEL_PROJECT_ID_PROD` | *Get from Vercel PROD project → Settings → General → Project ID* |
| `VITE_SUPABASE_URL_PROD` | `https://hpaehliuolapgsnyhpdb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY_PROD` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwYWVobGl1b2xhcGdzbnlocGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzMyODAsImV4cCI6MjA4MzU0OTI4MH0.eOCr0UwNT3KQeXqas-bjopaEvlL8YZsNIcirdnZZgro` |
| `VITE_API_URL_PROD` | `https://hydranote-production.up.railway.app` |
| `VITE_WS_URL_PROD` | `wss://hydranote-production.up.railway.app/ws` |

---

## Notes

- **VERCEL_ORG_ID**: Shared across both environments (repository-level)
- **VERCEL_PROJECT_ID_SAT** and **VERCEL_PROJECT_ID_PROD**: Get from your respective Vercel projects
- All other values are ready to copy-paste directly from this table
