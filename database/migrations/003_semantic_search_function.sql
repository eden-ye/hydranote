-- Semantic Search Function for pgvector similarity search
-- Run this SQL in Supabase SQL Editor for all environments (local, SAT, PROD)

-- Create semantic_search stored function
CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL,
  p_descriptor_type text DEFAULT NULL
)
RETURNS TABLE (
  document_id text,
  block_id text,
  bullet_text text,
  context_path text,
  children_summary text,
  descriptor_type text,
  score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ne.document_id,
    ne.block_id,
    ne.bullet_text,
    ne.context_path,
    ne.children_summary,
    ne.descriptor_type,
    (1 - (ne.embedding <=> query_embedding))::float as score
  FROM note_embeddings ne
  WHERE
    -- User isolation (use provided user_id or auth.uid())
    ne.user_id = COALESCE(p_user_id, auth.uid())
    -- Similarity threshold
    AND (1 - (ne.embedding <=> query_embedding)) >= match_threshold
    -- Optional descriptor filter
    AND (p_descriptor_type IS NULL OR ne.descriptor_type = p_descriptor_type)
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION semantic_search TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION semantic_search IS 'Performs semantic similarity search using pgvector. Returns notes ranked by cosine similarity score. User isolation enforced via RLS and user_id parameter.';
