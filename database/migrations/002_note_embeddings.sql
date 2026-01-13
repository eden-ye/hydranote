-- Note Embeddings for Semantic Search
-- Run this SQL in Supabase SQL Editor for all environments (local, SAT, PROD)

-- Enable pgvector extension (must be done manually in Supabase Dashboard first)
CREATE EXTENSION IF NOT EXISTS vector;

-- Note embeddings table with context-aware schema
CREATE TABLE IF NOT EXISTS public.note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id TEXT NOT NULL,
  block_id TEXT NOT NULL,

  -- The raw text of this bullet
  bullet_text TEXT NOT NULL,

  -- Full context path: "grandparent > parent > self"
  context_path TEXT NOT NULL,

  -- Descriptor type (nullable): What, Why, How, Pros, Cons
  descriptor_type TEXT,

  -- Children text concatenated (for disambiguation)
  children_summary TEXT,

  -- OpenAI text-embedding-3-small (1536 dimensions)
  embedding vector(1536),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, document_id, block_id)
);

-- Create IVFFlat index for similarity search
CREATE INDEX IF NOT EXISTS note_embeddings_embedding_idx
  ON public.note_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE public.note_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own embeddings
CREATE POLICY "Users can only access their own embeddings"
  ON public.note_embeddings FOR ALL
  USING (auth.uid() = user_id);
