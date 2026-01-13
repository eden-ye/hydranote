# BUG-EDITOR-3707: Grandchild Indentation Misalignment

## Symptoms

Grandchild blocks appear at nearly the same indentation level as their parent's siblings, creating visual confusion in the hierarchy.

```
▼  Parent
   Child1
   Grandchild    ← Should be further indented than Child1
   Child2
```

## Root Cause

The expand toggle (▼/▶) only renders when a block has children. When `_hasChildren` is false, `_renderExpandToggle()` returns `nothing`, leaving a 20px horizontal gap.

**Layout comparison:**
```
Block WITH children:    [grip:16px] [toggle:20px] [text...]
Block WITHOUT children: [grip:16px] [text...]  ← MISSING 20px
```

This creates inconsistent horizontal spacing:
- Child1 (has grandchild): text starts at 36px (grip + toggle)
- Grandchild (no children): text starts at 24px margin + 16px grip = 40px
- Grandchild appears only **4px** more indented than Child1, not the expected 24px

**File:** `frontend/src/blocks/components/bullet-block.ts`
- Lines 3028-3055: `_renderExpandToggle()` returns `nothing` when no children
- Lines 954-984: CSS `.bullet-expand-toggle` - 20px width

## Solution

Always render the expand toggle element to reserve space. When no children exist, render an empty placeholder that occupies the same 20px width but is non-interactive.

**Changes:**
1. Modify `_renderExpandToggle()` to always return a toggle element
2. When `!this._hasChildren`: render empty `<div class="bullet-expand-toggle"></div>`
3. Existing CSS already handles visibility (opacity-based) via `.has-children` class

**Result:**
```
Block WITH children:    [grip:16px] [toggle:20px] [text...] ← interactive
Block WITHOUT children: [grip:16px] [toggle:20px] [text...] ← empty placeholder
```

## Acceptance Criteria

- [x] Grandchild blocks are clearly indented 24px relative to their parent
- [x] Text alignment is consistent across all nesting levels
- [x] Expand toggle only shows icon/becomes clickable when block has children
- [x] Visual hierarchy is clear in 3+ level nesting
- [x] Unit tests pass
- [x] Build succeeds
- [x] Chrome E2E verification

## Prevention

- Reserve space for conditional UI elements even when hidden
- Use `visibility: hidden` or placeholder elements instead of conditional rendering when layout consistency matters

## Implementation

**File Modified:** `frontend/src/blocks/components/bullet-block.ts`
- Lines 3121-3152: `_renderExpandToggle()` method

**Changes Made:**
1. Modified `_renderExpandToggle()` to always return a TemplateResult (not `nothing`)
2. When `!this._hasChildren`: renders empty `<div class="bullet-expand-toggle"></div>` as placeholder
3. When `this._hasChildren`: renders interactive toggle with icon and click handler

**Tests Added:** `frontend/src/blocks/__tests__/bullet-block-component.test.ts`
- Added "Expand toggle placeholder (BUG-EDITOR-3707)" test suite
- Tests for placeholder rendering, CSS classes, interactivity, content, and layout consistency

## Status

- **Created**: 2026-01-13
- **Fixed**: 2026-01-13
- **Status**: resolved
