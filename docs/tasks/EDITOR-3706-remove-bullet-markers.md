# EDITOR-3706: Remove Dirty Bullet Markers from List Items

## Problem

Small bullet symbols (·, •, ◦, ▪, ▫) appear to the left of each list item in the editor. These markers look "dirty" and clutter the UI.

**Screenshot Evidence:**
- Bullet markers appear as small dots on the left side of each list line
- They show at every depth level (222, 444, 333, 111, 111)
- The visual effect is messy and distracting

## Root Cause Analysis

**File:** `frontend/src/blocks/components/bullet-block.ts`

The bullet markers are rendered in `_renderBlockTypePrefix()` method (lines 3867-3873):
```typescript
const marker = getBulletMarker(depth)
return html`
  <div class="block-prefix bullet">
    ${marker}
  </div>
`
```

**Supporting File:** `frontend/src/blocks/utils/block-icons.ts` (lines 12-22)
```typescript
export const BULLET_MARKERS = ['•', '◦', '▪', '▫'] as const

export function getBulletMarker(depth: number): string {
  const index = depth % BULLET_MARKERS.length
  return BULLET_MARKERS[index]
}
```

**CSS Styling:** `bullet-block.ts` (lines 1340-1370)
```css
.block-prefix.bullet {
  font-size: 8px;  /* Small font makes markers look dirty */
}
```

## Proposed Solution

**Option A (Recommended): Hide bullet markers via CSS**
```css
.block-prefix.bullet {
  display: none;
}
```

**Option B: Return empty string for bullet type**
Modify `_renderBlockTypePrefix()` to return nothing for bullet blocks.

## Files to Modify

- `frontend/src/blocks/components/bullet-block.ts` - Either CSS or render logic

## Acceptance Criteria

- [ ] Bullet markers (•, ◦, ▪, ▫) no longer appear on list items
- [ ] List indentation and structure remain intact
- [ ] Drag handles and other UI elements unaffected
- [ ] Build passes: `npm run build --prefix frontend`
- [ ] Chrome E2E: List items display cleanly without bullet markers

## Testing

1. Run frontend dev server: `npm run dev --prefix frontend`
2. Create a list with multiple levels of nesting
3. Verify no bullet markers appear on the left
4. Verify list structure and indentation still work correctly

## Estimate

Small change - CSS or render logic modification only.
