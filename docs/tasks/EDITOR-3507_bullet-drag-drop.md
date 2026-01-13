# EDITOR-3507: Bullet Drag-and-Drop

## Description
Implement elegant drag-and-drop for rich-text bullets with multi-block selection support, following Affine's approach with hover-triggered drag handles and visual drop indicators.

## Design Alignment with EDITOR-3508

Both tickets share the same **Affine-style UI layout**:

```
[Grip Handle ⋮⋮] [Expand ▶] [Content...]
      ↑              ↑
  Hidden by       Hidden by
  default         default

EDITOR-3507: Drag behavior (drag the handle)  ← THIS TICKET
EDITOR-3508: Click behavior (zoom into block)
```

**Key design decisions:**
- **No bullet dot** - removed entirely (follow Affine exactly)
- **Grip handle** serves dual purpose: click = zoom, drag = drag block
- **Expand toggle** (▶/▼) hidden by default, shows on hover

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [ ] Drag handle appears on bullet hover (left side, 4px grabber)
- [ ] Drag handle has smooth show/hide transition (250ms ease)
- [ ] Single-click on drag handle starts drag
- [ ] Shift+Click extends block selection range
- [ ] Ctrl/Cmd+Click toggles individual block selection
- [ ] Selected blocks show visual highlight
- [ ] Dragging any selected block moves all selected blocks
- [ ] Dragged blocks show reduced opacity (70%)
- [ ] Drop indicator shows placement position (before/after/in)
- [ ] Drop before/after repositions at same level
- [ ] Drop with right indent (X past threshold) nests as child
- [ ] Invalid drops prevented (self, descendants, invalid targets)
- [ ] Undo/redo works for drag operations (via BlockSuite history)
- [ ] Works with collapsed bullets
- [ ] Keyboard escape cancels drag

## Technical Details

### Drop Placement Logic
```
Mouse position relative to block:
┌─────────────────────────────────────┐
│  Top 25%            → 'before'      │
├─────────────────────────────────────┤
│                                     │
│  Middle 50%:                        │
│    - X < indent threshold → 'after' │
│    - X >= indent threshold → 'in'   │
│                                     │
├─────────────────────────────────────┤
│  Bottom 25%         → 'after'       │
└─────────────────────────────────────┘

Indent threshold = block.left + CHILDREN_PADDING (24px)
```

### Files to Create
| File | Purpose |
|------|---------|
| `blocks/components/drag-handle.ts` | Drag handle UI component |
| `blocks/components/drop-indicator.ts` | Drop indicator UI component |
| `blocks/utils/drag-drop.ts` | Core drag-drop calculation logic |
| `blocks/utils/drag-drop-types.ts` | TypeScript interfaces |
| `blocks/utils/block-selection.ts` | Multi-block selection logic |
| `blocks/__tests__/drag-drop.test.ts` | Unit tests for drag-drop |
| `blocks/__tests__/block-selection.test.ts` | Unit tests for selection |

### Files to Modify
| File | Changes |
|------|---------|
| `blocks/components/bullet-block.ts` | Add DND event handlers, selection UI |

## Dependencies
- Existing `doc.moveBlocks()` API (used for Tab/Shift+Tab)
- BlockSuite undo/redo history

## Parallel Safe With
- AUTH-*, API-*, FE-*

## Notes
Reference implementation: Affine's `/blocksuite/affine/widgets/drag-handle/`

## Status
- **Created**: 2026-01-12
- **Status**: pending
- **Epic**: MVP2 - Editor Enhancements
