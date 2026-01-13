# EDITOR-3702: Dashing Button Position Fix

## Summary
Move dashing button (—) closer to bullet text, align content on the right side.

## Current vs Desired Layout

**Current**: `• Bullet text          — content`

**Desired**: `• Bullet text — content`

The dashing button should be immediately after the bullet text, not floating far to the right.

## Acceptance Criteria
- [ ] Dashing button appears immediately after bullet text
- [ ] Right-side content (cheat sheet) is adjacent to dashing button
- [ ] Layout works for varying bullet text lengths
- [ ] Maintains proper alignment in nested bullets
- [ ] Works in both normal and focus modes

## Files to Modify
- `frontend/src/blocks/components/bullet-block.ts` - Layout/positioning

## Estimate
2 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP2 - Cheat Sheet / Dashing Button
