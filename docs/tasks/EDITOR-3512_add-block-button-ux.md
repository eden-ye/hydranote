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
- [ ] Find the "+" button component/widget
- [ ] Understand current positioning logic
- [ ] Identify what triggers position recalculation

### Phase 2: Fix Visual States
- [ ] Define clear CSS states for: default, hover, active, disabled
- [ ] Add appropriate cursor styles (pointer vs not-allowed)
- [ ] Add tooltips for accessibility
- [ ] Test contrast ratios for visibility

### Phase 3: Fix Positioning
- [ ] Determine best anchor point for button
- [ ] Implement stable positioning that doesn't shift during typing
- [ ] Consider hiding button during active typing state
- [ ] Test with various content widths and nested bullets

### Phase 4: Testing & Polish
- [ ] Verify button states are clearly distinguishable
- [ ] Verify position stability during typing
- [ ] Test on different viewport sizes
- [ ] Chrome E2E validation

## Files to Investigate/Modify

- `frontend/src/blocks/` - Block components with add button
- `frontend/src/components/` - Toolbar/button components
- CSS files for button styling

## Acceptance Criteria

- [ ] Button has clearly distinguishable visual states (default, hover, active, disabled)
- [ ] User can immediately tell if button is clickable or not
- [ ] Button position remains stable during inline typing
- [ ] Button does not shift/move when text content changes
- [ ] No console errors during interactions
- [ ] Accessible with proper tooltips and cursor styles

## Estimate

**3 hours**

## Priority

Medium - UX polish for better user experience

## Notes

- This is a usability/polish issue, not a blocking bug
- Should coordinate with EDITOR-3506 (inline formatting toolbar) for consistent button styling
