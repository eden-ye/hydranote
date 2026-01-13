# EDITOR-3509: Collapsible Inline Preview with Dash Separator Button

## Summary
Add a clickable dash "—" separator button between the bullet's main content and its inline preview. When clicked, the dash and preview hide together. The hidden state persists, and hovering reveals a "+" button to restore.

## Current Behavior
- Inline preview renders on the right side of collapsed bullets with children
- No way to hide the preview without collapsing the entire bullet

## Desired Behavior
1. Show a clickable "—" (em dash) button between main content and inline preview
2. Clicking the dash hides both the dash and the preview content
3. State persists in the block model (survives refresh)
4. When preview is hidden, hovering the row reveals a "+" button to restore

## Visual Reference

**Current (Image 1):**
```
▶ Apple                                           23rwer
  └── (left content)                    (right preview, gray)
```

**Desired (Image 3) - When visible:**
```
• Apple — 23rwer
        ↑
    clickable dash button
```

**When hidden (after clicking dash):**
```
• Apple                                           [+] (on hover)
```

## Technical Implementation

### 1. Schema Update (`bullet-block-schema.ts`)
Add new property:
```typescript
/** EDITOR-3509: Whether inline preview is visible (default: true) */
inlinePreviewVisible: boolean
```

### 2. Component Updates (`bullet-block.ts`)

**a) Add toggle method:**
```typescript
private _toggleInlinePreview(): void {
  this.doc.transact(() => {
    this.model.inlinePreviewVisible = !this.model.inlinePreviewVisible
  })
}
```

**b) Modify `_renderInlinePreview()`:**
- Check `model.inlinePreviewVisible` before rendering
- Prepend clickable dash separator before preview content
- Style dash as interactive button

**c) Add restore button method:**
```typescript
private _renderInlinePreviewRestoreButton(): TemplateResult | typeof nothing
```
- Only render when `inlinePreviewVisible === false`
- Show "+" icon on hover
- Click restores preview visibility

### 3. CSS Updates
```css
.inline-preview-separator {
  cursor: pointer;
  color: #9CA3AF;
  margin: 0 8px;
  transition: color 0.15s;
}
.inline-preview-separator:hover {
  color: #374151;
}

.inline-preview-restore {
  opacity: 0;
  cursor: pointer;
  /* Similar styling to expand button */
}
.bullet-container:hover .inline-preview-restore {
  opacity: 0.6;
}
```

## Acceptance Criteria
- [ ] Dash "—" appears between main content and inline preview
- [ ] Clicking dash hides both dash and preview
- [ ] State persists after page refresh
- [ ] Hovering on row (when preview hidden) shows "+" restore button
- [ ] Clicking "+" restores dash and preview
- [ ] Works for both cheatsheet segments and plain text previews
- [ ] No regression on existing descriptor visibility toggle

## Files to Modify
- `frontend/src/blocks/schemas/bullet-block-schema.ts`
- `frontend/src/blocks/components/bullet-block.ts`

## Testing
- Unit tests for toggle behavior
- E2E: Create bullet with children, collapse, click dash to hide, refresh, verify hidden, hover and click "+" to restore
