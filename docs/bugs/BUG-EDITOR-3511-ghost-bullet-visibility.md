# BUG-EDITOR-3511: Ghost Bullets Not Visible on Hover

## Summary
Ghost bullet suggestions exist in DOM but remain invisible (opacity: 0) even when hovering over the parent bullet block. The CSS `:host(:hover)` selector is not triggering the opacity change.

## Severity
**High** - Core feature of EDITOR-3511 is non-functional

## Steps to Reproduce
1. Navigate to http://localhost:5173
2. Create a bullet with text (e.g., "Apple")
3. Hover over the bullet
4. Expected: Ghost bullets appear below with grey italic text
5. Actual: No ghost bullets visible

## Technical Analysis

### DOM State (confirmed via JavaScript)
- 4 `.ghost-bullets-container` elements exist in DOM
- 12 `.ghost-bullet` elements exist (3 suggestions per container)
- Ghost bullets have proper content: "What are the key implications of this?"
- Container has `opacity: 1`, `height: 72px`
- Individual `.ghost-bullet` has `opacity: 0` (even when hovering)

### CSS Rules (from bullet-block.ts lines 1228-1242)
```css
.ghost-bullet {
  opacity: 0;  /* Hidden by default */
  transition: opacity 0.15s ease;
}

/* Show ghost bullets on parent hover */
:host(:hover) .ghost-bullet {
  opacity: 1;
}
```

### Root Cause
The `:host(:hover) .ghost-bullet` CSS selector is not triggering the opacity change to 1 when hovering over the bullet block component. Possible causes:
1. The ghost bullets container may be positioned outside the `:host` element's hover area
2. Shadow DOM scoping issue with the CSS selector
3. The hover state is being captured elsewhere (e.g., by child elements)

## Expected Behavior
When hovering over any bullet that has text:
- Ghost bullet suggestions should fade in (opacity: 0 -> 1)
- 3 suggestion questions should appear with grey italic text
- Dismiss button should appear on individual ghost bullet hover

## Affected Files
- `frontend/src/blocks/components/bullet-block.ts` - CSS styles and `_renderGhostBullets()` method
- Lines 1228-1242: Ghost bullet CSS styles
- Lines 3679-3755: `_renderGhostBullets()` render method

## Proposed Fix Options
1. **Option A**: Change CSS to use a class-based hover state (add `.is-hovered` class on mouseenter)
2. **Option B**: Move ghost bullets container inside the hover-sensitive area
3. **Option C**: Use JavaScript to toggle opacity on mouseenter/mouseleave events

## Test Evidence
- JavaScript check shows `getComputedStyle(ghostBullet).opacity === '0'` even during hover
- Screenshot shows "Apple" with AI sparkle icon (hover state) but no ghost bullets

## Related Ticket
EDITOR-3511: Ghost Bullet Suggestions

## Status
**Fixed** - 2026-01-13

## Solution
The root cause was that `HydraBulletBlock` renders to light DOM (no shadow DOM), so the CSS selector `:host(.is-hovered) .ghost-bullet` doesn't work because `:host` only works within shadow DOM.

**Fix implemented:**
1. Added `_isHovered` reactive property to track hover state
2. Added `mouseenter`/`mouseleave` event listeners in `connectedCallback`/`disconnectedCallback`
3. Modified `_renderGhostBullets()` to apply inline `style="opacity: ${ghostOpacity}"` based on `_isHovered`

**Files changed:**
- `frontend/src/blocks/components/bullet-block.ts`
  - Lines 728-732: Added `_isHovered` property
  - Lines 1510-1537: Added hover event listeners and handlers
  - Lines 3876-3889: Apply inline opacity style in render

**Verification:**
- Unit tests: 1555 tests pass
- Build: Successful
- Chrome E2E: Hover behavior verified - `_isHovered` toggles correctly on mouseenter/mouseleave
