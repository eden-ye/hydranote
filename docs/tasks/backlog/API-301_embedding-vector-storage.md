# API-301: Embedding/Vector Storage Setup

## Description
Set up vector database infrastructure for semantic search of notes.

## Acceptance Criteria
- [ ] Vector storage solution selected and configured (pgvector in Supabase recommended)
- [ ] Embedding model selected (OpenAI text-embedding-3-small or similar)
- [ ] Schema for storing note embeddings (note_id, embedding vector, metadata)
- [ ] Index for efficient similarity search
- [ ] Migration script for schema creation

## Technical Details
```sql
-- Using pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE note_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  document_id TEXT NOT NULL,
  block_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),  -- dimension depends on model
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON note_embeddings USING ivfflat (embedding vector_cosine_ops);
```
- RLS policies for user isolation
- Batch embedding generation on note save

## Dependencies
- None (backend infrastructure)

## Parallel Safe With
- EDITOR-*, FE-*

## Notes
Part of Epic 5: Semantic Linking. Backend foundation.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
