# EDITOR-3503: Create Portals from Suggestions

## Description
Create portal blocks in the current note based on user-selected suggestions from the reorganization modal.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [ ] Receive selected connections from EDITOR-3502 modal
- [ ] Create portal block for each selected connection
- [ ] Portals added as siblings at end of current document root
- [ ] Each portal points to the selected existing bullet
- [ ] Existing notes are NEVER modified
- [ ] Show success toast with count: "Created 2 connections"

## Technical Details

### Portal Creation
```typescript
interface PortalConnection {
  sourceDocId: string;
  sourceBlockId: string;
  contextPath: string;  // For display/logging
}

async function createPortalsFromSuggestions(
  doc: Doc,
  connections: PortalConnection[]
): Promise<void> {
  const noteBlock = doc.getBlockByFlavour('affine:note')[0];

  for (const conn of connections) {
    // Create portal block as child of note (sibling to root bullets)
    doc.addBlock('hydra:portal', {
      sourceDocId: conn.sourceDocId,
      sourceBlockId: conn.sourceBlockId,
      isCollapsed: false,
      syncStatus: 'synced',
    }, noteBlock.id);
  }
}
```

### Portal Placement
Portals are added at the END of the note, not inline:
```
My New Note
└── What it is
    └── Some content about Tesla...
└── 🔗 [Portal: Tesla > What it is > Electric car company]  ← NEW
└── 🔗 [Portal: Transportation > Types > EVs]               ← NEW
```

### Important Constraints
- **NEW note only**: Portals are added TO the current note
- **Existing notes unchanged**: Source notes are never modified
- **User confirmed**: Only create portals for user-selected suggestions

## Dependencies
- EDITOR-3502: Reorganization Modal UI
- Existing portal infrastructure (EDITOR-3401-3404)

## Parallel Safe With
- AUTH-*, API-*

## Notes
Part of Epic 5: Semantic Linking. Final step in reorganization flow.

**Design Doc**: See `docs/design/semantic-search.md` for full architecture.

## Status
- **Created**: 2026-01-12
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
