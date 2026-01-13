# EDITOR-3508: Focus Mode Zoom Feature

## Description
Add zoom (focus mode) behavior to the Affine-style grip handle. Following Affine's UI exactly: remove bullet dot, use grip handle for zoom on click. This ticket adds the click-to-zoom behavior; EDITOR-3507 adds drag behavior to the same handle.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Design Alignment with EDITOR-3507

Both tickets share the same **Affine-style UI layout**:

```
[Grip Handle ⋮⋮] [Expand ▶] [Content...]
      ↑              ↑
  Hidden by       Hidden by
  default         default

EDITOR-3507: Drag behavior (drag the handle)
EDITOR-3508: Click behavior (zoom into block)  ← THIS TICKET
```

**Key design decisions:**
- **No bullet dot** - removed entirely (follow Affine exactly)
- **Grip handle** serves dual purpose: click = zoom, drag = drag block
- **Expand toggle** (▶/▼) hidden by default, shows on hover

## Acceptance Criteria

### UI Structure (shared with EDITOR-3507)
- [x] Bullet dot (•) REMOVED - no longer rendered
- [x] Grip handle (⋮⋮) appears on the LEFT of expand toggle
- [x] Grip handle hidden by default, appears on hover
- [x] Expand toggle hidden by default, appears on hover (only if has children)

### Zoom Behavior (this ticket)
- [x] Single-clicking grip handle enters focus mode (tooltip: "Click to zoom")
- [x] Clicking expand toggle expands/collapses children (does NOT zoom)

### Focus Mode Display
- [x] Focused bullet's text appears as large editable title at top
- [ ] Title is editable inline (changes sync back to bullet via Yjs) - **Note**: Title displayed as read-only for now, inline editing deferred to future ticket
- [x] Only children of focused bullet are visible below
- [x] Breadcrumb shows path from root to focused bullet

### Exit Focus Mode
- [x] Clicking home icon exits focus mode
- [x] Escape key exits focus mode

## Technical Details

### Target UI Structure (Affine-style)

**Current:**
```
[Toggle ▶/• combined] [Content...]
```

**Target (Affine-style):**
```
[Grip ⋮⋮] [Expand ▶] [Content...]
    ↑          ↑
 Hidden,    Hidden,
 hover      hover
 Click=ZOOM Click=expand/collapse
 Drag=DRAG  (EDITOR-3507)
```

### Phase 1: Remove Bullet Dot, Add Grip Handle

**Changes to `bullet-block.ts`:**

1. Remove bullet dot from `_renderToggle()` - no more • icon
2. Add `_renderGripHandle()` - Affine-style ⋮⋮ grip dots
3. Add `_renderExpandToggle()` - just the ▶/▼ arrow
4. Both are hidden by default, shown on hover

**New DOM structure:**
```html
<div class="bullet-container">
  ${this._renderGripHandle()}      <!-- ⋮⋮ hidden, click=zoom -->
  ${this._renderExpandToggle()}    <!-- ▶/▼ hidden, click=expand -->
  <rich-text .../>
  ...
</div>
```

### Phase 2: Add Zoom Click Handler

**Add `_handleGripClick()` method:**
- Dispatch `hydra-focus-block` event with `blockId`
- Only triggers on click, not drag (EDITOR-3507 handles drag)

**New CSS:**
```css
/* Grip handle - Affine style */
.bullet-grip {
  width: 16px;
  height: 20px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bullet-container:hover .bullet-grip {
  opacity: 1;
  pointer-events: auto;
}

.bullet-grip:hover {
  background-color: var(--affine-hover-color, #f0f0f0);
  border-radius: 4px;
}

/* Grip dots icon */
.bullet-grip::before {
  content: '⋮⋮';
  font-size: 10px;
  color: var(--affine-icon-color, #888);
}

/* Expand toggle - hidden by default */
.bullet-expand-toggle {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.bullet-container:hover .bullet-expand-toggle.has-children {
  opacity: 1;
  pointer-events: auto;
}
```

