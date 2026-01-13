# EDITOR-3802: Portal Descriptor Parent

## Summary
When a portal points to a descriptor, show the descriptor's parent bullet as grey read-only text on the left side of the portal.

## Current Behavior
Portal shows descriptor content only.

## Desired Behavior
```
[Parent bullet text (grey)] Descriptor content
```

The parent bullet provides context for understanding the descriptor.

## Visual Example
```
[Portal]
├── "Machine Learning" (grey, read-only) → "Uses neural networks for pattern recognition"
```

## Acceptance Criteria
- [ ] Descriptor portals show parent bullet text
- [ ] Parent text is grey and read-only
- [ ] Parent text appears on left of descriptor
- [ ] Regular (non-descriptor) portals unchanged
- [ ] Parent text truncates if too long
- [ ] Works with nested descriptors

## Files to Modify
- `frontend/src/blocks/components/portal-block.ts`

## Estimate
3 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Portal Enhancements
