# EDITOR-3505: Portal Subtree Editing

## Description
Enable editing of any bullet within the portal subtree, with changes propagating to the source document.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [ ] Click any bullet in portal subtree to edit
- [ ] Edits sync to source document via Yjs
- [ ] Show "Editing source" indicator during edit
- [ ] First-edit warning (as in current portal): "Changes will affect source"
- [ ] Support all rich text operations (bold, italic, etc.)
- [ ] Cursor navigation within subtree works correctly
- [ ] Undo/redo works correctly (scoped to portal edits)

## Technical Details

### Editing Flow
```
User clicks bullet in portal subtree
         ↓
Show edit warning (if first time)
         ↓
User edits text via rich-text component
         ↓
Changes sync to source Yjs doc
         ↓
Source document updates (anywhere it's open)
         ↓
Other portals to same block also update
```

### Component Changes
```typescript
// portal-block.ts
renderBulletWithChildren(block: BulletBlock, depth: number) {
  return html`
    <div class="portal-bullet ${this.editingBlockId === block.id ? 'editing' : ''}"
         style="margin-left: ${depth * 20}px">
      <rich-text
        .yText=${block.text}
        @focus=${() => this.onBulletFocus(block)}
        @blur=${() => this.onBulletBlur(block)}
      ></rich-text>
      ${this.getChildren(block).map(child =>
        this.renderBulletWithChildren(child, depth + 1)
      )}
    </div>
  `;
}

onBulletFocus(block: BulletBlock) {
  this.editingBlockId = block.id;
  if (!this.hasShownWarning) {
    this.showEditWarning();
  }
}
```

### Sync Strategy
- Each bullet's `rich-text` is bound to source block's `Y.Text`
- Edits are automatically synced via Yjs CRDT
- No special handling needed - same as current portal text editing
- Conflict resolution handled by Yjs

### Edge Cases
- Source block deleted while editing → show orphan state
- Source document closed while editing → edits still sync (Yjs persistence)
- Multiple users editing same bullet → CRDT handles merge

## Dependencies
- EDITOR-3504: Portal Subtree Rendering

## Parallel Safe With
- AUTH-*, API-*, FE-*

## Notes
Part of Epic 5: Semantic Linking. Completes RemNote-like portal experience.

**Design Doc**: See `docs/design/semantic-search.md` for full architecture.

## Status
- **Created**: 2026-01-12
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
