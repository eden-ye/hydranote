# API-301: Embedding/Vector Storage Setup

## Description
Set up pgvector infrastructure for context-aware semantic search of notes.

## Automation Status
**🔧 PARTIAL MANUAL** - Requires user to enable pgvector in Supabase dashboard and add OPENAI_API_KEY

### User Manual Steps (Required Before Implementation)
1. Go to Supabase Dashboard → Database → Extensions
2. Search for `vector` and enable it
3. Add `OPENAI_API_KEY` to `.env.local`, `.env.sat`, `.env.prod`
4. After setup, Claude Code can automate the rest

## Acceptance Criteria
- [ ] **USER**: pgvector extension enabled in Supabase (all environments)
- [ ] **USER**: OPENAI_API_KEY added to backend env files
- [ ] **AUTO**: `note_embeddings` table with context-aware schema created
- [ ] **AUTO**: IVFFlat index for similarity search
- [ ] **AUTO**: RLS policies for user isolation
- [ ] **AUTO**: Python embedding service using OpenAI text-embedding-3-small
- [ ] **AUTO**: Embedding text builder (ancestor path + children summary)

## Technical Details

### Context-Aware Schema (Key Differentiator)
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
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

CREATE INDEX ON note_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE note_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own embeddings"
  ON note_embeddings FOR ALL
  USING (auth.uid() = user_id);
```

### Embedding Text Format
```
"Apple > [What] Red Sweet Fruit | contains: Crunchy, Grows on trees"
```
- 3 ancestor levels (Topic > Descriptor > Content)
- Descriptor prefix in brackets
- Children summary for disambiguation

### Embedding Model
- **Model**: OpenAI `text-embedding-3-small`
- **Dimensions**: 1536
- **Cost**: $0.02 per 1M tokens
- **Latency**: ~100ms

## Dependencies
- None (backend infrastructure)

## Parallel Safe With
- EDITOR-*, FE-*

## Notes
Part of Epic 5: Semantic Linking. Backend foundation for context-aware search.

**Design Doc**: See `docs/design/semantic-search.md` for full architecture.

## Status
- **Created**: 2026-01-10
- **Updated**: 2026-01-12 (context-aware schema design)
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
