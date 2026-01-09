# Supabase Setup Guide

This guide walks through setting up Supabase for Hydra Notes with SAT/Prod isolation.

## 1. Create Supabase Projects

You need **two separate projects** for environment isolation:

### SAT (Staging) Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) (Github eden_ye)
2. Click "New Project"
3. Name: `ewrU8C6B0TCyvz9e`
4. Database Password: -xM82CJ89*!-N9-
5. Region: Choose closest to your users
6. Click "Create new project"

### PROD Project
1. Repeat above steps
2. Name: `hydranote-prod`
3. Password: CapxyEBMGu3pn4lj

## 2. Get API Keys

For each project, go to **Settings → API**:

| Key | Location | Usage |
|-----|----------|-------|
| Project URL | `https://xxx.supabase.co` | `SUPABASE_URL` / `VITE_SUPABASE_URL` |
| anon/public | Under "Project API keys" | `VITE_SUPABASE_ANON_KEY` (frontend) |
| service_role | Under "Project API keys" | `SUPABASE_SERVICE_KEY` (backend only) |

⚠️ **Never expose `service_role` key in frontend code!**

## 3. Enable Google OAuth

For each project:

1. Go to **Authentication → Providers**
2. Find "Google" and click to expand
3. Toggle "Enable Sign in with Google"

### Get Google OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   - SAT: `https://[your-sat-project].supabase.co/auth/v1/callback`
   - PROD: `https://[your-prod-project].supabase.co/auth/v1/callback`
   - Local: `http://localhost:5173/auth/callback` (for testing)
7. Copy **Client ID** and **Client Secret**

### Configure in Supabase:
1. Paste Client ID and Client Secret in Supabase Google provider settings
2. Save

## 4. Create Database Tables

Run this SQL in **SQL Editor** for each project:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  ai_generations_used INTEGER DEFAULT 0,
  ai_generations_limit INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to increment AI generation count
CREATE OR REPLACE FUNCTION public.increment_ai_generation(user_id UUID)
RETURNS TABLE(success BOOLEAN, remaining INTEGER) AS $$
DECLARE
  current_used INTEGER;
  current_limit INTEGER;
BEGIN
  SELECT ai_generations_used, ai_generations_limit
  INTO current_used, current_limit
  FROM public.user_profiles
  WHERE id = user_id;

  IF current_used >= current_limit THEN
    RETURN QUERY SELECT FALSE, 0;
  ELSE
    UPDATE public.user_profiles
    SET ai_generations_used = ai_generations_used + 1,
        updated_at = NOW()
    WHERE id = user_id;

    RETURN QUERY SELECT TRUE, (current_limit - current_used - 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 5. Configure Environment Variables

### Local Development (`.env.local`)

```bash
# Get these from Supabase SAT project → Settings → API
VITE_SUPABASE_URL=https://[your-sat-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend uses service key (keep secret!)
SUPABASE_URL=https://[your-sat-project-id].supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Other settings
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
ANTHROPIC_API_KEY=sk-ant-api03-...
JWT_SECRET=your-dev-secret-min-32-chars
REDIS_URL=redis://localhost:6379
```

### SAT Environment (`.env.sat`)

```bash
VITE_SUPABASE_URL=https://[your-sat-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://[your-sat-project-id].supabase.co
SUPABASE_SERVICE_KEY=eyJ...
VITE_API_URL=https://api-sat.hydranote.app
VITE_WS_URL=wss://api-sat.hydranote.app
ANTHROPIC_API_KEY=sk-ant-api03-...
JWT_SECRET=sat-secret-different-from-dev
```

### Production Environment (`.env.prod`)

```bash
VITE_SUPABASE_URL=https://[your-prod-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://[your-prod-project-id].supabase.co
SUPABASE_SERVICE_KEY=eyJ...
VITE_API_URL=https://api.hydranote.app
VITE_WS_URL=wss://api.hydranote.app
ANTHROPIC_API_KEY=sk-ant-api03-...
JWT_SECRET=prod-secret-rotate-regularly
```

## 6. Test Authentication

Once configured, test the flow:

1. Start the dev server:
   ```bash
   cd frontend && npm run dev
   ```

2. Open `http://localhost:5173`

3. Click "Sign in with Google"

4. Check Supabase Dashboard:
   - **Authentication → Users** should show new user
   - **Table Editor → user_profiles** should have profile row

## 7. Security Checklist

- [ ] Service role key only in backend `.env`, never in frontend
- [ ] Different JWT secrets for each environment
- [ ] Row Level Security enabled on all tables
- [ ] Google OAuth redirect URIs match exactly
- [ ] CORS configured correctly in Supabase (Settings → API → CORS)

## Quick Reference

| Environment | Supabase Project | Purpose |
|-------------|-----------------|---------|
| Local | hydranote-sat | Development (uses SAT DB) |
| SAT | hydranote-sat | Staging/QA testing |
| PROD | hydranote-prod | Production users |

## Troubleshooting

### "Invalid API key"
- Check that you're using the correct project's keys
- Ensure anon key is in frontend, service key only in backend

### "User not created"
- Check the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Check function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`

### "CORS error"
- Go to Supabase → Settings → API → CORS
- Add your frontend URL: `http://localhost:5173` for dev

### "OAuth redirect mismatch"
- Ensure redirect URI in Google Console matches exactly
- Include the full path: `https://xxx.supabase.co/auth/v1/callback`
