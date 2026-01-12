# EDITOR-3504: Portal Subtree Rendering

## Description
Extend portal blocks to render the full subtree (children) of the source block when expanded, like RemNote.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [ ] When portal is expanded, show source bullet AND all its children
- [ ] Recursive rendering: children of children are also shown
- [ ] Indentation matches source hierarchy
- [ ] Expand/collapse state per-level (not just portal root)
- [ ] Loading state while fetching children
- [ ] Handle deeply nested structures gracefully (limit depth?)

## Technical Details

### Current vs New Behavior
```
CURRENT (text only):              NEW (subtree):
┌────────────────────────────┐   ┌────────────────────────────┐
│ 🔗 Tesla                   │   │ 🔗 Tesla                   │
│    (shows text only)       │   │ └── What it is             │
│                            │   │     └── Electric car co    │
└────────────────────────────┘   │ └── Founded                │
                                 │     └── 2003               │
                                 └────────────────────────────┘
```

### Component Changes
```typescript
// portal-block.ts
renderExpandedContent() {
  if (!this.model || this.syncStatus === 'orphaned') return;

  const sourceBlock = this.getSourceBlock();
  if (!sourceBlock) return;

  // Render source block + all descendants recursively
  return html`
    <div class="portal-subtree">
      ${this.renderBulletWithChildren(sourceBlock, 0)}
    </div>
  `;
}

renderBulletWithChildren(block: BulletBlock, depth: number) {
  const children = this.getChildren(block);
  return html`
    <div class="portal-bullet" style="margin-left: ${depth * 20}px">
      <rich-text .yText=${block.text}></rich-text>
      ${children.map(child => this.renderBulletWithChildren(child, depth + 1))}
    </div>
  `;
}
```

### Sync Considerations
- Children are fetched from source document's Yjs doc
- Live sync: if source children change, portal reflects it
- Orphan detection: if any child is deleted, show indicator

### Performance
- Lazy load children on expand (don't fetch until needed)
- Consider depth limit (e.g., max 10 levels) for performance
- Virtualize very long child lists if needed

## Dependencies
- Existing portal infrastructure (EDITOR-3401-3404)

## Parallel Safe With
- AUTH-*, API-*, FE-*

## Notes
Part of Epic 5: Semantic Linking. Essential for knowledge exploration.

**Design Doc**: See `docs/design/semantic-search.md` for full architecture.

## Status
- **Created**: 2026-01-12
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
