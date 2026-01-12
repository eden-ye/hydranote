# Semantic Search Architecture

> Design document for context-aware semantic search and auto-reorganization in Hydra Notes.

## Overview

This document describes the architecture for semantic search that differentiates identical terms by their hierarchical context (e.g., "Apple" the fruit vs "Apple" the company).

**Key Innovation**: Context-aware embeddings that include ancestor path + children summary.

## Research Summary

| Tool | Approach | Key Insight |
|------|----------|-------------|
| **Notion** | Vector embeddings + hybrid BM25/vector + reranking | Chunks pages, uses pgvector |
| **RemNote** | Hierarchical path-aware search | Full path indexed: "parent > child > target" |
| **Obsidian** | Plugin-based semantic search (OpenAI/Ollama) | Local-first, cosine similarity |
| **VSCode** | Hybrid: knowledge graph + semantic + lexical | Combines multiple signals |

**Takeaway**: RemNote's approach is most relevant - indexing the full path through hierarchy.

## Problem Statement

```
Apple                          Apple
└── What it is                 └── What it is
    └── Red Sweet Fruit            └── Technical company
```

These should be **semantically different** despite having the same parent text "Apple".

## Solution: Context-Aware Embeddings

### Embedding Text Format

```
"Apple > [What] Red Sweet Fruit | contains: Crunchy, Grows on trees"
"Apple > [What] Technical company | contains: iPhone, MacBook, Founded 1976"
```

Components:
- **3 ancestor levels**: Topic > Descriptor > Content
- **Descriptor prefix**: `[What]`, `[Why]`, `[How]`, etc.
- **Children summary**: First 5 children, 50 chars each

### Note Structure (3 Levels)

```
Apple                    ← Level 1: Topic/Concept
└── What it is           ← Level 2: Descriptor
    └── Red Sweet Fruit  ← Level 3: Content
```

## Database Schema

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  document_id TEXT NOT NULL,
  block_id TEXT NOT NULL,

  bullet_text TEXT NOT NULL,
  context_path TEXT NOT NULL,      -- "Apple > What it is > Red Sweet Fruit"
  descriptor_type TEXT,            -- "What", "Why", "How", etc.
  children_summary TEXT,           -- "Crunchy, Grows on trees"

  embedding vector(1536),          -- OpenAI text-embedding-3-small

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

## Auto-Reorganization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│            USER TRIGGERS REORGANIZATION (Cmd+Shift+L)           │
│            Manual trigger - NOT automatic on save/edit          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 1: EXTRACT CONCEPTS                        │
│  AI extracts: "Tesla Model 3", "electric vehicle", "Tesla Inc"  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 2: SEMANTIC SEARCH (per concept)              │
│  "Tesla Inc" → "Tesla > What > Electric car company" (0.89)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           STEP 3: SHOW SUGGESTION MODAL                         │
│  User selects which connections to create                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│       STEP 4: CREATE PORTALS (NEW NOTE ONLY)                    │
│  Portals added TO new note, pointing TO existing bullets        │
│  Existing notes: NEVER MODIFIED                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            STEP 5: INDEX NEW NOTE                               │
│  Generate embeddings, store for future search                   │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Embedding model** | OpenAI `text-embedding-3-small` | 1536-dim, $0.02/1M tokens, high quality |
| **Include children** | Yes | Enables disambiguation |
| **Ancestor levels** | 3 levels | Matches Topic > Descriptor > Content |
| **Trigger timing** | Manual (Cmd+Shift+L) | User controls when to reorganize |
| **Portal placement** | Into NEW note only | Existing notes never modified |
| **Similarity threshold** | 0.8 (configurable) | Good balance of precision/recall |

## Portal Architecture

### Current Limitation
Portals currently show only the source bullet's text, not its children.

### Planned Enhancement (EDITOR-3504, EDITOR-3505)
Extend portals to show full subtree when expanded (RemNote-like):

```
Current:                          Planned:
┌────────────────────────────┐   ┌────────────────────────────┐
│ 🔗 Tesla                   │   │ 🔗 Tesla                   │
│    (text only)             │   │ └── What it is             │
└────────────────────────────┘   │     └── Electric car co    │
                                 │ └── Founded                │
                                 │     └── 2003               │
                                 └────────────────────────────┘
```

## Implementation Tickets

### Automation Summary
| Type | Count |
|------|-------|
| ✅ Auto (Claude Code) | 8 tickets |
| 🔧 Manual (User) | 1 ticket (API-301 partial) |

### User Setup Required (One-Time)
1. Enable pgvector in Supabase (Dashboard → Database → Extensions → vector)
2. Add `OPENAI_API_KEY` to `.env.local`, `.env.sat`, `.env.prod`

### Phase A: Backend Infrastructure
| Ticket | Description | Auto? |
|--------|-------------|-------|
| API-301 | pgvector + `note_embeddings` table | 🔧 Manual setup |
| API-302 | Semantic search endpoint | ✅ Auto |
| API-303 | Concept extraction endpoint | ✅ Auto |

### Phase B: Frontend Integration
| Ticket | Description | Auto? |
|--------|-------------|-------|
| EDITOR-3501 | Background embedding sync | ✅ Auto |
| EDITOR-3502 | Reorganization modal UI | ✅ Auto |
| EDITOR-3503 | Portal creation from suggestions | ✅ Auto |
| FE-501 | Semantic linking settings | ✅ Auto |

### Phase C: Portal Enhancement
| Ticket | Description | Auto? |
|--------|-------------|-------|
| EDITOR-3504 | Portal subtree rendering | ✅ Auto |
| EDITOR-3505 | Portal subtree editing | ✅ Auto |

## API Endpoints

### POST `/api/notes/semantic-search`
```typescript
// Request
{
  query: string;
  limit?: number;       // Default: 5
  threshold?: number;   // Default: 0.8
  descriptor_filter?: string;  // Optional: "What", "Why", etc.
}

// Response
[{
  document_id: string;
  block_id: string;
  bullet_text: string;
  context_path: string;     // "Apple > What it is > Red Sweet Fruit"
  children_summary?: string;
  descriptor_type?: string;
  score: float;
}]
```

### POST `/api/ai/extract-concepts`
```typescript
// Request
{
  text: string;
  max_concepts?: number;  // Default: 5
}

// Response
{
  concepts: [{
    name: string;      // "Tesla Model 3"
    category?: string; // "product", "company", "category", etc.
  }]
}
```

### POST `/api/notes/embeddings/batch`
```typescript
// Request
{
  embeddings: [{
    document_id: string;
    block_id: string;
    bullet_text: string;
    context_path: string;
    descriptor_type?: string;
    children_summary?: string;
  }]
}
```

## References

- [Notion Semantic Search](https://dev.to/brainhubeu/make-notion-search-great-again-semantic-search-3c2)
- [RemNote Hierarchical Search](https://help.remnote.com/en/articles/6030777-hierarchical-search)
- [Obsidian Semantic Search](https://github.com/bbawj/obsidian-semantic-search)
- [VSCode Copilot Smart Search](https://code.visualstudio.com/blogs/2023/11/13/vscode-copilot-smarter)

---

**Created**: 2026-01-12
**Status**: Design complete, pending implementation
**Epic**: MVP2 - Semantic Linking
