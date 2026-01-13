# EDITOR-3805: Descriptor UI Polish

## Summary
Improve descriptor visual styling with round grey box background for better distinction.

## Current Behavior
Descriptors have minimal visual distinction from regular bullets.

## Desired Behavior
- Descriptors have round grey background box
- Clear visual separation from parent bullet
- Consistent with overall dark theme

## Visual Example
```
• Parent bullet
  ┌─────────────────────────────────┐
  │ Descriptor text in grey box     │
  └─────────────────────────────────┘
```

## Acceptance Criteria
- [ ] Descriptors have rounded grey background
- [ ] Padding inside background box
- [ ] Works with varying descriptor lengths
- [ ] Maintains readability in dark theme
- [ ] Doesn't break existing descriptor functionality
- [ ] Works in cheat sheet mode

## Files to Modify
- `frontend/src/blocks/components/bullet-block.ts` - Descriptor styling

## Estimate
3 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - UI Polish
