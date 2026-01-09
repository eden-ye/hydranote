-- Hydra Notes Database Schema
-- Run this SQL in Supabase SQL Editor for both SAT and PROD projects

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

-- Policy: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Trigger function to auto-create profile on signup
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

-- Trigger to call function on new user
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