### Phase 3: FocusHeader Component

**New file: `FocusHeader.tsx`**

```typescript
interface FocusHeaderProps {
  doc: Doc
  blockId: string
  onExitFocusMode: () => void
}
```

- Large editable title using BlockSuite rich-text (syncs via Yjs)
- Uses same `yText` property as original bullet
- Changes automatically sync back

### Phase 4: Wire Up Events

**Changes to `Editor.tsx`:**
- Add `hydra-focus-block` event listener
- Render `FocusHeader` when in focus mode
- CSS-based filtering: hide non-focused subtrees

## Files to Modify

| File | Changes |
|------|---------|
| `blocks/components/bullet-block.ts` | Remove bullet dot, add grip handle + expand toggle (both hidden by default), add click=zoom handler |
| `components/FocusHeader.tsx` | NEW - Editable title header |
| `components/Editor.tsx` | Wire `hydra-focus-block` event, render FocusHeader |

## Dependencies
- **EDITOR-3507** - Shares the same grip handle UI (this ticket adds click=zoom, 3507 adds drag)
- Existing `focusedBlockId` state in `editor-store.ts`
- Existing `useFocusMode()` hook (FE-406)
- Existing `Breadcrumb` component (FE-407)

## Parallel Safe With
- AUTH-*, API-*, FE-*

## Implementation Order
**Recommended**: Implement EDITOR-3508 first (grip handle + click=zoom), then EDITOR-3507 adds drag behavior to the same handle.

## Notes
- Event name: `hydra-focus-block` (follows existing pattern)
- Grip handle click vs drag: click triggers zoom, drag triggers DND (handled by mousedown + mousemove detection)
- Follow Affine's UI exactly - no bullet dot

## Status
- **Created**: 2026-01-12
- **Completed**: 2026-01-13
- **Status**: completed
- **Epic**: MVP2 - Editor Enhancements

## Implementation Summary

### Files Modified
| File | Changes |
|------|---------|
| `frontend/src/blocks/components/bullet-block.ts` | Added `_renderGripHandle()` and `_renderExpandToggle()` methods, removed old `_renderToggle()`, added CSS for grip handle and expand toggle, added `_handleGripClick()` to dispatch `hydra-focus-block` event |
| `frontend/src/components/FocusHeader.tsx` | NEW - Focus mode header component with title and exit button |
| `frontend/src/components/FocusHeader.css` | NEW - CSS styles for FocusHeader |
| `frontend/src/components/Editor.tsx` | Added `handleFocusBlockEvent` handler, wired event listener, added `focusedBlockTitle` state, render FocusHeader in focus mode |
| `frontend/src/blocks/__tests__/focus-mode-zoom.test.ts` | NEW - Unit tests for focus mode zoom logic (32 tests) |
| `frontend/src/components/__tests__/FocusHeader.test.tsx` | NEW - Unit tests for FocusHeader component (10 tests) |

### Key Implementation Details
1. **Grip Handle**: Rendered using CSS `::before` pseudo-element with `⋮⋮` content, hidden by default, visible on hover
2. **Expand Toggle**: Separate from grip, only shown when block has children, always visible when collapsed
3. **Focus Event**: Custom `hydra-focus-block` event bubbles up to Editor.tsx
4. **FocusHeader**: Displays focused block title (read-only), home icon to exit focus mode

### Test Results
- 1208 tests passing (54 test files)
- New tests: 42 (32 logic tests + 10 component tests)
- Build successful

### E2E Testing Notes
Manual Chrome E2E testing scenarios:
1. Hover over bullet - grip handle appears
2. Click grip handle - enters focus mode
3. FocusHeader shows with title and home icon
4. Click home icon - exits focus mode
5. Press Escape - exits focus mode
6. Breadcrumb shows path to focused block
7. Click expand toggle - expands/collapses children (no zoom)
