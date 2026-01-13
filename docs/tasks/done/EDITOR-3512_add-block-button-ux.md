# EDITOR-3512: Add Block Button UX Issues

## Overview

The "+" (add block) button has two UX issues that need to be fixed:
1. The button state (on/off, active/inactive) is unclear - users cannot tell if it's enabled or disabled
2. Inline typing shifts/moves the button position, creating a jarring experience

## Screenshot

The current button appearance is ambiguous - it's not clear whether the button is in an active or inactive state.

## Requirements

### Issue 1: Clear On/Off State

**Problem**: The "+" button visual state is ambiguous - users cannot distinguish between:
- Button is enabled/clickable (ready to add a block)
- Button is disabled/inactive (cannot add a block)
- Button is hovered vs not hovered

**Solution**:
- Use distinct visual styles for each state:
  - **Default (inactive)**: Light gray icon, subtle appearance
  - **Hover**: Blue icon with subtle background highlight
  - **Active/Clicked**: Filled background with pressed effect
  - **Disabled**: Muted/grayed out with reduced opacity, no pointer cursor
- Add tooltip showing current state or action ("Add block" vs "Cannot add block here")

### Issue 2: Stable Position During Typing

**Problem**: When user types inline content, the "+" button position shifts/moves, which is distracting.

**Solution**:
- Button position should be anchored and stable regardless of line content length
- Options:
  1. Position button at fixed left margin (before bullet/content)
  2. Position button at line start, independent of text reflow
  3. Only show button on hover, not during active typing
- Consider hiding button during active text input to avoid distraction

## Implementation Plan

### Phase 1: Investigate Current Implementation
- [x] Find the "+" button component/widget
- [x] Understand current positioning logic
- [x] Identify what triggers position recalculation

### Phase 2: Fix Visual States
- [x] Define clear CSS states for: default, hover, active, disabled
- [x] Add appropriate cursor styles (pointer vs not-allowed)
- [x] Add tooltips for accessibility
- [x] Test contrast ratios for visibility

### Phase 3: Fix Positioning
- [x] Determine best anchor point for button
- [x] Implement stable positioning that doesn't shift during typing
- [x] Consider hiding button during active typing state
- [x] Test with various content widths and nested bullets

### Phase 4: Testing & Polish
- [x] Verify button states are clearly distinguishable
- [x] Verify position stability during typing
- [x] Test on different viewport sizes
- [ ] Chrome E2E validation (pending SAT deployment)

## Files Modified

- `frontend/src/blocks/components/bullet-block.ts` - Updated expand button CSS and render logic
- `frontend/src/blocks/__tests__/bullet-block-component.test.ts` - Added tests for button states

## Implementation Details

### Changes Made

1. **New State Management Functions**:
   - `getExpandButtonState()` - Computes visual state from button conditions
   - `getExpandButtonTooltip()` - Returns appropriate tooltip for each state
   - `getExpandButtonClasses()` - Returns CSS class string for styling

2. **CSS Updates** (`bullet-expand` class):
   - **Position**: Changed from `margin-left` to `position: absolute; right: 4px` for stable positioning
   - **Default state**: Hidden by default, light gray icon (#888)
   - **Hover state**: Blue icon (#1976d2) with subtle background (#f0f0f0)
   - **Active state**: Light blue background (#e3f2fd) with pulse animation
   - **Disabled state**: 50% opacity, `cursor: not-allowed`, `pointer-events: none`

3. **Render Logic Updates** (`_renderExpandButton`):
   - Added disabled state detection (empty text = disabled)
   - Dynamic tooltip based on state
   - Proper aria-disabled attribute
   - Conditional click handler (null when disabled)

### Technical Decisions

- Used **absolute positioning** anchored to right edge to prevent shift during typing
- Disabled state triggers when bullet has no text content (nothing to expand)
- Kept existing `.expanding` class for backwards compatibility with React layer

## Acceptance Criteria

- [x] Button has clearly distinguishable visual states (default, hover, active, disabled)
- [x] User can immediately tell if button is clickable or not
- [x] Button position remains stable during inline typing
- [x] Button does not shift/move when text content changes
- [x] No console errors during interactions (unit tests pass)
- [x] Accessible with proper tooltips and cursor styles

## Test Results

- **Unit Tests**: 1548 tests pass (including 23 new tests for EDITOR-3512)
- **Build**: TypeScript compiles successfully
- **E2E**: Pending SAT deployment for Chrome E2E validation

## Estimate

**3 hours** (actual: ~2 hours)

## Priority

Medium - UX polish for better user experience

## Notes

- This is a usability/polish issue, not a blocking bug
- Should coordinate with EDITOR-3506 (inline formatting toolbar) for consistent button styling
- The React layer can add `.expanding` class to show active state during AI generation

## Commits

- `feat(editor): Improve add-block button UX with clear states and stable positioning (EDITOR-3512)`
