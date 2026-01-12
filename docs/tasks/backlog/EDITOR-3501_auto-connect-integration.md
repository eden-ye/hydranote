# EDITOR-3501: Background Embedding Sync

## Description
Sync note embeddings to backend on document save and handle background catch-up for existing notes.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [ ] On document save, send bullets to embedding API
- [ ] Build embedding text with context path + children summary
- [ ] Debounce saves to avoid excessive API calls
- [ ] Background catch-up job for unindexed notes
- [ ] Handle offline gracefully (queue for later sync)
- [ ] Show sync status indicator (optional)

## Technical Details

### Embedding Text Builder (Frontend)
```typescript
interface EmbeddingPayload {
  document_id: string;
  block_id: string;
  bullet_text: string;
  context_path: string;  // "Apple > What it is > Red Sweet Fruit"
  descriptor_type?: string;
  children_summary?: string;
}

function buildEmbeddingPayload(block: BulletBlock, doc: Doc): EmbeddingPayload {
  const ancestors = getAncestors(block, doc).slice(-3);
  const children = getChildren(block, doc).slice(0, 5);

  return {
    document_id: doc.id,
    block_id: block.id,
    bullet_text: block.text.toString(),
    context_path: [...ancestors.map(a => a.text), block.text].join(' > '),
    descriptor_type: block.descriptor,
    children_summary: children.map(c => c.text.slice(0, 50)).join(', '),
  };
}
```

### Save Hook
```typescript
// In editor save handler
async function onDocumentSave(doc: Doc) {
  const bullets = getAllBullets(doc);
  const payloads = bullets.map(b => buildEmbeddingPayload(b, doc));

  // Batch send to backend
  await fetch('/api/notes/embeddings/batch', {
    method: 'POST',
    body: JSON.stringify({ embeddings: payloads }),
  });
}
```

### Background Sync
- On app startup, check for unindexed documents
- Process in background with low priority
- Show progress indicator if user opens settings

## Dependencies
- API-301: Embedding/Vector Storage Setup

## Parallel Safe With
- AUTH-*, API-*

## Notes
Part of Epic 5: Semantic Linking. Ensures embeddings stay fresh.

**Design Doc**: See `docs/design/semantic-search.md` for full architecture.

## Status
- **Created**: 2026-01-10
- **Updated**: 2026-01-12 (refocused on sync, not auto-connect)
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
